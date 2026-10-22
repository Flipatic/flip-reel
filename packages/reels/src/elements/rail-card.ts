import { LitElement, css, html, nothing } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { flipReelElement } from './define'
import {
  LeasePriority,
  canHover,
  hasSlowConnection,
  isVideoStory,
  prefersReducedMotion,
  prefersSaveData,
  type LeasePriorityValue,
  type MediaScheduler,
  type Story,
} from '@flipatic/flip-reel-core'
import { VideoLeaseController } from '../controllers/video-lease-controller'

/**
 * `<flip-reel-rail-card>` — one story card in the rail, with hover video
 * preview. Emits an `open` event with the story id when activated.
 */
@flipReelElement('flip-reel-rail-card')
export class FlipReelRailCard extends LitElement {
  @property({ attribute: false }) story!: Story
  @property({ attribute: false }) scheduler!: MediaScheduler
  @property({ type: Number }) previewMs = 2000

  @state() private armed = false
  @query('video') private video?: HTMLVideoElement

  private lease?: VideoLeaseController
  private observer?: IntersectionObserver

  static styles = css`
    :host {
      display: block;
    }
    .card {
      position: relative;
      display: block;
      width: 100%;
      aspect-ratio: 9 / 16;
      border-radius: var(--flip-reel-radius-card, 16px);
      overflow: hidden;
      background: var(--flip-reel-neutral-900, #171717);
      color: #ffffff;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.3s ease;
    }
    @media (hover: hover) {
      .card:hover {
        transform: scale(1.03);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .card:hover {
        transform: none;
      }
    }
    .poster,
    .preview {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .category {
      position: absolute;
      top: 16px;
      left: 16px;
      padding: 4px 10px;
      border-radius: var(--flip-reel-radius-pill, 9999px);
      background: var(--flip-reel-alpha-black-60, rgba(0, 0, 0, 0.6));
      font-size: 12px;
      font-weight: 500;
      line-height: 16px;
      text-transform: uppercase;
      white-space: nowrap;
      color: #ffffff;
    }
    .meta {
      position: absolute;
      inset-inline: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 72px 16px 24px;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.8));
    }
    .publisher {
      font-size: 12px;
      font-weight: 500;
      line-height: 16px;
      text-transform: uppercase;
      opacity: 0.8;
    }
    .title {
      font-size: 18px;
      font-weight: 700;
      line-height: 22px;
    }
    .card:focus-visible {
      outline: none;
      box-shadow: var(
        --flip-reel-shadow-focus,
        0 0 0 2px #ffffff,
        0 0 0 4px rgba(29, 78, 216, 0.6)
      );
    }
  `

  firstUpdated(): void {
    this.lease = new VideoLeaseController(this, this.scheduler, () => this.stopPreview())
    this.setupObserver()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.observer?.disconnect()
  }

  private get canLoadPreview(): boolean {
    return isVideoStory(this.story) && canHover() && !prefersSaveData() && !hasSlowConnection()
  }

  private setupObserver(): void {
    if (!this.canLoadPreview) return
    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        this.armed = true
        this.observer?.disconnect()
      },
      { rootMargin: '300px 0px' },
    )
    this.observer.observe(this)
  }

  private onEnter(): void {
    if (!this.canLoadPreview || prefersReducedMotion()) return
    this.startPreview(LeasePriority.HOVER)
  }

  private onLeave(): void {
    this.stopPreview()
  }

  private startPreview(priority: LeasePriorityValue): void {
    if (!isVideoStory(this.story) || !this.lease?.acquire(priority)) return
    const video = this.video
    if (!video) return
    if (!video.src) video.src = `${this.story.preview ?? this.story.video}#t=0.001`
    video.currentTime = 0
    video.play().then(undefined, () => this.stopPreview())
  }

  private stopPreview(): void {
    const video = this.video
    if (video) {
      video.pause()
      video.currentTime = 0
    }
    this.lease?.release()
  }

  private onPreviewTime(): void {
    const video = this.video
    if (video && this.previewMs > 0 && video.currentTime * 1000 >= this.previewMs) {
      video.currentTime = 0
    }
  }

  private open(event: Event): void {
    event.preventDefault()
    this.dispatchEvent(
      new CustomEvent('open', {
        detail: { storyId: this.story.id },
        bubbles: true,
        composed: true,
      }),
    )
  }

  render() {
    const story = this.story
    const poster = isVideoStory(story) ? story.poster : story.image
    const previewSrc =
      isVideoStory(story) && this.armed ? `${story.preview ?? story.video}#t=0.001` : undefined
    return html`<a
      class="card"
      href="${this.story.link ?? '#'}"
      @click="${this.open}"
      @pointerenter="${this.onEnter}"
      @pointerleave="${this.onLeave}"
    >
      ${poster
        ? html`<img class="poster" src="${poster}" alt="" decoding="async" loading="lazy" />`
        : nothing}
      ${isVideoStory(story)
        ? html`<video
            class="preview"
            muted
            loop
            playsinline
            preload="metadata"
            src="${previewSrc ?? nothing}"
            @timeupdate="${this.onPreviewTime}"
          ></video>`
        : nothing}
      <span class="category">${this.story.category}</span>
      <div class="meta">
        ${this.story.brand ? html`<span class="publisher">${this.story.brand}</span>` : nothing}
        <h3 class="title">${this.story.title}</h3>
      </div>
    </a>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flip-reel-rail-card': FlipReelRailCard
  }
}
