# Events

Every widget event fires as a bubbling, composed `CustomEvent` on the widget element, so you
can listen on the element itself, a container, or `document`. Payloads ride in
`event.detail`; all names and payloads are declared in `FlipReelEventMap`.

```ts
document.querySelector('flip-reel')!.addEventListener('flip-reel:like', (event) => {
  event.detail.storyId // typed — no casts needed
})
```

## Event table

| Event                     | `detail`                                         | Fired when                                       |
| ------------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `flip-reel:ready`         | `{ instanceId: string }`                         | Feed loaded, widget interactive                  |
| `flip-reel:open`          | `{ storyId: string; index: number }`             | Full-screen player opened                        |
| `flip-reel:close`         | `{ storyId: string \| null }`                    | Player closed                                    |
| `flip-reel:view`          | `{ storyId: string; index: number }`             | A story became the active slide                  |
| `flip-reel:play`          | `{ storyId: string }`                            | Playback resumed                                 |
| `flip-reel:pause`         | `{ storyId: string }`                            | Playback paused                                  |
| `flip-reel:like`          | `{ storyId: string; liked: boolean }`            | Story liked or unliked                           |
| `flip-reel:share`         | `{ storyId: string }`                            | Share button used                                |
| `flip-reel:readmore`      | `{ storyId: string; link?: string }`             | "Read more" clicked — **cancelable**             |
| `flip-reel:error`         | `{ scope: FlipReelErrorScope; message: string }` | Something failed; the widget degrades gracefully |
| `flip-reel:ad:requested`  | `{ index: number }`                              | Ad break started, creative requested             |
| `flip-reel:ad:impression` | `{ index: number }`                              | Creative rendered, impression counted            |
| `flip-reel:ad:completed`  | `{ index: number }`                              | Ad played to completion                          |
| `flip-reel:ad:skipped`    | `{ index: number }`                              | Viewer skipped the ad                            |
| `flip-reel:ad:empty`      | `{ index: number }`                              | No-fill; the break was dismissed                 |

`FlipReelErrorScope` is `'feed' | 'player' | 'ads'`. In 0.2.1 only feed failures emit
`flip-reel:error` (scope `feed`); `player` and `ads` are reserved for later releases.

## Canceling `flip-reel:readmore`

`flip-reel:readmore` is dispatched with `cancelable: true` before the link opens. Calling
`event.preventDefault()` stops the navigation, letting you route the click yourself:

```ts
element.addEventListener('flip-reel:readmore', (event) => {
  event.preventDefault()
  router.push(event.detail.link!)
})
```

## React props

The `Reels` component maps every event to a typed prop; handlers receive the `CustomEvent`:

| Prop             | Event                     |
| ---------------- | ------------------------- |
| `onReady`        | `flip-reel:ready`         |
| `onOpen`         | `flip-reel:open`          |
| `onClose`        | `flip-reel:close`         |
| `onView`         | `flip-reel:view`          |
| `onPlay`         | `flip-reel:play`          |
| `onPause`        | `flip-reel:pause`         |
| `onLike`         | `flip-reel:like`          |
| `onShare`        | `flip-reel:share`         |
| `onReadMore`     | `flip-reel:readmore`      |
| `onReelsError`   | `flip-reel:error`         |
| `onAdRequested`  | `flip-reel:ad:requested`  |
| `onAdImpression` | `flip-reel:ad:impression` |
| `onAdCompleted`  | `flip-reel:ad:completed`  |
| `onAdSkipped`    | `flip-reel:ad:skipped`    |
| `onAdEmpty`      | `flip-reel:ad:empty`      |

Widget errors intentionally arrive on `onReelsError` — `onError` is React's native error
handler and cannot be reused.

## Callbacks

For the common interactions, `options.callbacks` offers direct function callbacks invoked
alongside the DOM events:

```ts
callbacks: {
  onLike:     (storyId: string, liked: boolean) => void
  onShare:    (storyId: string) => void
  onReadMore: (storyId: string, link?: string) => void
}
```

## TypeScript helpers

```ts
import type { FlipReelEvent, FlipReelEventMap, FlipReelEventName } from '@flipatic/flip-reel'

function onLike(event: FlipReelEvent<'flip-reel:like'>) {
  event.detail.liked
}
```
