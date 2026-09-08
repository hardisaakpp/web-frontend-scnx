import { invPlanesApi } from './config/invPlanesAxiosConfig'
import { mapInventarioApiError } from '../utils/apiErrorMapper'
import type {
  InventorySessionListItemDto,
  InventorySessionPickerDto,
  WarehouseSimpleDto,
  InventorySessionStatusDto,
  AddInventoryCountRequest,
  InventoryCountResultDto,
  ItemValidationDto,
  InventoryPickingSummaryDto,
  SupervisorSummaryDto,
  SessionDetailLineDto,
  SessionDetailStatsDto,
  SessionScansByUserDto,
  MyCountHistorySessionDto,
  DeleteCountsResultDto
} from '../types'

invPlanesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = mapInventarioApiError(error, 'No se pudo completar la operación de sesiones de inventario.')
    return Promise.reject(Object.assign(new Error(message), { cause: error }))
  }
)

export const inventarioSesionesService = {
  /**
   * Listado de tomas. `since`/`until` (ISO, sobre la fecha de apertura) se filtran en el servidor:
   * el costo del endpoint es calcular el alcance de cada toma devuelta contra sc_maestros, así que
   * traer solo el rango visible (15 días por defecto) es lo que hace rápida la pantalla.
   */
  async getSesiones(params?: { since?: string; until?: string; status?: string }): Promise<InventorySessionListItemDto[]> {
    // Sin filtro de fechas (usuario limpió el rango) puede tardar: se mantiene el timeout amplio.
    const response = await invPlanesApi.get<InventorySessionListItemDto[]>('/api/inventory-sessions', { params, timeout: 120_000 })
    return response.data
  },

  async getMisSesiones(): Promise<InventorySessionListItemDto[]> {
    // Mismo caso que getSesiones: un admin con acceso a todas las bodegas dispara una consulta de
    // stock por cada bodega distinta, en secuencia, en el backend — puede superar los 30s default.
    const response = await invPlanesApi.get<InventorySessionListItemDto[]>('/api/inventory-sessions/my', { timeout: 120_000 })
    return response.data
  },

  async deleteSesion(sessionId: string): Promise<void> {
    await invPlanesApi.delete(`/api/inventory-sessions/${sessionId}`)
  },

  async getMiHistorial(from?: string): Promise<MyCountHistorySessionDto[]> {
    const response = await invPlanesApi.get<MyCountHistorySessionDto[]>('/api/inventory-sessions/my/history', {
      params: from ? { from } : undefined
    })
    return response.data
  },

  async createSesion(
    warehouseCode: string,
    description: string | null,
    plannedCloseDate: string,
    filters?: {
      uNv1Values?: string[]
      uNv2Values?: string[]
      uNv3Values?: string[]
      uGenValues?: string[]
      materialValues?: string[]
      packValues?: string[]
      coleccionValues?: string[]
    },
    referenceCode?: string | null
  ): Promise<{ sessionId: string }> {
    const response = await invPlanesApi.post<{ sessionId: string }>('/api/inventory-sessions', {
      warehouseCode,
      description: description ?? null,
      plannedCloseDate,
      referenceCode: referenceCode ?? null,
      uNv1Values: filters?.uNv1Values?.length ? filters.uNv1Values : null,
      uNv2Values: filters?.uNv2Values?.length ? filters.uNv2Values : null,
      uNv3Values: filters?.uNv3Values?.length ? filters.uNv3Values : null,
      uGenValues: filters?.uGenValues?.length ? filters.uGenValues : null,
      materialValues: filters?.materialValues?.length ? filters.materialValues : null,
      packValues: filters?.packValues?.length ? filters.packValues : null,
      coleccionValues: filters?.coleccionValues?.length ? filters.coleccionValues : null,
    })
    return response.data
  },

  async getPickers(sessionId: string): Promise<InventorySessionPickerDto[]> {
    const response = await invPlanesApi.get<InventorySessionPickerDto[]>(`/api/inventory-sessions/${sessionId}/pickers`)
    return response.data
  },

  async addPicker(sessionId: string, userId: string): Promise<InventorySessionPickerDto> {
    const response = await invPlanesApi.post<InventorySessionPickerDto>(`/api/inventory-sessions/${sessionId}/pickers`, { userId })
    return response.data
  },

  async removePicker(sessionId: string, userId: string): Promise<void> {
    await invPlanesApi.delete(`/api/inventory-sessions/${sessionId}/pickers/${encodeURIComponent(userId)}`)
  },

  async setMyPickingLocation(sessionId: string, location: string | null): Promise<InventorySessionPickerDto> {
    const response = await invPlanesApi.put<InventorySessionPickerDto>(`/api/inventory-sessions/${sessionId}/pickers/me/location`, { location })
    return response.data
  },

  async getWarehouses(): Promise<WarehouseSimpleDto[]> {
    const response = await invPlanesApi.get<WarehouseSimpleDto[]>('/api/stock/warehouses')
    return response.data
  },

  async getSessionStatus(sessionId: string): Promise<InventorySessionStatusDto> {
    const response = await invPlanesApi.get<InventorySessionStatusDto>(`/api/inventory-sessions/${sessionId}/status`)
    return response.data
  },

  /**
   * Registra un conteo desde la pantalla de picking. Timeout corto a propósito: con WiFi conectado
   * pero sin salida a internet (caso típico en tienda) el default de 30 s dejaba al operador viendo
   * "Enviando..." medio minuto por cada escaneo; con 8 s el registro pasa rápido a la lista de
   * errores, que se reintenta sola.
   */
  async addCount(sessionId: string, data: AddInventoryCountRequest): Promise<InventoryCountResultDto> {
    const response = await invPlanesApi.post<InventoryCountResultDto>(`/api/inventory-sessions/${sessionId}/counts`, data, { timeout: 8_000 })
    return response.data
  },

  async validateItem(itemCode: string): Promise<ItemValidationDto> {
    const response = await invPlanesApi.get<ItemValidationDto>(`/api/stock/items/${encodeURIComponent(itemCode)}`)
    return response.data
  },

  async getPickingSummary(sessionId: string): Promise<InventoryPickingSummaryDto> {
    const response = await invPlanesApi.get<InventoryPickingSummaryDto>(`/api/inventory-sessions/${sessionId}/picking-summary`)
    return response.data
  },

  async deleteCount(sessionId: string, countId: string): Promise<void> {
    await invPlanesApi.delete(`/api/inventory-sessions/${sessionId}/counts/${countId}`)
  },

  /** Elimina varios ingresos en una sola llamada; los que no se pudieron borrar vienen en `skipped` con el motivo. */
  async deleteCounts(sessionId: string, countIds: string[]): Promise<DeleteCountsResultDto> {
    const response = await invPlanesApi.post<DeleteCountsResultDto>(`/api/inventory-sessions/${sessionId}/counts/delete-batch`, { countIds })
    return response.data
  },

  async getSupervisorSummary(sessionId: string): Promise<SupervisorSummaryDto> {
    const response = await invPlanesApi.get<SupervisorSummaryDto>(`/api/inventory-sessions/${sessionId}/supervisor-summary`)
    return response.data
  },

  async closeSession(sessionId: string, note?: string | null): Promise<InventorySessionStatusDto> {
    // Cerrar dispara un sync de stock contra SAP (sp_sync_stock_sap_warehouse/items) que puede
    // tardar más que el timeout default (30s) en bodegas grandes — sin esto, el front corta la
    // conexión, el backend cancela el SP a mitad de camino, y el próximo intento repite todo desde cero.
    const response = await invPlanesApi.post<InventorySessionStatusDto>(
      `/api/inventory-sessions/${sessionId}/close`,
      { note: note ?? null },
      { timeout: 180_000 }
    )
    return response.data
  },

  async getDetailStats(sessionId: string): Promise<SessionDetailStatsDto> {
    const response = await invPlanesApi.get<SessionDetailStatsDto>(`/api/inventory-sessions/${sessionId}/detail-stats`)
    return response.data
  },

  async getDetailLines(sessionId: string, status?: string): Promise<SessionDetailLineDto[]> {
    const params = status ? { status } : undefined
    const response = await invPlanesApi.get<SessionDetailLineDto[]>(`/api/inventory-sessions/${sessionId}/detail-lines`, { params })
    return response.data
  },

  async getScansByUser(sessionId: string): Promise<SessionScansByUserDto> {
    const response = await invPlanesApi.get<SessionScansByUserDto>(`/api/inventory-sessions/${sessionId}/scans-by-user`)
    return response.data
  },

  async syncWarehouseStock(warehouseCode: string): Promise<{ lastSyncAt: string | null }> {
    const response = await invPlanesApi.post<{ lastSyncAt: string | null }>(`/api/stock/sync/${encodeURIComponent(warehouseCode)}`)
    return response.data
  },

  async getWarehouseLastSync(warehouseCode: string): Promise<{ lastSyncAt: string | null }> {
    const response = await invPlanesApi.get<{ lastSyncAt: string | null }>(`/api/stock/last-sync/${encodeURIComponent(warehouseCode)}`)
    return response.data
  },

  async getArticleCounts(sessionId: string): Promise<ArticleCountLineDto[]> {
    const response = await invPlanesApi.get<ArticleCountLineDto[]>(`/api/inventory-sessions/${sessionId}/article-counts`)
    return response.data
  },

  async setManualCount(sessionId: string, itemCode: string, quantity: number): Promise<ArticleCountLineDto> {
    const response = await invPlanesApi.put<ArticleCountLineDto>(`/api/inventory-sessions/${sessionId}/manual-count`, { itemCode, quantity })
    return response.data
  },

  async submitItems(sessionId: string, itemCodes: string[]): Promise<SubmitItemsResultDto> {
    const response = await invPlanesApi.post<SubmitItemsResultDto>(`/api/inventory-sessions/${sessionId}/submit-items`, { itemCodes })
    return response.data
  },

  async getRecountAssignmentProposal(sessionId: string): Promise<RecountAssignmentProposalDto> {
    const response = await invPlanesApi.get<RecountAssignmentProposalDto>(`/api/inventory-sessions/${sessionId}/recount-assignment-proposal`)
    return response.data
  },

  async setRecountAssignments(sessionId: string, assignments: { itemCode: string; userId: string }[]): Promise<void> {
    await invPlanesApi.post(`/api/inventory-sessions/${sessionId}/recount-assignments`, { assignments })
  }
}

export interface ArticleCountLineDto {
  itemCode: string
  barcode: string | null
  itemDescription: string | null
  level2: string | null
  systemQuantity: number
  scannedQuantity: number
  manualQuantity: number
  totalCounted: number
  isSubmitted: boolean
  initialTotalCounted: number
  difference: number
  assignedUserId: string | null
  /** true = ya hay una fila de conteo (scan o manual, cualquier cantidad incl. 0) para la ronda vigente. */
  hasCurrentRoundEntry: boolean
}

export interface RecountAssignmentItemDto {
  itemCode: string
  description: string | null
  barcode: string | null
  level2: string | null
  scannedByUserIds: string[]
  suggestedUserId: string | null
}

export interface RecountAssignmentProposalDto {
  items: RecountAssignmentItemDto[]
  candidateUserIds: string[]
}

export interface SubmitItemsResultDto {
  submitted: number
  balanced: number
  differences: number
  items: SubmitItemLineDto[]
}

export interface SubmitItemLineDto {
  itemCode: string
  systemQuantity: number
  totalCounted: number
  difference: number
  balanceStatus: string
}
