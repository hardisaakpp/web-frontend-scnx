import type { UiError } from '../types'

type AxiosLikeError = {
  response?: {
    status?: number
    data?: Record<string, unknown>
    headers?: unknown
  }
  code?: string
}

function headerCorrelation(headers?: Record<string, string>): string | undefined {
  if (!headers) return undefined
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  )
  const id = lower['x-correlation-id']
  return typeof id === 'string' ? id : undefined
}

function parseBackendMessage(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null
  if (typeof data.message === 'string' && data.message.trim()) return data.message
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail
  const detailArr = data.detail
  if (Array.isArray(detailArr) && detailArr.length > 0) {
    const first = detailArr[0] as { msg?: string }
    if (typeof first?.msg === 'string') return first.msg
  }
  return null
}

export function correlationFromResponseHeaders(headers: unknown): string | undefined {
  if (!headers || typeof headers !== 'object') return undefined
  const h = headers as { get?: (name: string) => string | undefined }
  if (typeof h.get === 'function') {
    const fromGet = h.get('x-correlation-id') ?? h.get('X-Correlation-Id')
    if (typeof fromGet === 'string' && fromGet) return fromGet
  }
  return headerCorrelation(headers as Record<string, string>)
}

/**
 * Mapea errores HTTP del servicio de scan al modelo UI (contrato v1).
 */
export function mapScanApiError(error: unknown): UiError {
  const err = error as AxiosLikeError
  const status = err.response?.status
  const data = err.response?.data as Record<string, unknown> | undefined
  const correlationId =
    correlationFromResponseHeaders(err.response?.headers) ??
    (typeof data?.correlationId === 'string' ? data.correlationId : undefined)

  const backendCode = typeof data?.code === 'string' ? data.code : typeof data?.error === 'string' ? data.error : undefined
  const backendMsg = parseBackendMessage(data)

  if (status === 429) {
    return {
      code: 'RATE_LIMIT',
      message: 'Demasiadas consultas. Espera un momento e intenta de nuevo.',
      correlationId
    }
  }

  if (status === 400) {
    const isValidation = backendCode === 'VALIDATION_ERROR' || backendCode === 'VALIDATION'
    return {
      code: isValidation ? 'VALIDATION_ERROR' : 'BAD_REQUEST',
      message: backendMsg ?? 'Solicitud inválida. Verifica almacén y código.',
      correlationId
    }
  }

  if (status === 404 || backendCode === 'NOT_FOUND') {
    return {
      code: 'NOT_FOUND',
      message: backendMsg ?? 'Artículo no encontrado en el almacén seleccionado.',
      correlationId
    }
  }

  if (status === 408 || err.code === 'ECONNABORTED') {
    return {
      code: 'TIMEOUT',
      message: 'El servidor tardó demasiado. Intenta nuevamente.',
      correlationId
    }
  }

  if (status && status >= 500) {
    const isInternal = backendCode === 'INTERNAL_ERROR' || status === 500
    return {
      code: isInternal ? 'INTERNAL_ERROR' : 'SERVER_ERROR',
      message: backendMsg ?? 'Error interno del servidor. Intentá más tarde.',
      correlationId
    }
  }

  return {
    code: 'UNKNOWN',
    message: backendMsg ?? 'No se pudo completar la consulta de artículo.',
    correlationId
  }
}
