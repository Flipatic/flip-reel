# Elements & components

All elements render inside an open Shadow DOM, so host-page CSS cannot leak in; style them
through [CSS custom properties](theming.md).

## `<flip-reel>` (`FlipReelReels`)

The complete widget: card rail plus full-screen player.

Configure it one of two ways:

```html
<flip-reel feed="https://publisher.example/reels.json" locale="pl" brand="Publisher"></flip-reel>
```

```ts
import { mount } from '@flipatic/flip-reel'
const element = mount(document.querySelector('#reels')!, { feed: '...' })
```

`mount(target, options)` creates a `<flip-reel>`, assigns `options`, appends it to `target`,
and returns the element.

### Attributes

Attributes are read once at connect time when no `options` property is set. Complex options
(adapters, callbacks, theme, categories) are property-only.

| Attribute          | Maps to               | Type                         |
| ------------------ | --------------------- | ---------------------------- |
| `feed`             | `feed`                | URL string                   |
| `locale`           | `locale`              | string                       |
| `brand`            | `brand`               | string                       |
| `brand-logo`       | `brandLogo`           | URL string                   |
| `heading`          | `rail.heading`        | string (`""` hides it)       |
| `max-visible`      | `rail.maxVisible`     | number                       |
| `scroll-by`        | `rail.scrollBy`       | number                       |
| `rail-loop`        | `rail.loop`           | boolean (`"false"` disables) |
| `hover-preview-ms` | `rail.hoverPreviewMs` | number                       |
| `ads`              | `ads.enabled`         | boolean (`"false"` disables) |
| `ad-every`         | `ads.every`           | number                       |
| `ad-duration-ms`   | `ads.durationMs`      | number                       |

## `<flip-reel-rail>` (`FlipReelRail`)

The standalone horizontal card rail. Used internally by `<flip-reel>`, or standalone with the
same attributes as above (it bootstraps its own widget from them). Emits an `open`
`CustomEvent<{ storyId: string }>` when a card is activated.

Properties: `stories`, `scheduler`, `options`, `heading`, `previewMs` (`preview-ms`),
`maxVisible` (`max-visible`), `scrollStep` (`scroll-by`).

## `<flip-reel-player>` (`FlipReelPlayer`)

The full-screen dialog player. Usually driven by a parent `<flip-reel>`; standalone it
bootstraps from attributes and opens at the story id given by the `start` attribute.

## Internal elements

Exported for completeness and typing; you normally never instantiate them directly:

| Element                          | Class                       | Role                                                                 |
| -------------------------------- | --------------------------- | -------------------------------------------------------------------- |
| `<flip-reel-rail-card>`          | `FlipReelRailCard`          | One rail card with hover video preview; emits `open`                 |
| `<flip-reel-category-menu>`      | `FlipReelCategoryMenu`      | Category pill bar; emits `category-change`                           |
| `<flip-reel-progress-bar>`       | `FlipReelProgressBar`       | Seekable progress bar; emits `seek` with a 0–1 fraction              |
| `<flip-reel-ad-slide>`           | `FlipReelAdSlide`           | Hosts one ad creative; emits `ad-impression`, `ad-nofill`, `ad-skip` |
| `<flip-reel-blurred-background>` | `FlipReelBlurredBackground` | Blurred poster backdrop behind the desktop player                    |

## React

`@flipatic/flip-reel-react` wraps the elements via `@lit/react`:

```tsx
import { Reels, Rail, Player } from '@flipatic/flip-reel-react'

export function App() {
  return <Reels options={options} onView={(e) => track(e.detail.storyId)} />
}
```

`Reels` exposes every widget event as a typed `on*` prop — see
[Events](events.md#react-props). `Rail` and `Player` wrap the standalone elements without
event mappings (listen on the DOM node via `ref` if needed).

## Vue / Svelte / plain DOM

Custom elements work natively; listen with `@flip-reel:like` (Vue), `on:flip-reel:like`
(Svelte), or `addEventListener('flip-reel:like', ...)`. TypeScript infers the detail types
through the global `HTMLElementEventMap` augmentation shipped with the core package.
