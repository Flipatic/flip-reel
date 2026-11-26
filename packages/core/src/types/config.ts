import type { AdAdapter, FeedAdapter, FeedSource, StateStore } from './adapters'
import type { Category } from './story'

/** Options for the horizontal card rail. */
export interface RailOptions {
  /**
   * Heading above the rail; `null` hides it.
   * @defaultValue the locale's "Watch the latest reels"
   */
  heading?: string | null
  /**
   * Maximum number of cards rendered in the rail.
   * @defaultValue 10
   */
  maxVisible?: number
  /**
   * Number of cards one arrow click scrolls by.
   * @defaultValue 4
   */
  scrollBy?: number
  /**
   * Whether the rail wraps around at the ends.
   * @defaultValue false
   */
  loop?: boolean
  /**
   * How long a hovered card plays its muted preview, in milliseconds.
   * @defaultValue 2000
   */
  hoverPreviewMs?: number
}

/** Options for the full-screen player. */
export interface PlayerOptions {
  /**
   * Whether playback wraps from the last story back to the first.
   * @defaultValue true
   */
  loop?: boolean
  /**
   * Whether videos start muted so autoplay is never blocked.
   * @defaultValue true
   */
  autoplayMuted?: boolean
  /**
   * Whether stories with a link show the "read more" call to action.
   * @defaultValue true
   */
  showReadMore?: boolean
}

/** Options for view-gated ad breaks inside the player. */
export interface AdOptions {
  /**
   * Master switch for ad breaks.
   * @defaultValue true
   */
  enabled?: boolean
  /**
   * An ad occupies every Nth viewed slide, counting from the opening story.
   * @defaultValue 4
   */
  every?: number
  /**
   * How long a non-skippable ad blocks navigation, in milliseconds.
   * @defaultValue 5000
   */
  durationMs?: number
  /**
   * Whether ads become skippable once the viewer has sat through one full ad.
   * @defaultValue true
   */
  skippableAfterFirstView?: boolean
  /**
   * Makes every ad skippable immediately, overriding the first-view gate.
   * @defaultValue false
   */
  alwaysSkippable?: boolean
  /**
   * How long to wait for an ad adapter before treating the slot as a no-fill,
   * in milliseconds.
   * @defaultValue 2500
   */
  noFillTimeoutMs?: number
}

/** Toggles for the player's interaction buttons. */
export interface InteractionOptions {
  /**
   * Whether the like button (and double-tap like) is available.
   * @defaultValue true
   */
  like?: boolean
  /**
   * Whether the share button is available.
   * @defaultValue true
   */
  share?: boolean
}

/** Pluggable implementations replacing the built-in behavior. */
export interface AdaptersOptions {
  /** Renders ad creatives into the player's ad breaks. */
  ad?: AdAdapter
  /** Loads and normalizes the feed. */
  feed?: FeedAdapter
  /** Persists cross-session state such as the ad skip gate. */
  state?: StateStore
}

/**
 * Direct function callbacks for interactions, invoked alongside the
 * corresponding `flip-reel:*` DOM events.
 */
export interface InteractionCallbacks {
  onLike?: (storyId: string, liked: boolean) => void
  onShare?: (storyId: string) => void
  onReadMore?: (storyId: string, link?: string) => void
}

/** Everything the widget accepts at mount time. */
export interface FlipReelOptions {
  /** Where the stories come from. Required. */
  feed: FeedSource
  /**
   * UI locale; falls back to English for unknown locales.
   * @defaultValue "en"
   */
  locale?: string
  /**
   * Publisher name shown in the player top bar. Also used as the alt text of
   * the {@link FlipReelOptions.brandLogo | brand logo} image.
   * @defaultValue "FlipReel"
   */
  brand?: string
  /** URL of the logo displayed in the player top bar instead of the brand mark. */
  brandLogo?: string
  /** Explicit category list, overriding categories derived from the feed. */
  categories?: Category[]
  rail?: RailOptions
  player?: PlayerOptions
  ads?: AdOptions
  interactions?: InteractionOptions
  /** CSS custom property overrides, e.g. `{ '--flip-reel-progress-fill': '#f00' }`. */
  theme?: Record<string, string>
  adapters?: AdaptersOptions
  callbacks?: InteractionCallbacks
}

/** {@link FlipReelOptions} with every default applied and numbers clamped. */
/**
 * {@link RailOptions} after defaults are applied. `heading` stays `undefined` when it was
 * not set, so the UI falls back to the locale's heading; `null` hides the heading.
 */
export type ResolvedRailOptions = Omit<Required<RailOptions>, 'heading'> & {
  heading: string | null | undefined
}

export interface ResolvedConfig {
  feed: FeedSource
  locale: string
  brand: string
  brandLogo: string | null
  categories: Category[] | null
  rail: ResolvedRailOptions
  player: Required<PlayerOptions>
  ads: Required<AdOptions>
  interactions: Required<InteractionOptions>
  theme: Record<string, string>
  adapters: AdaptersOptions
  callbacks: InteractionCallbacks
}
