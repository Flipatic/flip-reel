import { describe, expect, it } from 'vitest'
import { railHeadingText } from './rail-heading'
import { en } from '../i18n/en'
import { pl } from '../i18n/pl'

describe('railHeadingText', () => {
  it('falls back to the locale heading when none is set', () => {
    expect(railHeadingText(undefined, en)).toBe(en.railHeading)
    expect(railHeadingText(undefined, pl)).toBe(pl.railHeading)
  })

  it('uses a custom heading as given', () => {
    expect(railHeadingText('Watch now', en)).toBe('Watch now')
  })

  it('hides the heading for null', () => {
    expect(railHeadingText(null, en)).toBeNull()
  })

  it('hides the heading for an empty string', () => {
    expect(railHeadingText('', en)).toBeNull()
  })
})
