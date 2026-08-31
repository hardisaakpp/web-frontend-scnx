/**
 * Extrae un mensaje de error legible de una respuesta axios/backend sin nunca dejar pasar
 * "[object Object]": si el backend no manda un string reconocible, cae al mensaje por defecto
 * en vez de interpolar el objeto de error directamente.
 */
export function extraerMensajeError(error: unknown, mensajePorDefecto = 'Ocurrió un error inesperado.'): string {
  if (!error || typeof error !== 'object') return mensajePorDefecto

  const err = error as { response?: { data?: { error?: unknown; message?: unknown } }; message?: unknown }
  const data = err.response?.data

  if (typeof data?.error === 'string' && data.error) return data.error
  if (typeof data?.message === 'string' && data.message) return data.message
  if (typeof err.message === 'string' && err.message) return err.message

  return mensajePorDefecto
}

/**
 * Extrae el código de error machine-readable (ej. "CAMPANA_CON_HISTORIAL",
 * "COMODIN_UNIVERSAL_REQUERIDO") que el backend manda junto al mensaje legible, para cuando la
 * UI necesita distinguir el tipo de rechazo sin parsear el texto (ver matriz de validadores de
 * Fase 3). Devuelve undefined si el backend no mandó un código reconocible.
 */
export function extraerCodigoError(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined

  const err = error as { response?: { data?: { code?: unknown } } }
  const code = err.response?.data?.code

  return typeof code === 'string' && code ? code : undefined
}
