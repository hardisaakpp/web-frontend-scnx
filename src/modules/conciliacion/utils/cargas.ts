import { APP_LOCALE } from '@/plugins/locale'

export function estadoBadgeClass(estado: string): string {
  switch (estado) {
    case 'PROCESADO':
      return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    case 'PARCIAL':
      return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    case 'ERROR':
      return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
  }
}

/** El backend guarda un mensaje simple (carga ERROR) o un array JSON de errores por fila (carga PARCIAL). */
export function parseObservaciones(observaciones: string | null | undefined): string[] {
  if (!observaciones) return []
  try {
    const parsed = JSON.parse(observaciones)
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)]
  } catch {
    return [observaciones]
  }
}

export function formatFechaCarga(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(APP_LOCALE, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}
