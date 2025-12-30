/**
 * Helper para parsear errores del backend
 * Los errores pueden venir separados por ';' cuando hay múltiples validaciones
 */

export interface ParsedError {
  title: string
  messages: string[]
  primaryMessage: string
  hasMultiple: boolean
  errorSource?: string | null
  errorCode?: string | null
}

/**
 * Parsea un mensaje de error que puede contener múltiples errores separados por ';'
 */
export function parseError(error: string | null | undefined, errorSource?: string | null): ParsedError {
  if (!error) {
    return {
      title: 'Error desconocido',
      messages: [],
      primaryMessage: 'Error desconocido',
      hasMultiple: false,
      errorSource: errorSource || null
    }
  }

  // Separar errores múltiples
  const messages = error.split(';')
    .map(e => e.trim())
    .filter(e => e.length > 0)

  // Determinar título según el origen del error
  let title = 'Error al integrar'
  if (errorSource) {
    title = errorSource === 'BACKEND'
      ? 'Error de validación'
      : errorSource === 'SAP_CONNECTION'
      ? 'Error de conexión con SAP'
      : errorSource === 'SAP'
      ? 'Error de SAP'
      : 'Error al integrar'
  }

  return {
    title,
    messages,
    primaryMessage: messages[0] || error,
    hasMultiple: messages.length > 1,
    errorSource: errorSource || null
  }
}

/**
 * Formatea un error parseado para mostrar en toast
 */
export function formatErrorForToast(parsed: ParsedError): { title: string; message: string } {
  if (parsed.hasMultiple) {
    return {
      title: parsed.title,
      message: `${parsed.primaryMessage} (+${parsed.messages.length - 1} error(es) más. Ver consola)`
    }
  }

  return {
    title: parsed.title,
    message: parsed.primaryMessage
  }
}

