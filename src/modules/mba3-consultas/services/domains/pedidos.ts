/**
 * Servicios de gestión de pedidos y plantillas
 * 
 * Este es el dominio más complejo, incluye:
 * - Upload y validación de plantillas Excel
 * - CRUD de pedidos
 * - Exportación en múltiples formatos
 * - Modificaciones de detalles (costo, total, comentario)
 * - Redistribución y ajustes de bodegas
 * - Gestión de cabecera y modificaciones de columnas
 */

import { mba3Api } from '../config/axiosConfig'
import { validateFile } from '../utils/fileValidator'
import { createEnrichedError, normalizeValidationResponse } from '../utils/errorHandler'
import { buildUrlWithParams } from '../utils/urlBuilder'
import type {
  UploadPlantillaResponse,
  PedidoCompleto,
  CrearPedidoRequest,
  CrearPedidoResponse,
  ActualizarCostoPedidoResponse,
  ModificarPedidoCabeceraRequest,
  ModificarPedidoCabeceraResponse,
  AjusteDetalle,
  ResumenConfirmacion,
  GuardarModificacionesColumnasRequest,
  GuardarModificacionesColumnasResponse,
  ObtenerModificacionesColumnasResponse,
  PedidosListadoResponse,
  TienePedidosResponse,
  CrearOCDesdePedidoResponse,
  DistribucionPedidoResponse,
  InfoArchivoPlantillaResponse,
  BuscarPlantillasResponse,
  PlantillasPedidosResponse,
  ListadoArchivosOriginalesResponse,
  EliminarArchivoOriginalResponse,
  ProcesoCompletoSAPResponse
} from '../../types'

export const pedidosService = {
  /**
   * Sube y procesa un archivo Excel de plantilla
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param file Archivo Excel con la plantilla
   * @returns Resultado de la validación y procesamiento
   */
  async uploadPlantilla(file: File): Promise<UploadPlantillaResponse> {
    try {
      validateFile(file)

      const formData = new FormData()
      formData.append('file', file)

      const response = await mba3Api.post<UploadPlantillaResponse>(
        '/api/plantillas/upload',
        formData,
        { timeout: 120000 } // 2 minutos - sincronizado con backend (login MBA3, validación SAP, etc.)
      )

      return normalizeValidationResponse(response.data)
    } catch (error: any) {
      console.error('❌ [uploadPlantilla] Error al subir plantilla:', error)
      console.error('❌ [uploadPlantilla] Response data:', error.response?.data)

      // Si el backend retorna 400 con validación, devolverlo como resultado manejable
      if (error.response?.status === 400 && error.response?.data?.status === 'validation_error') {
        const data = normalizeValidationResponse(error.response.data)
        if (!data.message && data.detail) {
          data.message = data.detail
        }
        return data as UploadPlantillaResponse
      }

      throw createEnrichedError(error, 'Error desconocido al subir plantilla')
    }
  },

  /**
   * Sube una plantilla Excel con correcciones de códigos aplicadas
   * 
   * Acepta un mapa de correcciones {codigo_original: codigo_sap_corregido}
   * 
   * @param file Archivo Excel
   * @param correcciones Mapa de correcciones de códigos
   * @returns Resultado de la validación y procesamiento
   */
  async uploadPlantillaConCorrecciones(
    file: File,
    correcciones: Record<string, string>
  ): Promise<UploadPlantillaResponse> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('correcciones_codigos', JSON.stringify(correcciones))
      
      const response = await mba3Api.post<UploadPlantillaResponse>('/api/plantillas/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 2 minutos
      })

      return normalizeValidationResponse(response.data)
    } catch (error: any) {
      console.error('❌ [uploadPlantillaConCorrecciones] Error:', error)
      
      if (error.response?.status === 400 && error.response?.data?.status === 'validation_error') {
        const data = normalizeValidationResponse(error.response.data)
        if (!data.message && data.detail) {
          data.message = data.detail
        }
        return data as UploadPlantillaResponse
      }

      throw createEnrichedError(error, 'Error desconocido al subir plantilla con correcciones')
    }
  },

  /**
   * Crea un pedido manualmente (sin Excel)
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param pedidoData Datos del pedido a crear
   * @returns Resultado de la creación
   */
  async crearPedidoManual(pedidoData: CrearPedidoRequest): Promise<CrearPedidoResponse> {
    try {
      const response = await mba3Api.post<CrearPedidoResponse>(
        '/api/pedidos',
        pedidoData
      )

      return normalizeValidationResponse(response.data)
    } catch (error: any) {
      console.error('❌ [crearPedidoManual] Error al crear pedido:', error)
      console.error('❌ [crearPedidoManual] Response data:', error.response?.data)

      if (error.response?.status === 400 && error.response?.data?.status === 'validation_error') {
        const data = normalizeValidationResponse(error.response.data)
        if (!data.message && data.detail) {
          data.message = data.detail
        }
        return data as CrearPedidoResponse
      }

      throw createEnrichedError(error, 'Error desconocido al crear pedido')
    }
  },

  /**
   * Obtiene un pedido completo por número
   * 
   * Requiere permiso: mba3-consultas.facturas.view
   * 
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param incluirRespuesta Si debe incluir respuesta_proveedor
   * @returns Pedido completo con cabecera y detalles
   */
  async getPedido(numeroPedido: string, incluirRespuesta: boolean = false): Promise<PedidoCompleto> {
    try {
      const params = incluirRespuesta ? '?incluir_respuesta=true' : ''
      const response = await mba3Api.get<PedidoCompleto>(`/api/plantillas/${numeroPedido}${params}`)
      return response.data
    } catch (error: any) {
      console.error('❌ [getPedido] Error al obtener pedido:', error)
      throw createEnrichedError(error, 'Error desconocido al obtener pedido')
    }
  },

  /**
   * Obtiene el último pedido del usuario
   * 
   * Requiere permiso: mba3-consultas.facturas.view
   * 
   * @param incluirRespuesta Si debe incluir respuesta_proveedor
   * @returns Pedido completo o null si no hay pedidos
   */
  async getUltimoPedido(incluirRespuesta: boolean = false): Promise<PedidoCompleto | null> {
    try {
      const params = incluirRespuesta ? '?incluir_respuesta=true' : ''
      const response = await mba3Api.get<PedidoCompleto | null>(`/api/plantillas/ultimo${params}`)
      
      if (!response.data || !response.data.cabecera) {
        return null
      }
      
      return response.data
    } catch (error: any) {
      console.error('❌ [getUltimoPedido] Error al obtener último pedido:', error)
      throw createEnrichedError(error, 'Error desconocido al obtener último pedido')
    }
  },

  /**
   * Busca plantillas/pedidos por número de pedido (búsqueda parcial)
   * 
   * Este endpoint está diseñado para el campo de búsqueda de "Cargar Plantilla":
   * - Realiza búsqueda parcial (ej: "P-12" encuentra "P-12.08 - 12 - 2025")
   * - Incluye pedidos en estado BORRADOR
   * - Filtra por el usuario actual
   * - No requiere otros campos de filtro
   * 
   * Requiere permiso: mba3-consultas.facturas.view
   * 
   * @param numeroPedido Texto de búsqueda (parcial o completo)
   * @returns Lista de pedidos que coinciden con la búsqueda
   */
  async buscarPlantillas(numeroPedido: string): Promise<BuscarPlantillasResponse> {
    try {
      const response = await mba3Api.get<BuscarPlantillasResponse>(
        `/api/plantillas/buscar`,
        {
          params: { numero_pedido: numeroPedido },
          timeout: 10000 // 10 segundos para búsqueda rápida
        }
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [buscarPlantillas] Error al buscar plantillas:', error)
      
      // Si no hay resultados, devolver respuesta vacía
      if (error.response?.status === 404) {
        return {
          status: 'success',
          data: [],
          total: 0,
          query: numeroPedido
        }
      }
      
      throw createEnrichedError(error, 'Error desconocido al buscar plantillas')
    }
  },

  /**
   * Obtiene la lista de pedidos para la página "Cargar Plantilla"
   * 
   * A diferencia de getPedidosListado (que usa GET /api/pedidos):
   * - INCLUYE pedidos en estado BORRADOR
   * - Filtra automáticamente por el usuario actual
   * - Diseñado específicamente para la interfaz de "Cargar Plantilla"
   * 
   * GET /api/plantillas/pedidos
   * 
   * Requiere permiso: mba3-consultas.facturas.view
   * 
   * @param filtros Filtros opcionales (estado, numero_pedido, limit, offset)
   * @returns Lista de pedidos con metadata de paginación
   */
  async getPlantillasPedidos(filtros?: {
    estado?: string
    numero_pedido?: string
    limit?: number
    offset?: number
  }): Promise<PlantillasPedidosResponse> {
    try {
      const url = buildUrlWithParams('/api/plantillas/pedidos', filtros || {})
      const response = await mba3Api.get<PlantillasPedidosResponse>(url)
      return response.data
    } catch (error: any) {
      console.error('❌ [getPlantillasPedidos] Error:', error)
      throw createEnrichedError(error, 'Error al obtener pedidos de plantillas')
    }
  },

  /**
   * Exporta pedido en Excel para enviar al proveedor
   * 
   * Requiere permiso: mba3-consultas.facturas.view
   * 
   * @param numeroPedido Número de pedido
   * @returns Blob del archivo Excel
   */
  async exportarPedidoParaProveedor(numeroPedido: string): Promise<Blob> {
    try {
      const response = await mba3Api.get<Blob>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/exportar-para-proveedor`,
        { responseType: 'blob' }
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [exportarPedidoParaProveedor] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al exportar pedido')
    }
  },

  /**
   * Exporta pedido en formato plano (CSV/TXT) para MBA
   * 
   * HU-08: Permite descargar pedido en archivo plano
   * Requiere permiso: mba3-consultas.facturas.view
   * 
   * @param numeroPedido Número de pedido
   * @param formato 'csv' o 'txt'
   * @returns Blob del archivo plano
   */
  async exportarPedidoPlanoMba(numeroPedido: string, formato: 'csv' | 'txt' = 'csv'): Promise<Blob> {
    try {
      const response = await mba3Api.get<Blob>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/exportar-plano-mba?formato=${formato}`,
        { responseType: 'blob' }
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [exportarPedidoPlanoMba] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al exportar pedido plano')
    }
  },

  /**
   * Crea orden de compra desde un pedido confirmado
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param numeroPedido Número de pedido
   * @returns Información de la OC creada y Solicitudes de Transferencia
   */
  async crearOrdenCompraDesdePedido(numeroPedido: string): Promise<CrearOCDesdePedidoResponse> {
    try {
      const response = await mba3Api.post<CrearOCDesdePedidoResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/crear-orden-compra`
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [crearOrdenCompraDesdePedido] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al crear orden de compra')
    }
  },

  /**
   * Actualiza el costo unitario de un detalle
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param numeroPedido Número de pedido
   * @param pedidoDetalleId ID del detalle
   * @param nuevoCosto Nuevo costo unitario sin IVA
   * @returns Resultado de la actualización
   */
  async actualizarCostoPedido(
    numeroPedido: string,
    pedidoDetalleId: string,
    nuevoCosto: number
  ): Promise<ActualizarCostoPedidoResponse> {
    try {
      const payload = { costo_doc_sin_iva: nuevoCosto }

      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) console.log('📤 [actualizarCostoPedido] Enviando:', {
          url: `/api/pedidos/${encodeURIComponent(numeroPedido)}/detalle/${pedidoDetalleId}/costo`,
          payload
        })
      }

      const response = await mba3Api.patch<ActualizarCostoPedidoResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/detalle/${pedidoDetalleId}/costo`,
        payload
      )

      if (import.meta.env.DEV) {
        if (import.meta.env.DEV) console.log('✅ [actualizarCostoPedido] Respuesta exitosa:', response.data)
      }
      return response.data
    } catch (error: any) {
      console.error('❌ [actualizarCostoPedido] Error:', error)

      let message = error.message || 'Error desconocido al actualizar costo'
      let detailedError = ''

      if (error.response?.data?.errors) {
        console.error('❌ [actualizarCostoPedido] Errores de validación:', error.response.data.errors)
        detailedError = error.response.data.errors
          .map((e: any) => typeof e === 'string' ? e : e.msg || e.message || JSON.stringify(e))
          .join('; ')
      }

      if (error.response?.data?.detail) {
        message = error.response.data.detail
      } else if (error.response?.data?.message) {
        message = error.response.data.message
      }

      const finalMessage = detailedError ? `${message}. Detalles: ${detailedError}` : message
      console.error('❌ [actualizarCostoPedido] Mensaje final:', finalMessage)

      throw new Error(finalMessage)
    }
  },

  /**
   * Actualiza el total de un detalle
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param numeroPedido Número de pedido
   * @param pedidoDetalleId ID del detalle
   * @param nuevoTotal Nuevo total
   * @returns Resultado de la actualización
   */
  async actualizarTotalPedido(
    numeroPedido: string,
    pedidoDetalleId: string,
    nuevoTotal: number
  ): Promise<ActualizarCostoPedidoResponse> {
    try {
      const payload = { total: nuevoTotal }
      const response = await mba3Api.patch<ActualizarCostoPedidoResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/detalle/${pedidoDetalleId}/total`,
        payload
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [actualizarTotalPedido] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al actualizar total')
    }
  },

  /**
   * Actualiza el comentario de un detalle
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param numeroPedido Número de pedido
   * @param pedidoDetalleId ID del detalle
   * @param nuevoComentario Nuevo comentario (puede ser null)
   * @returns Resultado de la actualización
   */
  async actualizarComentarioPedido(
    numeroPedido: string,
    pedidoDetalleId: string,
    nuevoComentario: string | null
  ): Promise<ActualizarCostoPedidoResponse> {
    try {
      const payload = { comentario: nuevoComentario }
      const response = await mba3Api.patch<ActualizarCostoPedidoResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/detalle/${pedidoDetalleId}/comentario`,
        payload
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [actualizarComentarioPedido] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al actualizar comentario')
    }
  },

  /**
   * Actualiza la cabecera de un pedido
   * 
   * HU-06: Modificar estado y fechas
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param pedidoId ID del pedido (UUID)
   * @param datosCabecera Datos a modificar
   * @returns Resultado de la actualización
   */
  async actualizarCabeceraPedido(
    pedidoId: string,
    datosCabecera: ModificarPedidoCabeceraRequest
  ): Promise<ModificarPedidoCabeceraResponse> {
    try {
      const response = await mba3Api.put<ModificarPedidoCabeceraResponse>(
        `/api/pedidos/${pedidoId}`,
        datosCabecera
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [actualizarCabeceraPedido] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al actualizar cabecera')
    }
  },

  /**
   * Descarta (elimina) un pedido desde la interfaz Cargar Plantilla.
   * DELETE /api/pedidos/{pedido_id} (sin notificar_el_rayo → no envía correo).
   * Respuestas: 204 éxito; 400/404/409 con detail.message o detail.error.
   *
   * @param pedidoId ID del pedido (UUID)
   */
  async descartarPedido(pedidoId: string): Promise<void> {
    try {
      await mba3Api.delete(`/api/pedidos/${encodeURIComponent(pedidoId)}`)
    } catch (error: any) {
      console.error('❌ [descartarPedido] Error:', error)
      throw createEnrichedError(error, 'Error al descartar pedido')
    }
  },

  /**
   * Elimina un pedido desde la interfaz Detalle del Pedido (botón "Eliminar Pedido").
   * DELETE /api/pedidos/{pedido_id}/eliminar
   * Solo válido en estado GESTIONAR PEDIDO (3). No envía email a EL RAYO.
   * Respuestas: 204 éxito; 400/404/409 con detail.message o detail.error.
   *
   * @param pedidoId ID del pedido (UUID)
   */
  async eliminarPedido(pedidoId: string): Promise<void> {
    try {
      await mba3Api.delete(`/api/pedidos/${encodeURIComponent(pedidoId)}/eliminar`)
    } catch (error: any) {
      console.error('❌ [eliminarPedido] Error:', error)
      throw createEnrichedError(error, 'Error al eliminar pedido')
    }
  },

  /**
   * Descarga un pedido en formato CSV (compatible con Excel)
   * GET /api/pedidos/{pedido_id}/descargar-csv
   * Solo válido en estado CONFIRMADO (4).
   * Respuestas: 200 con archivo CSV; 400/404 con detail.message.
   *
   * @param pedidoId ID del pedido (UUID)
   * @returns Blob del archivo CSV
   */
  async descargarPedidoCsv(pedidoId: string): Promise<Blob> {
    try {
      const response = await mba3Api.get<Blob>(
        `/api/pedidos/${encodeURIComponent(pedidoId)}/descargar-csv`,
        { responseType: 'blob' }
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [descargarPedidoCsv] Error:', error)
      throw createEnrichedError(error, 'Error al descargar CSV del pedido')
    }
  },

  /**
   * Descarga la distribución por tiendas en formato Excel
   * GET /api/pedidos/{pedido_id}/distribucion/descargar-excel
   * Genera archivo Excel con distribución confirmada (3 hojas).
   * Respuestas: 200 con archivo Excel; 404 con detail.message.
   *
   * @param pedidoId ID del pedido (UUID)
   * @param version Versión específica (opcional, por defecto última)
   * @returns Blob del archivo Excel
   */
  async descargarDistribucionExcel(pedidoId: string, version?: number): Promise<Blob> {
    try {
      const params = version != null ? `?version=${version}` : ''
      const response = await mba3Api.get<Blob>(
        `/api/pedidos/${encodeURIComponent(pedidoId)}/distribucion/descargar-excel${params}`,
        { responseType: 'blob' }
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [descargarDistribucionExcel] Error:', error)
      throw createEnrichedError(error, 'Error al descargar distribución Excel')
    }
  },

  /**
   * Cancela un pedido cambiando su estado a CANCELADO (estado_id = 19) y notifica a EL RAYO por correo.
   * El pedido NO se elimina, solo cambia de estado.
   * POST /api/pedidos/{pedido_id}/cancelar
   *
   * @param pedidoId ID del pedido (UUID)
   * @returns El pedido actualizado con estado CANCELADO
   */
  async cancelarPedido(pedidoId: string): Promise<PedidoCompleto> {
    try {
      const response = await mba3Api.post<PedidoCompleto>(
        `/api/pedidos/${encodeURIComponent(pedidoId)}/cancelar`
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [cancelarPedido] Error:', error)
      throw createEnrichedError(error, 'Error al cancelar pedido')
    }
  },

  /**
   * Envía un pedido en BORRADOR a EL RAYO.
   * POST /api/pedidos/{pedido_id}/enviar (sin body; usuario del JWT).
   * Respuesta 200: { status, message, pedido_id, numero_pedido, estado_id, estado_nombre }.
   * Errores 400/404: detail.error y detail.message.
   *
   * @param pedidoId ID del pedido (UUID)
   */
  async enviarPedido(pedidoId: string): Promise<{
    status: 'success'
    message: string
    pedido_id: string
    numero_pedido: string
    estado_id: number
    estado_nombre: string
  }> {
    try {
      const response = await mba3Api.post<{
        status: 'success'
        message: string
        pedido_id: string
        numero_pedido: string
        estado_id: number
        estado_nombre: string
      }>(`/api/pedidos/${encodeURIComponent(pedidoId)}/enviar`, {})
      return response.data
    } catch (error: any) {
      console.error('❌ [enviarPedido] Error:', error)
      throw createEnrichedError(error, 'Error al enviar pedido')
    }
  },

  /**
   * Marca el pedido como "GESTIONAR PEDIDO" (estado_id 16) cuando el usuario hace clic en "Ver Detalle".
   * POST /api/pedidos/{pedido_id}/gestionar (sin body).
   * Si el pedido está en NUEVO_PEDIDO (2) pasa a GESTIONAR_PEDIDO (16); si no existe → 404.
   * Respuesta 200: pedido completo para usar en detalle.
   *
   * @param pedidoId ID del pedido (UUID)
   */
  async gestionarPedido(pedidoId: string): Promise<PedidoCompleto> {
    try {
      const response = await mba3Api.post<PedidoCompleto>(
        `/api/pedidos/${encodeURIComponent(pedidoId)}/gestionar`,
        {}
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [gestionarPedido] Error:', error)
      throw createEnrichedError(error, 'Error al abrir detalle del pedido')
    }
  },

  /**
   * Pasa el pedido de GESTIONAR PEDIDO a REDISTRIBUCION.
   * POST /api/pedidos/{pedido_id}/confirmar-para-redistribucion (sin body).
   * Solo válido cuando estado es GESTIONAR PEDIDO. Respuesta 200: pedido completo actualizado.
   *
   * @param pedidoId ID del pedido (UUID)
   */
  async confirmarParaRedistribucion(pedidoId: string): Promise<PedidoCompleto> {
    try {
      const response = await mba3Api.post<PedidoCompleto>(
        `/api/pedidos/${encodeURIComponent(pedidoId)}/confirmar-para-redistribucion`,
        {}
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [confirmarParaRedistribucion] Error:', error)
      throw createEnrichedError(error, 'Error al confirmar pedido para redistribución')
    }
  },

  /**
   * Marca el pedido como "Despachar y Facturar" (estado_id 17).
   * POST /api/pedidos/{pedido_id}/marcar-despachar-y-facturar (sin body).
   * Solo válido cuando estado es CONFIRMADO_ENVIADO (estado_id 12). 400 si estado_no_confirmado_enviado.
   *
   * @param pedidoId ID del pedido (UUID)
   * @returns Pedido completo actualizado (cabecera con estado DESPACHAR Y FACTURAR)
   */
  async marcarDespacharYFacturar(pedidoId: string): Promise<PedidoCompleto> {
    try {
      const response = await mba3Api.post<PedidoCompleto>(
        `/api/pedidos/${encodeURIComponent(pedidoId)}/marcar-despachar-y-facturar`,
        {}
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [marcarDespacharYFacturar] Error:', error)
      throw createEnrichedError(error, 'Error al marcar Despachar y Facturar')
    }
  },

  /**
   * Marca el pedido como "Finalizado" (estado_id 18).
   * POST /api/pedidos/{pedido_id}/marcar-finalizado (sin body).
   * Solo válido cuando estado es Despachar y Facturar (estado_id 17). 400 con error "estado_no_despachar_y_facturar" si no.
   *
   * @param pedidoId ID del pedido (UUID)
   * @returns Pedido completo actualizado (cabecera con estado FINALIZADO)
   */
  async marcarFinalizado(pedidoId: string): Promise<PedidoCompleto> {
    try {
      const response = await mba3Api.post<PedidoCompleto>(
        `/api/pedidos/${encodeURIComponent(pedidoId)}/marcar-finalizado`,
        {}
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [marcarFinalizado] Error:', error)
      throw createEnrichedError(error, 'Error al marcar Finalizado')
    }
  },

  /**
   * Confirma la redistribución de un pedido
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param numeroPedido Número de pedido
   * @param ajustesDetalle Array de ajustes de redistribución
   * @returns Resultado de la confirmación
   */
  async confirmarRedistribucion(
    numeroPedido: string,
    ajustesDetalle: AjusteDetalle[]
  ): Promise<{
    status: 'success'
    message: string
    pedido_id: string
    redistribucion_id: string
    fecha_confirmacion: string
    resumen: ResumenConfirmacion
    ajustes_aplicados: number
  }> {
    try {
      const response = await mba3Api.post(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/redistribucion/confirmar`,
        { ajustes_detalle: ajustesDetalle }
      )
      return response.data as {
        status: 'success'
        message: string
        pedido_id: string
        redistribucion_id: string
        fecha_confirmacion: string
        resumen: ResumenConfirmacion
        ajustes_aplicados: number
      }
    } catch (error: any) {
      console.error('❌ [confirmarRedistribucion] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al confirmar redistribución')
    }
  },

  /**
   * Ejecuta el proceso completo: Redistribución + Generar ODC + Enviar a SAP
   * 
   * Este endpoint ejecuta los 3 pasos en secuencia:
   * 1. Confirmar Redistribución
   * 2. Generar ODC desde el pedido
   * 3. Enviar ODC a SAP Service Layer
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param ajustesDetalle Array de ajustes de redistribución
   * @returns Resultado del proceso completo con detalles de cada paso
   */
  async procesoCompletoSAP(
    numeroPedido: string,
    ajustesDetalle: AjusteDetalle[]
  ): Promise<ProcesoCompletoSAPResponse> {
    try {
      const response = await mba3Api.post<ProcesoCompletoSAPResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/proceso-completo-sap`,
        { ajustes_detalle: ajustesDetalle },
        { timeout: 180000 } // 3 minutos - proceso largo que incluye llamada a SAP
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [procesoCompletoSAP] Error:', error)
      
      // Si hay respuesta parcial, devolverla
      if (error.response?.data?.status === 'partial') {
        return error.response.data as ProcesoCompletoSAPResponse
      }
      
      throw createEnrichedError(error, 'Error al ejecutar proceso completo SAP')
    }
  },

  /**
   * Obtiene datos iniciales para la pantalla de redistribución.
   * GET /api/pedidos/{numero_pedido}/redistribucion/inicial.
   * Con solo_lectura=1 devuelve la última redistribución confirmada (formato BorradorResponse).
   *
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param soloLectura Si true, añade ?solo_lectura=1 para obtener la última confirmada en solo lectura
   * @returns ajustes_detalle (formato AjusteDetalle[]) para rellenar la vista
   */
  async getRedistribucionInicial(
    numeroPedido: string,
    soloLectura: boolean = false
  ): Promise<{ ajustes_detalle: AjusteDetalle[] }> {
    try {
      const params = new URLSearchParams()
      if (soloLectura) params.set('solo_lectura', '1')
      const query = params.toString() ? `?${params.toString()}` : ''
      const response = await mba3Api.get<{ ajustes_detalle: AjusteDetalle[] }>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/redistribucion/inicial${query}`
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [getRedistribucionInicial] Error:', error)
      throw createEnrichedError(error, 'Error al obtener datos iniciales de redistribución')
    }
  },

  /**
   * Obtiene la distribución (cantidad por tienda) guardada para un pedido.
   * GET /api/pedidos/{pedido_id}/distribucion. Sin version = última versión.
   *
   * @param pedidoId UUID del pedido
   * @param version Opcional: versión concreta; si no se envía, se usa la última
   * @returns Distribución por producto y tienda (distribucion_confirmada)
   */
  async getDistribucion(pedidoId: string, version?: number): Promise<DistribucionPedidoResponse> {
    try {
      const params = version != null ? `?version=${version}` : ''
      const response = await mba3Api.get<DistribucionPedidoResponse>(
        `/api/pedidos/${encodeURIComponent(pedidoId)}/distribucion${params}`
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [getDistribucion] Error:', error)
      throw createEnrichedError(error, 'Error al obtener distribución del pedido')
    }
  },

  /**
   * Ajusta automáticamente las bodegas
   * 
   * Mantiene el total confirmado constante cuando cambian tiendas
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param numeroPedido Número de pedido
   * @param ajustesDetalle Array de ajustes
   * @returns Redistribución ajustada
   */
  async ajustarBodegas(
    numeroPedido: string,
    ajustesDetalle: AjusteDetalle[]
  ): Promise<{
    status: 'success'
    message: string
    redistribucion_ajustada: AjusteDetalle[]
  }> {
    try {
      const response = await mba3Api.post(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/redistribucion/ajustar-bodegas`,
        { ajustes_detalle: ajustesDetalle }
      )
      return response.data as {
        status: 'success'
        message: string
        redistribucion_ajustada: AjusteDetalle[]
      }
    } catch (error: any) {
      console.error('❌ [ajustarBodegas] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al ajustar bodegas')
    }
  },

  /**
   * Guarda modificaciones de columnas (resaltado)
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param numeroPedido Número de pedido
   * @param modificaciones Array de modificaciones
   * @returns Resultado del guardado
   */
  async guardarModificacionesColumnas(
    numeroPedido: string,
    modificaciones: Array<{ pedido_detalle_id: string; columna_key: string }>
  ): Promise<GuardarModificacionesColumnasResponse> {
    try {
      const payload: GuardarModificacionesColumnasRequest = {
        numero_pedido: numeroPedido,
        modificaciones: modificaciones.map(m => ({
          pedido_detalle_id: m.pedido_detalle_id,
          columna_key: m.columna_key
        }))
      }

      const response = await mba3Api.post<GuardarModificacionesColumnasResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/modificaciones-columnas`,
        payload
      )

      return response.data
    } catch (error: any) {
      console.error('❌ [guardarModificacionesColumnas] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al guardar modificaciones')
    }
  },

  /**
   * Obtiene modificaciones de columnas guardadas
   * 
   * Requiere permiso: mba3-consultas.facturas.view
   * 
   * @param numeroPedido Número de pedido
   * @returns Modificaciones guardadas
   */
  async obtenerModificacionesColumnas(
    numeroPedido: string
  ): Promise<ObtenerModificacionesColumnasResponse> {
    try {
      const response = await mba3Api.get<ObtenerModificacionesColumnasResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/modificaciones-columnas`
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [obtenerModificacionesColumnas] Error:', error)

      // Si es 404, retornar respuesta vacía
      if (error.response?.status === 404) {
        return {
          status: 'success',
          numero_pedido: numeroPedido,
          modificaciones: []
        }
      }

      throw createEnrichedError(error, 'Error desconocido al obtener modificaciones')
    }
  },

  /**
   * Obtiene lista de pedidos con filtros
   * 
   * Requiere permiso: mba3-consultas.facturas.view
   * 
   * @param filtros Filtros de búsqueda
   * @returns Lista de pedidos con paginación
   */
  async getPedidosListado(filtros?: {
    estado?: string
    fecha_desde?: string
    fecha_hasta?: string
    proveedor_nombre?: string
    numero_pedido?: string
    creado_por?: string
    limit?: number
    offset?: number
  }): Promise<PedidosListadoResponse> {
    try {
      const url = buildUrlWithParams('/api/pedidos', filtros || {})
      const response = await mba3Api.get<PedidosListadoResponse>(url)
      return response.data
    } catch (error: any) {
      console.error('❌ [getPedidosListado] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al obtener listado de pedidos')
    }
  },

  /**
   * Obtiene pedidos con redistribución confirmada
   * 
   * @param filters Filtros de paginación
   * @returns Pedidos listos para generar ODC
   */
  async getPedidosConfirmados(filters?: {
    page?: number
    pageSize?: number
    estado?: string
  }): Promise<{
    data: PedidoCompleto[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    try {
      const params: Record<string, any> = {
        ...filters,
        redistribucion_confirmada: true
      }
      
      const url = buildUrlWithParams('/api/pedidos/confirmados', params)
      const response = await mba3Api.get(url)
      return response.data as {
        data: PedidoCompleto[]
        total: number
        page: number
        pageSize: number
        totalPages: number
      }
    } catch (error: any) {
      console.error('❌ [getPedidosConfirmados] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al obtener pedidos confirmados')
    }
  },

  /**
   * Obtiene el último pedido con redistribución confirmada
   * 
   * @returns Pedido confirmado más reciente o null
   */
  async getUltimoPedidoConfirmado(): Promise<PedidoCompleto | null> {
    try {
      const res = await pedidosService.getPedidosConfirmados({ page: 1, pageSize: 1 })
      const first = res.data?.[0]
      return first && (first as PedidoCompleto).cabecera ? (first as PedidoCompleto) : null
    } catch (error: any) {
      console.error('❌ [getUltimoPedidoConfirmado] Error:', error)
      return null
    }
  },

  /**
   * Obtiene el último pedido con respuesta del proveedor cargada
   * 
   * @param soloUsuario Si true, solo del usuario autenticado
   * @returns Objeto con numero_pedido o null
   */
  async getUltimoPedidoRedistribucion(soloUsuario: boolean = true): Promise<{ numero_pedido: string } | null> {
    try {
      const params = new URLSearchParams()
      params.append('solo_usuario', soloUsuario ? 'true' : 'false')
      const url = `/api/pedidos/ultimo-redistribucion?${params.toString()}`
      const response = await mba3Api.get<{ numero_pedido?: string; cabecera?: { numero_pedido: string } } | null>(url)
      const body = response.data
      if (body == null) return null
      const num = body.numero_pedido ?? body.cabecera?.numero_pedido
      return num ? { numero_pedido: num } : null
    } catch (error: any) {
      console.error('❌ [getUltimoPedidoRedistribucion] Error:', error)
      return null
    }
  },

  /**
   * Verifica si existen pedidos en el sistema
   * 
   * @returns Indica si hay pedidos guardados
   */
  async tienePedidos(): Promise<TienePedidosResponse> {
    try {
      const response = await mba3Api.get<TienePedidosResponse>('/api/pedidos/existe')
      return response.data
    } catch (error: any) {
      console.error('❌ [tienePedidos] Error:', error)
      
      // En caso de error, asumir que no hay pedidos
      return {
        status: 'error',
        tiene_pedidos: false,
        message: error.message || 'Error desconocido al verificar existencia de pedidos'
      }
    }
  },

  // ========== Storage de Archivos (MinIO/S3) ==========

  /**
   * Obtiene información del archivo Excel original almacenado en MinIO/S3
   * 
   * Permite verificar si existe el archivo antes de mostrar el botón de descarga.
   * GET /api/plantillas/{pedido_id}/info-archivo
   * 
   * @param pedidoId ID del pedido (UUID)
   * @returns Información del archivo o indicador de que no existe
   */
  async getInfoArchivoPlantilla(pedidoId: string): Promise<InfoArchivoPlantillaResponse> {
    try {
      const response = await mba3Api.get<InfoArchivoPlantillaResponse>(
        `/api/plantillas/${encodeURIComponent(pedidoId)}/info-archivo`
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [getInfoArchivoPlantilla] Error:', error)
      
      // Si es 404, el archivo no existe
      if (error.response?.status === 404) {
        return {
          existe: false,
          message: 'No existe archivo de plantilla para este pedido'
        }
      }

      throw createEnrichedError(error, 'Error al obtener información del archivo de plantilla')
    }
  },

  /**
   * Descarga el archivo Excel original almacenado en MinIO/S3
   * 
   * GET /api/plantillas/{pedido_id}/descargar-original
   * 
   * @param pedidoId ID del pedido (UUID)
   * @returns Blob del archivo Excel original
   */
  async descargarExcelOriginal(pedidoId: string): Promise<Blob> {
    try {
      const response = await mba3Api.get<Blob>(
        `/api/plantillas/${encodeURIComponent(pedidoId)}/descargar-original`,
        { 
          responseType: 'blob',
          timeout: 60000 // 60 segundos para archivos grandes
        }
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [descargarExcelOriginal] Error:', error)
      
      // Si es 404, el archivo no existe
      if (error.response?.status === 404) {
        throw new Error('No existe archivo de plantilla original para este pedido')
      }

      throw createEnrichedError(error, 'Error al descargar el archivo Excel original')
    }
  },

  /**
   * Obtiene el listado de archivos Excel originales almacenados en MinIO/S3
   * 
   * GET /api/plantillas/archivos
   * 
   * @param limit Límite de resultados (opcional, default 100)
   * @param soloActivos Si solo devuelve archivos activos (opcional, default true)
   * @returns Lista de archivos originales
   */
  async getListadoArchivosOriginales(limit?: number, soloActivos?: boolean): Promise<ListadoArchivosOriginalesResponse> {
    try {
      const params: Record<string, any> = {}
      if (limit != null) params.limit = limit
      if (soloActivos != null) params.solo_activos = soloActivos

      const url = buildUrlWithParams('/api/plantillas/archivos', params)
      const response = await mba3Api.get<ListadoArchivosOriginalesResponse>(url)
      return response.data
    } catch (error: any) {
      console.error('❌ [getListadoArchivosOriginales] Error:', error)
      throw createEnrichedError(error, 'Error al obtener listado de archivos originales')
    }
  },

  /**
   * Elimina un archivo Excel original del storage MinIO/S3
   * 
   * DELETE /api/plantillas/archivos/{archivo_id}
   * 
   * @param archivoId ID del archivo a eliminar
   * @param eliminarFisicamente Si se elimina también del MinIO (opcional, default false = soft delete)
   * @returns Resultado de la eliminación
   */
  async eliminarArchivoOriginal(archivoId: string, eliminarFisicamente?: boolean): Promise<EliminarArchivoOriginalResponse> {
    try {
      const params = eliminarFisicamente ? '?eliminar_fisicamente=true' : ''
      const response = await mba3Api.delete<EliminarArchivoOriginalResponse>(
        `/api/plantillas/archivos/${encodeURIComponent(archivoId)}${params}`
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [eliminarArchivoOriginal] Error:', error)
      
      if (error.response?.status === 404) {
        throw new Error('El archivo no existe o ya fue eliminado')
      }
      if (error.response?.status === 403) {
        throw new Error('No tiene permisos para eliminar este archivo')
      }

      throw createEnrichedError(error, 'Error al eliminar el archivo original')
    }
  },
}
