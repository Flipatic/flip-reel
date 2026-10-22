import { describe, expect, it, vi } from 'vitest'
import { defineElement, type ElementRegistry } from './define'

function fakeRegistry(): ElementRegistry & { defined: Map<string, CustomElementConstructor> } {
  const defined = new Map<string, CustomElementConstructor>()
  return {
    defined,
    get: (tag) => defined.get(tag),
    define: vi.fn((tag: string, ctor: CustomElementConstructor) => {
      if (defined.has(tag))
        throw new DOMException(`"${tag}" has already been used`, 'NotSupportedError')
      defined.set(tag, ctor)
    }),
  }
}

class First {}
class Second {}

describe('defineElement', () => {
  it('defines a tag the page does not have yet', () => {
    const registry = fakeRegistry()
    expect(defineElement('flip-reel', First as unknown as CustomElementConstructor, registry)).toBe(
      true,
    )
    expect(registry.defined.get('flip-reel')).toBe(First)
  })

  it('does not throw when a second build defines the same tag', () => {
    const registry = fakeRegistry()
    defineElement('flip-reel', First as unknown as CustomElementConstructor, registry)
    expect(() =>
      defineElement('flip-reel', Second as unknown as CustomElementConstructor, registry),
    ).not.toThrow()
    expect(
      defineElement('flip-reel', Second as unknown as CustomElementConstructor, registry),
    ).toBe(false)
    expect(registry.defined.get('flip-reel')).toBe(First)
    expect(registry.define).toHaveBeenCalledTimes(1)
  })

  it('does nothing without a custom element registry', () => {
    expect(
      defineElement('flip-reel', First as unknown as CustomElementConstructor, undefined),
    ).toBe(false)
  })
})
