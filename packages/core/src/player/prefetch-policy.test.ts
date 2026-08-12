import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolvePrefetch } from './prefetch-policy'

function stubConnection(connection: Record<string, unknown> | undefined): void {
  vi.stubGlobal('navigator', { connection })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('resolvePrefetch', () => {
  it('passes a plain number through', () => {
    expect(resolvePrefetch(2)).toBe(2)
  })

  it('clamps negative and fractional numbers', () => {
    expect(resolvePrefetch(-3)).toBe(0)
    expect(resolvePrefetch(2.7)).toBe(2)
    expect(resolvePrefetch(Number.NaN)).toBe(0)
  })

  it('hands the connection to a policy function', () => {
    stubConnection({ saveData: true, effectiveType: '3g', downlink: 1.4 })
    const seen: unknown[] = []

    const value = resolvePrefetch((connection) => {
      seen.push(connection)
      return connection.saveData ? 0 : 3
    })

    expect(value).toBe(0)
    expect(seen).toEqual([{ saveData: true, effectiveType: '3g', downlink: 1.4 }])
  })

  it('reports unknown connection fields as null', () => {
    stubConnection(undefined)

    const value = resolvePrefetch(({ effectiveType, downlink, saveData }) =>
      effectiveType === null && downlink === null && !saveData ? 4 : 0,
    )

    expect(value).toBe(4)
  })

  it('clamps whatever a policy function returns', () => {
    stubConnection({ effectiveType: '4g' })
    expect(resolvePrefetch(() => -1)).toBe(0)
    expect(resolvePrefetch(() => 3.9)).toBe(3)
  })
})
