/**
 * crypto.randomUUID() only exists in secure contexts (HTTPS or localhost).
 * Accessing the app over plain http:// on a LAN IP (e.g. http://192.168.x.x)
 * is not a secure context, so crypto.randomUUID is undefined there and
 * calling it throws, breaking the request before it's even sent.
 */
export function randomUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
