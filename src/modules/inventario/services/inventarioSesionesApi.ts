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
  MyCountHistorySessionDto
} from '../types'

invPlanesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = mapInventarioApiError(error, 'No se pudo completar la operación de sesiones de inventario.')
    return Promise.reject(Object.assign(new Error(message), { cause: error }))
  }
)

export const inventarioSesionesService = {
  async getSesiones(): Promise<InventorySessionListItemDto[]> {
    const response = await invPlanesApi.get<InventorySessionListItemDto[]>('/api/inventory-sessions')
    return response.data
  },

  async getMisSesiones(): Promise<InventorySessionListItemDto[]> {
    const response = await invPlanesApi.get<InventorySessionListItemDto[]>('/api/inventory-sessions/my')
    return response.data
  },

  async getMiHistorial(): Promise<MyCountHistorySessionDto[]> {
    const response = await invPlanesApi.get<MyCountHistorySessionDto[]>('/api/inventory-sessions/my/history')
    return response.data
  },

  async createSesion(
    warehouseCode: string,
    description?: string | null,
    plannedCloseDate?: string | null,
    filters?: {
      uNv1Values?: string[]
      uNv2Values?: string[]
      uNv3Values?: string[]
      uGenValues?: string[]
      materialValues?: string[]
      packValues?: string[]
      coleccionValues?: string[]
    }
  ): Promise<{ sessionId: string }> {
    const response = await invPlanesApi.post<{ sessionId: string }>('/api/inventory-sessions', {
      warehouseCode,
      description: description ?? null,
      plannedCloseDate: plannedCloseDate ?? null,
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

  async getWarehouses(): Promise<WarehouseSimpleDto[]> {
    const response = await invPlanesApi.get<WarehouseSimpleDto[]>('/api/stock/warehouses')
    return response.data
  },

  async getSessionStatus(sessionId: string): Promise<InventorySessionStatusDto> {
    const response = await invPlanesApi.get<InventorySessionStatusDto>(`/api/inventory-sessions/${sessionId}/status`)
    return response.data
  },

  async addCount(sessionId: string, data: AddInventoryCountRequest): Promise<InventoryCountResultDto> {
    const response = await invPlanesApi.post<InventoryCountResultDto>(`/api/inventory-sessions/${sessionId}/counts`, data)
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

  async getSupervisorSummary(sessionId: string): Promise<SupervisorSummaryDto> {
    const response = await invPlanesApi.get<SupervisorSummaryDto>(`/api/inventory-sessions/${sessionId}/supervisor-summary`)
    return response.data
  },

  async closeSession(sessionId: string, note?: string | null): Promise<InventorySessionStatusDto> {
    const response = await invPlanesApi.post<InventorySessionStatusDto>(`/api/inventory-sessions/${sessionId}/close`, { note: note ?? null })
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
