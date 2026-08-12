import type { RestartContext, RestartPolicy } from '../types/config'
import type { Story } from '../types/story'

function durationOf(video: HTMLVideoElement, story: Story): number {
  const seconds = video.duration
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000
  return story.durationMs ?? 0
}

export function shouldRestart(
  policy: RestartPolicy,
  video: HTMLVideoElement,
  story: Story,
): boolean {
  if (typeof policy !== 'function') return policy
  const context: RestartContext = {
    story,
    video,
    positionMs: video.currentTime * 1000,
    durationMs: durationOf(video, story),
  }
  return policy(context)
}
