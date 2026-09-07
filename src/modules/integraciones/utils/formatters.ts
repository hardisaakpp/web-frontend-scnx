import { APP_LOCALE, NUMBER_LOCALE } from '@/plugins/locale'
import { parseBackendMessage } from '@/utils/apiErrorMapper'
import type {
  HitellDocType,
  HitellRejectionType,
  HitellResult,
  HitellRetryStatus,
  SapJobStatus,
} from '../types'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

// ─── Fechas y números ────────────────────────────────────────────────────────

/**
 * El middleware devuelve fechas sin zona (hora del servidor / UTC-5). `new Date` las toma como
 * hora local, que es lo que el usuario espera ver; no se convierte.
 */
export function formatFechaHora(value?: string | null): string {
  if (!value) return '-'
  const fecha = new Date(value)
  if (Number.isNaN(fecha.getTime())) return value
  return fecha.toLocaleString(APP_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatDuracion(ms?: number | null): string {
  if (ms === null || ms === undefined) return '-'
  return `${ms.toLocaleString(NUMBER_LOCALE)} ms`
}

export function formatEntero(value?: number | null): string {
  if (value === null || value === undefined) return '-'
  return value.toLocaleString(NUMBER_LOCALE)
}

// ─── Etiquetas HITELL ────────────────────────────────────────────────────────

export const HITELL_DOC_TYPE_LABEL: Record<HitellDocType, string> = {
  ST: 'Transferencia de stock',
  GR: 'Entrada de mercadería',
}

export const HITELL_RESULT_LABEL: Record<HitellResult, string> = {
  INTEGRADO: 'Integrado',
  NO_CORRESPONDE: 'No corresponde',
  RECHAZADO: 'Rechazado',
}

export const HITELL_REJECTION_LABEL: Record<HitellRejectionType, string> = {
  PRODUCTO_NO_EXISTE: 'Producto no existe en HITELL',
  OTRO: 'Otro rechazo',
}

export function toneHitell(result: HitellResult): BadgeTone {
  switch (result) {
    case 'INTEGRADO':
      return 'success'
    case 'RECHAZADO':
      return 'danger'
    default:
      return 'neutral'
  }
}

/** Cómo comunicar el resultado de un reintento manual. */
export const HITELL_RETRY_FEEDBACK: Record<HitellRetryStatus, { titulo: string; tone: BadgeTone }> = {
  Synced: { titulo: 'Documento integrado en HITELL', tone: 'success' },
  SkippedNotPos: { titulo: 'No corresponde integrar: ningún almacén del documento usa WEBPOS', tone: 'info' },
  Rejected: { titulo: 'HITELL volvió a rechazar el documento', tone: 'warning' },
  Queued: { titulo: 'HITELL no respondió a tiempo; el reintento quedó encolado', tone: 'info' },
  Error: { titulo: 'Error al notificar a HITELL', tone: 'danger' },
}

// ─── Etiquetas Cola SAP ──────────────────────────────────────────────────────

export const SAP_JOB_STATUS_LABEL: Record<SapJobStatus, string> = {
  ENCOLADO: 'Encolado',
  PROCESANDO: 'Procesando',
  COMPLETADO: 'Completado',
  ERROR: 'Error',
}

export function toneJob(status: SapJobStatus): BadgeTone {
  switch (status) {
    case 'COMPLETADO':
      return 'success'
    case 'ERROR':
      return 'danger'
    case 'PROCESANDO':
      return 'info'
    default:
      return 'warning'
  }
}

// ─── HTTP ────────────────────────────────────────────────────────────────────

export function toneHttp(statusCode?: number | null): BadgeTone {
  if (statusCode === null || statusCode === undefined) return 'neutral'
  if (statusCode >= 500) return 'danger'
  if (statusCode >= 400) return 'warning'
  if (statusCode >= 200 && statusCode < 300) return 'success'
  return 'info'
}

// ─── Errores y JSON ──────────────────────────────────────────────────────────

/** Mensaje legible de un error de axios (ProblemDetails del middleware) o el fallback. */
export function mensajeError(error: unknown, fallback: string): string {
  const err = error as { response?: { status?: number; data?: unknown }; message?: string } | undefined
  const data = err?.response?.data
  if (data && typeof data === 'object') {
    const desdeBackend = parseBackendMessage(data as Record<string, unknown>)
    if (desdeBackend) return desdeBackend
    const titulo = (data as { title?: unknown }).title
    if (typeof titulo === 'string' && titulo.trim()) return titulo.trim()
  }
  if (typeof data === 'string' && data.trim()) return data.trim()
  if (err?.response?.status === 404) return 'No se encontró el registro solicitado.'
  if (err?.message) return err.message
  return fallback
}

/** Muestra JSON con sangría; si el valor es texto que parece JSON, lo parsea primero. */
export function prettyJson(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  let parsed: unknown = value
  if (typeof value === 'string') {
    const texto = value.trim()
    if ((texto.startsWith('{') && texto.endsWith('}')) || (texto.startsWith('[') && texto.endsWith(']'))) {
      try {
        parsed = JSON.parse(texto)
      } catch {
        return value
      }
    } else {
      return value
    }
  }
  try {
    return JSON.stringify(parsed, null, 2)
  } catch {
    return String(value)
  }
}

export function truncar(texto?: string | null, max = 90): string {
  if (!texto) return '-'
  return texto.length <= max ? texto : `${texto.slice(0, max)}…`
}
