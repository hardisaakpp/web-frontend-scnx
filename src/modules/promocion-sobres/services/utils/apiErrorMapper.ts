import type { PromocionSobresErrorCode, UiError } from '../../types'

type AxiosLikeError = {
  response?: {
    status?: number
    data?: {
      success?: boolean
      message?: string | null
      error_code?: string | null
      correlation_id?: string | null
    }
    headers?: Record<string, string>
  }
  code?: string
  message?: string
}

const ERROR_MESSAGES: Record<PromocionSobresErrorCode, string> = {
  NO_ENCONTRADO: 'La cédula no está registrada en esta promoción.',
  YA_ENTREGADO: 'Este beneficiario ya recibió el obsequio.',
  CODIGO_INVALIDO: 'El código escaneado no es válido para esta promoción.',
  IDENTIFICACION_INVALIDA: 'La cédula ingresada no es válida.',
  VALIDATION_ERROR: 'Los datos enviados no son válidos.',
  UNKNOWN: 'No se pudo completar la operación.'
}

function correlationFromHeaders(headers?: Record<string, string>): string | undefined {
  if (!headers) return undefined
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === 'x-correlation-id')
  return entry?.[1]
}

function mapKnownBackendCode(
  backendCode: string,
  backendMessage: string | null,
  correlationId?: string
): UiError | null {
  const code = backendCode.toUpperCase() as PromocionSobresErrorCode
  if (!(code in ERROR_MESSAGES)) return null
  return {
    code,
    message: backendMessage ?? ERROR_MESSAGES[code],
    correlationId
  }
}

export function mapPromocionSobresApiError(error: unknown): UiError {
  const err = error as AxiosLikeError
  const status = err.response?.status
  const body = err.response?.data
  const correlationId = body?.correlation_id ?? correlationFromHeaders(err.response?.headers)
  const backendCode = (body?.error_code || '').trim()
  const backendMessage = typeof body?.message === 'string' && body.message.trim() ? body.message : null

  if (backendCode) {
    const mapped = mapKnownBackendCode(backendCode, backendMessage, correlationId)
    if (mapped) return mapped
  }

  if (status === 404) {
    return {
      code: 'NO_ENCONTRADO',
      message: backendMessage ?? ERROR_MESSAGES.NO_ENCONTRADO,
      correlationId
    }
  }

  if (status === 409) {
    return {
      code: 'YA_ENTREGADO',
      message: backendMessage ?? ERROR_MESSAGES.YA_ENTREGADO,
      correlationId
    }
  }

  if (status === 403) {
    return {
      code: 'FORBIDDEN',
      message:
        backendMessage ?? 'Sin permiso para usar promoción sobres. Se requiere promocion.sobres.operate (JWT de Core activo).',
      correlationId
    }
  }

  if (status === 401) {
    return {
      code: 'BAD_REQUEST',
      message: backendMessage ?? 'Sesión no válida o token ausente. Inicia sesión o habilita DevBypass en el API.',
      correlationId
    }
  }

  if (status === 400) {
    return {
      code: 'BAD_REQUEST',
      message: backendMessage ?? 'Solicitud inválida. Verifica los datos e intenta de nuevo.',
      correlationId
    }
  }

  if (err.code === 'ECONNABORTED') {
    return {
      code: 'TIMEOUT',
      message: 'El servidor tardó demasiado. Intenta nuevamente.',
      correlationId
    }
  }

  if (!err.response) {
    return {
      code: 'NETWORK',
      message: 'No hay conexión con el servicio de promoción. Verifica tu red o el proxy de desarrollo.',
      correlationId
    }
  }

  if (status && status >= 500) {
    return {
      code: 'SERVER',
      message: backendMessage ?? 'Error interno del servidor. Intenta más tarde.',
      correlationId
    }
  }

  return {
    code: 'UNKNOWN',
    message: backendMessage ?? err.message ?? ERROR_MESSAGES.UNKNOWN,
    correlationId
  }
}
