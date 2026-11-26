# Options

`FlipReelOptions` is accepted by `mount()`, the `options` property of `<flip-reel>`, and the
React `Reels` component. Only `feed` is required; every other option has a default. Numeric
options are clamped to sane minimums by `resolveConfig`.

```ts
interface FlipReelOptions {
  feed: FeedSource
  locale?: string
  brand?: string
  brandLogo?: string
  categories?: Category[]
  rail?: RailOptions
  player?: PlayerOptions
  ads?: AdOptions
  interactions?: InteractionOptions
  theme?: Record<string, string>
  adapters?: AdaptersOptions
  callbacks?: InteractionCallbacks
}
```

## Top level

| Option       | Type                    | Default      | Description                                                                                                                |
| ------------ | ----------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `feed`       | `FeedSource`            | — required   | JSON URL (fetched without credentials), inline `Feed` object, or a sync/async factory returning one                        |
| `locale`     | `string`                | `"en"`       | UI language; `en` and `pl` are built in, regional variants collapse (`pl-PL` → `pl`), unknown locales fall back to English |
| `brand`      | `string`                | `"FlipReel"` | Publisher name in the player top bar; also the alt text of the `brandLogo` image                                           |
| `brandLogo`  | `string`                | none         | Logo URL shown in the top bar instead of the default brand mark                                                            |
| `categories` | `Category[]`            | derived      | Explicit category list; overrides categories from the feed or derived from stories                                         |
| `theme`      | `Record<string,string>` | `{}`         | CSS custom property overrides, e.g. `{ '--flip-reel-progress-fill': '#f00' }` — see [Theming](theming.md)                  |
| `adapters`   | `AdaptersOptions`       | `{}`         | Pluggable `feed`, `ad`, and `state` implementations — see [Adapters](adapters.md)                                          |
| `callbacks`  | `InteractionCallbacks`  | `{}`         | Direct function callbacks — see [Events](events.md#callbacks)                                                              |

## `rail`

| Option           | Type             | Default               | Description                                     |
| ---------------- | ---------------- | --------------------- | ----------------------------------------------- |
| `heading`        | `string \| null` | locale's rail heading | Heading above the rail; `null` or `''` hides it |
| `maxVisible`     | `number`         | `10`                  | Maximum cards rendered (min 1)                  |
| `scrollBy`       | `number`         | `4`                   | Cards one arrow click scrolls by (min 1)        |
| `loop`           | `boolean`        | `false`               | Wrap the rail around at the ends                |
| `hoverPreviewMs` | `number`         | `2000`                | Hover preview duration in ms (min 0)            |

## `player`

| Option          | Type      | Default | Description                                         |
| --------------- | --------- | ------- | --------------------------------------------------- |
| `loop`          | `boolean` | `true`  | Wrap from the last story back to the first          |
| `autoplayMuted` | `boolean` | `true`  | Start videos muted so autoplay is never blocked     |
| `showReadMore`  | `boolean` | `true`  | Show the "read more" link for stories with a `link` |

## `ads`

| Option                    | Type      | Default | Description                                                            |
| ------------------------- | --------- | ------- | ---------------------------------------------------------------------- |
| `enabled`                 | `boolean` | `true`  | Master switch for ad breaks                                            |
| `every`                   | `number`  | `4`     | An ad occupies every Nth viewed slide, counting from the opening story |
| `durationMs`              | `number`  | `5000`  | How long a non-skippable ad blocks navigation                          |
| `skippableAfterFirstView` | `boolean` | `true`  | Ads become skippable once the viewer sat through one full ad           |
| `alwaysSkippable`         | `boolean` | `false` | Every ad skippable immediately                                         |
| `noFillTimeoutMs`         | `number`  | `2500`  | Wait for the ad adapter before treating the slot as no-fill            |

## `interactions`

| Option  | Type      | Default | Description                     |
| ------- | --------- | ------- | ------------------------------- |
| `like`  | `boolean` | `true`  | Like button and double-tap like |
| `share` | `boolean` | `true`  | Share button                    |
