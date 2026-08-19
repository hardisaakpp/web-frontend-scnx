/**
 * ⭐ ARCHIVO EN REFACTORIZACIÓN
 * 
 * Este archivo está siendo refactorizado gradualmente para mejorar su mantenibilidad.
 * 
 * NUEVA ESTRUCTURA (en progreso):
 * - config/axiosConfig.ts: Configuración de axios e interceptores
 * - utils/: Utilidades compartidas (errorHandler, urlBuilder, fileValidator)
 * - domains/: Servicios organizados por dominio de negocio
 * 
 * El objeto `mba3ConsultasService` se mantiene para compatibilidad con código existente.
 * Los nuevos servicios modulares están disponibles en `domains/`.
 */

import type {
  Despacho,
  DespachoDetalle
} from '../types'
import type { OrdenCompraResponse, OrdenCompraLogResponse, RemisionResponse } from '../types'
import type { HealthResponse, ProcesoResponse } from '../types'
import type { SkuHomologacionResponse, SkuHomologacionUpdateRequest, SkuHomologacionCreateRequest, CruceProductosResponse, SugerenciasResponse, EstadoSincronizacionResponse, SincronizarMaestrosResponse, IniciarCruceResponse, ProcesoEstadoSSE, ProcesoEstado, ProcesoEstadoResponse, SugerenciaProducto, SugerenciasSkuResponse, DetallesOCResponse, ActualizarSkuRequest, ActualizarSkuResponse, BuscarSkuMba3Response, UploadPlantillaResponse, UploadPlantillaAsyncAcceptedResponse, PlantillaProcesoEstado, PedidoCompleto, CargarRespuestaProveedorResponse, RespuestaProveedorResponse, ProcesarConfirmacionResponse, ReporteDiferenciasResponse, IntegracionSAPResponse, ActualizarCostoPedidoResponse, AjusteDetalle, ResumenConfirmacion, GuardarModificacionesColumnasRequest, GuardarModificacionesColumnasResponse, ObtenerModificacionesColumnasResponse, ProcesamientoSAPResponse, PedidosListadoResponse, CrearOCDesdePedidoResponse, CrearPedidoRequest, CrearPedidoResponse, ModificarPedidoCabeceraRequest, ModificarPedidoCabeceraResponse, TienePedidosResponse, InfoArchivoPlantillaResponse, BuscarPlantillasResponse, PlantillasPedidosResponse, ProcesoCompletoSAPResponse, ProcesoCompletoSAPAsyncResponse, ProcesoCompletoSAPResultadoPolling, IntegracionSAPPorOCResponse, EstadosPedidoResponse, DiferenciaProduccionResponse, ConfirmarConDiferenciaResponse, HijoDiferenciaPayload } from '../types'

// ⭐ REEXPORTAR CONFIGURACIÓN Y UTILIDADES REFACTORIZADAS
export { mba3Api, API_BASE_URL } from './config/axiosConfig'
export * from './utils/errorHandler'
export * from './utils/urlBuilder'
export * from './utils/fileValidator'

// ⭐ REEXPORTAR SERVICIOS DE DOMINIO REFACTORIZADOS
export * from './domains'

// Importar configuración de axios y servicios refactorizados para uso interno
import { mba3Api, API_BASE_URL } from './config/axiosConfig'
import { pedidosService } from './domains/pedidos'
import { ordenesCompraService } from './domains/ordenesCompra'
import type { OrdenesCompraListFilters } from '../types'
import { calculateIntegrarSapTimeoutMs } from '../utils/integrarSapTimeout'
import { MAX_EXCEL_UPLOAD_SIZE_BYTES, MAX_EXCEL_UPLOAD_SIZE_MB } from '@/config/uploadLimits'

/**
 * ⭐ Objeto de servicio original mantenido para compatibilidad
 * 
 * Este objeto mantiene todos los métodos existentes para evitar romper
 * el código que ya usa `mba3ConsultasService`.
 * 
 * Los métodos refactorizados ya están disponibles en los módulos de dominio
 * y pueden importarse individualmente para mejor organización.
 */

export const mba3ConsultasService = {
  // Health check
  async healthCheck(): Promise<HealthResponse> {
    const response = await mba3Api.get<HealthResponse>('/health')
    return response.data
  },

  // Consultar (solo lectura)
  async consultar(): Promise<any> {
    const response = await mba3Api.get('/consultar')
    return response.data
  },

  // Migrar
  async migrar(retries: number = 2): Promise<ProcesoResponse> {
    let lastError: any = null

    // Intentar hasta (retries + 1) veces (retries = número de reintentos adicionales)
    // Por defecto: 3 intentos totales (intento 0, 1, 2)
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Si no es el primer intento, agregar un delay progresivo para dar tiempo al backend
        if (attempt > 0) {
          const delay = attempt * 2000 // Delay progresivo: 2s, 4s, 6s...
          console.warn(`[migrar] Reintentando migración (intento ${attempt + 1}/${retries + 1}) después de ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        // Timeout extendido a 120 segundos para operaciones de migración largas
        // que incluyen consultas a MBA3, SAP y guardado en base de datos
        const response = await mba3Api.get<ProcesoResponse>('/migrar/completo', {
          timeout: 120000 // 2 minutos
        })
        return response.data
      } catch (error: any) {
        lastError = error

        // Solo reintentar si es un error 500 y no es el último intento
        const is500Error = error.response?.status === 500
        const isLastAttempt = attempt === retries

        if (is500Error && !isLastAttempt) {
          console.warn(`[migrar] Error 500 en intento ${attempt + 1}/${retries + 1}. El backend puede necesitar inicialización. Reintentando...`)
          continue // Continuar al siguiente intento
        }

        // Si no es un 500 o es el último intento, lanzar el error
        throw error
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    throw lastError
  },

  // Procesar ODC (todos o específicos)
  // despachoIds: string | string[] | undefined - Si se proporciona, procesa solo esos despachos
  async procesarOC(despachoIds?: string | string[]): Promise<any> {
    const params = new URLSearchParams()

    if (despachoIds) {
      // Si es un array, enviar múltiples IDs
      if (Array.isArray(despachoIds)) {
        // Para múltiples IDs, algunos backends esperan múltiples parámetros con el mismo nombre
        // O un string separado por comas. Intentamos con múltiples parámetros primero
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

  // Integrar SAP (una o múltiples ODCs)
  // referenciaDespacho: string | string[] | undefined - Si se proporciona, integra solo esas ODCs
  // almacenDestino: string | undefined - Código del almacén destino (ej: RL, OUT, LP)
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

    // ⭐ FUTURO: Leer headers de respuesta del backend para ajustar timeout en próximas llamadas
    // const backendTimeout = response.headers['x-request-timeout']
    // if (backendTimeout) {
    //   console.debug(`⏱️ [integrarSAP] Backend recomienda timeout: ${backendTimeout}s`)
    //   // Podríamos almacenar esto para futuras llamadas similares
    // }

    return response.data
  },

  // Órdenes de compra
  async getOrdenesCompra(
    estado?: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: OrdenesCompraListFilters,
    signal?: AbortSignal
  ): Promise<OrdenCompraResponse> {
    return ordenesCompraService.getOrdenesCompra(estado, page, pageSize, filters, signal)
  },

  // Eliminar órdenes de compra (una o múltiples)
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

  // Pruebas (endpoint completo)
  async pruebas(): Promise<ProcesoResponse> {
    const response = await mba3Api.get<ProcesoResponse>('/pruebas')
    return response.data
  },

  // Obtener conteo de despachos disponibles
  async getDespachosCount(): Promise<{ count: number; disponible: boolean }> {
    const response = await mba3Api.get<{ count: number; disponible: boolean }>('/despachos/count')
    return response.data
  },

  // Obtener lista de despachos (prefacturas guardadas en BD)
  // Usa el endpoint /despachos/count modificado que ahora devuelve la lista + conteo
  async getDespachos(page: number = 1, pageSize: number = 10): Promise<{ status: string; data: Despacho[]; metadata: { count: number; filters: {} }; total: number; page: number; pageSize: number }> {
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

  // Obtener detalles de un despacho específico
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

  // Obtener logs de órdenes de compra
  async getOrdenesCompraLogs(page: number = 1, pageSize: number = 10, filters?: { estado?: string; fechaDesde?: string; fechaHasta?: string }): Promise<OrdenCompraLogResponse> {
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())

      if (filters?.estado) {
        params.append('estado', filters.estado)
      }
      if (filters?.fechaDesde) {
        params.append('fecha_desde', filters.fechaDesde)
      }
      if (filters?.fechaHasta) {
        params.append('fecha_hasta', filters.fechaHasta)
      }

      const queryString = params.toString()
      const url = queryString ? `/ordenes-compra/logs?${queryString}` : '/ordenes-compra/logs'
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

  // Obtener remisiones
  async getRemisiones(page: number = 1, pageSize: number = 10): Promise<RemisionResponse> {
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())

      const queryString = params.toString()
      const url = queryString ? `/remisiones?${queryString}` : '/remisiones'
      const response = await mba3Api.get<RemisionResponse>(url)
      return response.data
    } catch (error: any) {
      console.error('❌ [getRemisiones] Error al obtener remisiones:', error)
      // Preservar el error original (AxiosError) para que la vista pueda distinguir 4xx/5xx
      throw error
    }
  },

  // Consultar remisiones desde MBA3
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

  // ========== Homologaciones de SKU ==========

  // Obtener homologaciones de SKU con filtros
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
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())

      if (filters?.estado) {
        params.append('estado', filters.estado)
      }
      if (filters?.tiene_diferencias !== undefined) {
        params.append('tiene_diferencias', filters.tiene_diferencias.toString())
      }
      if (filters?.tiene_datos_sap !== undefined) {
        params.append('tiene_datos_sap', filters.tiene_datos_sap.toString())
      }
      if (filters?.sku) {
        params.append('sku', filters.sku)
      }

      const queryString = params.toString()
      const url = queryString ? `/api/homologaciones-sku?${queryString}` : '/api/homologaciones-sku'
      const response = await mba3Api.get<SkuHomologacionResponse>(url)
      return response.data
    } catch (error: any) {
      console.error('❌ [getSkuHomologaciones] Error al obtener homologaciones:', error)
      throw new Error(`No se pudieron obtener las homologaciones de SKU. Error: ${error.message}`)
    }
  },

  // Actualizar una homologación de SKU
  async updateSkuHomologacion(
    homologacionId: string,
    updateData: SkuHomologacionUpdateRequest
  ): Promise<any> {
    try {
      const response = await mba3Api.put(`/api/homologaciones-sku/${homologacionId}`, updateData)
      return response.data
    } catch (error: any) {
      console.error('❌ [updateSkuHomologacion] Error al actualizar homologación:', error)
      throw new Error(`No se pudo actualizar la homologación. Error: ${error.message}`)
    }
  },

  // Crear o actualizar múltiples homologaciones
  async bulkUpdateSkuHomologaciones(
    updates: Array<{ homologacion_id: string; data: SkuHomologacionUpdateRequest }>
  ): Promise<any> {
    try {
      const response = await mba3Api.post('/api/homologaciones-sku/bulk-update', { updates })
      return response.data
    } catch (error: any) {
      console.error('❌ [bulkUpdateSkuHomologaciones] Error al actualizar homologaciones:', error)
      throw new Error(`No se pudieron actualizar las homologaciones. Error: ${error.message}`)
    }
  },

  // Sincronizar homologaciones desde despachos (detectar SKUs no coincidentes)
  async sincronizarHomologaciones(): Promise<any> {
    try {
      const response = await mba3Api.post('/api/homologaciones-sku/sincronizar')
      return response.data
    } catch (error: any) {
      console.error('❌ [sincronizarHomologaciones] Error al sincronizar homologaciones:', error)
      throw new Error(`No se pudieron sincronizar las homologaciones. Error: ${error.message}`)
    }
  },

  // Crear una nueva homologación manualmente
  async createSkuHomologacion(
    createData: SkuHomologacionCreateRequest
  ): Promise<any> {
    try {
      const response = await mba3Api.post('/api/homologaciones-sku', createData)
      return response.data
    } catch (error: any) {
      console.error('❌ [createSkuHomologacion] Error al crear homologación:', error)
      throw new Error(`No se pudo crear la homologación. Error: ${error.message}`)
    }
  },

  // ========== Cruce de Productos ==========

  // Iniciar cruce de productos (retorna process_id)
  async iniciarCruce(): Promise<IniciarCruceResponse> {
    try {
      const response = await mba3Api.post<IniciarCruceResponse>('/cruce-productos/iniciar')
      return response.data
    } catch (error: any) {
      console.error('❌ [iniciarCruce] Error al iniciar cruce:', error)
      throw new Error(`No se pudo iniciar el cruce de productos. Error: ${error.message}`)
    }
  },

  // Conectar al stream SSE para seguir el progreso
  async seguirProgresoCruce(
    processId: string,
    onProgress: (data: ProcesoEstadoSSE) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void,
    abortSignal?: AbortSignal  // Para cancelación
  ): Promise<ReadableStreamDefaultReader | null> {
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('No hay token de autenticación')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cruce-productos/stream/${processId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        signal: abortSignal,  // Permite cancelación externa
      })

      if (!response.ok) {
        throw new Error(`Error al conectar al stream: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No se pudo obtener el reader del stream')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      // Función para procesar el stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              if (onComplete) onComplete()
              break
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || '' // Guardar línea incompleta

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6) // Remover 'data: '
                  const data: ProcesoEstadoSSE = JSON.parse(jsonStr)
                  onProgress(data)

                  // Si el proceso terminó, cerrar la conexión
                  if (data.status === 'completed' || data.status === 'error') {
                    reader.cancel()
                    if (onComplete) onComplete()
                    return reader
                  }
                } catch (parseError) {
                  console.warn('⚠️ [seguirProgresoCruce] Error al parsear evento SSE:', parseError, 'Line:', line)
                }
              } else if (line.startsWith('event: ')) {
                // Opcional: manejar tipos de eventos específicos
                const eventType = line.slice(7)
                console.debug('📡 [SSE] Event type:', eventType)
              }
            }
          }
        } catch (streamError: any) {
          // Si es cancelación, no es un error real
          if (streamError.name === 'AbortError') {
            if (import.meta.env.DEV) console.log('🛑 [seguirProgresoCruce] Stream cancelado por el usuario')
            reader.cancel()
            return reader
          }
          throw streamError
        }

        return reader
      }

      // Ejecutar procesamiento del stream
      await processStream()
      return reader
    } catch (error: any) {
      console.error('❌ [seguirProgresoCruce] Error en stream SSE:', error)
      if (onError) {
        onError(error instanceof Error ? error : new Error(error.message || 'Error desconocido'))
      } else {
        throw error
      }
      return null
    }
  },

  // Obtener resultado del cruce (polling alternativo)
  async obtenerResultadoCruce(processId: string): Promise<ProcesoEstadoResponse> {
    try {
      const response = await mba3Api.get<ProcesoEstadoResponse>(`/cruce-productos/resultado/${processId}`)
      return response.data
    } catch (error: any) {
      console.error('❌ [obtenerResultadoCruce] Error al obtener resultado:', error)
      throw new Error(`No se pudo obtener el resultado del cruce. Error: ${error.message}`)
    }
  },

  // Obtener sugerencias de homologación
  async obtenerSugerencias(): Promise<SugerenciasResponse> {
    try {
      // Timeout muy extendido ya que el cálculo de sugerencias puede tardar varios minutos
      // especialmente con muchos productos sin match
      const response = await mba3Api.get<SugerenciasResponse>('/cruce-productos/sugerencias', {
        timeout: 600000 // 10 minutos (600 segundos)
      })
      return response.data
    } catch (error: any) {
      // Si es error 412, lanzar un error con mensaje descriptivo
      // pero preservar el status code para que el frontend lo detecte
      if (error.response?.status === 412) {
        const errorData = error.response.data
        const message = errorData?.messsage || errorData?.message || 'No hay un cruce reciente disponible'
        const customError = new Error(message)
          // Preservar el status code para que el frontend lo detecte
          ; (customError as any).response = error.response
        throw customError
      }

      // Detectar timeout específicamente
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('⏱️ [obtenerSugerencias] Timeout - el proceso puede seguir ejecutándose en el servidor')
        const timeoutError = new Error('El cálculo de sugerencias está tardando más de lo esperado. El proceso puede seguir ejecutándose en el servidor. Intenta nuevamente en unos minutos.')
          ; (timeoutError as any).isTimeout = true
        throw timeoutError
      }

      console.error('❌ [obtenerSugerencias] Error al obtener sugerencias:', error)
      throw new Error(`No se pudieron obtener las sugerencias. Error: ${error.message}`)
    }
  },

  // Obtener estado de sincronización
  async obtenerEstadoSincronizacion(): Promise<EstadoSincronizacionResponse> {
    try {
      const response = await mba3Api.get<EstadoSincronizacionResponse>('/cruce-productos/estado-sincronizacion')
      return response.data
    } catch (error: any) {
      console.error('❌ [obtenerEstadoSincronizacion] Error al obtener estado:', error)
      throw new Error(`No se pudo obtener el estado de sincronización. Error: ${error.message}`)
    }
  },

  // Sincronizar maestros manualmente
  async sincronizarMaestros(): Promise<SincronizarMaestrosResponse> {
    try {
      // Timeout muy extendido ya que la sincronización puede tardar varios minutos
      const response = await mba3Api.post<SincronizarMaestrosResponse>('/cruce-productos/sincronizar-maestros', {}, {
        timeout: 600000 // 10 minutos
      })
      return response.data
    } catch (error: any) {
      console.error('❌ [sincronizarMaestros] Error al sincronizar maestros:', error)
      throw new Error(`No se pudo sincronizar los maestros. Error: ${error.message}`)
    }
  },

  // ========== Búsqueda de SKU ==========

  // Buscar SKU en MBA3
  async buscarSkuMba3(
    sku: string,
    incluirSugerenciasSap: boolean = false,
    limiteSugerencias: number = 20
  ): Promise<BuscarSkuMba3Response> {
    try {
      const params: any = {
        sku: sku
      }

      // Solo agregar parámetros si se solicitan sugerencias
      if (incluirSugerenciasSap) {
        params.incluir_sugerencias_sap = true
        params.limite_sugerencias = Math.min(Math.max(limiteSugerencias, 1), 100) // Entre 1 y 100
      }

      // Timeout aumentado a 60 segundos para dar margen al backend (que tiene timeout de 25s)
      const response = await mba3Api.get<BuscarSkuMba3Response>(`/cruce-productos/buscar-sku/mba3`, {
        params: params,
        timeout: 60000 // 60 segundos
      })

      return response.data
    } catch (error: any) {
      // Si el error es 404, significa que no se encontró el SKU (no es un error crítico)
      if (error.response?.status === 404) {
        return {
          status: 'not_found',
          message: `SKU no encontrado en MBA3: ${sku}`,
          sku: sku,
          data: null
        }
      }
      // Si el error es 504 (Gateway Timeout), el backend falló por timeout (25s)
      if (error.response?.status === 504) {
        console.error('❌ [buscarSkuMba3] Timeout en el backend:', error)
        throw new Error('La búsqueda en MBA3 tardó demasiado tiempo. Por favor, intente nuevamente.')
      }
      console.error('❌ [buscarSkuMba3] Error al buscar SKU en MBA3:', error)
      throw new Error(`No se pudo buscar el SKU en MBA3. Error: ${error.message}`)
    }
  },

  // Buscar SKU en SAP
  async buscarSkuSap(sku: string): Promise<{ data: any }> {
    try {
      // Timeout aumentado a 60 segundos para dar margen al backend (que tiene timeout de 25s)
      const response = await mba3Api.get<{ status?: string; sku?: string; data?: any }>(`/cruce-productos/buscar-sku/sap`, {
        params: { sku },
        timeout: 60000 // 60 segundos
      })
      // El backend devuelve { status, sku, data }
      // Extraer el campo data de la respuesta
      return { data: response.data?.data || response.data || null }
    } catch (error: any) {
      // Si el error es 404, significa que no se encontró el SKU (no es un error crítico)
      if (error.response?.status === 404) {
        return { data: null }
      }
      // Si el error es 504 (Gateway Timeout), el backend falló por timeout (25s)
      if (error.response?.status === 504) {
        console.error('❌ [buscarSkuSap] Timeout en el backend:', error)
        throw new Error('La búsqueda en SAP tardó demasiado tiempo. Por favor, intente nuevamente.')
      }
      console.error('❌ [buscarSkuSap] Error al buscar SKU en SAP:', error)
      throw new Error(`No se pudo buscar el SKU en SAP. Error: ${error.message}`)
    }
  },

  // Buscar sugerencias de SKU similares en SAP
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
    } catch (error: any) {
      console.error('❌ [buscarSugerenciasSku] Error al buscar sugerencias:', error)

      // Si el error es 404, significa que no se encontraron sugerencias
      if (error.response?.status === 404) {
        return {
          status: 'not_found',
          sku_referencia: sku,
          message: `No se encontraron SKUs similares para: ${sku}`,
          sugerencias: [],
          total_encontrados: 0
        }
      }

      // Para otros errores, lanzar excepción
      throw new Error(`No se pudieron obtener las sugerencias. Error: ${error.message}`)
    }
  },

  // Obtener detalles de una ODC
  async obtenerDetallesOC(ocId: string): Promise<DetallesOCResponse> {
    try {
      const response = await mba3Api.get<DetallesOCResponse>(`/ordenes-compra/${ocId}/detalles`)
      return response.data
    } catch (error: any) {
      console.error('❌ [obtenerDetallesOC] Error al obtener detalles:', error)
      throw new Error(`No se pudieron obtener los detalles de la ODC. Error: ${error.message}`)
    }
  },

  // Descargar PDF de una ODC
  async descargarODCPDF(ocId: string): Promise<Blob> {
    try {
      const response = await mba3Api.get<Blob>(`/ordenes-compra/${ocId}/pdf`, {
        responseType: 'blob',
        timeout: 60000,
      })
      return response.data
    } catch (error: any) {
      console.error('❌ [descargarODCPDF] Error al descargar PDF:', error)
      throw new Error(`No se pudo descargar el PDF de la ODC. Error: ${error.message}`)
    }
  },

  /**
   * Reintentar solo Solicitudes de Transferencia (ITR) fallidas para una OC ya enviada.
   * Backend: POST /ordenes-compra/{oc_id}/reintentar-st (idempotente, no reenvía la ODC).
   * Re-exporta el método del servicio de dominio para mantener compatibilidad.
   */
  async reintentarSolicitudesTransferencia(ocId: string) {
    try {
      const response = await mba3Api.post(
        `/ordenes-compra/${ocId}/reintentar-st`,
        {},
        { timeout: 120000 }
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [reintentarSolicitudesTransferencia] Error al reintentar ST:', error)
      const detail = error?.response?.data?.message || error?.response?.data?.detail || error.message
      throw new Error(`No se pudo reintentar las Solicitudes de Transferencia. ${detail}`)
    }
  },

  /**
   * Obtener detalle de integración SAP por oc_id (GET /ordenes-compra/{oc_id}/integracion-sap).
   * Usado para rellenar el modal al hacer clic en "Num ODC" cuando no hay datos en memoria.
   * 404 si no existe registro de envío para esa OC.
   */
  async getIntegracionSAP(ocId: string): Promise<IntegracionSAPPorOCResponse> {
    const response = await mba3Api.get<IntegracionSAPPorOCResponse>(`/ordenes-compra/${ocId}/integracion-sap`)
    return response.data
  },

  // Actualizar SKU en un detalle de ODC
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
    } catch (error: any) {
      console.error('❌ [actualizarSkuDetalle] Error al actualizar SKU:', error)

      // Extraer mensaje de error más descriptivo
      let message = error.message || 'Error desconocido al actualizar SKU'

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

  // ========== Plantillas / Pedidos ==========
  // ⭐ REFACTORIZADO: Los métodos se delegan al servicio de pedidos
  // Ver: services/domains/pedidos.ts

  /**
   * Sube y procesa un archivo Excel de plantilla
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param file Archivo Excel con la plantilla
   * @param onProgress Callback opcional para reportar progreso (0-100%)
   * @deprecated Usar pedidosService.uploadPlantilla() directamente
   */
  async uploadPlantilla(
    file: File,
    onProgress?: (progress: number, fase: 'upload' | 'processing') => void
  ): Promise<UploadPlantillaResponse> {
    return pedidosService.uploadPlantilla(file, onProgress)
  },

  /**
   * ⭐ NUEVO: Sube una plantilla Excel con correcciones de códigos aplicadas
   * Similar a uploadPlantilla pero acepta un mapa de correcciones {codigo_original: codigo_sap_corregido}
   * @param file Archivo Excel con la plantilla
   * @param correcciones Mapa de correcciones de códigos
   * @param onProgress Callback opcional para reportar progreso (0-100%)
   * @deprecated Usar pedidosService.uploadPlantillaConCorrecciones() directamente
   */
  async uploadPlantillaConCorrecciones(
    file: File,
    correcciones: Record<string, string>,
    onProgress?: (progress: number, fase: 'upload' | 'processing') => void
  ): Promise<UploadPlantillaResponse> {
    return pedidosService.uploadPlantillaConCorrecciones(file, correcciones, onProgress)
  },

  /**
   * Sube una plantilla para procesamiento en segundo plano (Celery).
   * Responde con process_id; el resultado se obtiene con getResultadoPlantilla(process_id).
   * @deprecated Usar pedidosService.uploadPlantillaAsync() directamente
   */
  async uploadPlantillaAsync(
    file: File,
    opts?: {
      validar?: boolean
      bloquea_con_errores?: boolean
      modo_tiendas?: 'validar_estricto' | 'crear_si_no_existe' | 'sincronizar_maestro'
      confirmar_sincronizacion?: boolean
      correcciones_codigos?: Record<string, string>
    },
    onProgress?: (progress: number, fase: 'upload' | 'processing') => void
  ): Promise<UploadPlantillaAsyncAcceptedResponse> {
    return pedidosService.uploadPlantillaAsync(file, opts, onProgress)
  },

  /**
   * Obtiene el estado/resultado del procesamiento async de una plantilla (polling).
   * @deprecated Usar pedidosService.getResultadoPlantilla() directamente
   */
  async getResultadoPlantilla(processId: string): Promise<PlantillaProcesoEstado | UploadPlantillaResponse> {
    return pedidosService.getResultadoPlantilla(processId)
  },

  /**
   * Crea un pedido manualmente por pantalla (sin Excel)
   * Requiere permiso: mba3-consultas.proceso.execute
   * @deprecated Usar pedidosService.crearPedidoManual() directamente
   */
  async crearPedidoManual(pedidoData: CrearPedidoRequest): Promise<CrearPedidoResponse> {
    return pedidosService.crearPedidoManual(pedidoData)
  },

  /**
   * Obtiene un pedido completo por número de pedido
   * Requiere permiso: mba3-consultas.facturas.view
   * @deprecated Usar pedidosService.getPedido() directamente
   */
  async getPedido(numeroPedido: string, incluirRespuesta: boolean = false): Promise<PedidoCompleto> {
    return pedidosService.getPedido(numeroPedido, incluirRespuesta)
  },

  /**
   * Obtiene el último pedido cargado por el usuario autenticado
   * Requiere permiso: mba3-consultas.facturas.view
   * @param incluirRespuesta Si es true, incluye respuesta_proveedor si existe
   * @returns PedidoCompleto o null si no hay pedidos
   * @deprecated Usar pedidosService.getUltimoPedido() directamente
   */
  async getUltimoPedido(incluirRespuesta: boolean = false): Promise<PedidoCompleto | null> {
    return pedidosService.getUltimoPedido(incluirRespuesta)
  },

  /**
   * Exporta un pedido en formato Excel para enviar al proveedor
   * Requiere permiso: mba3-consultas.facturas.view
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @returns Blob del archivo Excel
   * @deprecated Usar pedidosService.exportarPedidoParaProveedor() directamente
   */
  async exportarPedidoParaProveedor(numeroPedido: string): Promise<Blob> {
    return pedidosService.exportarPedidoParaProveedor(numeroPedido)
  },

  /**
   * Exporta un pedido en formato plano (CSV o TXT) para subir en MBA
   * HU-08: Permite a usuarios de El Rayo descargar el pedido en archivo plano
   * Requiere permiso: mba3-consultas.facturas.view
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param formato Formato de salida: 'csv' o 'txt' (por defecto 'csv')
   * @returns Blob del archivo plano
   * @deprecated Usar pedidosService.exportarPedidoPlanoMba() directamente
   */
  async exportarPedidoPlanoMba(numeroPedido: string, formato: 'csv' | 'txt' = 'csv'): Promise<Blob> {
    return pedidosService.exportarPedidoPlanoMba(numeroPedido, formato)
  },

  /**
   * Carga la respuesta del proveedor desde un archivo Excel
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   */
  async cargarRespuestaProveedor(numeroPedido: string, file: File): Promise<CargarRespuestaProveedorResponse> {
    try {
      // Validar tipo de archivo - solo Excel
      const allowedExtensions = ['.xlsx', '.xls']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`Tipo de archivo no permitido. Solo se permiten: ${allowedExtensions.join(', ')}`)
      }

      // Validar tamaño máximo de archivo
      if (file.size > MAX_EXCEL_UPLOAD_SIZE_BYTES) {
        throw new Error(`El archivo excede el tamaño máximo de ${MAX_EXCEL_UPLOAD_SIZE_MB} MB`)
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await mba3Api.post<CargarRespuestaProveedorResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/cargar-respuesta-proveedor`,
        formData
      )

      return response.data
    } catch (error: any) {
      console.error('❌ [cargarRespuestaProveedor] Error al cargar respuesta:', error)

      let message = error.message || 'Error desconocido al cargar respuesta del proveedor'
      let hasBackendMessage = false

      if (error.response?.data) {
        const detail = error.response.data.detail

        if (detail) {
          hasBackendMessage = true
          if (Array.isArray(detail)) {
            // Si es un array, unir los mensajes de forma más legible
            message = detail.map((item: any) => {
              if (typeof item === 'string') return item
              if (item?.msg) return item.msg
              if (item?.loc && item?.msg) {
                // Formato de validación de FastAPI: {loc: [...], msg: "...", type: "..."}
                const location = Array.isArray(item.loc) ? item.loc.join('.') : String(item.loc)
                return `${location}: ${item.msg}`
              }
              return JSON.stringify(item)
            }).join('\n')
          } else if (typeof detail === 'string') {
            message = detail
          } else if (detail.message) {
            message = detail.message
          } else {
            message = String(detail)
          }
        } else if (error.response.data.message) {
          hasBackendMessage = true
          message = error.response.data.message
        } else if (error.response.data.error) {
          hasBackendMessage = true
          message = error.response.data.error
        }
      } else if (error.request) {
        message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      }

      // Solo usar mensaje genérico si NO tenemos un mensaje del backend y el mensaje es genérico
      if (!hasBackendMessage && (message === 'Request failed with status code 400' ||
        message.includes('status code') ||
        message === 'Error desconocido al cargar respuesta del proveedor')) {
        message = 'Error al procesar el archivo. Verifica que el formato sea correcto.'
      }

      throw new Error(message)
    }
  },

  /**
   * Crea automáticamente la respuesta del proveedor desde los datos actuales del pedido
   * Este endpoint reemplaza la carga de archivo Excel - genera respuesta_proveedor desde pedido.detalles
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param pedidoId Opcional: ID del pedido (si se proporciona, se usa en lugar de numeroPedido)
   * @param diferenciaReconocida Req. 1.2 (endurecimiento): true si el usuario ya vio el modal
   *   de diferencia de producción y decidió confirmar sin generar pedido hijo. El backend
   *   rechaza (400) la confirmación si detecta diferencia y este flag no viene en true.
   */
  async crearRespuestaProveedorDesdePedido(numeroPedido: string, pedidoId?: string, diferenciaReconocida?: boolean): Promise<CargarRespuestaProveedorResponse> {
    try {
      // Usar pedido_id si está disponible, sino usar numero_pedido
      const identifier = pedidoId || encodeURIComponent(numeroPedido)
      // El backend usa /crear-respuesta-desde-pedido según la implementación
      const response = await mba3Api.post<CargarRespuestaProveedorResponse>(
        `/api/pedidos/${identifier}/crear-respuesta-desde-pedido`,
        diferenciaReconocida ? { diferencia_reconocida: true } : {}
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [crearRespuestaProveedorDesdePedido] Error al crear respuesta:', error)

      // Manejar error 409 (ya existe - idempotencia)
      if (error.response?.status === 409) {
        const errorData = error.response.data
        const message = errorData?.detail || errorData?.message || 'Esta respuesta del proveedor ya existe'
        const customError = new Error(message)
          ; (customError as any).isConflict = true
          ; (customError as any).statusCode = 409
        throw customError
      }

      let message = error.message || 'Error desconocido al crear respuesta del proveedor'

      if (error.response?.data) {
        const detail = error.response.data.detail
        if (detail && typeof detail === 'object') {
          // Req. 1.2 (endurecimiento): 'diferencia_produccion_no_reconocida' llega como
          // objeto estructurado ({error, message, detalles}), no como string.
          message = detail.message || message
        } else if (detail) {
          message = detail
        } else if (error.response.data.message) {
          message = error.response.data.message
        }
      }

      const enrichedError = new Error(message)
        ; (enrichedError as any).response = error.response
        ; (enrichedError as any).errorCode = error.response?.data?.detail?.error
      throw enrichedError
    }
  },

  /**
   * Obtiene la respuesta del proveedor para un pedido
   * Requiere permiso: mba3-consultas.facturas.view
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   */
  async getRespuestaProveedor(numeroPedido: string): Promise<RespuestaProveedorResponse> {
    try {
      const response = await mba3Api.get<RespuestaProveedorResponse>(`/api/pedidos/${encodeURIComponent(numeroPedido)}/respuesta-proveedor`)
      return response.data
    } catch (error: any) {
      console.error('❌ [getRespuestaProveedor] Error al obtener respuesta:', error)

      // Si es 404, el pedido no tiene respuesta aún
      if (error.response?.status === 404) {
        throw new Error('No existe respuesta del proveedor para este pedido')
      }

      let message = error.message || 'Error desconocido al obtener respuesta del proveedor'

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
   * Procesa la confirmación del proveedor y ajusta el pedido
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param forzarRedistribucion Si true, siempre redistribuye proporcionalmente
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
        const customError = new Error(message)
          ; (customError as any).isConflict = true
          ; (customError as any).statusCode = 409
        throw customError
      }

      let message = error.message || 'Error desconocido al procesar confirmación'

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
   * Obtiene el reporte de diferencias para un pedido
   * Requiere permiso: mba3-consultas.facturas.view
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param formato Formato del reporte: 'json' (default), 'excel', 'csv' (pendiente)
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

      let message = error.message || 'Error desconocido al obtener reporte de diferencias'

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
   * Crea una orden de compra desde un pedido confirmado
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @returns Respuesta con información de la OC creada y Solicitudes de Transferencia (si se integró a SAP)
   * @deprecated Usar pedidosService.crearOrdenCompraDesdePedido() directamente
   */
  async crearOrdenCompraDesdePedido(numeroPedido: string): Promise<CrearOCDesdePedidoResponse> {
    return pedidosService.crearOrdenCompraDesdePedido(numeroPedido)
  },

  /**
   * Actualiza el costo unitario de un detalle de pedido
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param pedidoDetalleId ID del detalle del pedido a actualizar
   * @param nuevoCosto Nuevo costo unitario sin IVA
   * @deprecated Usar pedidosService.actualizarCostoPedido() directamente
   */
  async actualizarCostoPedido(
    numeroPedido: string,
    pedidoDetalleId: string,
    nuevoCosto: number
  ): Promise<ActualizarCostoPedidoResponse> {
    return pedidosService.actualizarCostoPedido(numeroPedido, pedidoDetalleId, nuevoCosto)
  },

  /**
   * Actualiza el total de un detalle de pedido
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param pedidoDetalleId ID del detalle del pedido a actualizar
   * @param nuevoTotal Nuevo total
   * @deprecated Usar pedidosService.actualizarTotalPedido() directamente
   */
  async actualizarTotalPedido(
    numeroPedido: string,
    pedidoDetalleId: string,
    nuevoTotal: number
  ): Promise<ActualizarCostoPedidoResponse> {
    return pedidosService.actualizarTotalPedido(numeroPedido, pedidoDetalleId, nuevoTotal)
  },

  /**
   * Actualiza el comentario de un detalle de pedido
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param pedidoDetalleId ID del detalle del pedido a actualizar
   * @param nuevoComentario Nuevo comentario (puede ser null para eliminar)
   * @deprecated Usar pedidosService.actualizarComentarioPedido() directamente
   */
  async actualizarComentarioPedido(
    numeroPedido: string,
    pedidoDetalleId: string,
    nuevoComentario: string | null
  ): Promise<ActualizarCostoPedidoResponse> {
    return pedidosService.actualizarComentarioPedido(numeroPedido, pedidoDetalleId, nuevoComentario)
  },

  /**
   * Actualiza la cabecera de un pedido (HU-06 - Modificar estado y fechas)
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param pedidoId ID del pedido (UUID)
   * @param datosCabecera Datos de la cabecera a modificar (estado, fechas, etc.)
   * @deprecated Usar pedidosService.actualizarCabeceraPedido() directamente
   */
  async actualizarCabeceraPedido(
    pedidoId: string,
    datosCabecera: ModificarPedidoCabeceraRequest
  ): Promise<ModificarPedidoCabeceraResponse> {
    return pedidosService.actualizarCabeceraPedido(pedidoId, datosCabecera)
  },

  /**
   * Descarta (elimina) un pedido desde Cargar Plantilla. DELETE /api/pedidos/{pedido_id}.
   * @param pedidoId ID del pedido (UUID)
   */
  async descartarPedido(pedidoId: string): Promise<void> {
    return pedidosService.descartarPedido(pedidoId)
  },

  /**
   * Cancela un pedido desde Detalle del Pedido (botón "Cancelar Pedido").
   * POST /api/pedidos/{pedido_id}/cancelar-por-el-rayo
   * Solo válido en estado CONFIRMADO POR PRODUCCION (23), y solo para odcsap.view.
   * Cambia estado a CANCELADO POR EL RAYO (20).
   * @param pedidoId ID del pedido (UUID)
   */
  async cancelarPedidoPorElRayo(pedidoId: string): Promise<any> {
    return pedidosService.cancelarPedidoPorElRayo(pedidoId)
  },

  async confirmarProduccion(pedidoId: string): Promise<any> {
    return pedidosService.confirmarProduccion(pedidoId)
  },

  /**
   * Req. 1.2 (pedidos parciales): ver domains/pedidos.ts.
   */
  async obtenerDiferenciaProduccion(numeroPedido: string): Promise<DiferenciaProduccionResponse> {
    return pedidosService.obtenerDiferenciaProduccion(numeroPedido)
  },

  async confirmarConDiferencia(numeroPedido: string, hijos: HijoDiferenciaPayload[]): Promise<ConfirmarConDiferenciaResponse> {
    return pedidosService.confirmarConDiferencia(numeroPedido, hijos)
  },

  /**
   * Descarga un pedido como Excel con estructura de "Descargar Pedido"
   * GET /api/pedidos/{pedido_id}/descargar-pedido
   * Válido desde estado GESTIONAR PEDIDO (3) en adelante.
   * @param pedidoId ID del pedido (UUID)
   * @returns Blob del archivo Excel
   */
  async descargarPedido(pedidoId: string): Promise<Blob> {
    return pedidosService.descargarPedido(pedidoId)
  },

  /**
   * Descarga un pedido con los valores ORIGINALES (antes de ediciones) en formato Excel.
   * GET /api/pedidos/{pedido_id}/descargar-pedido-original
   * Lee de las tablas pedido_original y pedido_detalle_original.
   * @param pedidoId ID del pedido (UUID)
   * @returns Blob del archivo Excel
   */
  async descargarPedidoOriginal(pedidoId: string): Promise<Blob> {
    return pedidosService.descargarPedidoOriginal(pedidoId)
  },

  /**
   * Descarga un pedido en formato CSV (compatible con Excel)
   * GET /api/pedidos/{pedido_id}/descargar-csv
   * Solo válido en estado CONFIRMADO (4).
   * @param pedidoId ID del pedido (UUID)
   * @returns Blob del archivo CSV
   */
  async descargarPedidoCsv(pedidoId: string): Promise<Blob> {
    return pedidosService.descargarPedidoCsv(pedidoId)
  },

  /**
   * Descarga la distribución por tiendas en formato Excel
   * GET /api/pedidos/{pedido_id}/distribucion/descargar-excel
   * Genera archivo Excel con distribución confirmada (3 hojas).
   * @param pedidoId ID del pedido (UUID)
   * @param version Versión específica (opcional)
   * @returns Blob del archivo Excel
   */
  async descargarDistribucionExcel(pedidoId: string, version?: number): Promise<Blob> {
    return pedidosService.descargarDistribucionExcel(pedidoId, version)
  },

  /**
   * Exporta las Solicitudes de Traslado del pedido en formato Excel
   * GET /api/pedidos/{pedido_id}/traslados/exportar-excel
   * @param pedidoId ID del pedido (UUID)
   * @param version Versión específica (opcional)
   * @returns Blob del archivo Excel
   */
  async exportarTrasladosExcel(pedidoId: string, version?: number): Promise<Blob> {
    return pedidosService.exportarTrasladosExcel(pedidoId, version)
  },

  /**
   * Exporta el Análisis de Margen de Rentabilidad por producto (req. 1.4/1.5)
   * GET /api/pedidos/{numeroPedido}/margen/exportar-excel
   * @param numeroPedido Número o UUID del pedido
   * @returns Blob del archivo Excel
   */
  async exportarAnalisisMargen(numeroPedido: string): Promise<Blob> {
    return pedidosService.exportarAnalisisMargen(numeroPedido)
  },

  /**
   * Cancela (elimina) un pedido desde Redistribución. Misma acción que descartar a nivel de BD.
   * @param pedidoId ID del pedido (UUID)
   */
  async cancelarPedido(pedidoId: string): Promise<PedidoCompleto> {
    return pedidosService.cancelarPedido(pedidoId)
  },

  /**
   * Envía un pedido en BORRADOR a EL RAYO. POST /api/pedidos/{pedido_id}/enviar.
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
    return pedidosService.enviarPedido(pedidoId)
  },

  /**
   * Marca el pedido como GESTIONAR_PEDIDO al hacer clic en "Ver Detalle". POST /api/pedidos/{pedido_id}/gestionar.
   * @param pedidoId ID del pedido (UUID)
   * @returns Pedido completo (respuesta 200)
   */
  async gestionarPedido(pedidoId: string): Promise<PedidoCompleto> {
    return pedidosService.gestionarPedido(pedidoId)
  },

  /**
   * Pasa el pedido de GESTIONAR PEDIDO a REDISTRIBUCION (desde detalle). POST /api/pedidos/{pedido_id}/confirmar-para-redistribucion.
   * @param pedidoId ID del pedido (UUID)
   * @returns Pedido completo actualizado (estado REDISTRIBUCION)
   */
  async confirmarParaRedistribucion(pedidoId: string): Promise<PedidoCompleto> {
    return pedidosService.confirmarParaRedistribucion(pedidoId)
  },

  /**
   * Marca el pedido como "Despachar y Facturar" (estado_id 17). Solo válido en CONFIRMADO_ENVIADO (12).
   */
  async marcarDespacharYFacturar(pedidoId: string): Promise<PedidoCompleto> {
    return pedidosService.marcarDespacharYFacturar(pedidoId)
  },

  /**
   * Marca el pedido como "Finalizado" (estado_id 18). Solo válido en Despachar y Facturar (17).
   */
  async marcarFinalizado(pedidoId: string): Promise<PedidoCompleto> {
    return pedidosService.marcarFinalizado(pedidoId)
  },

  /**
   * Confirma la redistribución de un pedido
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param ajustesDetalle Array de ajustes de redistribución por producto
   * @deprecated Usar pedidosService.confirmarRedistribucion() directamente
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
    return pedidosService.confirmarRedistribucion(numeroPedido, ajustesDetalle)
  },

  /**
   * Ejecuta el proceso completo: Redistribución + Generar ODC + Enviar a SAP
   * 
   * POST /api/pedidos/{numero_pedido}/proceso-completo-sap
   * 
   * @param numeroPedido Número de pedido
   * @param ajustesDetalle Array de ajustes de redistribución
   * @returns Resultado del proceso completo con detalles de cada paso
   */
  async procesoCompletoSAP(
    numeroPedido: string,
    ajustesDetalle: AjusteDetalle[]
  ): Promise<ProcesoCompletoSAPResponse> {
    return pedidosService.procesoCompletoSAP(numeroPedido, ajustesDetalle)
  },

  /**
   * Inicia el proceso completo SAP en segundo plano (async/Celery).
   * POST /api/pedidos/{numero_pedido}/proceso-completo-sap-async → 202.
   * Luego consultar resultado con getProcesoSAPResultado(process_id) (polling).
   */
  async procesoCompletoSAPAsync(
    numeroPedido: string,
    ajustesDetalle: AjusteDetalle[]
  ): Promise<ProcesoCompletoSAPAsyncResponse | ProcesoCompletoSAPResponse> {
    return pedidosService.procesoCompletoSAPAsync(numeroPedido, ajustesDetalle)
  },

  /**
   * Consulta el resultado de un proceso SAP en segundo plano (polling).
   * GET /api/pedidos/proceso-sap/resultado/{process_id}
   */
  async getProcesoSAPResultado(processId: string): Promise<ProcesoCompletoSAPResultadoPolling> {
    return pedidosService.getProcesoSAPResultado(processId)
  },

  /**
   * Obtiene datos iniciales de redistribución. Con soloLectura=true usa .../inicial?solo_lectura=1 (última confirmada).
   * @param numeroPedido Número de pedido
   * @param soloLectura Si true, devuelve la última redistribución confirmada (vista solo lectura)
   */
  async getRedistribucionInicial(numeroPedido: string, soloLectura: boolean = false) {
    return pedidosService.getRedistribucionInicial(numeroPedido, soloLectura)
  },

  /**
   * Guarda un borrador de redistribución
   * 
   * Permite al usuario guardar su progreso sin confirmar la redistribución.
   * NO cambia el estado del pedido - solo persiste los datos.
   * El usuario puede recuperar el borrador más tarde con obtenerBorradorRedistribucion().
   * 
   * @param numeroPedido Número de pedido
   * @param ajustesDetalle Array de ajustes de redistribución
   * @returns Resultado del guardado con fecha
   * @deprecated Usar pedidosService.guardarBorradorRedistribucion() directamente
   */
  async guardarBorradorRedistribucion(
    numeroPedido: string,
    ajustesDetalle: import('../types').AjusteDetalle[]
  ) {
    return pedidosService.guardarBorradorRedistribucion(numeroPedido, ajustesDetalle)
  },

  /**
   * Obtiene el borrador de redistribución guardado previamente
   * 
   * Permite recuperar el progreso del usuario si guardó un borrador antes.
   * Si no hay borrador guardado, devuelve ajustes_detalle vacío.
   * 
   * @param numeroPedido Número de pedido
   * @returns Borrador guardado con fecha o respuesta vacía si no existe
   * @deprecated Usar pedidosService.obtenerBorradorRedistribucion() directamente
   */
  async obtenerBorradorRedistribucion(numeroPedido: string) {
    return pedidosService.obtenerBorradorRedistribucion(numeroPedido)
  },

  /**
   * Obtiene la distribución guardada (cantidad por tienda) para un pedido.
   * GET /api/pedidos/{pedido_id}/distribucion. Sin version = última versión.
   * @param pedidoId UUID del pedido
   * @param version Opcional: versión concreta
   */
  async getDistribucion(pedidoId: string, version?: number) {
    return pedidosService.getDistribucion(pedidoId, version)
  },

  /**
   * Guarda las modificaciones de columnas (resaltado) para un pedido
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param modificaciones Array de modificaciones de columnas
   * @deprecated Usar pedidosService.guardarModificacionesColumnas() directamente
   */
  async guardarModificacionesColumnas(
    numeroPedido: string,
    modificaciones: Array<{ pedido_detalle_id: string; columna_key: string }>
  ): Promise<GuardarModificacionesColumnasResponse> {
    return pedidosService.guardarModificacionesColumnas(numeroPedido, modificaciones)
  },

  /**
   * Obtiene las modificaciones de columnas (resaltado) para un pedido
   * Requiere permiso: mba3-consultas.facturas.view
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @deprecated Usar pedidosService.obtenerModificacionesColumnas() directamente
   */
  async obtenerModificacionesColumnas(
    numeroPedido: string
  ): Promise<ObtenerModificacionesColumnasResponse> {
    return pedidosService.obtenerModificacionesColumnas(numeroPedido)
  },

  /**
   * Obtiene lista de pedidos con redistribución confirmada (listos para generar ODC)
   * @param filters Filtros de paginación y búsqueda
   * @deprecated Usar pedidosService.getPedidosConfirmados() directamente
   */
  async getPedidosConfirmados(filters?: {
    page?: number
    pageSize?: number
    estado?: string
    fecha_desde?: string
    fecha_hasta?: string
    tipo_fecha?: import('../types').TipoFechaFiltro
    proveedor_nombre?: string
    numero_pedido?: string
    creado_por?: string
  }): Promise<{
    data: PedidoCompleto[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    return pedidosService.getPedidosConfirmados(filters)
  },

  /**
   * Obtiene el último pedido con redistribución confirmada (para cargar en Redistribución al entrar desde dashboard).
   * Usa la lista de confirmados ordenada por el backend; devuelve el primero como "último".
   * @returns PedidoCompleto o null si no hay pedidos confirmados
   * @deprecated Usar pedidosService.getUltimoPedidoConfirmado() directamente
   */
  async getUltimoPedidoConfirmado(): Promise<PedidoCompleto | null> {
    return pedidosService.getUltimoPedidoConfirmado()
  },

  /**
   * Obtiene el último pedido con estado RESPUESTA_PROVEEDOR_CARGADA (para Redistribución al entrar desde dashboard).
   * Usa el endpoint GET /api/pedidos/ultimo-redistribucion (misma idea que cargar-plantilla y GET /api/plantillas/ultimo).
   * @param soloUsuario Si true (default), último del usuario autenticado; si false, último global.
   * @returns Objeto con numero_pedido para redirigir, o null si no hay ninguno en ese estado.
   * @deprecated Usar pedidosService.getUltimoPedidoRedistribucion() directamente
   */
  async getUltimoPedidoRedistribucion(soloUsuario: boolean = true): Promise<{ numero_pedido: string } | null> {
    return pedidosService.getUltimoPedidoRedistribucion(soloUsuario)
  },

  /**
   * Procesa ODC desde un pedido (reutiliza lógica de procesarOC pero para pedidos)
   * Aplica transformación docenas→unidades SAP automáticamente
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
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
   * Requiere permiso: mba3-consultas.facturas.view
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
        throw new Error('No existe procesamiento SAP para este pedido. Primero debe confirmar la redistribución.')
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

  /**
   * Obtiene lista de pedidos con filtros y paginación
   * Requiere permiso: mba3-consultas.facturas.view
   * @param filtros Filtros opcionales para la búsqueda
   * @returns Lista de pedidos con metadata de paginación
   * @deprecated Usar pedidosService.getPedidosListado() directamente
   */
  async getPedidosListado(filtros?: import('../types').PedidosListadoFiltros): Promise<import('../types').PedidosListadoResponse> {
    return pedidosService.getPedidosListado(filtros)
  },

  /**
   * Ajusta automáticamente las bodegas cuando cambian las tiendas
   * Mantiene el total confirmado constante
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param ajustesDetalle Array de ajustes de redistribución por producto
   * @deprecated Usar pedidosService.ajustarBodegas() directamente
   */
  async ajustarBodegas(
    numeroPedido: string,
    ajustesDetalle: AjusteDetalle[]
  ): Promise<{
    status: 'success'
    message: string
    redistribucion_ajustada: AjusteDetalle[]
  }> {
    return pedidosService.ajustarBodegas(numeroPedido, ajustesDetalle)
  },

  /**
   * Verifica si existen pedidos en el sistema
   * @returns Respuesta indicando si hay pedidos guardados
   * @deprecated Usar pedidosService.tienePedidos() directamente
   */
  async tienePedidos(): Promise<TienePedidosResponse> {
    return pedidosService.tienePedidos()
  },

  // ========== Storage de Archivos (MinIO/S3) ==========

  /**
   * Obtiene información del archivo Excel original almacenado en MinIO/S3
   * Permite verificar si existe el archivo antes de mostrar el botón de descarga.
   * GET /api/plantillas/{pedido_id}/info-archivo
   * @param pedidoId ID del pedido (UUID)
   * @returns Información del archivo o indicador de que no existe
   * @deprecated Usar pedidosService.getInfoArchivoPlantilla() directamente
   */
  async getInfoArchivoPlantilla(pedidoId: string): Promise<InfoArchivoPlantillaResponse> {
    return pedidosService.getInfoArchivoPlantilla(pedidoId)
  },

  /**
   * Descarga el archivo Excel original almacenado en MinIO/S3
   * GET /api/plantillas/{pedido_id}/descargar-original
   * @param pedidoId ID del pedido (UUID)
   * @returns Blob del archivo Excel original
   * @deprecated Usar pedidosService.descargarExcelOriginal() directamente
   */
  async descargarExcelOriginal(pedidoId: string): Promise<Blob> {
    return pedidosService.descargarExcelOriginal(pedidoId)
  },

  // ========== Búsqueda de Plantillas ==========

  /**
   * Busca plantillas/pedidos por número de pedido (búsqueda parcial)
   * 
   * Diseñado para el campo de búsqueda de "Cargar Plantilla":
   * - Búsqueda parcial (ej: "P-12" encuentra "P-12.08 - 12 - 2025")
   * - Incluye pedidos en estado BORRADOR
   * - Filtra por usuario actual
   * - No requiere otros campos de filtro
   * 
   * GET /api/plantillas/buscar?numero_pedido={query}
   * @param numeroPedido Texto de búsqueda (parcial o completo)
   * @returns Lista de pedidos que coinciden
   * @deprecated Usar pedidosService.buscarPlantillas() directamente
   */
  async buscarPlantillas(numeroPedido: string): Promise<BuscarPlantillasResponse> {
    return pedidosService.buscarPlantillas(numeroPedido)
  },

  /**
   * Obtiene la lista de pedidos para la página "Cargar Plantilla"
   * 
   * A diferencia de getPedidosListado (GET /api/pedidos):
   * - INCLUYE pedidos en estado BORRADOR
   * - No filtra por usuario: visibles para todos con permiso mba3-consultas.facturas.view
   *
   * GET /api/plantillas/pedidos
   * @param filtros Filtros opcionales (estado, numero_pedido, creado_por, limit, offset)
   * @returns Lista de pedidos con paginación
   * @deprecated Usar pedidosService.getPlantillasPedidos() directamente
   */
  async getPlantillasPedidos(filtros?: {
    estado?: string
    numero_pedido?: string
    creado_por?: string
    fecha_desde?: string
    fecha_hasta?: string
    tipo_fecha?: import('../types').TipoFechaFiltro
    limit?: number
    offset?: number
    solo_pendientes_accion?: boolean
  }): Promise<PlantillasPedidosResponse> {
    return pedidosService.getPlantillasPedidos(filtros)
  },

  /**
   * Obtiene la lista de estados de pedido para dropdowns de filtros.
   * 
   * GET /api/pedidos/estados?contexto={contexto}
   * @param contexto Contexto que determina qué estados devolver
   * @returns Lista de estados con id, nombre y orden
   * @deprecated Usar pedidosService.getEstadosPedido() directamente
   */
  async getEstadosPedido(contexto?: 'pedidos' | 'redistribucion' | 'cargar-plantilla' | 'produccion'): Promise<EstadosPedidoResponse> {
    return pedidosService.getEstadosPedido(contexto)
  },
}

