/**
 * Composable para manejar mensajes de error de SAP de forma amigable
 */

interface SapErrorCode {
  code: string
  message: string
  description?: string
}

// Mapeo de códigos de error comunes de SAP a mensajes amigables
const SAP_ERROR_CODES: Record<string, SapErrorCode> = {
  // Errores de autenticación/autorización
  '401': {
    code: '401',
    message: 'Error de autenticación con SAP',
    description: 'Las credenciales de SAP no son válidas o han expirado'
  },
  '403': {
    code: '403',
    message: 'Sin permisos para realizar esta operación',
    description: 'El usuario no tiene permisos suficientes en SAP'
  },
  
  // Errores de validación
  'VALIDATION_ERROR': {
    code: 'VALIDATION_ERROR',
    message: 'Error de validación en los datos',
    description: 'Los datos enviados a SAP no cumplen con los requisitos de validación'
  },
  'MISSING_FIELD': {
    code: 'MISSING_FIELD',
    message: 'Campo requerido faltante',
    description: 'Falta un campo obligatorio en la solicitud a SAP'
  },
  'INVALID_FORMAT': {
    code: 'INVALID_FORMAT',
    message: 'Formato de dato inválido',
    description: 'El formato de uno o más campos no es válido para SAP'
  },
  
  // Errores de negocio
  'DUPLICATE_DOCUMENT': {
    code: 'DUPLICATE_DOCUMENT',
    message: 'Documento duplicado',
    description: 'Ya existe un documento con estos datos en SAP'
  },
  'INVALID_CARDCODE': {
    code: 'INVALID_CARDCODE',
    message: 'Código de proveedor inválido',
    description: 'El código del proveedor no existe en SAP'
  },
  'INVALID_ITEMCODE': {
    code: 'INVALID_ITEMCODE',
    message: 'Código de artículo inválido',
    description: 'Uno o más códigos de artículo no existen en SAP'
  },
  'INSUFFICIENT_STOCK': {
    code: 'INSUFFICIENT_STOCK',
    message: 'Stock insuficiente',
    description: 'No hay suficiente inventario disponible en SAP'
  },
  
  // Errores de conexión
  'CONNECTION_ERROR': {
    code: 'CONNECTION_ERROR',
    message: 'Error de conexión con SAP',
    description: 'No se pudo establecer conexión con el servidor SAP'
  },
  'TIMEOUT': {
    code: 'TIMEOUT',
    message: 'Tiempo de espera agotado',
    description: 'La solicitud a SAP tardó demasiado tiempo en responder'
  },
  
  // Errores genéricos
  'INTERNAL_ERROR': {
    code: 'INTERNAL_ERROR',
    message: 'Error interno de SAP',
    description: 'Ocurrió un error interno en el servidor SAP'
  },
  'UNKNOWN_ERROR': {
    code: 'UNKNOWN_ERROR',
    message: 'Error desconocido de SAP',
    description: 'Ocurrió un error no identificado al comunicarse con SAP'
  }
}

/**
 * Obtiene un mensaje amigable para un error de SAP
 */
export function getSapErrorMessage(errorCode: string | null | undefined, defaultMessage?: string): string {
  if (!errorCode) {
    return defaultMessage || 'Error al procesar la solicitud con SAP'
  }

  const error = SAP_ERROR_CODES[errorCode.toUpperCase()]
  if (error) {
    return error.message
  }

  // Si no hay un código específico, intentar parsear códigos numéricos comunes
  const numericCode = parseInt(errorCode)
  if (!isNaN(numericCode)) {
    const numericError = SAP_ERROR_CODES[String(numericCode)]
    if (numericError) {
      return numericError.message
    }
  }

  // Si no se encuentra el código, devolver el código con formato amigable
  return `Error SAP (${errorCode})`
}

/**
 * Obtiene la descripción completa de un error de SAP
 */
export function getSapErrorDescription(errorCode: string | null | undefined): string | null {
  if (!errorCode) {
    return null
  }

  const error = SAP_ERROR_CODES[errorCode.toUpperCase()]
  if (error) {
    return error.description || error.message
  }

  const numericCode = parseInt(errorCode)
  if (!isNaN(numericCode)) {
    const numericError = SAP_ERROR_CODES[String(numericCode)]
    if (numericError) {
      return numericError.description || numericError.message
    }
  }

  return null
}

/**
 * Verifica si un error proviene de SAP
 */
export function isSapError(errorSource: string | null | undefined): boolean {
  return errorSource?.toUpperCase() === 'SAP'
}

/**
 * Obtiene un mensaje completo formateado para mostrar al usuario
 */
export function formatSapError(
  errorSource: string | null | undefined,
  errorCode: string | null | undefined,
  errorMessage: string | null | undefined,
  defaultMessage?: string
): { title: string; description: string | null } {
  const isSap = isSapError(errorSource)
  
  if (isSap && errorCode) {
    return {
      title: getSapErrorMessage(errorCode, errorMessage || defaultMessage),
      description: getSapErrorDescription(errorCode) || errorMessage || null
    }
  }

  return {
    title: errorMessage || defaultMessage || 'Error al procesar la solicitud',
    description: isSap ? 'Este error proviene del sistema SAP' : null
  }
}




