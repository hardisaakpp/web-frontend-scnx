import { mba3Api } from '../config/axiosConfig'
import { buildUrlWithParams } from '../utils/urlBuilder'
import type { OrdenCompraResponse, OrdenCompraLogResponse } from '../../types'

/**
 * Respuesta de POST /ordenes-compra/{oc_id}/reintentar-st.
 * El backend devuelve `status: success | partial | error` según éxito total/parcial.
 */
export interface ReintentarSTResponse {
  status: 'success' | 'partial' | 'error'
  message: string
  oc_id: string
  reintentadas?: number
  origen_lista_tiendas?: 'detalle' | 'resultado_json' | 'ninguno'
  tiendas_objetivo?: string[]
  tiendas_count?: number
  resultado_st?: {
    success?: boolean
    transferencias_creadas?: number
    transferencias_errores?: number
    total_tiendas?: number
    [key: string]: any
  }
}

/**
 * Servicios para gestión de órdenes de compra
 */
export const ordenesCompraService = {
  /**
   * Obtener órdenes de compra con filtros opcionales
   */
  async getOrdenesCompra(estado?: string, page: number = 1, pageSize: number = 10): Promise<OrdenCompraResponse> {
    const params: Record<string, any> = {
      page: page.toString(),
      pageSize: pageSize.toString()
    }
    
    // Solo agregar el parámetro estado si está definido y no es undefined
    // Si estado es undefined, no se agrega el parámetro, lo que debería devolver todas las órdenes
    if (estado !== undefined && estado !== null && estado !== '') {
      params.estado = estado
    }

    const url = buildUrlWithParams('/ordenes-compra', params)
    const response = await mba3Api.get<OrdenCompraResponse>(url)
    return response.data
  },

  /**
   * Eliminar órdenes de compra (una o múltiples)
   */
  async deleteOrdenesCompra(ocIds: string | string[]): Promise<any> {
    if (Array.isArray(ocIds)) {
      // Para múltiples IDs, enviar como array en el body usando POST con método DELETE
      // O usar parámetros en query string
      const params = new URLSearchParams()
      ocIds.forEach(id => params.append('oc_id', id))
      const queryString = params.toString()
      const response = await mba3Api.delete(`/ordenes-compra?${queryString}`)
      return response.data
    } else {
      // Para un solo ID, enviar en la URL
      const response = await mba3Api.delete(`/ordenes-compra/${ocIds}`)
      return response.data
    }
  },

  /**
   * Descargar el PDF de una orden de compra
   */
  async downloadODCPDF(ocId: string): Promise<Blob> {
    const response = await mba3Api.get(`/ordenes-compra/${ocId}/pdf`, {
      responseType: 'blob',
      timeout: 60000, // 60s para generación de PDF
    })
    return response.data as Blob
  },

  /**
   * Reintenta solo las Solicitudes de Transferencia (ITR) fallidas para una OC ya enviada.
   * No reenvía la ODC. Idempotente: solo procesa tiendas pendientes que aún no tienen ITR creado.
   *
   * - 200 success: todas las tiendas pendientes resueltas (o no había pendientes).
   * - 200 partial: algunas tiendas siguen en error.
   * - 400: la ODC no está en estado ENVIADA o le falta pedido_id.
   * - 409: ya hay otro reintento ST en curso para esta OC.
   */
  async reintentarSolicitudesTransferencia(ocId: string): Promise<ReintentarSTResponse> {
    const response = await mba3Api.post<ReintentarSTResponse>(
      `/ordenes-compra/${ocId}/reintentar-st`,
      {},
      { timeout: 120000 } // hasta 2 min: SAP puede demorar con varios ITR
    )
    return response.data
  },

  /**
   * Obtener logs de órdenes de compra con filtros opcionales
   */
  async getOrdenesCompraLogs(
    page: number = 1, 
    pageSize: number = 10, 
    filters?: { estado?: string; fechaDesde?: string; fechaHasta?: string }
  ): Promise<OrdenCompraLogResponse> {
    try {
      const params: Record<string, any> = {
        page: page.toString(),
        pageSize: pageSize.toString()
      }

      if (filters?.estado) {
        params.estado = filters.estado
      }
      if (filters?.fechaDesde) {
        params.fecha_desde = filters.fechaDesde
      }
      if (filters?.fechaHasta) {
        params.fecha_hasta = filters.fechaHasta
      }

      const url = buildUrlWithParams('/ordenes-compra/logs', params)
      const response = await mba3Api.get<OrdenCompraLogResponse>(url, { timeout: 60000 })
      return response.data
    } catch (error: any) {
      // Si el método GET no está permitido (405), intentar con POST
      if (error.response?.status === 405) {
        console.warn('⚠️ GET no permitido para /ordenes-compra/logs, intentando con POST...')
        try {
          const body: any = {
            page,
            pageSize
          }

          if (filters?.estado) {
            body.estado = filters.estado
          }
          if (filters?.fechaDesde) {
            body.fecha_desde = filters.fechaDesde
          }
          if (filters?.fechaHasta) {
            body.fecha_hasta = filters.fechaHasta
          }

          const response = await mba3Api.post<OrdenCompraLogResponse>('/ordenes-compra/logs', body, { timeout: 60000 })
          return response.data
        } catch (postError: any) {
          // Si POST tampoco funciona, lanzar un error más descriptivo
          throw new Error('El endpoint /ordenes-compra/logs no está disponible. Por favor, verifique la configuración del backend. El endpoint debe aceptar GET o POST.')
        }
      }
      throw error
    }
  },
}
