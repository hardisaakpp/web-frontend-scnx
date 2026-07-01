import { isAxiosError } from 'axios'
import { mba3Api } from '../config/axiosConfig'
import { createEnrichedError } from '../utils/errorHandler'
import type { 
  BuscarSkuMba3Response, 
  SugerenciasSkuResponse, 
  DetallesOCResponse, 
  ActualizarSkuResponse,
  ApiResponse
} from '../../types'

export const busquedaSkuService = {
  /**
   * Buscar SKU en MBA3 por código o descripción
   * 
   * @param sku Código o descripción del SKU a buscar
   * @param buscarPorDescripcion Si es true, busca por descripción; si es false, por código
   * @param limite Número máximo de resultados (default: 20, max: 100)
   * @returns Lista de SKUs encontrados
   */
  async buscarSkuMba3(
    sku: string,
    buscarPorDescripcion: boolean = false,
    limite: number = 20
  ): Promise<BuscarSkuMba3Response> {
    try {
      const response = await mba3Api.get<BuscarSkuMba3Response>('/cruce-productos/buscar-sku/mba3', {
        params: {
          sku,
          buscar_por_descripcion: buscarPorDescripcion,
          limite: Math.min(limite, 100) // Máximo 100 según backend
        },
        timeout: 60000
      })

      return response.data
    } catch (error) {
      // Si el error es 404, significa que no se encontró el SKU
      if (isAxiosError(error) && error.response?.status === 404) {
        return {
          status: 'not_found',
          message: `No se encontraron resultados para: ${sku}`,
          sku: sku,
          data: null
        }
      }

      throw createEnrichedError(error, 'No se pudo realizar la búsqueda en MBA3')
    }
  },

  /**
   * Buscar SKU en SAP
   * 
   * @param sku Código del SKU a buscar en SAP
   * @returns Datos del SKU en SAP
   */
  async buscarSkuSap(sku: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await mba3Api.get<ApiResponse<unknown>>(`/cruce-productos/buscar-sku/sap`, {
        params: { sku },
        timeout: 60000
      })

      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return {
          status: 'not_found',
          data: null
        }
      }

      throw createEnrichedError(error, 'No se pudo buscar el SKU en SAP')
    }
  },

  /**
   * Obtener sugerencias de SKU similares en SAP
   * 
   * Busca SKUs en SAP que sean similares al SKU proporcionado,
   * útil para encontrar alternativas cuando no hay coincidencia exacta.
   * 
   * @param sku SKU de referencia para buscar similares
   * @param limite Número máximo de sugerencias (default: 20, max: 100)
   * @returns Lista de sugerencias ordenadas por similitud
   */
  async buscarSugerenciasSku(sku: string, limite: number = 20): Promise<SugerenciasSkuResponse> {
    try {
      const response = await mba3Api.get<SugerenciasSkuResponse>(`/cruce-productos/buscar-sku/sap/sugerencias`, {
        params: {
          sku,
          limite: Math.min(limite, 100) // Máximo 100 según backend
        },
        timeout: 60000
      })

      return response.data
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        return {
          status: 'not_found',
          sku_referencia: sku,
          message: `No se encontraron SKUs similares para: ${sku}`,
          sugerencias: [],
          total_encontrados: 0
        }
      }

      throw createEnrichedError(error, 'No se pudieron obtener las sugerencias')
    }
  },

  /**
   * Obtener detalles de una ODC (órden de compra)
   * 
   * @param ocId ID de la orden de compra
   * @returns Detalles completos de la ODC
   */
  async obtenerDetallesOC(ocId: string): Promise<DetallesOCResponse> {
    try {
      const response = await mba3Api.get<DetallesOCResponse>(`/ordenes-compra/${ocId}/detalles`)
      return response.data
    } catch (error) {
      throw createEnrichedError(error, 'No se pudieron obtener los detalles de la ODC')
    }
  },

  /**
   * Actualizar SKU en un detalle de ODC
   * 
   * @param ocId ID de la orden de compra
   * @param ocDetalleId ID del detalle a actualizar
   * @param nuevoSku Nuevo código SKU
   * @param validarEnSap Si debe validar que el SKU exista en SAP
   * @returns Resultado de la actualización
   */
  async actualizarSkuDetalle(
    ocId: string,
    ocDetalleId: string,
    nuevoSku: string,
    validarEnSap: boolean = true
  ): Promise<ActualizarSkuResponse> {
    try {
      const response = await mba3Api.put<ActualizarSkuResponse>(
        `/ordenes-compra/${ocId}/detalle/${ocDetalleId}/sku`,
        {
          nuevo_sku: nuevoSku,
          validar_en_sap: validarEnSap
        }
      )
      return response.data
    } catch (error) {
      throw createEnrichedError(error, 'Error al actualizar SKU en la ODC')
    }
  },
}
