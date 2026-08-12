# FlipReel

Open-source, embeddable stories/reels widget for publishers. Drops into any site (WordPress,
React, Vue, Angular, plain HTML), isolates its styles with Shadow DOM, hosts arbitrary ad code
through a stable adapter contract, and is built to be light and CWV-safe. Architecture and all
locked design decisions live in [docs/architecture.md](docs/architecture.md).

**Live demo:** <https://flip-reel-demo.vercel.app/>

## Packages

| Package                             | Description                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| `@flipatic/flip-reel`               | Lit web components (`flip-reel`, `flip-reel-rail`, `flip-reel-player`) + design tokens + i18n |
| `@flipatic/flip-reel-core`          | Headless engine: config, feed loading, player/ad state machines, MediaScheduler, state store  |
| `@flipatic/flip-reel-ad-gpt`        | Reference Google Ad Manager ad adapter                                                        |
| `@flipatic/flip-reel-react`         | React bindings via `@lit/react` (not published yet — web component works natively)            |
| `apps/{demo,react,vue,nuxt,svelte}` | Publisher-page demos for HTML, React, Vue, Nuxt, and Svelte                                   |

## Installation

With a bundler (npm / pnpm / yarn):

```bash
npm i @flipatic/flip-reel
```

`@flipatic/flip-reel-core` is installed automatically as a dependency — add it directly only
when you build custom adapters or use the headless engine on its own. The Google Ad Manager
adapter is separate:

```bash
npm i @flipatic/flip-reel-ad-gpt
```

Without a bundler, load the ready-made bundle from a CDN (pin the version in production):

```html
<script type="module" src="https://unpkg.com/@flipatic/flip-reel@0.1.2"></script>
```

## Quick start

Drop-in (any site, no bundler — served from unpkg):

```html
<script type="module" src="https://unpkg.com/@flipatic/flip-reel"></script>
<flip-reel feed="https://publisher.example/reels.json"></flip-reel>
```

Programmatic (`npm i @flipatic/flip-reel`):

```ts
import { mount } from '@flipatic/flip-reel'

mount(document.querySelector('#reels')!, {
  feed: 'https://publisher.example/reels.json',
  locale: 'pl',
  rail: { maxVisible: 10, scrollBy: 4 },
  ads: { every: 4, durationMs: 5000 },
})
```

`player.restartOnRevisit` decides what a reel does when the viewer scrolls back to it: `true`
(default) restarts it, `false` resumes where they left off, and a predicate decides per story.

```ts
mount(target, {
  feed,
  player: { restartOnRevisit: ({ durationMs }) => durationMs >= 30_000 },
})
```

`player.prefetch` is how many reels around the current one are loaded ahead of time (default `1`).
Reels below the current one buffer fully so they start instantly, reels above load metadata only.
Raising it trades bandwidth for a faster start; `0` loads nothing but the reel being watched. It
also takes a function, called with the viewer's connection, so the window can follow the network:

```ts
mount(target, {
  feed,
  player: {
    prefetch: ({ saveData, effectiveType, downlink }) => {
      if (saveData || effectiveType === '2g') return 0
      return downlink !== null && downlink > 5 ? 3 : 1
    },
  },
})
```

`effectiveType` and `downlink` are `null` where the browser reports nothing. Save-Data and 2G
connections skip prefetching regardless of what the option says.

## Theming

Set documented CSS custom properties from the host page — they pierce the Shadow DOM:

```css
flip-reel {
  --flip-reel-radius-card: 12px;
  --flip-reel-progress-fill: #ff4d6d;
  --flip-reel-heading-color: #0a0a0a;
}
```

## Develop

```bash
pnpm install
pnpm build        # builds all packages
pnpm --filter @flipatic/flip-reel-demo dev   # run the demo (after build)
pnpm test         # core unit tests
pnpm typecheck
```

## License & Trademark

Released under the Apache License 2.0.

You are free to use, modify, and distribute this software, including in commercial products. Attribution notices in the NOTICE file must be preserved in derivative works.

"FlipReel" is a trademark and is NOT licensed under Apache 2.0. You may not use this name to brand, promote, or endorse derivative works without prior written permission. Forks must be released under a different name.
