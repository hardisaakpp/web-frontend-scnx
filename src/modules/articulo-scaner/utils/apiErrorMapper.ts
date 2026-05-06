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

function extractValidationMessage(details: unknown): string | null {
  if (!details) return null
  if (Array.isArray(details)) {
    const fieldMessages = details
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const record = item as Record<string, unknown>
        const field =
          (typeof record.field === 'string' && record.field) ||
          (typeof record.path === 'string' && record.path) ||
          (typeof record.param === 'string' && record.param) ||
          ''
        const msg =
          (typeof record.message === 'string' && record.message) ||
          (typeof record.msg === 'string' && record.msg) ||
          ''
        if (!msg) return null
        return field ? `${field}: ${msg}` : msg
      })
      .filter((line): line is string => Boolean(line))
    if (fieldMessages.length > 0) return fieldMessages.join(' | ')
  }
  if (typeof details === 'object') {
    const pairs = Object.entries(details as Record<string, unknown>)
      .map(([field, value]) => {
        if (typeof value === 'string' && value.trim()) return `${field}: ${value}`
        return null
      })
      .filter((line): line is string => Boolean(line))
    if (pairs.length > 0) return pairs.join(' | ')
  }
  if (typeof details === 'string' && details.trim()) return details
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
  if (error instanceof Error && error.message.startsWith('[articulo-scan]')) {
    return {
      code: 'BAD_RESPONSE',
      message: error.message.replace(/^\[articulo-scan\]\s*/, ''),
      correlationId: undefined
    }
  }

  const err = error as AxiosLikeError
  const status = err.response?.status
  const data = err.response?.data as Record<string, unknown> | undefined
  const correlationId =
    correlationFromResponseHeaders(err.response?.headers) ??
    (typeof data?.correlationId === 'string' ? data.correlationId : undefined)

  const backendCode = typeof data?.code === 'string' ? data.code : typeof data?.error === 'string' ? data.error : undefined
  const backendMsg = parseBackendMessage(data)
  const details = data?.details

  if (status === 429) {
    return {
      code: 'RATE_LIMIT',
      message: 'Demasiadas consultas. Espera un momento e intenta de nuevo.',
      correlationId
    }
  }

  if (status === 400) {
    const isValidation = backendCode === 'VALIDATION_ERROR' || backendCode === 'VALIDATION'
    const validationMessage = extractValidationMessage(details)
    return {
      code: isValidation ? 'VALIDATION_ERROR' : 'BAD_REQUEST',
      message: validationMessage ?? backendMsg ?? 'Solicitud inválida. Verifica almacén y código.',
      details,
      correlationId
    }
  }

  if (status === 404 || backendCode === 'NOT_FOUND') {
    return {
      code: 'NOT_FOUND',
      message: backendMsg ?? 'Artículo no encontrado en el almacén seleccionado.',
      details,
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
      details,
      correlationId
    }
  }

  return {
    code: 'UNKNOWN',
    message: backendMsg ?? 'No se pudo completar la consulta de artículo.',
    details,
    correlationId
  }
}
