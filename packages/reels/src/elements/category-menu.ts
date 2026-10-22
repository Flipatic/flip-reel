import { LitElement, css, html, nothing } from 'lit'
import { property, state } from 'lit/decorators.js'
import { flipReelElement } from './define'
import type { Category } from '@flipatic/flip-reel-core'

/**
 * `<flip-reel-category-menu>` — scrollable category pill bar of the player.
 * Emits a `category-change` event with the selected category id.
 */
@flipReelElement('flip-reel-category-menu')
export class FlipReelCategoryMenu extends LitElement {
  @property({ attribute: false }) categories: Category[] = []
  @property() active = 'all'

  @state() private pill: { left: number; width: number } | null = null

  private resizeObserver?: ResizeObserver

  static styles = css`
    :host {
      display: flex;
      justify-content: center;
      max-width: 100%;
    }
    .menu {
      display: inline-flex;
      align-items: center;
      min-width: 0;
      max-width: 100%;
      padding: 4px 0;
      border-radius: var(--flip-reel-radius-pill, 9999px);
      background: var(--flip-reel-control-bg, rgba(23, 23, 23, 0.8));
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
      overflow: hidden;
    }
    .bar {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 2px;
      min-width: 0;
      max-width: 100%;
      overflow-x: auto;
      overscroll-behavior-x: none;
      scrollbar-width: none;
    }
    .bar::-webkit-scrollbar {
      display: none;
    }
    .pill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      border-radius: var(--flip-reel-radius-pill, 9999px);
      background: var(--flip-reel-white, #ffffff);
      z-index: 0;
      transition:
        transform var(--flip-reel-pill-dur, 300ms)
          var(--flip-reel-ease-emphasized, cubic-bezier(0.22, 1, 0.36, 1)),
        width var(--flip-reel-pill-dur, 300ms)
          var(--flip-reel-ease-emphasized, cubic-bezier(0.22, 1, 0.36, 1));
    }
    .seg {
      position: relative;
      z-index: 1;
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      min-height: 40px;
      border: none;
      cursor: pointer;
      padding: 0 16px;
      border-radius: var(--flip-reel-radius-pill, 9999px);
      font: inherit;
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
      white-space: nowrap;
      background: transparent;
      color: var(--flip-reel-alpha-white-70, rgba(255, 255, 255, 0.7));
      transition: color 0.2s ease;
    }
    .seg:first-of-type {
      margin-inline-start: 4px;
    }
    .seg:last-of-type {
      margin-inline-end: 4px;
    }
    .seg:hover {
      color: var(--flip-reel-on-surface, #ffffff);
    }
    .seg[aria-selected='true'] {
      color: var(--flip-reel-neutral-900, #171717);
    }
    .seg:focus-visible {
      outline: none;
    }
  `

  firstUpdated(): void {
    const bar = this.renderRoot.querySelector('.bar')
    if (!bar) return
    this.resizeObserver = new ResizeObserver(() => this.measure())
    this.resizeObserver.observe(bar)
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
  }

  updated(): void {
    this.measure()
    requestAnimationFrame(() => this.measure())
    const active = this.renderRoot.querySelector<HTMLElement>('button[aria-selected="true"]')
    active?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }

  private measure(): void {
    const active = this.renderRoot.querySelector<HTMLButtonElement>('button[aria-selected="true"]')
    if (!active || active.offsetWidth === 0) return
    const next = { left: active.offsetLeft, width: active.offsetWidth }
    if (!this.pill || this.pill.left !== next.left || this.pill.width !== next.width) {
      this.pill = next
    }
  }

  private select(id: string): void {
    this.dispatchEvent(
      new CustomEvent('category-change', { detail: { id }, bubbles: true, composed: true }),
    )
  }

  render() {
    return html`<div class="menu">
      <div class="bar" role="tablist">
        ${this.pill
          ? html`<span
              class="pill"
              aria-hidden="true"
              style="width:${this.pill.width}px; transform: translateX(${this.pill.left}px)"
            ></span>`
          : nothing}
        ${this.categories.map(
          (category) =>
            html`<button
              class="seg"
              role="tab"
              aria-selected="${this.active === category.id ? 'true' : 'false'}"
              @click="${() => this.select(category.id)}"
            >
              ${category.label}
            </button>`,
        )}
      </div>
    </div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flip-reel-category-menu': FlipReelCategoryMenu
  }
}
