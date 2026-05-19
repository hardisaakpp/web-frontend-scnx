/**
 * Servicios de procesamiento de órdenes de compra y SAP
 */

import { mba3Api } from '../config/axiosConfig'
import { calculateIntegrarSapTimeoutMs } from '../../utils/integrarSapTimeout'
import { buildUrlWithParams } from '../utils/urlBuilder'
import type { IntegracionSAPResponse, ProcesamientoSAPResponse } from '../../types'

export const procesamientoService = {
  /**
   * Procesar ODC (todos o específicos)
   * 
   * @param despachoIds ID(s) de despacho a procesar. Si no se proporciona, procesa todos
   * @returns Resultado del procesamiento
   */
  async procesarOC(despachoIds?: string | string[]): Promise<any> {
    const params = new URLSearchParams()

    if (despachoIds) {
      // Si es un array, enviar múltiples IDs
      if (Array.isArray(despachoIds)) {
        // Para múltiples IDs, algunos backends esperan múltiples parámetros con el mismo nombre
        despachoIds.forEach(id => params.append('despacho_id', id))
      } else {
        // Si es un solo ID
        params.append('despacho_id', despachoIds)
      }
    }

    const queryString = params.toString()
    const url = queryString ? `/procesar-oc?${queryString}` : '/procesar-oc'
    const response = await mba3Api.get(url)
    return response.data
  },

  /**
   * Integrar SAP (una o múltiples ODCs)
   * 
   * ⭐ TIMEOUT SINCRONIZADO CON BACKEND
   * Calcula timeout dinámico basado en número de ODCs:
   * - Base: 60s para 1 ODC
   * - +30s por cada ODC adicional
   * - Máximo: 5 minutos
   * 
   * @param referenciaDespacho Referencia(s) de despacho a integrar. Si no se proporciona, integra todas
   * @param almacenDestino Código del almacén destino (ej: RL, OUT, LP)
   * @returns Resultado de la integración con SAP
   */
  async integrarSAP(referenciaDespacho?: string | string[], almacenDestino?: string): Promise<IntegracionSAPResponse> {
    const params = new URLSearchParams()

    if (referenciaDespacho) {
      // Si es un array, enviar múltiples referencias
      if (Array.isArray(referenciaDespacho)) {
        referenciaDespacho.forEach(ref => params.append('referencia_despacho', ref))
      } else {
        // Si es un solo valor
        params.append('referencia_despacho', referenciaDespacho)
      }
    }

    // Agregar almacén destino si se proporciona
    if (almacenDestino) {
      params.append('almacen_destino', almacenDestino)
    }

    const queryString = params.toString()
    const url = queryString ? `/integrar-sap?${queryString}` : '/integrar-sap'

    const finalTimeout = calculateIntegrarSapTimeoutMs(referenciaDespacho)
    const numOrdenes = Array.isArray(referenciaDespacho)
      ? referenciaDespacho.length
      : referenciaDespacho
        ? 1
        : 0

    console.debug(`⏱️ [integrarSAP] Timeout calculado: ${finalTimeout / 1000}s para ${numOrdenes} ODC(s)`)
    
    const response = await mba3Api.post<IntegracionSAPResponse>(url, undefined, {
      timeout: finalTimeout
    })
    
    return response.data
  },

  /**
   * Procesar ODC desde un pedido confirmado
   * 
   * Aplica transformación docenas→unidades SAP automáticamente.
   * 
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @returns Resultado del procesamiento
   */
  async procesarOCDesdePedido(numeroPedido: string): Promise<any> {
    try {
      const response = await mba3Api.post(`/api/pedidos/${encodeURIComponent(numeroPedido)}/procesar-oc`)
      return response.data
    } catch (error: any) {
      console.error('❌ [procesarOCDesdePedido] Error al procesar ODC desde pedido:', error)
      
      let message = error.message || 'Error desconocido al procesar ODC desde pedido'
      
      if (error.response?.data) {
        if (error.response.data.detail) {
          message = error.response.data.detail
        } else if (error.response.data.message) {
          message = error.response.data.message
        }
      }
      
      throw new Error(message)
    }
  },

  /**
   * Obtiene el procesamiento SAP de un pedido confirmado
   * 
   * Requiere permiso: mba3-consultas.facturas.view
   * 
   * @param pedidoId ID del pedido o número de pedido (ej: "P-12.48 - 12 - 2025")
   * @returns Información completa del procesamiento SAP incluyendo productos y estadísticas
   */
  async getProcesamientoSAP(pedidoId: string): Promise<ProcesamientoSAPResponse> {
    try {
      const response = await mba3Api.get<ProcesamientoSAPResponse>(
        `/api/pedidos/${encodeURIComponent(pedidoId)}/procesamiento-sap`
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [getProcesamientoSAP] Error al obtener procesamiento SAP:', error)

      // Si es 404, el pedido no tiene procesamiento SAP aún
      if (error.response?.status === 404) {
        throw new Error('El pedido aún no ha sido procesado en SAP')
      }

      let message = error.message || 'Error desconocido al obtener procesamiento SAP'
      
      if (error.response?.data) {
        if (error.response.data.detail) {
          message = error.response.data.detail
        } else if (error.response.data.message) {
          message = error.response.data.message
        }
      }
      
      throw new Error(message)
    }
  },
}
