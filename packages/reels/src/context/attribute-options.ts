import type { FlipReelOptions } from '@flipatic/flip-reel-core'

interface OptionsHost extends HTMLElement {
  options?: FlipReelOptions
}

function numberAttr(el: HTMLElement, name: string): number | undefined {
  const raw = el.getAttribute(name)
  if (raw === null) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

function boolAttr(el: HTMLElement, name: string): boolean | undefined {
  if (!el.hasAttribute(name)) return undefined
  return el.getAttribute(name) !== 'false'
}

export function readOptions(el: OptionsHost): FlipReelOptions | null {
  if (el.options) return el.options

  const feed = el.getAttribute('feed')
  if (!feed) return null

  return {
    feed,
    locale: el.getAttribute('locale') ?? undefined,
    brand: el.getAttribute('brand') ?? undefined,
    brandLogo: el.getAttribute('brand-logo') ?? undefined,
    rail: {
      heading: el.getAttribute('heading') ?? undefined,
      maxVisible: numberAttr(el, 'max-visible'),
      scrollBy: numberAttr(el, 'scroll-by'),
      loop: boolAttr(el, 'rail-loop'),
      hoverPreviewMs: numberAttr(el, 'hover-preview-ms'),
    },
    ads: {
      enabled: boolAttr(el, 'ads'),
      every: numberAttr(el, 'ad-every'),
      durationMs: numberAttr(el, 'ad-duration-ms'),
    },
  }
}
