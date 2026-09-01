import { cediApi } from '@/lib/http'
import type {
  CompletarSolicitudRequest,
  DistribucionScanBatchItemDto,
  DistribucionScanBatchResultDto,
  PickingSessionDto,
  SolicitudPickingDetailDto,
} from '../types'

const pickingDistribucionApi = {
  getSession: async (sessionId: string) => {
    const response = await cediApi.get<PickingSessionDto>(`picking-sessions/${sessionId}`)
    return response.data
  },

  /** Escaneo TRANSVERSAL (por ItemCode) — CEDI reparte solo entre las solicitudes pendientes de ese ítem. */
  saveScanBatch: async (sessionId: string, items: DistribucionScanBatchItemDto[]) => {
    const response = await cediApi.post<DistribucionScanBatchResultDto>(`picking-sessions/${sessionId}/scans`, items)
    return response.data
  },

  /** "Cerrar picking" del grupo — parcial exige cedi.grupo.picking.supervisor (el backend lo valida). */
  closeSession: async (sessionId: string) => {
    const response = await cediApi.post<PickingSessionDto>(`picking-sessions/${sessionId}/close`)
    return response.data
  },

  /** Detalle del picking de UNA solicitud (tienda) puntual — "Picking por Documento" (P-010). */
  getSolicitud: async (sessionId: string, solicitudId: string) => {
    const response = await cediApi.get<SolicitudPickingDetailDto>(`picking-sessions/${sessionId}/solicitudes/${solicitudId}`)
    return response.data
  },

  /** Escaneo directo contra las líneas de UNA solicitud puntual (sin reparto). */
  saveScanBatchForSolicitud: async (sessionId: string, solicitudId: string, items: DistribucionScanBatchItemDto[]) => {
    const response = await cediApi.post<DistribucionScanBatchResultDto>(
      `picking-sessions/${sessionId}/solicitudes/${solicitudId}/scans`, items)
    return response.data
  },

  /** "Confirmar recepción 100%" auditada — requiere cedi.grupo.picking.supervisor. */
  completarSolicitud: async (sessionId: string, solicitudId: string, request: CompletarSolicitudRequest) => {
    const response = await cediApi.post<PickingSessionDto>(
      `picking-sessions/${sessionId}/solicitudes/${solicitudId}/complete`, request)
    return response.data
  },
}

export default pickingDistribucionApi
