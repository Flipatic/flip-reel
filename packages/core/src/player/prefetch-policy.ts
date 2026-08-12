import { connectionInfo } from '../utils/device'
import type { PrefetchPolicy } from '../types/config'

export function resolvePrefetch(policy: PrefetchPolicy): number {
  const value = typeof policy === 'function' ? policy(connectionInfo()) : policy
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}
