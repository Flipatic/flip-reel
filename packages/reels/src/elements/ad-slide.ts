import { LitElement, css, html, nothing } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { flipReelElement } from './define'
import type { AdAdapter, AdHandle } from '@flipatic/flip-reel-core'
import type { Messages } from '../i18n/i18n'
import { icon } from '../icons/icons'

/**
 * `<flip-reel-ad-slide>` — hosts one ad creative during an ad break: asks the
 * {@link AdAdapter} for a creative, shows the countdown/skip UI, and emits
 * `ad-impression`, `ad-nofill`, and `ad-skip` events.
 */
@flipReelElement('flip-reel-ad-slide')
export class FlipReelAdSlide extends LitElement {
  @property({ attribute: false }) adapter?: AdAdapter
  @property({ attribute: false }) messages!: Messages
  @property() locale = 'en'
  @property({ type: Number }) index = 0
  @property({ type: Boolean }) active = false
  @property({ type: Boolean }) skippable = false
  @property({ type: Number }) remainingMs = 0
  @property({ type: Number }) noFillTimeoutMs = 2500

  @query('.creative') private container?: HTMLElement

  private handle?: AdHandle
  private requested = -1
  private timeoutId = 0
  private totalMs = 0
  @state() private outcome: 'none' | 'filled' | 'empty' = 'none'
  private reported = false

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      display: block;
    }
    .creative {
      position: absolute;
      inset: 0;
      overflow: hidden;
      background: #000000;
    }
    .stripes {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        45deg,
        #f8fafc 0,
        #f8fafc 24px,
        #e2e8f0 24px,
        #e2e8f0 48px
      );
    }
    .bars {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 0 32px;
    }
    .bar {
      height: 12px;
      border-radius: 9999px;
      background: rgba(212, 212, 212, 0.8);
    }
    .bar-1 {
      width: 128px;
    }
    .bar-2 {
      width: 192px;
    }
    .bar-3 {
      width: 160px;
    }
    .ad-top {
      position: absolute;
      inset-inline: 0;
      top: calc(var(--reel-clear, calc(max(16px, env(safe-area-inset-top)) + 64px)) + 8px);
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
    }
    @media (min-width: 768px) {
      .ad-top {
        top: 12px;
        padding: 0 12px;
      }
    }
    .label {
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: var(--flip-reel-radius-pill, 9999px);
      font-size: 11px;
      line-height: 16px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--flip-reel-white, #ffffff);
      background: var(--flip-reel-neutral-900, #171717);
    }
    .countdown {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .skip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      border: none;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: var(--flip-reel-radius-pill, 9999px);
      font: inherit;
      font-size: 12px;
      line-height: 16px;
      font-weight: 600;
      color: var(--flip-reel-white, #ffffff);
      background: rgba(23, 23, 23, 0.85);
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      transition: background-color 0.15s ease;
    }
    .skip:hover {
      background: var(--flip-reel-neutral-900, #171717);
    }
    .skip:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--flip-reel-white, #ffffff);
    }
    .skip svg {
      width: 14px;
      height: 14px;
    }
    .timer {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 9999px;
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      color: var(--flip-reel-white, #ffffff);
      background: rgba(23, 23, 23, 0.85);
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
    }
    .ad-bottom {
      position: absolute;
      inset-inline: 0;
      bottom: 0;
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 64px 16px max(16px, env(safe-area-inset-bottom));
      background: linear-gradient(
        to top,
        #ffffff,
        rgba(255, 255, 255, 0.95) 50%,
        rgba(255, 255, 255, 0)
      );
    }
    .ad-cta {
      align-self: center;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: none;
      cursor: pointer;
      padding: 12px 24px;
      border-radius: var(--flip-reel-radius-pill, 9999px);
      font: inherit;
      font-size: 14px;
      line-height: 20px;
      font-weight: 600;
      color: var(--flip-reel-white, #ffffff);
      background: var(--flip-reel-neutral-900, #171717);
      transition: background-color 0.15s ease;
    }
    .ad-cta:hover {
      background: var(--flip-reel-neutral-800, #262626);
    }
    .ad-cta:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px var(--flip-reel-neutral-900, #171717);
    }
    .ad-cta svg {
      width: 16px;
      height: 16px;
    }
    .ad-progress {
      width: 100%;
      height: 4px;
      overflow: hidden;
      border-radius: var(--flip-reel-radius-lg, 8px);
      background: var(--flip-reel-neutral-200, #e5e5e5);
    }
    .ad-progress-fill {
      height: 100%;
      border-radius: 9999px;
      background: var(--flip-reel-neutral-900, #171717);
      transition: width 0.2s linear;
    }
  `

  updated(changed: Map<string, unknown>): void {
    if (changed.has('index') && this.index !== this.requested) {
      void this.requestAd()
    } else if (changed.has('active') && this.active) {
      this.report()
    }
    if (this.active && this.remainingMs > this.totalMs) this.totalMs = this.remainingMs
    if (!this.active) this.totalMs = 0
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.teardown()
  }

  private async requestAd(): Promise<void> {
    this.requested = this.index
    this.outcome = 'none'
    this.reported = false
    this.teardown()
    const container = this.container
    if (!container) return
    if (!this.adapter) {
      this.settle(this.hasSlottedAd() ? 'filled' : 'empty')
      return
    }
    let settled = false
    this.timeoutId = window.setTimeout(() => {
      if (settled) return
      settled = true
      this.settle('empty')
    }, this.noFillTimeoutMs)
    try {
      const handle = await this.adapter.request({
        index: this.index,
        container,
        format: 'vertical-video',
        locale: this.locale,
      })
      if (settled) {
        handle?.destroy()
        return
      }
      settled = true
      window.clearTimeout(this.timeoutId)
      if (!handle) {
        this.settle('empty')
        return
      }
      this.handle = handle
      this.settle('filled')
    } catch {
      if (settled) return
      settled = true
      window.clearTimeout(this.timeoutId)
      this.settle('empty')
    }
  }

  private settle(outcome: 'filled' | 'empty'): void {
    this.outcome = outcome
    this.report()
  }

  private report(): void {
    if (this.reported || !this.active || this.outcome === 'none') return
    this.reported = true
    if (this.outcome === 'filled') this.impression()
    else this.fail()
  }

  private hasSlottedAd(): boolean {
    const slot = this.renderRoot.querySelector('slot')
    return Boolean(slot && slot.assignedNodes({ flatten: true }).length > 0)
  }

  private impression(): void {
    this.handle?.onImpression?.()
    this.dispatchEvent(new CustomEvent('ad-impression', { bubbles: true, composed: true }))
  }

  private fail(): void {
    this.dispatchEvent(new CustomEvent('ad-nofill', { bubbles: true, composed: true }))
  }

  private teardown(): void {
    if (this.timeoutId) window.clearTimeout(this.timeoutId)
    this.timeoutId = 0
    this.handle?.destroy()
    this.handle = undefined
  }

  private skip(): void {
    this.dispatchEvent(new CustomEvent('ad-skip', { bubbles: true, composed: true }))
  }

  render() {
    const seconds = Math.ceil(this.remainingMs / 1000)
    const progress =
      this.totalMs > 0
        ? Math.min(1, Math.max(0, (this.totalMs - this.remainingMs) / this.totalMs))
        : 0
    const placeholder = this.outcome === 'empty'
    return html`<div class="creative" part="ad-creative">
        ${placeholder
          ? html`<div class="stripes" aria-hidden="true"></div>
              <div class="bars" aria-hidden="true">
                <span class="bar bar-1"></span><span class="bar bar-2"></span
                ><span class="bar bar-3"></span>
              </div>`
          : nothing}
        <slot name="ad"></slot>
      </div>
      <div class="ad-top">
        <span class="label">${this.messages.advertising}</span>
        ${this.active
          ? html`<div class="countdown">
              ${this.skippable
                ? html`<button class="skip" type="button" @click="${this.skip}">
                    ${this.messages.skip}${icon('skip-forward')}
                  </button>`
                : nothing}
              <span class="timer" aria-live="polite">${seconds}</span>
            </div>`
          : nothing}
      </div>
      ${placeholder
        ? html`<div class="ad-bottom">
            <button class="ad-cta" type="button">
              ${this.messages.readMore}${icon('external-link')}
            </button>
            <div
              class="ad-progress"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${Math.round(progress * 100)}"
            >
              <div class="ad-progress-fill" style="width:${progress * 100}%"></div>
            </div>
          </div>`
        : nothing}`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flip-reel-ad-slide': FlipReelAdSlide
  }
}
