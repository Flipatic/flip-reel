import { LitElement, css, html, nothing, type PropertyValues } from 'lit'
import { property, state } from 'lit/decorators.js'
import { flipReelElement } from './define'
import type { FlipReelOptions } from '@flipatic/flip-reel-core'
import { WidgetController } from '../context/widget-controller'
import { readOptions } from '../context/attribute-options'
import { tokens } from '../styles/tokens'
import './rail-element'
import './player-element'

/**
 * `<flip-reel>` — the complete widget: card rail plus full-screen player.
 * Configure via the `options` property or via element attributes (`feed`,
 * `locale`, `brand`, ...). Emits `flip-reel:*` events on itself.
 */
@flipReelElement('flip-reel')
export class FlipReelReels extends LitElement {
  /** Widget configuration; attribute-based options are read when omitted. */
  @property({ attribute: false }) options?: FlipReelOptions

  @state() private widget?: WidgetController
  @state() private revision = 0

  static styles = [
    tokens,
    css`
      :host {
        display: block;
      }
      .error {
        padding: 24px;
        font-size: 14px;
        color: var(--flip-reel-heading-color, #171717);
      }
    `,
  ]

  connectedCallback(): void {
    super.connectedCallback()
    void this.bootstrap()
  }

  willUpdate(changed: PropertyValues): void {
    if (changed.has('options') && !this.widget) void this.bootstrap()
  }

  disconnectedCallback(): void {
    super.disconnectedCallback()
    this.widget?.destroy()
  }

  private async bootstrap(): Promise<void> {
    if (this.widget) return
    const options = this.options ?? readOptions(this)
    if (!options) return
    this.widget = new WidgetController(options, this)
    await this.widget.load()
    this.revision += 1
  }

  private onStoryOpen(event: CustomEvent<{ storyId: string }>): void {
    this.widget?.player.open(event.detail.storyId)
  }

  render() {
    const widget = this.widget
    if (!widget) return nothing
    if (widget.error) {
      return html`<div class="error" role="alert">${widget.messages.contentUnavailable}</div>`
    }
    const heading = widget.config.rail.heading ?? widget.messages.railHeading
    return html`
      <flip-reel-rail
        .stories="${widget.stories}"
        .scheduler="${widget.scheduler}"
        .heading="${heading}"
        .previewMs="${widget.config.rail.hoverPreviewMs}"
        .maxVisible="${widget.config.rail.maxVisible}"
        .scrollStep="${widget.config.rail.scrollBy}"
        @open="${this.onStoryOpen}"
      ></flip-reel-rail>
      <flip-reel-player .widget="${widget}"></flip-reel-player>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flip-reel': FlipReelReels
  }
}
