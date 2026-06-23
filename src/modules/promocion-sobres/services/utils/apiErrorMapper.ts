import type { PromocionSobresErrorCode, UiError } from '../../types'
import { correlationFromResponseHeaders } from '@/utils/apiErrorMapper'

type ApiErrorBody = {
  success?: boolean
  message?: string | null
  error_code?: string | null
  errorCode?: string | null
  details?: unknown
  correlation_id?: string | null
  correlationId?: string | null
}

type PromocionAxiosError = {
  response?: {
    status?: number
    data?: ApiErrorBody
    headers?: unknown
  }
  code?: string
  message?: string
}

const ERROR_MESSAGES: Record<PromocionSobresErrorCode, string> = {
  NO_ENCONTRADO: 'La cédula no está registrada en esta promoción.',
  YA_ENTREGADO: 'Este beneficiario ya recibió el obsequio.',
  ESCANEO_DUPLICADO: 'Este codigo ya fue validado. El flujo ha finalizado.',
  CODIGO_INVALIDO:
    'El codigo escaneado no coincide con el codigo de validacion registrado para este cliente.',
  IDENTIFICACION_INVALIDA: 'La cédula ingresada no es válida.',
  VALIDATION_ERROR: 'Los datos enviados no son válidos.',
  UNKNOWN: 'No se pudo completar la operación.',
}

function extractBackendErrorCode(body?: ApiErrorBody): string {
  if (!body) return ''
  const raw = body.error_code ?? body.errorCode
  return typeof raw === 'string' ? raw.trim() : ''
}

function extractCorrelationId(body?: ApiErrorBody, headers?: unknown): string | undefined {
  const fromBody = body?.correlation_id ?? body?.correlationId
  if (typeof fromBody === 'string' && fromBody.trim()) return fromBody.trim()
  return correlationFromResponseHeaders(headers)
}

function looksLikeEscaneoDuplicado(message: string | null): boolean {
  if (!message) return false
  const normalized = message.toLowerCase()
  return normalized.includes('validado') || normalized.includes('finalizado')
}

function mapKnownBackendCode(
  backendCode: string,
  backendMessage: string | null,
  correlationId?: string
): UiError | null {
  const code = backendCode.toUpperCase() as PromocionSobresErrorCode
  if (!(code in ERROR_MESSAGES)) return null
  return { code, message: backendMessage ?? ERROR_MESSAGES[code], correlationId }
}

export function mapPromocionSobresApiError(error: unknown): UiError {
  const err = error as PromocionAxiosError
  const status = err.response?.status
  const body = err.response?.data
  const correlationId = extractCorrelationId(body, err.response?.headers)
  const backendCode = extractBackendErrorCode(body)
  const backendMessage = typeof body?.message === 'string' && body.message.trim() ? body.message : null

  if (backendCode) {
    const mapped = mapKnownBackendCode(backendCode, backendMessage, correlationId)
    if (mapped) return mapped
  }

  if (status === 404) {
    return { code: 'NO_ENCONTRADO', message: backendMessage ?? ERROR_MESSAGES.NO_ENCONTRADO, correlationId }
  }

  if (status === 409) {
    if (looksLikeEscaneoDuplicado(backendMessage)) {
      return { code: 'ESCANEO_DUPLICADO', message: backendMessage ?? ERROR_MESSAGES.ESCANEO_DUPLICADO, correlationId }
    }
    return { code: 'YA_ENTREGADO', message: backendMessage ?? ERROR_MESSAGES.YA_ENTREGADO, correlationId }
  }

  if (status === 403) {
    return {
      code: 'FORBIDDEN',
      message: backendMessage ?? 'Sin permiso. Entrega: promocion.sobres.operate. Monitoreo: boton-monitorear.view.',
      correlationId,
    }
  }

  if (status === 401) {
    return {
      code: 'BAD_REQUEST',
      message: backendMessage ?? 'Sesión no válida o token ausente. Inicia sesión o habilita DevBypass en el API.',
      correlationId,
    }
  }

  if (status === 400) {
    return {
      code: 'BAD_REQUEST',
      message: backendMessage ?? 'Solicitud inválida. Verifica los datos e intenta de nuevo.',
      correlationId,
    }
  }

  if (err.code === 'ECONNABORTED') {
    return { code: 'TIMEOUT', message: 'El servidor tardó demasiado. Intenta nuevamente.', correlationId }
  }

  if (!err.response) {
    return {
      code: 'NETWORK',
      message: 'No hay conexión con el servicio de promoción. Verifica tu red o el proxy de desarrollo.',
      correlationId,
    }
  }

  if (status && status >= 500) {
    return { code: 'SERVER', message: backendMessage ?? 'Error interno del servidor. Intenta más tarde.', correlationId }
  }

  return { code: 'UNKNOWN', message: backendMessage ?? err.message ?? ERROR_MESSAGES.UNKNOWN, correlationId }
}
