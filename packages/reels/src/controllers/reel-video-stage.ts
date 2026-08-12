import {
  shouldRestart,
  type PlayerState,
  type RestartPolicy,
  type Story,
} from '@flipatic/flip-reel-core'

export interface ReelVideoStageDeps {
  restartOnRevisit: RestartPolicy
  onAutoplayBlocked: (blocked: boolean) => void
}

export class ReelVideoStage {
  private playingId = ''

  constructor(private readonly deps: ReelVideoStageDeps) {}

  reset(): void {
    this.playingId = ''
  }

  sync(videos: HTMLVideoElement[], state: PlayerState, target: number): void {
    const live =
      state.open && !this.blockedByAd(state, target) && !this.blockedByPause(state, target)
    const leavingId = this.leavingId(state.stories[target])
    for (const video of videos) {
      video.muted = state.muted
      const index = Number(video.dataset.index)
      const story = state.stories[index]
      if (live && index === target) this.start(video, story)
      else this.stop(video, story, leavingId)
    }
  }

  private leavingId(targetStory?: Story): string {
    if (!this.playingId || !targetStory) return ''
    return targetStory.id === this.playingId ? '' : this.playingId
  }

  private blockedByAd(state: PlayerState, target: number): boolean {
    return state.ad.active || (state.ad.due && target > state.activeIndex)
  }

  private blockedByPause(state: PlayerState, target: number): boolean {
    return state.paused && target === state.activeIndex
  }

  private start(video: HTMLVideoElement, story?: Story): void {
    if (story && story.id !== this.playingId) {
      this.playingId = story.id
      this.rewind(video, story)
    }
    if (!video.paused) return
    video.play().then(
      () => this.deps.onAutoplayBlocked(false),
      () => this.deps.onAutoplayBlocked(true),
    )
  }

  private stop(video: HTMLVideoElement, story: Story | undefined, leavingId: string): void {
    if (!video.paused) video.pause()
    if (!story || story.id !== leavingId) return
    this.rewind(video, story)
  }

  private rewind(video: HTMLVideoElement, story: Story): void {
    if (video.currentTime === 0) return
    if (!video.ended && !shouldRestart(this.deps.restartOnRevisit, video, story)) return
    video.currentTime = 0
  }
}
