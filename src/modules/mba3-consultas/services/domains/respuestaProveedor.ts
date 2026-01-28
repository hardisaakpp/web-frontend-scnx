/**
 * Servicios de respuesta de proveedores
 */

import { mba3Api } from '../config/axiosConfig'
import { validateFile } from '../utils/fileValidator'
import { createEnrichedError, normalizeValidationResponse } from '../utils/errorHandler'
import type {
  CargarRespuestaProveedorResponse,
  RespuestaProveedorResponse,
  ProcesarConfirmacionResponse
} from '../../types'

export const respuestaProveedorService = {
  /**
   * Cargar respuesta del proveedor desde archivo Excel
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param file Archivo Excel con la respuesta del proveedor
   * @returns Resultado de la carga
   */
  async cargarRespuestaProveedor(numeroPedido: string, file: File): Promise<CargarRespuestaProveedorResponse> {
    try {
      validateFile(file)

      const formData = new FormData()
      formData.append('file', file)

      const response = await mba3Api.post<CargarRespuestaProveedorResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/cargar-respuesta-proveedor`,
        formData
      )

      return normalizeValidationResponse(response.data)
    } catch (error: any) {
      console.error('❌ [cargarRespuestaProveedor] Error al cargar respuesta:', error)

      // Manejar error 400 con validación
      if (error.response?.status === 400 && error.response?.data?.status === 'validation_error') {
        return normalizeValidationResponse(error.response.data) as CargarRespuestaProveedorResponse
      }

      throw createEnrichedError(error, 'Error desconocido al cargar respuesta del proveedor')
    }
  },

  /**
   * Crear respuesta del proveedor desde pedido existente
   * 
   * Copia los datos del pedido como respuesta del proveedor.
   * Útil cuando se quiere procesar sin archivo Excel.
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param pedidoId ID del pedido (opcional)
   * @returns Resultado de la creación
   */
  async crearRespuestaProveedorDesdePedido(numeroPedido: string, pedidoId?: string): Promise<CargarRespuestaProveedorResponse> {
    try {
      const response = await mba3Api.post<CargarRespuestaProveedorResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/crear-respuesta-desde-pedido`,
        pedidoId ? { pedido_id: pedidoId } : undefined
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [crearRespuestaProveedorDesdePedido] Error:', error)
      throw createEnrichedError(error, 'Error desconocido al crear respuesta desde pedido')
    }
  },

  /**
   * Obtener respuesta del proveedor
   * 
   * Requiere permiso: mba3-consultas.facturas.view
   * 
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @returns Respuesta del proveedor
   */
  async getRespuestaProveedor(numeroPedido: string): Promise<RespuestaProveedorResponse> {
    try {
      const response = await mba3Api.get<RespuestaProveedorResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/respuesta-proveedor`
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [getRespuestaProveedor] Error al obtener respuesta:', error)

      // Si es 404, el pedido no tiene respuesta aún
      if (error.response?.status === 404) {
        throw new Error('No existe respuesta del proveedor para este pedido')
      }

      throw createEnrichedError(error, 'Error desconocido al obtener respuesta del proveedor')
    }
  },

  /**
   * Procesar confirmación del proveedor y ajustar el pedido
   * 
   * Requiere permiso: mba3-consultas.proceso.execute
   * 
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param forzarRedistribucion Si true, siempre redistribuye proporcionalmente
   * @returns Resultado del procesamiento
   */
  async procesarConfirmacionProveedor(
    numeroPedido: string,
    forzarRedistribucion: boolean = false
  ): Promise<ProcesarConfirmacionResponse> {
    try {
      const params = new URLSearchParams()
      if (forzarRedistribucion) {
        params.append('forzar_redistribucion', 'true')
      }

      const queryString = params.toString()
      const url = queryString
        ? `/api/pedidos/${encodeURIComponent(numeroPedido)}/procesar-confirmacion?${queryString}`
        : `/api/pedidos/${encodeURIComponent(numeroPedido)}/procesar-confirmacion`

      const response = await mba3Api.post<ProcesarConfirmacionResponse>(url)
      return response.data
    } catch (error: any) {
      console.error('❌ [procesarConfirmacionProveedor] Error al procesar confirmación:', error)

      // Manejar error 409 (respuesta ya procesada - idempotencia)
      if (error.response?.status === 409) {
        const errorData = error.response.data
        const message = errorData?.detail || errorData?.message || 'Esta respuesta del proveedor ya fue procesada anteriormente'
        const customError = new Error(message) as any
        customError.isConflict = true
        customError.statusCode = 409
        throw customError
      }

      throw createEnrichedError(error, 'Error desconocido al procesar confirmación')
    }
  },
}
