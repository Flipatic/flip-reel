import type { AdOptions, InteractionOptions, PlayerOptions, RailOptions } from '../types/config'

export const DEFAULT_LOCALE = 'en'

export const DEFAULT_RAIL: Required<RailOptions> = {
  heading: null,
  maxVisible: 10,
  scrollBy: 4,
  loop: false,
  hoverPreviewMs: 2000,
}

export const DEFAULT_PLAYER: Required<PlayerOptions> = {
  loop: true,
  autoplayMuted: true,
  showReadMore: true,
  restartOnRevisit: true,
  prefetch: 1,
}

export const DEFAULT_ADS: Required<AdOptions> = {
  enabled: true,
  every: 4,
  durationMs: 5000,
  skippableAfterFirstView: true,
  alwaysSkippable: false,
  noFillTimeoutMs: 2500,
}

export const DEFAULT_INTERACTIONS: Required<InteractionOptions> = {
  like: true,
  share: true,
}
