import { mba3Api } from '../config/axiosConfig'
import type { Despacho, DespachoDetalle } from '../../types'

/**
 * Servicios para gestión de despachos
 */
export const despachosService = {
  /**
   * Obtener conteo de despachos
   */
  async getDespachosCount(): Promise<{ count: number; disponible: boolean }> {
    const response = await mba3Api.get<{ count: number; disponible: boolean }>('/despachos/count')
    return response.data
  },

  /**
   * Obtener lista de despachos (prefacturas guardadas en BD)
   * Usa el endpoint /despachos/count modificado que ahora devuelve la lista + conteo
   */
  async getDespachos(page: number = 1, pageSize: number = 10): Promise<{ 
    status: string
    data: Despacho[]
    metadata: { count: number; filters: {} }
    total: number
    page: number
    pageSize: number 
  }> {
    try {
      const response = await mba3Api.get<any>('/despachos/count')

      // Intentar obtener los datos de diferentes formas posibles
      let despachosData: Despacho[] = []

      if (Array.isArray(response.data)) {
        despachosData = response.data
      } else if (response.data.data && Array.isArray(response.data.data)) {
        despachosData = response.data.data
      } else if (response.data.despachos && Array.isArray(response.data.despachos)) {
        despachosData = response.data.despachos
      } else if (response.data.resultado && Array.isArray(response.data.resultado)) {
        despachosData = response.data.resultado
      } else if (response.data.despatches && Array.isArray(response.data.despatches)) {
        despachosData = response.data.despatches
      }

      const count = response.data.count || despachosData.length || 0

      return {
        status: 'success',
        data: despachosData,
        metadata: {
          count: count,
          filters: {},
        },
        total: count,
        page: page,
        pageSize: pageSize,
      }
    } catch (error: any) {
      console.error('❌ [getDespachos] Error al obtener despachos:', error)
      throw new Error(`No se pudo obtener los despachos desde el backend. Error: ${error.message}`)
    }
  },

  /**
   * Obtener detalles de un despacho específico
   */
  async getDespachoDetalles(despachoId: string): Promise<DespachoDetalle[]> {
    try {
      const response = await mba3Api.get<any>(`/despachos/${despachoId}/detalles`)

      // El endpoint podría devolver los detalles de diferentes formas
      let detalles: DespachoDetalle[] = []

      if (Array.isArray(response.data)) {
        detalles = response.data
      } else if (response.data.data && Array.isArray(response.data.data)) {
        detalles = response.data.data
      } else if (response.data.detalles && Array.isArray(response.data.detalles)) {
        detalles = response.data.detalles
      } else if (response.data.items && Array.isArray(response.data.items)) {
        detalles = response.data.items
      }

      return detalles
    } catch (error: any) {
      console.error('❌ [getDespachoDetalles] Error:', error)
      throw new Error(`No se pudieron obtener los detalles del despacho. Error: ${error.message}`)
    }
  },
}
