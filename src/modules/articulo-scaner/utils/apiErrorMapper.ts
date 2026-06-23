import type { UiError } from '../types'
import {
  type AxiosLikeError,
  correlationFromResponseHeaders,
  extractValidationMessage,
  parseBackendMessage,
} from '@/utils/apiErrorMapper'

export { correlationFromResponseHeaders }

export function mapScanApiError(error: unknown): UiError {
  if (error instanceof Error && error.message.startsWith('[articulo-scan]')) {
    return {
      code: 'BAD_RESPONSE',
      message: error.message.replace(/^\[articulo-scan\]\s*/, ''),
      correlationId: undefined,
    }
  }

  const err = error as AxiosLikeError
  const status = err.response?.status
  const data = err.response?.data
  const correlationId =
    correlationFromResponseHeaders(err.response?.headers) ??
    (typeof data?.correlationId === 'string' ? data.correlationId : undefined)
  const backendCode =
    typeof data?.code === 'string' ? data.code : typeof data?.error === 'string' ? data.error : undefined
  const backendMsg = parseBackendMessage(data)
  const details = data?.details

  if (status === 429) {
    return { code: 'RATE_LIMIT', message: 'Demasiadas consultas. Espera un momento e intenta de nuevo.', correlationId }
  }

  if (status === 400) {
    const isValidation = backendCode === 'VALIDATION_ERROR' || backendCode === 'VALIDATION'
    const validationMessage = extractValidationMessage(details)
    return {
      code: isValidation ? 'VALIDATION_ERROR' : 'BAD_REQUEST',
      message: validationMessage ?? backendMsg ?? 'Solicitud inválida. Verifica almacén y código.',
      details,
      correlationId,
    }
  }

  if (status === 404 || backendCode === 'NOT_FOUND') {
    return {
      code: 'NOT_FOUND',
      message: backendMsg ?? 'Artículo no encontrado en el almacén seleccionado.',
      details,
      correlationId,
    }
  }

  if (status === 408 || err.code === 'ECONNABORTED') {
    return { code: 'TIMEOUT', message: 'El servidor tardó demasiado. Intenta nuevamente.', correlationId }
  }

  if (status && status >= 500) {
    const isInternal = backendCode === 'INTERNAL_ERROR' || status === 500
    return {
      code: isInternal ? 'INTERNAL_ERROR' : 'SERVER_ERROR',
      message: backendMsg ?? 'Error interno del servidor. Intentá más tarde.',
      details,
      correlationId,
    }
  }

  return {
    code: 'UNKNOWN',
    message: backendMsg ?? 'No se pudo completar la consulta de artículo.',
    details,
    correlationId,
  }
}
