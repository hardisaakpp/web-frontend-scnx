/** Mensaje cuando axios corta antes de que el backend/Celery termine. */
export const SAP_MAY_STILL_PROCESSING_MESSAGE =
  'La operación tardó más de lo esperado en el navegador. El servidor puede seguir procesando: revisa el estado de la ODC en unos minutos o actualiza la lista.'

/** Aviso cuando el POST inicial tarda y podría tratarse de un fallback síncrono sin progreso incremental. */
export const SAP_SLOW_SYNC_LIKELY_MESSAGE =
  'El proceso puede tardar varios minutos. Se está ejecutando en el servidor; no hay actualizaciones de progreso en tiempo real en este modo.'

export function isHttpTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; message?: string }
  return (
    e.code === 'ECONNABORTED' ||
    (typeof e.message === 'string' &&
      (e.message.includes('timeout') || e.message.includes('Timeout')))
  )
}

export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; message?: string }
  return (
    e.code === 'ERR_NETWORK' ||
    e.code === 'ECONNRESET' ||
    (typeof e.message === 'string' && e.message.includes('Network Error'))
  )
}

/** Timeout o pérdida de conexión: el job en servidor puede haber terminado igual. */
export function isTransientClientError(error: unknown): boolean {
  return isHttpTimeoutError(error) || isNetworkError(error)
}
