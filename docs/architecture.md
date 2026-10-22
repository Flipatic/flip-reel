# FlipReel — Architecture

> Status: v1 implemented 2026-06-16 (decisions locked 2026-06-09, consolidated into this single
> document 2026-07-31). The monorepo under `packages/` and `apps/` realizes it. Some sections
> describe planned layers that 0.2.1 does not ship yet (`::part()`/slot theming beyond the ad
> slot, Tier B light-DOM adoption, the version-collision guard, SRI hashes, adapter
> `apiVersion`, Playwright E2E); the [README roadmap](../README.md#roadmap) tracks them.

FlipReel is an **open-source, embeddable stories/reels widget for publishers**. It must drop
into any publisher site built with any technology (WordPress, React, Vue, Angular, plain HTML), be
heavily customizable in both look and behavior, host arbitrary ad code, and be light, smooth and
broadly cross-browser. Publisher engineering teams will audit it — the bar is "no compromises".

Benchmarks: VG (Norway), NYT video, WP.pl mobile strip.
UI/UX proof of concept: <https://flipatic-reels-poc.vercel.app/> (Next.js demo — we ported the
**design**, not the code; see [PoC findings](#poc-findings)).

---

## Guiding principles

1. **Everything is an adapter.** We will not satisfy every ad server, CMS, analytics stack or
   consent setup — so the widget never hard-codes any vendor. It defines small, stable contracts
   (ads, feed, analytics, state) and ships reference implementations. Publishers plug in their own
   in a few lines; the community covers the long tail.
2. **The widget owns the UX, the publisher owns the content.** Ad timing, the "Advertising" label,
   countdown and skip-gate are widget logic; what renders inside the ad container is publisher
   code.
3. **Hostile-page assumption.** We do not control the page we live on: aggressive global CSS,
   tag managers loading scripts twice, two teams embedding different widget versions, several
   widget instances competing for video decoders. Every layer defends against this.
4. **Zero trust required.** No phone-home, no storage by default, no eval, CSP-friendly, SRI
   published. The README claim "the only network request is your feed" must stay literally true.
5. **Degrade, don't polyfill.** Feature-detect at boot; old browsers get working links, not a
   broken player or a 100KB polyfill payload.

---

## Layer diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Adapters: @flipatic/flip-reel-react (wrapper),               │
│            @flipatic/flip-reel-ad-gpt,                        │
│            publisher-provided Ad/Feed/Analytics/StateStore    │
├──────────────────────────────────────────────────────────────┤
│  View (Lit, Shadow DOM): <flip-reel> umbrella,                │
│  <flip-reel-rail>, <flip-reel-player> — theming via CSS       │
│  custom properties, ::part(), slots                           │
├──────────────────────────────────────────────────────────────┤
│  @flipatic/flip-reel-core (pure TS, zero UI):                 │
│   • player/ad finite-state machines                           │
│   • config resolver + validation                              │
│   • feed loader, event bus                                    │
│   • MediaScheduler (page-global playback/preload budget)      │
│   • StateStore contract (in-memory default)                   │
└──────────────────────────────────────────────────────────────┘
```

Core is 100% unit-testable without a DOM and independent of the view layer.

## Isolation: Shadow DOM, plain CSS tokens

Style isolation is a hard requirement in both directions. Options considered:

1. **Full iframe** — perfect isolation, but breaks responsive sizing, SEO, the blended-into-page
   listing design, and requires postMessage for everything. Rejected for the widget as a whole
   (kept for ad slots — see [Ads](#ads)).
2. **Prefixed classes / CSS-in-JS on the host page** — fragile in both directions on unknown
   pages. Rejected.
3. **Web Components + Shadow DOM (open)** — native standard, isolates both directions, works in
   every framework. **Chosen.**

- Autonomous custom elements with **open Shadow DOM** (open so publishers can debug and use
  `::part()`). We never use customized built-ins (`is="..."`) — Safari will never support them;
  this is also why caniuse's "partial" Safari flag for custom elements does not affect us
  (documented for auditors: autonomous custom elements are fully supported).
- Inside the shadow root: **plain CSS with design tokens** (`--flip-reel-*`). No Tailwind, no
  CSS-in-JS, no runtime style framework.
- Consequence: all styling must be expressed through the token/part/slot surface; contributors
  cannot reach for utility frameworks.

### Theming surface

- **CSS custom properties** (`--flip-reel-*`) — documented token set; pierces Shadow DOM by
  design.
- **`::part()`** — exposed structural parts for deeper styling.
- **Slots** — inject own CTA, "Read more", brand logo, ad markup.
- Behavior via a typed, validated config object (max videos, loop, ad cadence, callbacks, all
  UI strings for i18n/RTL).

## View layer: Lit

The view layer must compile to standard custom elements, stay small, work inside Shadow DOM, and
read as "boring, auditable standards code". Candidates: **Lit** (~5 KB — _is_ web components;
reactive properties, scoped styles, slots/parts are the native model), **Svelte 5** (smaller
compiled output, but generated code is harder to audit and the custom-element target is a
secondary citizen), **Preact** (~3 KB, but custom-element wrapping is manual, one layer away from
the platform).

**Lit chosen** for standards alignment, first-class Shadow DOM/slots/parts ergonomics, maturity,
and the free React wrapper via `@lit/react`. Animations the design needs (carousel transitions,
crossfades, category pill slide) are CSS transitions + FLIP — no framework animation runtime.

Two design constraints keep this decision cheap to revisit: all logic lives in the headless core
(Lit components are thin templates), and the custom element registry is injectable from day one.
`@lit-labs/*` packages (SSR, scoped-registry mixin) are labs/pre-release: each use requires an
explicit decision; none are part of v1.

## Headless core with explicit state machines

Reels playback combined with ad gating is genuinely a state machine: playing / paused /
buffering / ad / skip-gate / ended, plus failure modes. Scattering this logic across UI
components produces untestable, racy code — and publisher IT will read this code.

`@flipatic/flip-reel-core` is a **pure TypeScript package with zero UI and zero DOM
dependencies**, containing:

- **Player FSM** — explicit states including `autoplay-blocked` (iOS Low Power Mode: rejected
  `video.play()` promise → poster + play button) and transitions driven by the MediaScheduler's
  lease grants/revocations (`playing → poster` on revoke is a normal transition, not an error).
- **Ad FSM** — entry every N _viewed_ slides (not positions — loop-safe), skip-gate evaluation
  via StateStore, countdown ticking, `ad-nofill` state (timeout → silent skip), pause semantics
  (countdown freezes; pause always allowed — WCAG 2.2.2 / EAA).
- **Config resolver** — typed config with defaults and validation (full messages in dev build
  only; prod build applies defaults silently to protect the bundle budget).
- **Feed loader** — fetches/normalizes the feed contract, including the dedicated `preview`
  rendition.
- **Event bus** — emits the `flip-reel:*` / `ad:*` lifecycle consumed by the view layer and
  re-emitted as DOM CustomEvents.

State machines are hand-written reducers, not XState — the bundle cost of an FSM library is not
justified for two machines; the spec lives in the test suite. The core is 100% unit-testable in
Node (Vitest) without a browser; the FSM transition tables are normative documentation — ad
behavior disputes are settled by pointing at the machine, not at UI code.

## Component model — composition first

Not one monolith but a set of composable custom elements; the umbrella element is a convenience
wrapper:

```html
<!-- 95% of publishers: everything included -->
<flip-reel feed="https://publisher.example/reels.json"></flip-reel>

<!-- composition: rail alone, player alone (e.g. inline in an article), custom layouts -->
<flip-reel-rail feed="..."></flip-reel-rail>
<flip-reel-player feed="..." start="story-7"></flip-reel-player>
```

Elements communicate through the core (shared context/event bus), never through DOM parentage, so
publishers can scatter them across a layout (inline player, rail without detail, two rails
sharing one player). Internal pieces (cards, progress, category menu) are private elements
styleable via `::part()`.

### Native `<dialog>` for the detail view

The fullscreen detail view is a classic embed trap: `position: fixed` breaks under any
transformed/`overflow` ancestor on the publisher page, and portaling to `document.body` breaks
CSS custom property inheritance. Instead, the player uses a native `<dialog>` **inside** the
component: `showModal()` promotes to the browser top layer **without moving the element in the
DOM** — solving the transformed-ancestor trap while keeping `--flip-reel-*` tokens inheriting
naturally. Focus trapping, `Esc` handling and `::backdrop` come from the platform instead of
being reimplemented — no portal code path, no custom focus-trap, fewer a11y bugs by
construction. On mobile the same `<dialog>` renders the full-viewport variant (`dvh`-based).
`<dialog>` support is what sets the browser baseline floor (see below) — an accepted cost.

## Ads

Three integration levels, one contract:

1. **Slot (zero JS):** publisher drops markup/iframe into a named slot; widget orchestrates it.
2. **`AdAdapter` callback** for GAM/Prebid-style dynamic demand:

   ```ts
   interface AdAdapter {
     request(ctx: AdSlotContext): Promise<AdHandle | null> // null = no-fill
   }
   interface AdSlotContext {
     index: number // ad position ordinal
     container: HTMLElement // iframe/light-DOM mount point
     format: 'vertical-video' | 'display'
     consent?: unknown // publisher-provided consent signal (e.g. TCData)
     locale: string
   }
   interface AdHandle {
     durationMs?: number // overrides default countdown
     skippableAfterMs?: number
     refresh?(): void // persistent container is re-used, never re-cloned
     onImpression?(): void
     destroy(): void
   }
   ```

3. **Packaged adapter:** `@flipatic/flip-reel-ad-gpt` (reference, Google Ad Manager).

Widget-owned semantics regardless of level: ad containers render in **iframe or slotted light
DOM, never deep Shadow DOM** (ad scripts break in shadow roots); containers are **persistent per
position** and re-used via `AdHandle.refresh()` — scripts are not re-executed per appearance; ad
every N viewed slides (**counted by views, not positions** — loop-safe), "Advertising" label,
countdown, non-skippable on first exposure (skip-gate via `StateStore`, flag set on
`ad:completed`, not on display), **pause always works** (countdown freezes), no-fill → silent
slide skip after a configurable timeout (default 2.5 s) + `ad:empty` event. Lifecycle events:
`ad:requested|impression|completed|skipped|empty`.

## Feed contract

BYO data. Story = `{ id, title, category, link, brand, poster, video, renditions[], preview }` —
`preview` is a dedicated tiny muted MP4 (~100–300 KB) for the 2 s hover/viewport loop so the
listing never downloads full videos. Static images are first-class story types. Input: feed URL,
inline JSON, or a fetch callback. The `poster` field is optional but strongly recommended for
video stories (blurred detail background, `autoplay-blocked` fallback, Tier B markup).

## State & privacy

`StateStore` contract with an **in-memory default** — the widget persists nothing on its own, so
there is no consent obligation out of the box; "non-skippable first time" then means per page
view, which satisfies the business intent.

```ts
interface StateStore {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T): void
  remove(key: string): void
}
```

Publishers opt into persistence (localStorage/cookie/server) under **their** CMP in ~3 lines;
`createLocalStorageStateStore()` ships as an opt-in helper. Keys are namespaced and versioned
(`flip-reel:v1:ad:gate-passed`); gate scope is global per store (surviving one ad anywhere releases
the gate everywhere). GDPR/TCF, CMP choice and storage trade-offs stay entirely on the
publisher's side, where they belong. No telemetry, ever.

## Events & analytics

DOM `CustomEvent`s only — no analytics vendor coupling, no adapter package:
`flip-reel:view|play|like|share|readmore|error` + the `ad:*` lifecycle. Publishers bridge to
GA/Matomo/whatever in their own code; one documented example ships in docs.

## Page-global runtime: versions & media budget

We do not control the host page: tag managers load scripts twice, different teams embed different
widget versions (`customElements.define()` on a taken tag **throws**), and browsers hard-limit
concurrent video decoders (iOS Safari ≈ 3–4; beyond that: silent freezes, black frames). Both
problems concern the whole page, hence one guarded namespace:
`globalThis.__FLIP_REEL__ ??= { version, instances, scheduler }`.

### Version-collision defense (layered)

1. **Scoped custom element registries** where available (Chrome/Edge 146+, Safari 26+; Firefox
   pending). Feature-detected; each instance gets its own registry and tag collisions vanish as
   a problem class. The registry is injectable from day one so this layer slots in without
   refactoring.
2. **Idempotent loader:** same version loaded twice → no-op.
3. **Define-guard:** `if (!customElements.get(TAG)) define(...)` — never throw; on a
   major-version mismatch log a loud, actionable `console.warn`.
4. **Major-suffixed tags as fallback policy:** v1 owns `flip-reel`; a later major that loses the
   tag race registers `flip-reel-v2`. Minor/patch never change tag or attribute/event contracts.
5. **`FlipReel.mount()` always works** regardless of tag ownership.

### MediaScheduler — playback as a leased resource

- Page-global budget: ≈ 2 (iOS) / 3 (other) simultaneously active decoders across **all**
  instances and both majors (the cross-version protocol on `window.__FLIP_REEL__` is
  deliberately dumb — counters and plain objects, not class instances).
- Priorities: `PLAYER_ACTIVE > IN_VIEW > HOVER > PRELOAD`; an opening player preempts all rail
  previews and returns leases on close.
- **Eviction actually frees the decoder:** `pause()` + `removeAttribute('src')` + `load()` —
  `pause()` alone does not release hardware.
- Dynamic preload window: active = `auto`, ±1 neighbor = `metadata`, rest = `none`. Preload
  queue with concurrency 1–2 and `AbortController` cancellation on swipe.
- Driven by shared `IntersectionObserver` instances; respects `Save-Data`,
  `prefers-reduced-motion` (no hover autoplay) and `navigator.connection`; rail preview is
  disabled on non-hover (touch) devices.
- Lease revocation is a normal FSM transition (`playing → poster`), so degradation under
  pressure is smooth, not random. All media elements must acquire leases; direct `video.play()`
  calls are banned by convention.

## Distribution — two integration tiers

"Paste a script and it works" and "real `<a>` links in the markup for SEO/no-JS" are mutually
exclusive in one mode; the trade-off is explicit:

- **Tier A — drop-in:** one `<script>` from CDN + one tag. No SEO content, zero publisher work.
  CLS-safe placeholder required (documented `aspect-ratio` snippet). Honest positioning: reels
  are usually supplementary content; for many publishers this is enough.
- **Tier B — progressive enhancement:** publisher server-renders plain `<a>` cards (partials
  provided for WP/Twig/JSX) inside the element; the widget **adopts the light DOM** as initial
  data and upgrades it. SEO + working no-JS fallback + better LCP. Plain HTML adoption on the
  client — no `@lit-labs/ssr` (pre-release labs software — rejected for v1), no Node
  requirement, no hydration-mismatch class of bugs. Light-DOM adoption is designed in from day
  one (retrofitting it later would be invasive).
- **Tier C — future note, not a commitment:** declarative Shadow DOM pre-rendering may become an
  optional third tier once Lit SSR leaves labs.

Other entry points on top of both tiers: direct custom-element usage in any framework,
`FlipReel.mount(el, config)` JS API, `@flipatic/flip-reel-react` wrapper (via `@lit/react`).
Vue/Angular consume the custom element natively — dedicated wrappers only on demonstrated
demand. Outputs: npm (ESM) + CDN (IIFE, versioned `/v1/` paths, SRI hashes, immutable cache).
SRI and the auto-updating `/v1/` channel are in tension — SRI is documented for pinned versions
only. Tier B partials are supported artifacts (template changes are semver-relevant).

## Performance contract (CWV-safe embed)

Publishers live off SEO; CWV regressions are grounds for immediate removal of any third-party
embed. CWV safety is a documented contract:

- **CLS = 0 by contract:** the documented embed snippet includes an `aspect-ratio` placeholder
  that reserves the widget's exact space before JS loads, for both tiers. Widget dimensions are
  part of the public API (changes are semver-relevant).
- **Bundle budget:** v1 ships rail + player as a single entry, currently ~29 KB gzip (ESM,
  0.2.1), with a hard ceiling of **30 KB gzip** (what every page pays).
- **Main-thread budget:** init < 50 ms of long tasks on a mid-range device; media work is
  IntersectionObserver-driven and batched in `requestAnimationFrame`.
- **Network discipline:** posters outside the viewport are lazy with `fetchpriority="low"`;
  listing never downloads full videos (dedicated `preview` renditions).

Every new feature negotiates with the budget — "just add a dependency" is structurally
discouraged.

## Browser baseline

Floor is set by `<dialog>` + `dvh`, not by web components: **Safari/iOS 15.4, Chrome 108,
Firefox 101** (~95% global, ~4 years of browsers). Degradation ladder instead of polyfills:

1. Baseline browsers → full experience.
2. CSS-only fallbacks where free (`height: 100vh; height: 100dvh;` cascade).
3. Missing `customElements`/`attachShadow` → widget does not initialize: Tier B markup leaves
   working `<a>` links; Tier A leaves the CLS-safe placeholder. No web-components polyfills,
   ever.

We accept ~5% of global traffic getting links instead of the player — by design, documented.
HLS/DASH adaptive bitrate is out of scope for v1 — direct MP4 with `preload` heuristics only.

## Media pipeline

Desktop detail background = **blurred poster image**, not a video frame. Candidates considered:
a second scaled+blurred `<video>` (doubles decoder usage — collides with the decoder budget) and
canvas frame-grabbing (requires CORS-clean video — `crossorigin="anonymous"` + correct CDN
headers on the publisher side, else the canvas is tainted; a guaranteed support nightmare).
Chosen: small poster rendition with `blur(90px) saturate(1.4)`, `scale(1.25)` overscan to hide
blur edge bleed, dark overlay token (default 55% black), desktop-only, crossfaded on slide
change (two stacked layers, opacity swap). At blur(90px) a poster is visually indistinguishable
from a live frame at a fraction of the cost: zero extra decoders, zero CORS exposure, zero
canvas code. Works with any publisher CDN configuration.

Player FSM includes explicit `autoplay-blocked` (iOS Low Power Mode — poster + play button
fallback) and `ad-nofill` states. Error policy: feed failure ⇒ the widget shows a localized
"content unavailable" message and emits `flip-reel:error` with scope `feed`. The player wraps
from the last story back to the first by default (`player.loop`, default `true`); set it to
`false` to hard-stop at both ends. The PoC's doubled-list teleport was evaluated and dropped in
favor of this playlist-level wrap.

## Security checklist (what publisher IT will look for)

No network calls except the configured feed · no storage by default · no `eval`/`new Function` ·
CSP-compatible (nonce support documented) · SRI hashes published per release · feed data is never
`innerHTML`-ed (Lit escapes by default — repo rule) · Apache-2.0 licensed, readable source,
sourcemaps shipped.

## Licensing, trust posture & governance

- **License: Apache 2.0.** The explicit patent grant matters for enterprise publisher adoption,
  and the NOTICE mechanism carries attribution and trademark protection: "FlipReel" is a
  trademark and is **not** licensed — forks must ship under a different name (see NOTICE and the
  README trademark section).
- **Fully open source — no open-core.** No hosted/paid tier planned; hosted feeds/CMS, if ever,
  would be a separate product outside this repo.
- **Trust posture (release policy):** no telemetry/phone-home, no storage by default, no `eval`,
  CSP compatibility with documented nonce support, SRI hashes published per release, sourcemaps
  shipped, feed data never `innerHTML`-ed.
- **Contract stability:** every adapter contract carries an `apiVersion`; changes follow semver
  with a documented deprecation policy — these interfaces are the public API the adapter
  ecosystem builds on. Community ad/feed adapters can be published by anyone without permission.

## Repository layout (pnpm + Turborepo)

```
apps/
  demo/          # kitchen-sink demo (port of the PoC design)
  react/         # publisher-page demo: React
  vue/           # publisher-page demo: Vue
  nuxt/          # publisher-page demo: Nuxt (SSR)
  svelte/        # publisher-page demo: Svelte
packages/
  core/          # @flipatic/flip-reel-core — headless TS
  reels/         # @flipatic/flip-reel — custom elements + bundles (IIFE/ESM)
  react/         # @flipatic/flip-reel-react wrapper (private, not published yet)
  ad-gpt/        # @flipatic/flip-reel-ad-gpt — reference ad adapter (Google Ad Manager)
  demo-shared/   # shared demo feed/assets (private)
```

Toolchain: Vite library mode (Rolldown family), Vitest (core unit tests), Playwright planned for
cross-browser E2E (WebKit coverage in CI; physical-iOS checklist per release, since Playwright
WebKit ≠ real iOS), and Prettier. Browserslist
pinned to the baseline above. A docs app with a live configurator (click options → copy a ready
embed snippet) is planned as the adoption engine.

---

## PoC findings

Inspected 2026-06-09 (homepage + detail + compiled CSS):

- Next.js App Router demo, Tailwind + 4 custom classes, lucide icons. **Design reference only** —
  Tailwind is excluded from the widget runtime; the port to token-based plain CSS was mechanical.
- Desktop background blur is a blurred **poster image**, not a video frame.
- Detail modal is a manual `position:fixed` div — replaced with native `<dialog>`.
- Listing eager-loads all videos with `preload="auto"` including a 4K file — confirmed CWV risk
  that MediaScheduler + preview renditions eliminate.
- **Ads, skip-gate and the progress bar did not exist in the PoC.** The hardest requirements were
  unproven — the walking skeleton proved them first.

## Walking skeleton — five proofs

The first implementation milestone proved risks, not features:

1. Style isolation on a hostile page (aggressive global CSS stress test).
2. CLS = 0 with lazy init (placeholder contract works).
3. Two instances + two versions coexisting on one page (registry/guard + shared scheduler).
4. `autoplay-blocked` flow on a physical iPhone in Low Power Mode.
5. Ad no-fill → silent skip via a dummy `AdAdapter`.
