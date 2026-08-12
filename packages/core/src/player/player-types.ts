import type { Story } from '../types/story'

export interface AdState {
  active: boolean
  due: boolean
  skippable: boolean
  blocking: boolean
  index: number
  remainingMs: number
  durationMs: number
}

export interface PlayerState {
  open: boolean
  categoryId: string
  stories: Story[]
  activeIndex: number
  muted: boolean
  paused: boolean
  autoplayBlocked: boolean
  storyProgress: number
  likedIds: ReadonlySet<string>
  ad: AdState
}
