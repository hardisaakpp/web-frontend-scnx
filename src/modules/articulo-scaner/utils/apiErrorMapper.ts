import type { UiError } from '../types'
import {
  type AxiosLikeError,
  correlationFromResponseHeaders,
  extractValidationMessage,
  parseBackendMessage,
} from '@/utils/apiErrorMapper'

export { correlationFromResponseHeaders }

function resolveCorrelationId(headers: unknown, data: any): string | undefined {
  return (
    correlationFromResponseHeaders(headers) ??
    (typeof data?.correlationId === 'string' ? data.correlationId : undefined)
  )
}

function resolveBackendCode(data: any): string | undefined {
  if (typeof data?.code === 'string') return data.code
  if (typeof data?.error === 'string') return data.error
  return undefined
}

function map400Error(
  backendCode: string | undefined,
  details: unknown,
  backendMsg: string | null | undefined,
  correlationId: string | undefined,
): UiError {
  const isValidation = backendCode === 'VALIDATION_ERROR' || backendCode === 'VALIDATION'
  const validationMsg = extractValidationMessage(details)
  return {
    code: isValidation ? 'VALIDATION_ERROR' : 'BAD_REQUEST',
    message: validationMsg ?? backendMsg ?? 'Solicitud inválida. Verifica almacén y código.',
    details,
    correlationId,
  }
}

function map5xxError(
  status: number,
  backendCode: string | undefined,
  backendMsg: string | null | undefined,
  details: unknown,
  correlationId: string | undefined,
): UiError {
  const isInternal = backendCode === 'INTERNAL_ERROR' || status === 500
  return {
    code: isInternal ? 'INTERNAL_ERROR' : 'SERVER_ERROR',
    message: backendMsg ?? 'Error interno del servidor. Intentá más tarde.',
    details,
    correlationId,
  }
}

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
  const correlationId = resolveCorrelationId(err.response?.headers, data)
  const backendCode = resolveBackendCode(data)
  const backendMsg = parseBackendMessage(data)
  const details = data?.details

  if (status === 429) {
    return { code: 'RATE_LIMIT', message: 'Demasiadas consultas. Espera un momento e intenta de nuevo.', correlationId }
  }

  if (status === 400) {
    return map400Error(backendCode, details, backendMsg, correlationId)
  }

  if (status === 404 || backendCode === 'NOT_FOUND') {
    return { code: 'NOT_FOUND', message: backendMsg ?? 'Artículo no encontrado en el almacén seleccionado.', details, correlationId }
  }

  if (status === 408 || err.code === 'ECONNABORTED') {
    return { code: 'TIMEOUT', message: 'El servidor tardó demasiado. Intenta nuevamente.', correlationId }
  }

  if (status && status >= 500) {
    return map5xxError(status, backendCode, backendMsg, details, correlationId)
  }

  return { code: 'UNKNOWN', message: backendMsg ?? 'No se pudo completar la consulta de artículo.', details, correlationId }
}
