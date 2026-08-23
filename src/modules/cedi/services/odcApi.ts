import { cediApi } from '@/lib/http'
import type {
  CompleteAllRequest,
  LineActionRequest,
  OdcDetailDto,
  OdcFilterDto,
  OdcPickingSessionDto,
  PagedResult,
  OdcDto,
  ScanBatchItemDto,
  ScanBatchResultDto,
  SyncOdcResult,
} from '../types'

const odcApi = {
  getOdcs: async (filters: OdcFilterDto, page = 1, pageSize = 20) => {
    const response = await cediApi.get<PagedResult<OdcDto>>('Odc', { params: { ...filters, page, pageSize } })
    return response.data
  },

  getOdc: async (numDoc: string) => {
    const response = await cediApi.get<OdcDetailDto>(`Odc/${numDoc}`)
    return response.data
  },

  /** POST /api/odc/sync — trae páginas recientes desde el middleware (equivalente a confMerg.php). */
  syncOdcs: async (maxPages = 5) => {
    const response = await cediApi.post<SyncOdcResult>('Odc/sync', null, { params: { maxPages } })
    return response.data
  },

  /** "Actualizar desde SAP" — refresca el detalle de UNA ODC puntual vía su DocEntry ya cacheado. */
  refreshOdc: async (numDoc: string) => {
    const response = await cediApi.post<OdcDetailDto>(`Odc/${numDoc}/refresh`)
    return response.data
  },

  /** "Recibir" — inicia (o retoma) la sesión de picking; bloquea la ODC en SAP la primera vez. */
  startPickingSession: async (numDoc: string) => {
    const response = await cediApi.post<OdcPickingSessionDto>(`Odc/${numDoc}/picking-sessions`)
    return response.data
  },

  getPickingSessions: async (numDoc: string) => {
    const response = await cediApi.get<OdcPickingSessionDto[]>(`Odc/${numDoc}/picking-sessions`)
    return response.data
  },

  getPickingSession: async (sessionId: string) => {
    const response = await cediApi.get<OdcPickingSessionDto>(`odc-picking-sessions/${sessionId}`)
    return response.data
  },

  saveScanBatch: async (sessionId: string, items: ScanBatchItemDto[]) => {
    const response = await cediApi.post<ScanBatchResultDto>(`odc-picking-sessions/${sessionId}/scans`, items)
    return response.data
  },

  /** Anula todo lo escaneado de un ítem y lo vuelve a 0 — requiere cedi.odc.picking.supervisor. */
  resetLine: async (sessionId: string, request: LineActionRequest) => {
    const response = await cediApi.post<OdcPickingSessionDto>(`odc-picking-sessions/${sessionId}/lines/reset`, request)
    return response.data
  },

  /** Carga el faltante de un ítem sin escanearlo — requiere cedi.odc.picking.supervisor. */
  markLineComplete: async (sessionId: string, request: LineActionRequest) => {
    const response = await cediApi.post<OdcPickingSessionDto>(`odc-picking-sessions/${sessionId}/lines/complete`, request)
    return response.data
  },

  /** Carga el faltante de TODAS las líneas pendientes — requiere cedi.odc.picking.supervisor. */
  markAllComplete: async (sessionId: string, request: CompleteAllRequest) => {
    const response = await cediApi.post<OdcPickingSessionDto>(`odc-picking-sessions/${sessionId}/complete-all`, request)
    return response.data
  },
}

export default odcApi
