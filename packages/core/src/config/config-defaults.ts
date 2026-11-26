import type {
  AdOptions,
  InteractionOptions,
  PlayerOptions,
  ResolvedRailOptions,
} from '../types/config'

/** Locale used when {@link FlipReelOptions.locale} is omitted. */
export const DEFAULT_LOCALE = 'en'

/** Defaults for {@link RailOptions}. `heading: undefined` means the locale's heading. */
export const DEFAULT_RAIL: ResolvedRailOptions = {
  heading: undefined,
  maxVisible: 10,
  scrollBy: 4,
  loop: false,
  hoverPreviewMs: 2000,
}

/** Defaults for {@link PlayerOptions}. */
export const DEFAULT_PLAYER: Required<PlayerOptions> = {
  loop: true,
  autoplayMuted: true,
  showReadMore: true,
}

/** Defaults for {@link AdOptions}. */
export const DEFAULT_ADS: Required<AdOptions> = {
  enabled: true,
  every: 4,
  durationMs: 5000,
  skippableAfterFirstView: true,
  alwaysSkippable: false,
  noFillTimeoutMs: 2500,
}

/** Defaults for {@link InteractionOptions}. */
export const DEFAULT_INTERACTIONS: Required<InteractionOptions> = {
  like: true,
  share: true,
}
