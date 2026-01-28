/**
 * Servicios de reportes y diferencias
 */

import { mba3Api } from '../config/axiosConfig'
import { createEnrichedError } from '../utils/errorHandler'
import type { ReporteDiferenciasResponse } from '../../types'

export const reportesService = {
  /**
   * Obtener reporte de diferencias para un pedido
   * 
   * Requiere permiso: mba3-consultas.facturas.view
   * 
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param formato Formato del reporte: 'json' (default), 'excel', 'csv'
   * @returns Reporte en formato JSON o Blob según formato solicitado
   */
  async getReporteDiferencias(
    numeroPedido: string,
    formato: 'json' | 'excel' | 'csv' = 'json'
  ): Promise<ReporteDiferenciasResponse | Blob> {
    try {
      const params = new URLSearchParams()
      params.append('formato', formato)

      const response = await mba3Api.get(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/reporte-diferencias?${params.toString()}`,
        formato !== 'json' ? { responseType: 'blob' } : {}
      )

      // Si es formato diferente a JSON, retornar el Blob
      if (formato !== 'json') {
        return response.data as Blob
      }

      return response.data as ReporteDiferenciasResponse
    } catch (error: any) {
      console.error('❌ [getReporteDiferencias] Error al obtener reporte:', error)

      // Si es 404, el pedido no tiene confirmación procesada
      if (error.response?.status === 404) {
        throw new Error('No existe reporte de diferencias para este pedido. Primero debe procesar la confirmación del proveedor.')
      }

      throw createEnrichedError(error, 'Error desconocido al obtener reporte de diferencias')
    }
  },
}
