const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * Fecha local -> ISO UTC de limite de dia (00:00:00.000 o 23:59:59.999 local). Misma tecnica que
 * recepcion-mercaderia/stores/historyStore.ts's toLocalBoundIso, duplicada porque los modulos no
 * comparten utils.
 */
export function toLocalDayBoundIso(value: string, endOfDay: boolean): string {
  const match = DATE_ONLY_PATTERN.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  const d = endOfDay
    ? new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999)
    : new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0)
  return d.toISOString()
}

export function todayLocalDateString(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function daysAgoLocalDateString(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
