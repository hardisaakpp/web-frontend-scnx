import { APP_LOCALE, NUMBER_LOCALE } from '@/plugins/locale'

const currencyFormatter = new Intl.NumberFormat(NUMBER_LOCALE, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '$ 0.00'
  return currencyFormatter.format(value)
}

/** Fecha corta (DateOnly "yyyy-MM-dd" del backend) → dd/MM/yyyy en el locale de la app. */
export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '—'
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString(APP_LOCALE, { dateStyle: 'short' })
}

/** Fecha/hora completa (DateTime ISO del backend, p. ej. fechaIntegracionSAP) → fecha corta + hora. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString(APP_LOCALE, { dateStyle: 'short', timeStyle: 'short' })
}

/** Date nativo → "yyyy-MM-dd" (formato DateOnly que espera api-tesoreria en query params/rutas). */
export function toDateOnlyString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Días transcurridos entre una fecha DateOnly "yyyy-MM-dd" y hoy (para mensajes de bloqueo). */
export function diasTranscurridosDesde(fechaDateOnly: string): number {
  const [year, month, day] = fechaDateOnly.split('-').map(Number)
  const fecha = new Date(year, month - 1, day)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  fecha.setHours(0, 0, 0, 0)
  return Math.round((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24))
}
