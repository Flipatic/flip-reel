export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const iosDevice = /iP(hone|ad|od)/.test(ua)
  const iPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return iosDevice || iPadOS
}

export function canHover(): boolean {
  if (typeof matchMedia === 'undefined') return false
  return matchMedia('(hover: hover) and (pointer: fine)').matches
}

export function prefersReducedMotion(): boolean {
  if (typeof matchMedia === 'undefined') return false
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface ConnectionInfo {
  saveData: boolean
  effectiveType: string | null
  downlink: number | null
}

interface NetworkInformation {
  saveData?: boolean
  effectiveType?: string
  downlink?: number
}

function networkInformation(): NetworkInformation | undefined {
  if (typeof navigator === 'undefined') return undefined
  return (navigator as { connection?: NetworkInformation }).connection
}

export function connectionInfo(): ConnectionInfo {
  const network = networkInformation()
  return {
    saveData: Boolean(network?.saveData),
    effectiveType: network?.effectiveType ?? null,
    downlink: typeof network?.downlink === 'number' ? network.downlink : null,
  }
}

export function prefersSaveData(): boolean {
  return Boolean(networkInformation()?.saveData)
}

export function hasSlowConnection(): boolean {
  const type = networkInformation()?.effectiveType
  return type === 'slow-2g' || type === '2g'
}
