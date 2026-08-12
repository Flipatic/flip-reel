import { describe, expect, it } from 'vitest'
import type { PlayerState, RestartPolicy, Story } from '@flipatic/flip-reel-core'
import { ReelVideoStage } from './reel-video-stage'

interface FakeVideo {
  dataset: { index: string; storyId: string }
  muted: boolean
  paused: boolean
  ended: boolean
  currentTime: number
  duration: number
  play(): Promise<void>
  pause(): void
}

function fakeVideo(index: number, currentTime = 0, duration = 60): FakeVideo {
  const video: FakeVideo = {
    dataset: { index: String(index), storyId: `s${index}` },
    muted: true,
    paused: true,
    ended: false,
    currentTime,
    duration,
    play() {
      video.paused = false
      return Promise.resolve()
    },
    pause() {
      video.paused = true
    },
  }
  return video
}

function stories(count: number): Story[] {
  return Array.from({ length: count }, (_unused, index) => ({
    type: 'video' as const,
    id: `s${index}`,
    title: `Story ${index}`,
    category: 'all',
    video: `${index}.mp4`,
  }))
}

function playerState(activeIndex: number, overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    open: true,
    categoryId: 'all',
    stories: stories(3),
    activeIndex,
    muted: true,
    paused: false,
    autoplayBlocked: false,
    storyProgress: 0,
    likedIds: new Set<string>(),
    ad: {
      active: false,
      due: false,
      skippable: false,
      blocking: false,
      index: 0,
      remainingMs: 0,
      durationMs: 0,
    },
    ...overrides,
  }
}

function createStage(restartOnRevisit: RestartPolicy = true) {
  const blocked: boolean[] = []
  const stage = new ReelVideoStage({
    restartOnRevisit,
    onAutoplayBlocked: (value) => blocked.push(value),
  })
  return { stage, blocked }
}

function sync(
  stage: ReelVideoStage,
  videos: FakeVideo[],
  state: PlayerState,
  target: number,
): void {
  stage.sync(videos as unknown as HTMLVideoElement[], state, target)
}

describe('ReelVideoStage', () => {
  it('plays the target and pauses every other video', () => {
    const { stage } = createStage()
    const videos = [fakeVideo(0), fakeVideo(1), fakeVideo(2)]
    videos[0]!.paused = false

    sync(stage, videos, playerState(0), 1)

    expect(videos[0]!.paused).toBe(true)
    expect(videos[1]!.paused).toBe(false)
    expect(videos[2]!.paused).toBe(true)
  })

  it('plays the scroll target before the active index has landed', () => {
    const { stage } = createStage()
    const videos = [fakeVideo(0), fakeVideo(1)]

    sync(stage, videos, playerState(0), 1)

    expect(videos[1]!.paused).toBe(false)
  })

  it('restarts a story the moment it is left behind', () => {
    const { stage } = createStage()
    const videos = [fakeVideo(0), fakeVideo(1)]

    sync(stage, videos, playerState(0), 0)
    videos[0]!.currentTime = 12
    sync(stage, videos, playerState(0), 1)

    expect(videos[0]!.currentTime).toBe(0)
  })

  it('keeps the position of a story left behind when restart is disabled', () => {
    const { stage } = createStage(false)
    const videos = [fakeVideo(0), fakeVideo(1)]

    sync(stage, videos, playerState(0), 0)
    videos[0]!.currentTime = 12
    sync(stage, videos, playerState(0), 1)

    expect(videos[0]!.currentTime).toBe(12)
  })

  it('restarts a revisited story by default', () => {
    const { stage } = createStage()
    const videos = [fakeVideo(0, 12), fakeVideo(1)]

    sync(stage, videos, playerState(0), 1)
    sync(stage, videos, playerState(1), 0)

    expect(videos[0]!.currentTime).toBe(0)
  })

  it('resumes a revisited story when restart is disabled', () => {
    const { stage } = createStage(false)
    const videos = [fakeVideo(0, 12), fakeVideo(1)]

    sync(stage, videos, playerState(0), 1)
    sync(stage, videos, playerState(1), 0)

    expect(videos[0]!.currentTime).toBe(12)
  })

  it('lets a predicate decide from the story duration', () => {
    const { stage } = createStage(({ durationMs }) => durationMs >= 30_000)
    const videos = [fakeVideo(0, 5, 12), fakeVideo(1, 5, 45)]

    sync(stage, videos, playerState(0), 1)
    sync(stage, videos, playerState(1), 0)
    sync(stage, videos, playerState(0), 1)

    expect(videos[0]!.currentTime).toBe(5)
    expect(videos[1]!.currentTime).toBe(0)
  })

  it('always restarts a finished story', () => {
    const { stage } = createStage(false)
    const videos = [fakeVideo(0, 60), fakeVideo(1)]
    videos[0]!.ended = true

    sync(stage, videos, playerState(0), 1)
    sync(stage, videos, playerState(1), 0)

    expect(videos[0]!.currentTime).toBe(0)
  })

  it('keeps the position across a pause and resume', () => {
    const { stage } = createStage()
    const videos = [fakeVideo(0)]

    sync(stage, videos, playerState(0), 0)
    videos[0]!.currentTime = 12
    sync(stage, videos, playerState(0, { paused: true }), 0)
    sync(stage, videos, playerState(0), 0)

    expect(videos[0]!.currentTime).toBe(12)
    expect(videos[0]!.paused).toBe(false)
  })

  it('holds playback back when the next story raises an ad', () => {
    const { stage } = createStage()
    const videos = [fakeVideo(0), fakeVideo(1)]
    const state = playerState(0, {
      ad: { ...playerState(0).ad, due: true },
    })

    sync(stage, videos, state, 1)

    expect(videos[1]!.paused).toBe(true)
  })

  it('reports a rejected play as blocked autoplay', async () => {
    const { stage, blocked } = createStage()
    const video = fakeVideo(0)
    video.play = () => Promise.reject(new Error('blocked'))

    sync(stage, [video], playerState(0), 0)
    await Promise.resolve()

    expect(blocked).toEqual([true])
  })
})
