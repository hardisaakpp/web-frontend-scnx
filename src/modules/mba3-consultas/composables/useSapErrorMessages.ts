/**
 * Composable para manejar mensajes de error de SAP de forma amigable
 */

interface SapErrorCode {
  code: string
  message: string
  description?: string
  suggestedActions?: string[]  // ⭐ NUEVO: Acciones sugeridas
}

// Mapeo de códigos de error comunes de SAP a mensajes amigables
const SAP_ERROR_CODES: Record<string, SapErrorCode> = {
  // Errores de autenticación/autorización
  '401': {
    code: '401',
    message: 'Error de autenticación con SAP',
    description: 'Las credenciales de SAP no son válidas o han expirado',
    suggestedActions: [
      'Verificar las credenciales de SAP en la configuración',
      'Contactar al administrador de SAP para renovar credenciales',
      'Revisar la configuración de ENABLE_SAP_SERVICE_LAYER en .env'
    ]
  },
  '403': {
    code: '403',
    message: 'Sin permisos para realizar esta operación',
    description: 'El usuario no tiene permisos suficientes en SAP',
    suggestedActions: [
      'Contactar al administrador de SAP para solicitar permisos',
      'Verificar que el usuario tenga permisos para crear Purchase Orders',
      'Revisar los permisos del usuario en SAP'
    ]
  },
  
  // Errores de validación
  'VALIDATION_ERROR': {
    code: 'VALIDATION_ERROR',
    message: 'Error de validación en los datos',
    description: 'Los datos enviados a SAP no cumplen con los requisitos de validación',
    suggestedActions: [
      'Revisar que todos los campos requeridos estén completos',
      'Verificar el formato de los datos (números, fechas, etc.)',
      'Revisar los logs en sap_integration_logs para más detalles'
    ]
  },
  'MISSING_FIELD': {
    code: 'MISSING_FIELD',
    message: 'Campo requerido faltante',
    description: 'Falta un campo obligatorio en la solicitud a SAP',
    suggestedActions: [
      'Revisar que todos los campos obligatorios estén completos',
      'Verificar la información del pedido antes de generar la OC',
      'Completar los campos faltantes y volver a intentar'
    ]
  },
  'INVALID_FORMAT': {
    code: 'INVALID_FORMAT',
    message: 'Formato de dato inválido',
    description: 'El formato de uno o más campos no es válido para SAP',
    suggestedActions: [
      'Verificar el formato de campos numéricos y fechas',
      'Revisar que los códigos de proveedor y productos sean válidos',
      'Corregir el formato de los datos y volver a intentar'
    ]
  },
  
  // Errores de negocio
  'DUPLICATE_DOCUMENT': {
    code: 'DUPLICATE_DOCUMENT',
    message: 'Documento duplicado',
    description: 'Ya existe un documento con estos datos en SAP',
    suggestedActions: [
      'Verificar si la orden de compra ya fue creada en SAP',
      'Revisar el estado de la OC en la vista de procesos',
      'Si es necesario, eliminar la OC duplicada en SAP antes de reintentar'
    ]
  },
  'INVALID_CARDCODE': {
    code: 'INVALID_CARDCODE',
    message: 'Código de proveedor inválido',
    description: 'El código del proveedor no existe en SAP',
    suggestedActions: [
      'Verificar que el código del proveedor exista en SAP',
      'Revisar la homologación de proveedores',
      'Contactar al administrador si el proveedor debe ser creado en SAP'
    ]
  },
  'INVALID_ITEMCODE': {
    code: 'INVALID_ITEMCODE',
    message: 'Código de artículo inválido',
    description: 'Uno o más códigos de artículo no existen en SAP',
    suggestedActions: [
      'Revisar la vista de ODC con Errores para identificar SKUs problemáticos',
      'Corregir los SKUs usando el botón "Corregir SKU"',
      'Verificar las homologaciones de productos en la vista de Homologaciones',
      'Asegurar que todos los productos estén correctamente homologados'
    ]
  },
  'INSUFFICIENT_STOCK': {
    code: 'INSUFFICIENT_STOCK',
    message: 'Stock insuficiente',
    description: 'No hay suficiente inventario disponible en SAP',
    suggestedActions: [
      'Verificar el stock disponible en SAP',
      'Ajustar las cantidades solicitadas si es necesario',
      'Contactar al área de compras para gestionar el stock'
    ]
  },
  
  // Errores de conexión
  'CONNECTION_ERROR': {
    code: 'CONNECTION_ERROR',
    message: 'Error de conexión con SAP',
    description: 'No se pudo establecer conexión con el servidor SAP',
    suggestedActions: [
      'Verificar la conectividad de red con el servidor SAP',
      'Revisar la configuración de SAP_SERVICE_LAYER_URL',
      'Verificar que el servidor SAP esté disponible',
      'Contactar al equipo técnico si el problema persiste'
    ]
  },
  'TIMEOUT': {
    code: 'TIMEOUT',
    message: 'Tiempo de espera agotado',
    description: 'La solicitud a SAP tardó demasiado tiempo en responder',
    suggestedActions: [
      'Reintentar la operación (puede ser un problema temporal)',
      'Verificar la carga del servidor SAP',
      'Aumentar SAP_SERVICE_LAYER_TIMEOUT si es necesario',
      'Contactar al equipo técnico si el problema persiste'
    ]
  },
  
  // Errores genéricos
  'INTERNAL_ERROR': {
    code: 'INTERNAL_ERROR',
    message: 'Error interno de SAP',
    description: 'Ocurrió un error interno en el servidor SAP',
    suggestedActions: [
      'Reintentar la operación después de unos minutos',
      'Revisar los logs en sap_integration_logs',
      'Contactar al administrador de SAP si el problema persiste'
    ]
  },
  'UNKNOWN_ERROR': {
    code: 'UNKNOWN_ERROR',
    message: 'Error desconocido de SAP',
    description: 'Ocurrió un error no identificado al comunicarse con SAP',
    suggestedActions: [
      'Revisar los detalles del error en el modal de error',
      'Revisar los logs en sap_integration_logs para más información',
      'Contactar al equipo técnico con los detalles del error'
    ]
  }
}

// ⭐ NUEVO: Mapeo de códigos de error numéricos comunes de SAP (como -4013)
const SAP_NUMERIC_ERROR_CODES: Record<string, SapErrorCode> = {
  '-4013': {
    code: '-4013',
    message: 'El proveedor no existe en SAP',
    description: 'El código del proveedor (CardCode) no está registrado en SAP',
    suggestedActions: [
      'Verificar que el código del proveedor exista en SAP',
      'Revisar la homologación de proveedores',
      'Contactar al administrador de SAP para crear el proveedor si es necesario'
    ]
  },
  '-5002': {
    code: '-5002',
    message: 'El artículo no existe en SAP',
    description: 'El código del artículo (ItemCode) no está registrado en SAP',
    suggestedActions: [
      'Revisar la vista de ODC con Errores para identificar SKUs problemáticos',
      'Usar el botón "Corregir SKU" para corregir los SKUs incorrectos',
      'Verificar las homologaciones en la vista de Homologaciones'
    ]
  }
}

/**
 * Obtiene un mensaje amigable para un error de SAP
 */
export function getSapErrorMessage(errorCode: string | null | undefined, defaultMessage?: string): string {
  if (!errorCode) {
    return defaultMessage || 'Error al procesar la solicitud con SAP'
  }

  const error = SAP_ERROR_CODES[errorCode.toUpperCase()] || SAP_NUMERIC_ERROR_CODES[errorCode]
  if (error) {
    return error.message
  }

  // Si no hay un código específico, intentar parsear códigos numéricos comunes
  const numericCode = parseInt(errorCode)
  if (!isNaN(numericCode)) {
    const numericError = SAP_ERROR_CODES[String(numericCode)] || SAP_NUMERIC_ERROR_CODES[String(numericCode)]
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

  const error = SAP_ERROR_CODES[errorCode.toUpperCase()] || SAP_NUMERIC_ERROR_CODES[errorCode]
  if (error) {
    return error.description || error.message
  }

  const numericCode = parseInt(errorCode)
  if (!isNaN(numericCode)) {
    const numericError = SAP_ERROR_CODES[String(numericCode)] || SAP_NUMERIC_ERROR_CODES[String(numericCode)]
    if (numericError) {
      return numericError.description || numericError.message
    }
  }

  return null
}

/**
 * ⭐ NUEVO: Obtiene acciones sugeridas para un error de SAP
 */
export function getSapErrorSuggestedActions(errorCode: string | null | undefined): string[] {
  if (!errorCode) {
    return [
      'Revisar los logs en sap_integration_logs para más información',
      'Contactar al equipo técnico si el problema persiste'
    ]
  }

  const error = SAP_ERROR_CODES[errorCode.toUpperCase()] || SAP_NUMERIC_ERROR_CODES[errorCode]
  if (error && error.suggestedActions) {
    return error.suggestedActions
  }

  const numericCode = parseInt(errorCode)
  if (!isNaN(numericCode)) {
    const numericError = SAP_ERROR_CODES[String(numericCode)] || SAP_NUMERIC_ERROR_CODES[String(numericCode)]
    if (numericError && numericError.suggestedActions) {
      return numericError.suggestedActions
    }
  }

  return [
    'Revisar los detalles del error en el modal de error',
    'Revisar los logs en sap_integration_logs',
    'Contactar al equipo técnico con los detalles del error'
  ]
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
): { title: string; description: string | null; suggestedActions?: string[] } {
  const isSap = isSapError(errorSource)
  
  if (isSap && errorCode) {
    return {
      title: getSapErrorMessage(errorCode, errorMessage || defaultMessage),
      description: getSapErrorDescription(errorCode) || errorMessage || null,
      suggestedActions: getSapErrorSuggestedActions(errorCode)
    }
  }

  return {
    title: errorMessage || defaultMessage || 'Error al procesar la solicitud',
    description: isSap ? 'Este error proviene del sistema SAP' : null,
    suggestedActions: errorCode ? getSapErrorSuggestedActions(errorCode) : undefined
  }
}
