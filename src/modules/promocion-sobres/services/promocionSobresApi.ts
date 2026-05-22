import { promocionSobresApi, promocionSobresApiPrefix } from './config/axiosConfig'
import { mapPromocionSobresApiError } from './utils/apiErrorMapper'
import { fechaModificacionClienteIso } from './utils/clientLocalDateTime'
import type {
  ApiResponse,
  BeneficiarioDto,
  EntregaRegistradaDto,
  EntregadosMonitoreoDto,
  RegistrarEntregaRequest,
  UiError
} from '../types'

export { mapPromocionSobresApiError }

/** Algunos servicios serializan flags como 0/1; el estado lo define el API, no reglas locales. */
function normalizeApiBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1') return true
  if (value === 0 || value === '0') return false
  return Boolean(value)
}

function normalizeBeneficiarioDto(raw: BeneficiarioDto): BeneficiarioDto {
  return {
    ...raw,
    entregado: normalizeApiBoolean(raw.entregado as unknown),
    puedeEscanear: normalizeApiBoolean(raw.puedeEscanear as unknown)
  }
}

/**
 * Flags según POST /entregas: solo campos explícitos del API (BD).
 * Sin fallback al estado previo del cliente.
 */
export function resolveEntregaFlagsFromApi(
  entrega: EntregaRegistradaDto,
  fallback?: Partial<Pick<BeneficiarioDto, 'entregado' | 'puedeEscanear'>>
): { entregado: boolean; puedeEscanear: boolean } {
  const entregado =
    entrega.entregado != null
      ? normalizeApiBoolean(entrega.entregado)
      : entrega.exitoso != null
        ? normalizeApiBoolean(entrega.exitoso)
        : (fallback?.entregado ?? false)
  const puedeEscanear =
    entrega.puedeEscanear != null
      ? normalizeApiBoolean(entrega.puedeEscanear)
      : (fallback?.puedeEscanear ?? false)
  return { entregado, puedeEscanear }
}

/** Errores POST /entregas (ExecuteEntrega) cuando `details` refleja estado en BD. */
export function parseEntregaEstadoDetails(
  details: unknown
): Partial<Pick<BeneficiarioDto, 'entregado' | 'puedeEscanear'>> | null {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return null
  const d = details as Record<string, unknown>
  const patch: Partial<Pick<BeneficiarioDto, 'entregado' | 'puedeEscanear'>> = {}
  if ('entregado' in d && d.entregado != null) {
    patch.entregado = normalizeApiBoolean(d.entregado)
  }
  if ('puedeEscanear' in d && d.puedeEscanear != null) {
    patch.puedeEscanear = normalizeApiBoolean(d.puedeEscanear)
  }
  return Object.keys(patch).length ? patch : null
}

export function extractEntregaEstadoPatchFromAxiosError(
  error: unknown
): Partial<Pick<BeneficiarioDto, 'entregado' | 'puedeEscanear'>> | null {
  const err = error as { response?: { data?: { details?: unknown } } }
  return parseEntregaEstadoDetails(err.response?.data?.details)
}

function unwrapSuccess<T>(body: ApiResponse<T>): { data: T; message: string | null } {
  if (!body.success) {
    const error: UiError = {
      code: (body.error_code?.toUpperCase() as UiError['code']) || 'UNKNOWN',
      message: body.message || 'La API de promoción sobres devolvió un error.',
      correlationId: body.correlation_id ?? undefined
    }
    throw Object.assign(new Error(error.message), { uiError: error })
  }
  return { data: body.data as T, message: body.message ?? null }
}

export const promocionSobresService = {
  async consultarBeneficiario(identificacion: string): Promise<{ beneficiario: BeneficiarioDto; mensajeApi: string | null }> {
    const id = identificacion.trim()
    const response = await promocionSobresApi.get<ApiResponse<BeneficiarioDto>>(
      `${promocionSobresApiPrefix}/beneficiarios/${encodeURIComponent(id)}`
    )
    const { data, message } = unwrapSuccess(response.data)
    return { beneficiario: normalizeBeneficiarioDto(data), mensajeApi: message }
  },

  async registrarEntrega(payload: RegistrarEntregaRequest): Promise<{ entrega: EntregaRegistradaDto; mensajeApi: string | null }> {
    const response = await promocionSobresApi.post<ApiResponse<EntregaRegistradaDto>>(
      `${promocionSobresApiPrefix}/entregas`,
      {
        identificacion: payload.identificacion.trim(),
        codigoEscaneado: payload.codigoEscaneado.trim(),
        fechaModificacion: payload.fechaModificacion ?? fechaModificacionClienteIso()
      }
    )
    const { data, message } = unwrapSuccess(response.data)
    return { entrega: data, mensajeApi: message }
  },

  async consultarEntregadosMonitoreo(): Promise<EntregadosMonitoreoDto> {
    const response = await promocionSobresApi.get<ApiResponse<EntregadosMonitoreoDto>>(
      `${promocionSobresApiPrefix}/monitoreo/entregados`,
      {
        params: { _: Date.now() },
        headers: { 'Cache-Control': 'no-cache' }
      }
    )
    const { data } = unwrapSuccess(response.data)
    return data
  }
}
