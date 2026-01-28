import { mba3Api } from '../config/axiosConfig'
import type { HealthResponse } from '../../types'

/**
 * Servicios de health check y consulta básica
 */
export const healthService = {
  /**
   * Health check del servicio MBA3
   */
  async healthCheck(): Promise<HealthResponse> {
    const response = await mba3Api.get<HealthResponse>('/health')
    return response.data
  },

  /**
   * Consultar (solo lectura)
   */
  async consultar(): Promise<any> {
    const response = await mba3Api.get('/consultar')
    return response.data
  },
}
