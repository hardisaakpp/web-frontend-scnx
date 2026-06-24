export type AxiosLikeError = {
  response?: {
    status?: number
    data?: Record<string, unknown>
    headers?: unknown
  }
  code?: string
  message?: string
}

export interface UiError {
  code: string
  message: string
  details?: unknown
  correlationId?: string
}

export function parseBackendMessage(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null
  if (typeof data.message === 'string' && data.message.trim()) return data.message.trim()
  if (typeof data.detail === 'string' && data.detail.trim()) return data.detail.trim()
  const detailArr = data.detail
  if (Array.isArray(detailArr) && detailArr.length > 0) {
    const first = detailArr[0] as { msg?: string }
    if (typeof first?.msg === 'string') return first.msg
  }
  return null
}

export function correlationFromResponseHeaders(headers: unknown): string | undefined {
  if (!headers || typeof headers !== 'object') return undefined
  const h = headers as { get?: (name: string) => string | undefined } & Record<string, unknown>
  if (typeof h.get === 'function') {
    const fromGet = h.get('x-correlation-id') ?? h.get('X-Correlation-Id')
    if (typeof fromGet === 'string' && fromGet) return fromGet
  }
  const lower = Object.fromEntries(
    Object.entries(h).map(([k, v]) => [k.toLowerCase(), v])
  )
  const id = lower['x-correlation-id']
  return typeof id === 'string' ? id : undefined
}

export function extractValidationMessage(details: unknown): string | null {
  if (!details) return null
  if (Array.isArray(details)) {
    const lines = details
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const r = item as Record<string, unknown>
        const field =
          (typeof r.field === 'string' && r.field) ||
          (typeof r.path === 'string' && r.path) ||
          (typeof r.param === 'string' && r.param) ||
          ''
        const msg =
          (typeof r.message === 'string' && r.message) ||
          (typeof r.msg === 'string' && r.msg) ||
          ''
        if (!msg) return null
        return field ? `${field}: ${msg}` : msg
      })
      .filter((l): l is string => Boolean(l))
    if (lines.length > 0) return lines.join(' | ')
  }
  if (typeof details === 'object') {
    const pairs = Object.entries(details as Record<string, unknown>)
      .map(([k, v]) => (typeof v === 'string' && v.trim() ? `${k}: ${v}` : null))
      .filter((l): l is string => Boolean(l))
    if (pairs.length > 0) return pairs.join(' | ')
  }
  if (typeof details === 'string' && details.trim()) return details
  return null
}

function mapByStatus(
  status: number | undefined,
  backendMsg: string | null,
  correlationId: string | undefined
): UiError | null {
  if (status === 400) return { code: 'BAD_REQUEST', message: backendMsg ?? 'Solicitud inválida.', correlationId }
  if (status === 401) return { code: 'UNAUTHORIZED', message: backendMsg ?? 'Sesión no válida.', correlationId }
  if (status === 403) return { code: 'FORBIDDEN', message: backendMsg ?? 'Sin permiso para esta operación.', correlationId }
  if (status === 404) return { code: 'NOT_FOUND', message: backendMsg ?? 'Recurso no encontrado.', correlationId }
  if (status === 408) return { code: 'TIMEOUT', message: 'El servidor tardó demasiado. Intenta nuevamente.', correlationId }
  if (status === 429) return { code: 'RATE_LIMIT', message: 'Demasiadas consultas. Espera un momento e intenta de nuevo.', correlationId }
  if (status && status >= 500) return { code: 'SERVER_ERROR', message: backendMsg ?? 'Error interno del servidor. Intenta más tarde.', correlationId }
  return null
}

export function mapApiError(error: unknown, fallback = 'No se pudo completar la operación.'): UiError {
  const err = error as AxiosLikeError
  const status = err.response?.status
  const data = err.response?.data
  const correlationId = correlationFromResponseHeaders(err.response?.headers)
  const backendMsg = parseBackendMessage(data)

  const byStatus = mapByStatus(status, backendMsg, correlationId)
  if (byStatus) return byStatus

  if (err.code === 'ECONNABORTED') {
    return { code: 'TIMEOUT', message: 'El servidor tardó demasiado. Intenta nuevamente.', correlationId }
  }
  if (!err.response) {
    return { code: 'NETWORK', message: 'Sin conexión con el servicio. Verifica tu red.', correlationId }
  }

  return { code: 'UNKNOWN', message: backendMsg ?? fallback, correlationId }
}
