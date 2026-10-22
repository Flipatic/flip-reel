/** The part of `CustomElementRegistry` the define-guard needs; injectable for tests. */
export type ElementRegistry = Pick<CustomElementRegistry, 'get' | 'define'>

/**
 * Defines `tag` unless the page already has it. A second FlipReel build on the
 * same page (a CMS plugin plus a manual script tag, say) would otherwise throw
 * from `customElements.define`. The first definition wins; version mismatches
 * are reported by `getRuntime()`.
 *
 * Returns whether this call defined the element.
 */
export function defineElement(
  tag: string,
  ctor: CustomElementConstructor,
  registry: ElementRegistry | undefined = globalThis.customElements,
): boolean {
  if (!registry || registry.get(tag)) return false
  registry.define(tag, ctor)
  return true
}

/** Drop-in replacement for Lit's `@customElement` that goes through {@link defineElement}. */
export const flipReelElement =
  (tag: string) =>
  (ctor: CustomElementConstructor): void => {
    defineElement(tag, ctor)
  }
