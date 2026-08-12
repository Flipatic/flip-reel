const SNAP_EPSILON_PX = 4
const STEP_ANIMATION_MS = 260
const MIN_ANIMATION_MS = 120

export interface ReelGeometryHost {
  scroller(): HTMLElement | null
  reels(): HTMLElement[]
}

export class ReelScrollDriver {
  private animFrame = 0
  private animTarget = -1

  constructor(private readonly host: ReelGeometryHost) {}

  get isAnimating(): boolean {
    return this.animFrame !== 0
  }

  get animationTarget(): number {
    return this.animTarget
  }

  nearestIndex(fallback = 0): number {
    const scroller = this.host.scroller()
    const reels = this.host.reels()
    if (!scroller || reels.length === 0) return fallback
    const offset = scroller.scrollTop + this.scrollPaddingTop(scroller)
    let best = fallback
    let bestDist = Infinity
    for (const reel of reels) {
      const dist = Math.abs(reel.offsetTop - offset)
      if (dist < bestDist) {
        bestDist = dist
        best = Number(reel.dataset.index)
      }
    }
    return best
  }

  snapTop(index: number): number {
    const scroller = this.host.scroller()
    if (!scroller) return 0
    const reel = this.host.reels().find((el) => Number(el.dataset.index) === index)
    if (!reel) return index * this.pageHeight(scroller)
    return reel.offsetTop - this.scrollPaddingTop(scroller)
  }

  atIndex(index: number): boolean {
    const scroller = this.host.scroller()
    if (!scroller) return false
    return Math.abs(scroller.scrollTop - this.snapTop(index)) <= SNAP_EPSILON_PX
  }

  jumpTo(index: number): void {
    const scroller = this.host.scroller()
    if (!scroller) return
    this.cancel()
    scroller.scrollTop = this.snapTop(index)
    this.updateFade()
  }

  animateTo(index: number, onLanded?: () => void): void {
    const scroller = this.host.scroller()
    if (!scroller) return
    this.cancelFrame()
    const target = this.snapTop(index)
    const start = scroller.scrollTop
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const distance = target - start
    if (reduced || Math.abs(distance) <= SNAP_EPSILON_PX) {
      this.settleAt(scroller, target)
      onLanded?.()
      return
    }
    scroller.style.scrollSnapType = 'none'
    this.animTarget = index
    const duration = this.durationFor(scroller, Math.abs(distance))
    const startTime = performance.now()
    const ease = (t: number) => 1 - Math.pow(1 - t, 2)
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration)
      scroller.scrollTop = start + distance * ease(t)
      this.updateFade()
      if (t < 1) {
        this.animFrame = requestAnimationFrame(tick)
        return
      }
      this.settleAt(scroller, target)
      onLanded?.()
    }
    this.animFrame = requestAnimationFrame(tick)
  }

  cancel(): void {
    this.cancelFrame()
    this.animTarget = -1
    this.host.scroller()?.style.removeProperty('scroll-snap-type')
  }

  destroy(): void {
    this.cancel()
  }

  updateFade(): void {
    const scroller = this.host.scroller()
    if (!scroller) return
    const scrollTop = scroller.scrollTop
    const viewportH = scroller.clientHeight
    const spt = this.scrollPaddingTop(scroller)
    for (const reel of this.host.reels()) {
      const top = reel.offsetTop
      const h = reel.offsetHeight
      let opacity = 1
      if (top + h < scrollTop) opacity = 0
      else if (top <= scrollTop + viewportH) {
        const above = Math.max(0, scrollTop + spt - top)
        opacity = 1 - Math.min(1, above / Math.max(1, h * 0.9))
      }
      const value = String(opacity)
      if (reel.style.opacity !== value) reel.style.opacity = value
    }
  }

  private durationFor(scroller: HTMLElement, distance: number): number {
    const page = this.pageHeight(scroller)
    if (page <= 0) return STEP_ANIMATION_MS
    return Math.max(MIN_ANIMATION_MS, STEP_ANIMATION_MS * Math.min(1, distance / page))
  }

  private settleAt(scroller: HTMLElement, top: number): void {
    scroller.scrollTop = top
    scroller.style.removeProperty('scroll-snap-type')
    this.animFrame = 0
    this.animTarget = -1
    this.updateFade()
  }

  private cancelFrame(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame)
    this.animFrame = 0
  }

  private scrollPaddingTop(scroller: HTMLElement): number {
    return parseFloat(getComputedStyle(scroller).scrollPaddingTop) || 0
  }

  private pageHeight(scroller: HTMLElement): number {
    const reels = this.host.reels()
    const first = reels[0]
    const second = reels[1]
    if (first && second) return second.offsetTop - first.offsetTop
    return first?.offsetHeight ?? scroller.clientHeight
  }
}
