/**
 * Utilidades para manejo consistente de errores del backend
 */

/**
 * Extrae mensaje de error del backend de forma consistente
 */
export function extractErrorMessage(error: any): string {
  let message = error.message || 'Error desconocido'
  
  if (error.response?.data) {
    // Prioridad 1: Business exception
    if (error.response.data.type === 'business_exception') {
      return error.response.data.error || error.response.data.message || message
    }
    
    // Prioridad 2: Campo 'error'
    if (error.response.data.error) {
      return error.response.data.error
    }
    
    // Prioridad 3: Campo 'detail' (FastAPI)
    if (error.response.data.detail) {
      const detail = error.response.data.detail
      if (Array.isArray(detail)) {
        return detail.map((item: any) => {
          if (typeof item === 'string') return item
          if (item?.msg) return item.msg
          if (item?.loc && item?.msg) {
            const location = Array.isArray(item.loc) ? item.loc.join('.') : String(item.loc)
            return `${location}: ${item.msg}`
          }
          return JSON.stringify(item)
        }).join('\n')
      } else if (typeof detail === 'string') {
        return detail
      } else if (detail.message) {
        return detail.message
      }
      return String(detail)
    }
    
    // Prioridad 4: Campo 'message'
    if (error.response.data.message) {
      return error.response.data.message
    }
  }
  
  if (error.request) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
  }
  
  return message
}

/**
 * Crea un error enriquecido con información del backend
 */
export function createEnrichedError(error: any, defaultMessage: string): Error {
  const message = extractErrorMessage(error)
  const enrichedError = new Error(message || defaultMessage) as any
  
  // Preservar información del response
  enrichedError.response = error.response
  enrichedError.isBusinessException = error.response?.data?.type === 'business_exception'
  enrichedError.businessError = error.response?.data?.error
  
  return enrichedError
}

/**
 * Normaliza respuesta de validación (validation -> validacion)
 */
export function normalizeValidationResponse(data: any): any {
  const normalized = { ...data }
  if (normalized.validation && !normalized.validacion) {
    normalized.validacion = normalized.validation
  }
  if (normalized.validation_sap && !normalized.validacion_sap) {
    normalized.validacion_sap = normalized.validation_sap
  }
  return normalized
}
