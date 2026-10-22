import { LitElement, css, html, nothing } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { flipReelElement } from './define'
import type { FlipReelOptions, MediaScheduler, Story } from '@flipatic/flip-reel-core'
import { WidgetController } from '../context/widget-controller'
import { readOptions } from '../context/attribute-options'
import { icon } from '../icons/icons'
import { tokens } from '../styles/tokens'
import { railControl, visuallyHidden } from '../styles/shared'
import './rail-card'

const SCROLL_DURATION = 25
const SCROLL_FRICTION = 0.68
const FIXED_STEP_MS = 1000 / 60

/**
 * `<flip-reel-rail>` — the standalone horizontal card rail. Bootstraps its own
 * widget from attributes when used without a parent `<flip-reel>`. Emits an
 * `open` event with the clicked story id.
 */
@flipReelElement('flip-reel-rail')
export class FlipReelRail extends LitElement {
  /** Stories to render as cards. */
  @property({ attribute: false }) stories: Story[] = []
  /** Playback scheduler shared with the rest of the page. */
  @property({ attribute: false }) scheduler?: MediaScheduler
  /** Widget configuration for standalone bootstrapping. */
  @property({ attribute: false }) options?: FlipReelOptions
  /** Heading above the rail; empty string hides it. */
  @property() heading: string | null = null
  /** How long a hovered card plays its muted preview, in milliseconds. */
  @property({ type: Number, attribute: 'preview-ms' }) previewMs = 2000
  /** Maximum number of cards rendered. */
  @property({ type: Number, attribute: 'max-visible' }) maxVisible = 10
  /** Number of cards one arrow click scrolls by. */
  @property({ type: Number, attribute: 'scroll-by' }) scrollStep = 4

  @state() private canLeft = false
  @state() private canRight = true
  @query('.track') private track?: HTMLElement

  private own?: WidgetController
  private scrollFrame = 0

  static styles = [
    tokens,
    railControl,
    visuallyHidden,
    css`
      :host {
        display: block;
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 0 0 24px;
      }
      h2 {
        margin: 0;
        font-size: var(--flip-reel-heading-size, 30px);
        line-height: 36px;
        font-weight: 700;
        letter-spacing: -0.75px;
        color: var(--flip-reel-heading-color, #171717);
      }
      .arrows {
        display: none;
        gap: 8px;
      }
      @media (min-width: 1024px) {
        .arrows {
          display: flex;
        }
      }
      .track {
        display: flex;
        gap: var(--flip-reel-gap, 16px);
        overflow-x: auto;
        scrollbar-width: none;
        padding: 12px;
        margin: 0 -12px;
      }
      .track::-webkit-scrollbar {
        display: none;
      }
      .item {
        flex: 0 0 62%;
      }
      @media (min-width: 640px) {
        .item {
          flex-basis: 34%;
        }
      }
      @media (min-width: 768px) {
        .item {
          flex-basis: 27%;
        }
      }
      @media (min-width: 1024px) {
        .item {
          flex-basis: calc((100% - 3rem) / 3.5 * 0.85);
        }
      }
    `,
  ]

  connectedCallback(): void {
    super.connectedCallback()
    if (!this.scheduler) void this.bootstrap()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame)
    this.own?.destroy()
  }

  private async bootstrap(): Promise<void> {
    const options = readOptions(this)
    if (!options) return
    this.own = new WidgetController(options, this)
    await this.own.load()
    this.stories = this.own.stories
    this.scheduler = this.own.scheduler
    this.heading = this.own.config.rail.heading ?? this.own.messages.railHeading
    this.previewMs = this.own.config.rail.hoverPreviewMs
    this.maxVisible = this.own.config.rail.maxVisible
    this.scrollStep = this.own.config.rail.scrollBy
  }

  private scrollByCards(direction: 1 | -1): void {
    const track = this.track
    if (!track) return
    const item = track.querySelector<HTMLElement>('.item')
    const step = (item?.offsetWidth ?? track.clientWidth / 3) + 16
    const max = track.scrollWidth - track.clientWidth
    const target = Math.max(0, Math.min(max, track.scrollLeft + direction * step * this.scrollStep))
    this.animateScrollLeft(track, target)
  }

  private animateScrollLeft(track: HTMLElement, target: number): void {
    if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame)
    if (Math.abs(target - track.scrollLeft) < 1) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      track.scrollLeft = target
      return
    }
    let location = track.scrollLeft
    let previous = location
    let velocity = 0
    let accumulator = 0
    let last = performance.now()
    const tick = (now: number) => {
      accumulator += Math.min(now - last, FIXED_STEP_MS * 4)
      last = now
      while (accumulator >= FIXED_STEP_MS) {
        previous = location
        velocity += (target - location) / SCROLL_DURATION
        velocity *= SCROLL_FRICTION
        location += velocity
        accumulator -= FIXED_STEP_MS
      }
      if (Math.abs(target - location) < 0.5) {
        track.scrollLeft = target
        this.scrollFrame = 0
        return
      }
      track.scrollLeft = previous + (location - previous) * (accumulator / FIXED_STEP_MS)
      this.scrollFrame = requestAnimationFrame(tick)
    }
    this.scrollFrame = requestAnimationFrame(tick)
  }

  private onScroll(): void {
    const track = this.track
    if (!track) return
    this.canLeft = track.scrollLeft > 8
    this.canRight = track.scrollLeft + track.clientWidth < track.scrollWidth - 8
  }

  render() {
    const heading = this.heading ?? ''
    const visible = this.stories.slice(0, this.maxVisible)
    return html`<section>
      <div class="head">
        <h2>${heading}</h2>
        <div class="arrows">
          <button
            class="rail-control"
            type="button"
            ?disabled="${!this.canLeft}"
            aria-label="Scroll left"
            @click="${() => this.scrollByCards(-1)}"
          >
            ${icon('arrow-left')}
          </button>
          <button
            class="rail-control"
            type="button"
            ?disabled="${!this.canRight}"
            aria-label="Scroll right"
            @click="${() => this.scrollByCards(1)}"
          >
            ${icon('arrow-right')}
          </button>
        </div>
      </div>
      ${this.scheduler
        ? html`<div class="track" @scroll="${this.onScroll}">
            ${visible.map(
              (story) =>
                html`<div class="item">
                  <flip-reel-rail-card
                    .story="${story}"
                    .scheduler="${this.scheduler}"
                    .previewMs="${this.previewMs}"
                  ></flip-reel-rail-card>
                </div>`,
            )}
          </div>`
        : nothing}
    </section>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flip-reel-rail': FlipReelRail
  }
}
