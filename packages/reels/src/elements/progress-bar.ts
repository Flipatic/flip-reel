import { LitElement, css, html } from 'lit'
import { property } from 'lit/decorators.js'
import { flipReelElement } from './define'

/**
 * `<flip-reel-progress-bar>` — seekable playback progress bar. `value` is the
 * played fraction (0–1); emits a `seek` event with the target fraction.
 */
@flipReelElement('flip-reel-progress-bar')
export class FlipReelProgressBar extends LitElement {
  @property({ type: Number }) value = 0

  private dragging = false

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    .bar {
      display: flex;
      width: 100%;
      align-items: center;
      padding: 8px 0;
      cursor: pointer;
      touch-action: none;
    }
    .track {
      width: 100%;
      height: 4px;
      border-radius: var(--flip-reel-radius-lg, 8px);
      background: var(
        --flip-reel-progress-track,
        var(--flip-reel-alpha-white-10, rgba(255, 255, 255, 0.1))
      );
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: 9999px;
      background: var(--flip-reel-progress-fill, var(--flip-reel-white, #ffffff));
    }
  `

  private fractionFromPointer(event: PointerEvent): number {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    if (rect.width <= 0) return 0
    return Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  }

  private emitSeek(fraction: number): void {
    this.value = fraction
    this.dispatchEvent(new CustomEvent('seek', { detail: fraction, bubbles: true, composed: true }))
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.dragging = true
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    this.emitSeek(this.fractionFromPointer(event))
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (this.dragging) this.emitSeek(this.fractionFromPointer(event))
  }

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.dragging = false
    const el = event.currentTarget as HTMLElement
    if (el.hasPointerCapture(event.pointerId)) el.releasePointerCapture(event.pointerId)
  }

  render() {
    const pct = Math.max(0, Math.min(1, this.value)) * 100
    return html`<div
      class="bar"
      @pointerdown="${this.onPointerDown}"
      @pointermove="${this.onPointerMove}"
      @pointerup="${this.onPointerUp}"
      @pointercancel="${this.onPointerUp}"
    >
      <div
        class="track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${Math.round(pct)}"
      >
        <div class="fill" style="width:${pct}%"></div>
      </div>
    </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flip-reel-progress-bar': FlipReelProgressBar
  }
}
