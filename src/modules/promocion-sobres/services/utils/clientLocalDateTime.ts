import { APP_LOCALE } from '@/plugins/locale'

const ISO_OFFSET_SUFFIX = /(?:[zZ]|[+-]\d{2}:\d{2})$/

/** Muestra fecha/hora persistida en BD (hora local del cajero) sin reinterpretar zona. */
export function formatPromocionSobresFecha(iso: string): string {
  const trimmed = iso.trim()
  if (!ISO_OFFSET_SUFFIX.test(trimmed)) {
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/)
    if (match) {
      const date = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6] ?? 0)
      )
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString(APP_LOCALE, { dateStyle: 'medium', timeStyle: 'short' })
      }
    }
  }

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(APP_LOCALE, { dateStyle: 'medium', timeStyle: 'short' })
}

/** ISO 8601 con offset de la zona del navegador (hora de la PC del cajero). */
export function fechaModificacionClienteIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const offsetMin = -d.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  const hours = pad(Math.floor(abs / 60))
  const minutes = pad(abs % 60)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${hours}:${minutes}`
}
