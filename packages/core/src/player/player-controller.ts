import { ALL_CATEGORY_ID, filterByCategory } from '../feed/feed-normalizer'
import { AdSession } from './ad-session'
import type { EventBus } from '../events/event-bus'
import type { FlipReelEventMap } from '../types/events'
import type { ResolvedConfig } from '../types/config'
import type { StateStore } from '../types/adapters'
import type { Story } from '../types/story'
import type { PlayerState } from './player-types'

export interface PlayerControllerDeps {
  config: ResolvedConfig
  store: StateStore
  events: EventBus<FlipReelEventMap>
}

export class PlayerController {
  private readonly ad: AdSession
  private readonly liked = new Set<string>()
  private readonly listeners = new Set<(state: PlayerState) => void>()
  private allStories: Story[] = []
  private stories: Story[] = []
  private categoryId = ALL_CATEGORY_ID
  private isOpen = false
  private activeIndex = 0
  private paused = false
  private muted: boolean
  private autoplayBlocked = false
  private storyProgress = 0
  private viewsSinceAd = 0
  private adsShown = 0
  private adActive = false

  constructor(private readonly deps: PlayerControllerDeps) {
    this.muted = deps.config.player.autoplayMuted
    this.ad = new AdSession(
      {
        durationMs: deps.config.ads.durationMs,
        skippableAfterFirstView: deps.config.ads.skippableAfterFirstView,
        alwaysSkippable: deps.config.ads.alwaysSkippable,
      },
      deps.store,
    )
  }

  setStories(stories: Story[]): void {
    this.allStories = stories
    this.rebuild()
    this.notify()
  }

  subscribe(listener: (state: PlayerState) => void): () => void {
    this.listeners.add(listener)
    listener(this.snapshot())
    return () => {
      this.listeners.delete(listener)
    }
  }

  open(storyId: string, categoryId?: string): void {
    if (categoryId) this.categoryId = categoryId
    this.rebuild()
    const index = this.stories.findIndex((story) => story.id === storyId)
    this.activeIndex = index >= 0 ? index : 0
    this.isOpen = true
    this.resetSession()
    this.resetActive()
    this.emitOpenView()
    this.notify()
  }

  close(): void {
    const story = this.currentStory()
    this.isOpen = false
    this.paused = true
    this.adActive = false
    this.deps.events.emit('flip-reel:close', { storyId: story?.id ?? null })
    this.notify()
  }

  setCategory(categoryId: string): void {
    if (this.adActive || categoryId === this.categoryId) return
    this.applyCategory(categoryId)
    this.registerView(true)
  }

  requestIndex(index: number): void {
    this.advanceTo(index)
  }

  notifyLanded(index: number): void {
    this.advanceTo(index)
  }

  reportVideoProgress(currentMs: number, durationMs: number): void {
    if (durationMs <= 0 || this.adActive) return
    this.storyProgress = Math.min(1, currentMs / durationMs)
  }

  togglePause(): void {
    this.setPaused(!this.paused)
  }

  setPaused(paused: boolean): void {
    if (this.adActive || this.paused === paused) return
    this.paused = paused
    const story = this.currentStory()
    if (story) {
      this.deps.events.emit(paused ? 'flip-reel:pause' : 'flip-reel:play', { storyId: story.id })
    }
    this.notify()
  }

  setMuted(muted: boolean): void {
    this.muted = muted
    this.notify()
  }

  toggleMuted(): void {
    this.setMuted(!this.muted)
  }

  setAutoplayBlocked(blocked: boolean): void {
    const paused = blocked || this.paused
    if (this.autoplayBlocked === blocked && this.paused === paused) return
    this.autoplayBlocked = blocked
    this.paused = paused
    this.notify()
  }

  toggleLike(storyId?: string): void {
    const story = storyId ? this.storyById(storyId) : this.currentStory()
    if (!story) return
    const liked = !this.liked.has(story.id)
    if (liked) this.liked.add(story.id)
    else this.liked.delete(story.id)
    this.deps.events.emit('flip-reel:like', { storyId: story.id, liked })
    this.deps.config.callbacks.onLike?.(story.id, liked)
    this.notify()
  }

  share(storyId?: string): void {
    const story = storyId ? this.storyById(storyId) : this.currentStory()
    if (!story) return
    this.deps.events.emit('flip-reel:share', { storyId: story.id })
    this.deps.config.callbacks.onShare?.(story.id)
  }

  readMore(): void {
    const story = this.currentStory()
    if (!story) return
    this.deps.events.emit('flip-reel:readmore', { storyId: story.id, link: story.link })
    this.deps.config.callbacks.onReadMore?.(story.id, story.link)
  }

  tick(deltaMs: number): void {
    if (!this.adActive) return
    const secondsBefore = Math.ceil(this.ad.remainingMs / 1000)
    if (this.ad.tick(deltaMs)) {
      this.deps.events.emit('flip-reel:ad:completed', { index: this.adsShown })
      this.resolveAd()
      return
    }
    if (Math.ceil(this.ad.remainingMs / 1000) !== secondsBefore) this.notify()
  }

  requestAdSkip(): void {
    if (!this.adActive) return
    if (this.ad.requestSkip()) {
      this.deps.events.emit('flip-reel:ad:skipped', { index: this.adsShown })
      this.resolveAd()
    }
  }

  onAdImpression(): void {
    this.deps.events.emit('flip-reel:ad:impression', { index: this.adsShown })
  }

  onAdNoFill(): void {
    this.deps.events.emit('flip-reel:ad:empty', { index: this.adsShown })
    this.resolveAd()
  }

  snapshot(): PlayerState {
    return {
      open: this.isOpen,
      categoryId: this.categoryId,
      stories: this.stories,
      activeIndex: this.activeIndex,
      muted: this.muted,
      paused: this.paused,
      autoplayBlocked: this.autoplayBlocked,
      storyProgress: this.storyProgress,
      likedIds: this.liked,
      ad: {
        active: this.adActive,
        due: this.adDue(),
        skippable: this.ad.skippable,
        blocking: this.adActive && !this.ad.skippable,
        index: this.adsShown,
        remainingMs: this.ad.remainingMs,
        durationMs: this.ad.durationMs,
      },
    }
  }

  destroy(): void {
    this.listeners.clear()
  }

  private advanceTo(index: number): void {
    if (this.adActive || index < 0 || index >= this.stories.length || index === this.activeIndex) {
      return
    }
    const forward = index > this.activeIndex
    this.commitIndex(index)
    this.registerView(forward)
  }

  private registerView(canRaiseAd: boolean): void {
    if (canRaiseAd && this.adDue()) {
      this.raiseAd()
      return
    }
    this.viewsSinceAd += 1
  }

  private adDue(): boolean {
    const { enabled, every } = this.deps.config.ads
    if (!enabled || every <= 0) return false
    return this.viewsSinceAd + 1 >= every
  }

  private raiseAd(): void {
    this.adActive = true
    this.paused = true
    this.ad.start()
    this.deps.events.emit('flip-reel:ad:requested', { index: this.adsShown })
    this.notify()
  }

  private resolveAd(): void {
    if (!this.adActive) return
    this.adsShown += 1
    this.adActive = false
    this.viewsSinceAd = 1
    this.resetActive()
    this.notify()
  }

  private commitIndex(index: number): void {
    this.activeIndex = index
    this.resetActive()
    this.emitView()
    this.notify()
  }

  private applyCategory(categoryId: string): void {
    this.categoryId = categoryId
    this.rebuild()
    this.activeIndex = 0
    this.resetActive()
    this.emitView()
    this.notify()
  }

  private resetSession(): void {
    this.viewsSinceAd = 1
    this.adsShown = 0
    this.adActive = false
  }

  private resetActive(): void {
    this.storyProgress = 0
    this.paused = false
    this.autoplayBlocked = false
  }

  private rebuild(): void {
    this.stories = filterByCategory(this.allStories, this.categoryId)
  }

  private currentStory(): Story | null {
    return this.stories[this.activeIndex] ?? null
  }

  private storyById(id: string): Story | null {
    return this.stories.find((story) => story.id === id) ?? null
  }

  private emitView(): void {
    const story = this.currentStory()
    if (story)
      this.deps.events.emit('flip-reel:view', { storyId: story.id, index: this.activeIndex })
  }

  private emitOpenView(): void {
    const story = this.currentStory()
    if (!story) return
    this.deps.events.emit('flip-reel:open', { storyId: story.id, index: this.activeIndex })
    this.deps.events.emit('flip-reel:view', { storyId: story.id, index: this.activeIndex })
  }

  private notify(): void {
    const state = this.snapshot()
    for (const listener of Array.from(this.listeners)) listener(state)
  }
}
