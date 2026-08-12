import type { AdAdapter, FeedAdapter, FeedSource, StateStore } from './adapters'
import type { Category, Story } from './story'
import type { ConnectionInfo } from '../utils/device'

export interface RailOptions {
  heading?: string | null
  maxVisible?: number
  scrollBy?: number
  loop?: boolean
  hoverPreviewMs?: number
}

export interface RestartContext {
  story: Story
  video: HTMLVideoElement
  positionMs: number
  durationMs: number
}

export type RestartPolicy = boolean | ((context: RestartContext) => boolean)

export type PrefetchPolicy = number | ((connection: ConnectionInfo) => number)

export interface PlayerOptions {
  loop?: boolean
  autoplayMuted?: boolean
  showReadMore?: boolean
  restartOnRevisit?: RestartPolicy
  prefetch?: PrefetchPolicy
}

export interface AdOptions {
  enabled?: boolean
  every?: number
  durationMs?: number
  skippableAfterFirstView?: boolean
  alwaysSkippable?: boolean
  noFillTimeoutMs?: number
}

export interface InteractionOptions {
  like?: boolean
  share?: boolean
}

export interface AdaptersOptions {
  ad?: AdAdapter
  feed?: FeedAdapter
  state?: StateStore
}

export interface InteractionCallbacks {
  onLike?: (storyId: string, liked: boolean) => void
  onShare?: (storyId: string) => void
  onReadMore?: (storyId: string, link?: string) => void
}

export interface FlipReelOptions {
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

export interface ResolvedConfig {
  feed: FeedSource
  locale: string
  brand: string
  brandLogo: string | null
  categories: Category[] | null
  rail: Required<RailOptions>
  player: Required<PlayerOptions>
  ads: Required<AdOptions>
  interactions: Required<InteractionOptions>
  theme: Record<string, string>
  adapters: AdaptersOptions
  callbacks: InteractionCallbacks
}
