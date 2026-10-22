import { LitElement, css, html, nothing, type PropertyValues } from 'lit'
import { property, query, state } from 'lit/decorators.js'
import { flipReelElement } from './define'

/** `<flip-reel-blurred-background>` — blurred poster backdrop behind the desktop player. */
@flipReelElement('flip-reel-blurred-background')
export class FlipReelBlurredBackground extends LitElement {
  @property() poster?: string
  @state() private previous?: string
  @query('.current') private currentImg?: HTMLImageElement
  private fade?: Animation

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: blur(90px) saturate(1.4);
      transform: scale(1.25);
    }
    .overlay {
      position: absolute;
      inset: 0;
      background: var(--flip-reel-overlay, rgba(10, 10, 10, 0.55));
    }
  `

  willUpdate(changed: PropertyValues): void {
    if (!changed.has('poster')) return
    const old = changed.get('poster') as string | undefined
    if (old && old !== this.poster) this.previous = old
  }

  updated(changed: PropertyValues): void {
    if (!changed.has('poster') || !this.previous || !this.currentImg) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.previous = undefined
      return
    }
    this.fade?.cancel()
    this.fade = this.currentImg.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 900,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    })
    this.fade.finished.then(
      () => {
        this.previous = undefined
      },
      () => {},
    )
  }

  render() {
    return html`${this.previous
        ? html`<img alt="" aria-hidden="true" src="${this.previous}" />`
        : nothing}
      ${this.poster
        ? html`<img
            class="current"
            alt=""
            aria-hidden="true"
            decoding="async"
            src="${this.poster}"
          />`
        : nothing}
      <div class="overlay"></div>`
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flip-reel-blurred-background': FlipReelBlurredBackground
  }
}
