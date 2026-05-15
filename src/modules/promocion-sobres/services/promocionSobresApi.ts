import { promocionSobresApi, promocionSobresApiPrefix } from './config/axiosConfig'
import { mapPromocionSobresApiError } from './utils/apiErrorMapper'
import type {
  ApiResponse,
  BeneficiarioDto,
  EntregaRegistradaDto,
  RegistrarEntregaRequest,
  UiError
} from '../types'

export { mapPromocionSobresApiError }

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    const error: UiError = {
      code: (response.error_code?.toUpperCase() as UiError['code']) || 'UNKNOWN',
      message: response.message || 'La API de promoción sobres devolvió un error.',
      correlationId: response.correlation_id ?? undefined
    }
    throw Object.assign(new Error(error.message), { uiError: error })
  }
  return response.data as T
}

export const promocionSobresService = {
  async consultarBeneficiario(identificacion: string): Promise<BeneficiarioDto> {
    const id = identificacion.trim()
    const response = await promocionSobresApi.get<ApiResponse<BeneficiarioDto>>(
      `${promocionSobresApiPrefix}/beneficiarios/${encodeURIComponent(id)}`
    )
    return unwrap(response.data)
  },

  async registrarEntrega(payload: RegistrarEntregaRequest): Promise<EntregaRegistradaDto> {
    const response = await promocionSobresApi.post<ApiResponse<EntregaRegistradaDto>>(
      `${promocionSobresApiPrefix}/entregas`,
      {
        identificacion: payload.identificacion.trim(),
        codigoEscaneado: payload.codigoEscaneado.trim()
      }
    )
    return unwrap(response.data)
  }
}
