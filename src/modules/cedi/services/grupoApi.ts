import { cediApi } from '@/lib/http'
import type {
  CrearGrupoRequest,
  CrearGrupoResultDto,
  GrupoDetailDto,
  GrupoDto,
  IntegrarStockTransferResultDto,
  PagedResult,
  PickingSessionDto,
} from '../types'

const grupoApi = {
  /** "Crea Lista D." — consolida las SOT elegidas en un grupo nuevo y las bloquea en SAP. */
  crearGrupo: async (request: CrearGrupoRequest) => {
    const response = await cediApi.post<CrearGrupoResultDto>('grupos', request)
    return response.data
  },

  getGrupos: async (page = 1, pageSize = 20) => {
    const response = await cediApi.get<PagedResult<GrupoDto>>('grupos', { params: { page, pageSize } })
    return response.data
  },

  getGrupo: async (id: string) => {
    const response = await cediApi.get<GrupoDetailDto>(`grupos/${id}`)
    return response.data
  },

  /** Arma (o retoma) la sesión de picking transversal del grupo. */
  startPickingSession: async (grupoId: string) => {
    const response = await cediApi.post<PickingSessionDto>(`grupos/${grupoId}/picking-sessions`)
    return response.data
  },

  /** "Crear transferencias" — genera un StockTransfer por solicitud con algo escaneado. */
  integrarStockTransfer: async (grupoId: string) => {
    const response = await cediApi.post<IntegrarStockTransferResultDto>(`grupos/${grupoId}/integrate-sap`)
    return response.data
  },

  /** Cierra la sesión de picking ABIERTA del grupo (resuelve el sessionId internamente) — para el Kanban (P-016). */
  closePicking: async (grupoId: string) => {
    const response = await cediApi.post<PickingSessionDto>(`grupos/${grupoId}/close-picking`)
    return response.data
  },
}

export default grupoApi
