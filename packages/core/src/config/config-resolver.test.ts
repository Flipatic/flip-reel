import { describe, expect, it } from 'vitest'
import { resolveConfig } from './config-resolver'
import { DEFAULT_ADS, DEFAULT_RAIL } from './config-defaults'
import { FlipReelConfigError } from './config-errors'
import type { FlipReelOptions } from '../types/config'

const feed = { stories: [] }

describe('resolveConfig', () => {
  it('throws without a feed source', () => {
    expect(() => resolveConfig({} as FlipReelOptions)).toThrow(FlipReelConfigError)
  })

  it('fills every section with defaults', () => {
    const config = resolveConfig({ feed })
    expect(config.locale).toBe('en')
    expect(config.brand).toBe('FlipReel')
    expect(config.brandLogo).toBeNull()
    expect(config.categories).toBeNull()
    expect(config.rail).toEqual(DEFAULT_RAIL)
    expect(config.ads).toEqual(DEFAULT_ADS)
    expect(config.player).toEqual({ loop: true, autoplayMuted: true, showReadMore: true })
    expect(config.interactions).toEqual({ like: true, share: true })
    expect(config.theme).toEqual({})
    expect(config.adapters).toEqual({})
    expect(config.callbacks).toEqual({})
  })

  it('merges partial overrides over defaults', () => {
    const config = resolveConfig({
      feed,
      locale: 'pl',
      brand: 'Publisher',
      rail: { maxVisible: 6 },
      ads: { every: 2 },
      interactions: { share: false },
    })
    expect(config.locale).toBe('pl')
    expect(config.brand).toBe('Publisher')
    expect(config.rail.maxVisible).toBe(6)
    expect(config.rail.scrollBy).toBe(DEFAULT_RAIL.scrollBy)
    expect(config.ads.every).toBe(2)
    expect(config.interactions).toEqual({ like: true, share: false })
  })

  it('clamps numeric options to their minimums', () => {
    const config = resolveConfig({
      feed,
      rail: { maxVisible: 0, scrollBy: -3, hoverPreviewMs: -100 },
      ads: { every: 0, durationMs: -1, noFillTimeoutMs: -1 },
    })
    expect(config.rail.maxVisible).toBe(1)
    expect(config.rail.scrollBy).toBe(1)
    expect(config.rail.hoverPreviewMs).toBe(0)
    expect(config.ads.every).toBe(1)
    expect(config.ads.durationMs).toBe(0)
    expect(config.ads.noFillTimeoutMs).toBe(0)
  })

  it('falls back to defaults for non-finite numbers', () => {
    const config = resolveConfig({
      feed,
      rail: { maxVisible: Number.NaN },
      ads: { every: Infinity },
    })
    expect(config.rail.maxVisible).toBe(DEFAULT_RAIL.maxVisible)
    expect(config.ads.every).toBe(DEFAULT_ADS.every)
  })

  it('leaves the rail heading unset so the UI can use the locale heading', () => {
    expect(resolveConfig({ feed }).rail.heading).toBeUndefined()
    expect(resolveConfig({ feed, rail: { maxVisible: 4 } }).rail.heading).toBeUndefined()
  })

  it('keeps a null rail heading, which hides the heading', () => {
    expect(resolveConfig({ feed, rail: { heading: null } }).rail.heading).toBeNull()
  })

  it('keeps a custom rail heading', () => {
    expect(resolveConfig({ feed, rail: { heading: 'Watch now' } }).rail.heading).toBe('Watch now')
  })
})
