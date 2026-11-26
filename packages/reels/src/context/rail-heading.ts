import type { Messages } from '../i18n/messages'

/**
 * Text of the rail heading: the configured value, or the locale's heading when none was set.
 * Returns `null` when the heading should be hidden (`null` or an empty string).
 */
export function railHeadingText(
  heading: string | null | undefined,
  messages: Messages,
): string | null {
  if (heading === undefined) return messages.railHeading
  return heading ? heading : null
}
