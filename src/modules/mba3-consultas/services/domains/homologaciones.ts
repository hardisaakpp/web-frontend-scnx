/**
 * Servicios de homologaciones de SKU
 */

import { mba3Api } from '../config/axiosConfig'
import { buildUrlWithParams } from '../utils/urlBuilder'
import { createEnrichedError } from '../utils/errorHandler'
import type { 
  SkuHomologacionResponse, 
  SkuHomologacionUpdateRequest, 
  SkuHomologacionCreateRequest,
  SkuHomologacion,
  ApiResponse
} from '../../types'

export const homologacionesService = {
  /**
   * Obtener homologaciones de SKU con filtros
   * 
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param filters Filtros opcionales
   * @returns Lista paginada de homologaciones
   */
  async getSkuHomologaciones(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
      estado?: string
      tiene_diferencias?: boolean
      tiene_datos_sap?: boolean
      sku?: string
    }
  ): Promise<SkuHomologacionResponse> {
    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        pageSize,
        ...filters
      }

      const url = buildUrlWithParams('/api/homologaciones-sku', params)
      const response = await mba3Api.get<SkuHomologacionResponse>(url)
      return response.data
    } catch (error) {
      throw createEnrichedError(error, 'No se pudieron obtener las homologaciones de SKU')
    }
  },

  /**
   * Actualizar una homologación de SKU
   * 
   * @param homologacionId ID de la homologación
   * @param updateData Datos a actualizar
   * @returns Homologación actualizada
   */
  async updateSkuHomologacion(
    homologacionId: string,
    updateData: SkuHomologacionUpdateRequest
  ): Promise<ApiResponse<SkuHomologacion>> {
    try {
      const response = await mba3Api.put<ApiResponse<SkuHomologacion>>(`/api/homologaciones-sku/${homologacionId}`, updateData)
      return response.data
    } catch (error) {
      throw createEnrichedError(error, 'No se pudo actualizar la homologación')
    }
  },

  /**
   * Crear o actualizar múltiples homologaciones en batch
   * 
   * @param updates Array de actualizaciones
   * @returns Resultado del batch update
   */
  async bulkUpdateSkuHomologaciones(
    updates: Array<{ homologacion_id: string; data: SkuHomologacionUpdateRequest }>
  ): Promise<ApiResponse<unknown>> {
    try {
      const response = await mba3Api.post<ApiResponse<unknown>>('/api/homologaciones-sku/bulk-update', { updates })
      return response.data
    } catch (error) {
      throw createEnrichedError(error, 'No se pudieron actualizar las homologaciones')
    }
  },

  /**
   * Sincronizar homologaciones desde despachos
   * 
   * Detecta SKUs no coincidentes entre MBA3 y SAP.
   * 
   * @returns Resultado de la sincronización
   */
  async sincronizarHomologaciones(): Promise<ApiResponse<unknown>> {
    try {
      const response = await mba3Api.post<ApiResponse<unknown>>('/api/homologaciones-sku/sincronizar')
      return response.data
    } catch (error) {
      throw createEnrichedError(error, 'No se pudieron sincronizar las homologaciones')
    }
  },

  /**
   * Crear una nueva homologación manualmente
   * 
   * @param createData Datos de la nueva homologación
   * @returns Homologación creada
   */
  async createSkuHomologacion(
    createData: SkuHomologacionCreateRequest
  ): Promise<ApiResponse<SkuHomologacion>> {
    try {
      const response = await mba3Api.post<ApiResponse<SkuHomologacion>>('/api/homologaciones-sku', createData)
      return response.data
    } catch (error) {
      throw createEnrichedError(error, 'No se pudo crear la homologación')
    }
  },
}
