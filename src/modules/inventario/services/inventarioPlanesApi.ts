import { invPlanesApi } from './config/invPlanesAxiosConfig'
import { mapInventarioApiError } from '../utils/apiErrorMapper'
import type {
  CreateInventoryPlanRequest,
  InventoryPlanDto,
  PlanFilterCatalogDto,
  WarehouseSimpleDto
} from '../types'

invPlanesApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = mapInventarioApiError(error, 'No se pudo completar la operación de planes de inventario.')
    return Promise.reject(Object.assign(new Error(message), { cause: error }))
  }
)

export const inventarioPlanesService = {
  async getPlanes(status?: 'Planned' | 'Executed'): Promise<InventoryPlanDto[]> {
    const response = await invPlanesApi.get<InventoryPlanDto[]>('/api/inventory-plans', {
      params: status ? { status } : undefined
    })
    return response.data
  },

  async createPlan(request: CreateInventoryPlanRequest): Promise<InventoryPlanDto> {
    const response = await invPlanesApi.post<InventoryPlanDto>('/api/inventory-plans', request)
    return response.data
  },

  async executePlan(planId: string): Promise<InventoryPlanDto> {
    const response = await invPlanesApi.post<InventoryPlanDto>(`/api/inventory-plans/${planId}/execute`)
    return response.data
  },

  async deletePlan(planId: string): Promise<void> {
    await invPlanesApi.delete(`/api/inventory-plans/${planId}`)
  },

  async getFilterCatalog(): Promise<PlanFilterCatalogDto> {
    const response = await invPlanesApi.get<PlanFilterCatalogDto>('/api/inventory-plans/filter-catalog')
    return response.data
  },

  async getWarehouses(): Promise<WarehouseSimpleDto[]> {
    const response = await invPlanesApi.get<WarehouseSimpleDto[]>('/api/stock/warehouses')
    return response.data
  }
}
