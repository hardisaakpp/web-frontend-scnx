import { inventarioApi, inventoryApiPrefix } from './config/axiosConfig'
import { mapInventarioApiError } from '../utils/apiErrorMapper'
import type {
  ApiResponse,
  CatalogDataDto,
  ExecutePlanningResultDto,
  GeneratedInventoryDto,
  ImportCsvResult,
  InventoryDetailDto,
  InventoryPlanningDetailDto,
  InventoryPlanningSummaryDto,
  SaveInventoryPlanningRequest,
  SavePlanningResultDto,
  UpdateUserSettingsRequest,
  UserEditDataDto,
  UserSettingsDto,
  WarehouseDto
} from '../types'

function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || response.error_code || 'La API de inventario devolvió un error.')
  }
  return response.data as T
}

inventarioApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = mapInventarioApiError(error, 'No se pudo completar la operación de inventario.')
    return Promise.reject(Object.assign(new Error(message), { cause: error }))
  }
)

export { mapInventarioApiError }

export const inventarioService = {
  async getUserEditData(id: number): Promise<UserEditDataDto> {
    const response = await inventarioApi.get<ApiResponse<UserEditDataDto>>(`${inventoryApiPrefix}/user-settings/${id}/edit-data`)
    return unwrap(response.data)
  },

  async updateUserSettings(id: number, payload: UpdateUserSettingsRequest): Promise<UserSettingsDto> {
    const response = await inventarioApi.put<ApiResponse<UserSettingsDto>>(`${inventoryApiPrefix}/user-settings/${id}`, payload)
    return unwrap(response.data)
  },

  async getWarehouses(activeOnly = false, planningOnly = false): Promise<WarehouseDto[]> {
    const response = await inventarioApi.get<ApiResponse<WarehouseDto[]>>(`${inventoryApiPrefix}/warehouses`, {
      params: { activeOnly, planningOnly }
    })
    return unwrap(response.data)
  },

  async getPlanningCatalog(): Promise<CatalogDataDto> {
    const response = await inventarioApi.get<ApiResponse<CatalogDataDto>>(`${inventoryApiPrefix}/warehouses/planning-catalog`)
    return unwrap(response.data)
  },

  async filterSubcategories(categories: string[]): Promise<string[]> {
    const response = await inventarioApi.post<ApiResponse<string[]>>(`${inventoryApiPrefix}/warehouses/subcategories/filter`, {
      categories
    })
    return unwrap(response.data)
  },

  async getPlannings(): Promise<InventoryPlanningSummaryDto[]> {
    const response = await inventarioApi.get<ApiResponse<InventoryPlanningSummaryDto[]>>(`${inventoryApiPrefix}/inventory-plannings`)
    return unwrap(response.data)
  },

  async getPlanning(id: number): Promise<InventoryPlanningDetailDto> {
    const response = await inventarioApi.get<ApiResponse<InventoryPlanningDetailDto>>(`${inventoryApiPrefix}/inventory-plannings/${id}`)
    return unwrap(response.data)
  },

  async savePlanning(payload: SaveInventoryPlanningRequest): Promise<SavePlanningResultDto> {
    const request = payload.id
      ? inventarioApi.put<ApiResponse<SavePlanningResultDto>>(`${inventoryApiPrefix}/inventory-plannings/${payload.id}`, payload)
      : inventarioApi.post<ApiResponse<SavePlanningResultDto>>(`${inventoryApiPrefix}/inventory-plannings`, payload)
    const response = await request
    return unwrap(response.data)
  },

  async importPlannings(file: File): Promise<ImportCsvResult> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await inventarioApi.post<ApiResponse<ImportCsvResult>>(`${inventoryApiPrefix}/inventory-plannings/import`, formData, {
      timeout: 120000
    })
    return unwrap(response.data)
  },

  async deletePlanning(id: number, force = false): Promise<void> {
    const response = await inventarioApi.delete<ApiResponse<{ id: number }>>(`${inventoryApiPrefix}/inventory-plannings/${id}`, {
      params: { force }
    })
    unwrap(response.data)
  },

  async togglePlanningStatus(id: number, status: string): Promise<void> {
    const response = await inventarioApi.patch<ApiResponse<{ id: number; status: string }>>(
      `${inventoryApiPrefix}/inventory-plannings/${id}/status`,
      { status }
    )
    unwrap(response.data)
  },

  async executePlanning(id: number): Promise<ExecutePlanningResultDto> {
    const response = await inventarioApi.post<ApiResponse<ExecutePlanningResultDto>>(
      `${inventoryApiPrefix}/inventory-plannings/${id}/execute`,
      undefined,
      { timeout: 180000 }
    )
    return unwrap(response.data)
  },

  async getInventories(): Promise<GeneratedInventoryDto[]> {
    const response = await inventarioApi.get<ApiResponse<GeneratedInventoryDto[]>>(`${inventoryApiPrefix}/inventories`)
    return unwrap(response.data)
  },

  async getInventoryDetail(id: number): Promise<InventoryDetailDto> {
    const response = await inventarioApi.get<ApiResponse<InventoryDetailDto>>(`${inventoryApiPrefix}/inventories/${id}/detail`)
    return unwrap(response.data)
  }
}
