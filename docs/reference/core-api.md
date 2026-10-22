# Core API

The headless engine in `@flipatic/flip-reel-core`. Everything here is UI-free and runs
without the widget elements — use it to build custom experiences on the same state machines.

## Config

- `resolveConfig(options: FlipReelOptions): ResolvedConfig` — applies defaults and minimum
  clamps; throws `FlipReelConfigError` without a `feed`.
- `DEFAULT_LOCALE`, `DEFAULT_RAIL`, `DEFAULT_PLAYER`, `DEFAULT_ADS`, `DEFAULT_INTERACTIONS` —
  the default values as constants.
- Errors: `FlipReelConfigError` (invalid options), `FeedLoadError` (feed fetch/validation).

## Feed

- `normalizeFeed(raw, allLabel, override?): Feed` — validates a raw payload; see
  [Feed format](feed.md).
- `filterByCategory(stories, categoryId): Story[]` — `ALL_CATEGORY_ID` (`"all"`) returns
  everything.
- `DefaultFeedAdapter` — the built-in `FeedAdapter`; constructor takes
  `{ allLabel, categories? }`.
- Type guards: `isVideoStory(story)`, `isImageStory(story)`.

## `PlayerController`

The full-screen player state machine: navigation, category filtering, pause/mute, likes, and
ad cadence. Constructed with `{ config, store, events }`.

```ts
const player = new PlayerController({ config, store, events })
player.setStories(stories)
const unsubscribe = player.subscribe((state) => render(state))
player.open('s1')
```

| Member                                | Role                                                                |
| ------------------------------------- | ------------------------------------------------------------------- |
| `setStories(stories)`                 | Replaces the story pool and rebuilds the playlist                   |
| `subscribe(listener)`                 | State snapshots; fires immediately, returns unsubscribe             |
| `open(storyId, categoryId?)`          | Opens the player on a story                                         |
| `close()`                             | Closes the player                                                   |
| `setCategory(id)`                     | Switches category (ignored during an ad)                            |
| `requestIndex(i)` / `notifyLanded(i)` | Requests / reports navigation to a slide                            |
| `togglePause()` / `setPaused(p)`      | Pause control                                                       |
| `toggleMuted()` / `setMuted(m)`       | Mute control                                                        |
| `toggleLike(storyId?)`                | Likes/unlikes; emits `flip-reel:like`                               |
| `share(storyId?)`                     | Emits `flip-reel:share`                                             |
| `readMore(): boolean`                 | Emits cancelable `flip-reel:readmore`; `false` = link must not open |
| `tick(deltaMs)`                       | Advances the ad countdown (call per animation frame)                |
| `requestAdSkip()`                     | Skips the ad when skippable                                         |
| `onAdImpression()` / `onAdNoFill()`   | Reports an ad render or no-fill; emits `ad:impression` / `ad:empty` |
| `reportVideoProgress(cur, dur)`       | Feeds playback progress into the state                              |
| `setAutoplayBlocked(b)`               | Marks blocked autoplay (shows the play overlay)                     |
| `snapshot(): PlayerState`             | Current immutable state                                             |
| `destroy()`                           | Drops all subscribers                                               |

`PlayerState` (see `player-types.ts`): `open`, `categoryId`, `stories`, `activeIndex`,
`muted`, `paused`, `autoplayBlocked`, `storyProgress`, `likedIds`, and `ad`
(`{ active, skippable, blocking, index, remainingMs, durationMs }`).

## `EventBus<EventMap>`

Typed pub/sub keyed by an event-name-to-payload map.

- `on(type, listener): () => void` — subscribe, returns unsubscribe.
- `off(type, listener)` / `clear()`.
- `emit(type, payload)` — fire and forget.
- `emitCancelable(type, payload): boolean` — listeners returning `false` veto the default
  action; used by `flip-reel:readmore`.

## `MediaScheduler`

Page-global cap on concurrently playing media (2 on iOS, 3 elsewhere), shared by all widget
instances via `getRuntime()`.

- `request(holder): MediaLease | null` — at capacity, evicts the weakest lower-priority
  lease; `null` when refused.
- `setBudget(n)` — resizes the cap (min 1), evicting as needed.
- `LeasePriority`: `PRELOAD` (10) < `HOVER` (20) < `IN_VIEW` (30) < `PLAYER_ACTIVE` (40).

## Runtime

- `getRuntime(): GlobalRuntime` — the page-global `{ version, scheduler, instances }`
  singleton stored on `globalThis`; warns on version mismatch between bundles.
- `FLIP_REEL_VERSION` — this build's version.
- `createInstanceId()` — page-unique widget instance id.

## State stores

`MemoryStateStore`, `createLocalStorageStateStore()` — see
[Adapters → StateStore](adapters.md#statestore).

## Playback building blocks

- `PlaylistModel` — cursor over an ordered story list with optional wrap-around
  (`next`, `prev`, `focusById`, `canNext`, `canPrev`, `current`).
- `AdSession` — countdown state of one ad break; persists the first-view gate under
  `AD_GATE_KEY` so later ads become skippable.

## Device utilities

`isIOS()`, `canHover()`, `prefersReducedMotion()`, `prefersSaveData()`,
`hasSlowConnection()` — SSR-safe (return `false` without a DOM).

## i18n (widget package)

`getMessages(locale): Messages` from `@flipatic/flip-reel` returns the UI string catalog
(`en`, `pl` built in; regional variants collapse; unknown locales fall back to English).
