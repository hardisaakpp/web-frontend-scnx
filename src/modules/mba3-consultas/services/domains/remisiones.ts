import { mba3Api } from '../config/axiosConfig'
import { buildUrlWithParams } from '../utils/urlBuilder'
import type { RemisionResponse } from '../../types'

/**
 * Servicios para gestión de remisiones
 */
export const remisionesService = {
  /**
   * Obtener lista de remisiones con paginación
   */
  async getRemisiones(page: number = 1, pageSize: number = 10): Promise<RemisionResponse> {
    try {
      const url = buildUrlWithParams('/remisiones', { 
        page: page.toString(), 
        pageSize: pageSize.toString() 
      })
      const response = await mba3Api.get<RemisionResponse>(url)
      return response.data
    } catch (error: any) {
      console.error('❌ [getRemisiones] Error al obtener remisiones:', error)
      // Preservar el error original (AxiosError) para que la vista pueda distinguir 4xx/5xx
      throw error
    }
  },

  /**
   * Consultar remisiones desde MBA3
   */
  async consultarRemisionesDesdeMBA3(): Promise<any> {
    try {
      const response = await mba3Api.get('/remisiones/consultar')
      return response.data
    } catch (error: any) {
      console.error('❌ [consultarRemisionesDesdeMBA3] Error al consultar remisiones desde MBA3:', error)
      // Preservar el error original (AxiosError) para que la vista pueda distinguir 4xx/5xx
      throw error
    }
  },
}
