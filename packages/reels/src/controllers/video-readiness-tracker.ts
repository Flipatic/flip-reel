import type { ReactiveControllerHost } from 'lit'

const HAVE_NOTHING = 0
const HAVE_CURRENT_DATA = 2

export class VideoReadinessTracker {
  private ids: ReadonlySet<string> = new Set()

  constructor(private readonly host: ReactiveControllerHost) {}

  get ready(): ReadonlySet<string> {
    return this.ids
  }

  observe(videos: HTMLVideoElement[]): void {
    const next = new Set<string>()
    for (const video of videos) {
      const id = video.dataset.storyId
      if (id && this.hasFrame(video, id)) next.add(id)
    }
    if (this.matches(next)) return
    this.ids = next
    this.host.requestUpdate()
  }

  private hasFrame(video: HTMLVideoElement, id: string): boolean {
    if (video.readyState >= HAVE_CURRENT_DATA) return true
    return this.ids.has(id) && video.readyState > HAVE_NOTHING
  }

  private matches(next: ReadonlySet<string>): boolean {
    if (next.size !== this.ids.size) return false
    for (const id of next) if (!this.ids.has(id)) return false
    return true
  }
}
