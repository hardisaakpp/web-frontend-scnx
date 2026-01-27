import axios from 'axios'
import router from '@/router'
import type {
  Despacho,
  DespachoDetalle
} from '../types'
import type { OrdenCompraResponse, OrdenCompraLogResponse, RemisionResponse } from '../types'
import type { HealthResponse, ProcesoResponse } from '../types'
import type { SkuHomologacionResponse, SkuHomologacionUpdateRequest, SkuHomologacionCreateRequest, CruceProductosResponse, SugerenciasResponse, EstadoSincronizacionResponse, SincronizarMaestrosResponse, IniciarCruceResponse, ProcesoEstadoSSE, ProcesoEstado, ProcesoEstadoResponse, SugerenciaProducto, SugerenciasSkuResponse, DetallesOCResponse, ActualizarSkuRequest, ActualizarSkuResponse, BuscarSkuMba3Response, UploadPlantillaResponse, PedidoCompleto, CargarRespuestaProveedorResponse, RespuestaProveedorResponse, ProcesarConfirmacionResponse, ReporteDiferenciasResponse, IntegracionSAPResponse, ActualizarCostoPedidoResponse, AjusteDetalle, ResumenConfirmacion, GuardarModificacionesColumnasRequest, GuardarModificacionesColumnasResponse, ObtenerModificacionesColumnasResponse, ProcesamientoSAPResponse, PedidosListadoResponse, CrearOCDesdePedidoResponse, CrearPedidoRequest, CrearPedidoResponse, ModificarPedidoCabeceraRequest, ModificarPedidoCabeceraResponse, TienePedidosResponse } from '../types'

// Usar la URL base del backend MBA3
const API_BASE_URL = import.meta.env.VITE_MBA3_API_BASE_URL || 'http://localhost:8000'

// Crear instancia de axios específica para este módulo
const mba3Api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Interceptor para agregar token JWT en cada request
mba3Api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')

    if (token) {
      // Usar la misma sintaxis que funciona en api.js
      if (!config.headers) {
        config.headers = {}
      }
      config.headers.Authorization = `Bearer ${token}`
    }

    // Si es FormData, eliminar Content-Type para que axios lo establezca automáticamente con boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }

    return config
  },
  error => {
    console.error('❌ [MBA3 API Request] Error en interceptor:', error)
    return Promise.reject(error)
  }
)

/**
 * ⭐ SISTEMA DE TIMEOUT SINCRONIZADO FRONTEND-BACKEND
 * 
 * El backend puede comunicar el timeout recomendado mediante headers HTTP:
 * - X-Request-Timeout: Tiempo en segundos que el backend recomienda para esta operación
 * - X-Request-Timeout-Min: Tiempo mínimo en segundos (fallback seguro)
 * 
 * El frontend lee estos headers y ajusta dinámicamente el timeout.
 * Si el backend no envía headers, se usa un timeout por defecto seguro.
 */

// Interceptor para manejar errores y autenticación
mba3Api.interceptors.response.use(
  (response) => {
    // ⭐ Leer headers de timeout del backend y loguear para debugging
    const timeoutHeader = response.headers['x-request-timeout']
    const timeoutMinHeader = response.headers['x-request-timeout-min']
    
    if (timeoutHeader || timeoutMinHeader) {
      console.debug(`⏱️ [MBA3 API] Backend recomienda timeout: ${timeoutHeader || 'N/A'}s (mín: ${timeoutMinHeader || 'N/A'}s)`)
    }
    
    return response
  },
  (error) => {
    // Manejar errores 401 (token inválido o expirado)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }

    // Endpoints que pueden retornar 404 como respuesta válida (no son errores críticos)
    const url = error.config?.url || ''
    const isExpected404 = error.response?.status === 404 && (
      url.includes('/api/plantillas/ultimo') || // No hay pedidos es válido
      url.includes('/api/plantillas/') || // Pedido no encontrado es válido
      url.includes('/api/pedidos/ultimo-redistribucion') // No hay último para redistribución es válido
    )

    // Solo loguear errores que no sean 404 esperados
    if (!isExpected404) {
      // Log detallado del error para debugging
      console.error('🔍 [MBA3 API Interceptor] Error capturado:', error)
      if (error.response) {
        console.error('🔍 [MBA3 API Interceptor] Status:', error.response.status)
        console.error('🔍 [MBA3 API Interceptor] Data completa:', error.response.data)
        console.error('🔍 [MBA3 API Interceptor] URL:', error.config?.url)
        console.error('🔍 [MBA3 API Interceptor] Method:', error.config?.method)
      } else if (error.request) {
        console.error('🔍 [MBA3 API Interceptor] Request Error:', error.request)
        console.error('🔍 [MBA3 API Interceptor] No se recibió respuesta del servidor')
      }
    }

    // NO modificar el error aquí - dejarlo pasar tal cual para que cada método lo maneje
    // Solo agregar información del response data al error si no la tiene
    if (error.response?.data && !error.responseData) {
      error.responseData = error.response.data
    }

    return Promise.reject(error)
  }
)

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
    
    // ⭐ TIMEOUT SINCRONIZADO CON BACKEND
    // Calcular timeout dinámico basado en:
    // 1. Número de ODCs a procesar (más ODCs = más tiempo)
    // 2. Headers del backend si están disponibles (en futuras respuestas)
    // 3. Timeout por defecto seguro
    const numOrdenes = Array.isArray(referenciaDespacho) ? referenciaDespacho.length : (referenciaDespacho ? 1 : 0)
    
    // Timeout base: 60s para 1 ODC, +30s por cada ODC adicional
    // Esto cubre: envío a SAP (~10s), emails (~4s), transferencias (~1-5s x tienda), notificaciones
    // El proceso completo puede tomar ~36-40s para 1 ODC según logs
    const baseTimeout = 60000 // 60 segundos base
    const timeoutPerOrden = 30000 // +30 segundos por cada ODC adicional
    const calculatedTimeout = baseTimeout + (numOrdenes > 1 ? (numOrdenes - 1) * timeoutPerOrden : 0)
    
    // Timeout máximo de seguridad: 5 minutos (300s)
    // Timeout mínimo: 60 segundos
    const minTimeout = 60000
    const maxTimeout = 300000
    const finalTimeout = Math.max(minTimeout, Math.min(maxTimeout, calculatedTimeout))
    
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
  async getOrdenesCompra(estado?: string, page: number = 1, pageSize: number = 10): Promise<OrdenCompraResponse> {
    const params = new URLSearchParams()
    // Solo agregar el parámetro estado si está definido y no es undefined
    // Si estado es undefined, no se agrega el parámetro, lo que debería devolver todas las órdenes
    if (estado !== undefined && estado !== null && estado !== '') {
      params.append('estado', estado)
    }
    params.append('page', page.toString())
    params.append('pageSize', pageSize.toString())

    const queryString = params.toString()
    const url = queryString ? `/ordenes-compra?${queryString}` : '/ordenes-compra'
    const response = await mba3Api.get<OrdenCompraResponse>(url)
    return response.data
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
      const response = await mba3Api.get<OrdenCompraLogResponse>(url)
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

          const response = await mba3Api.post<OrdenCompraLogResponse>('/ordenes-compra/logs', body)
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
            console.log('🛑 [seguirProgresoCruce] Stream cancelado por el usuario')
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

  // Realizar cruce de productos entre MBA3 y SAP (método legacy - mantener para compatibilidad)
  async realizarCruce(): Promise<CruceProductosResponse> {
    try {
      // Timeout extendido ya que el cruce puede tardar
      const response = await mba3Api.get<CruceProductosResponse>('/cruce-productos/realizar-cruce', {
        timeout: 120000 // 2 minutos
      })
      return response.data
    } catch (error: any) {
      console.error('❌ [realizarCruce] Error al realizar cruce de productos:', error)
      throw new Error(`No se pudo realizar el cruce de productos. Error: ${error.message}`)
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

  /**
   * Sube y procesa un archivo Excel de plantilla
   * Requiere permiso: mba3-consultas.proceso.execute
   */
  async uploadPlantilla(file: File): Promise<UploadPlantillaResponse> {
    try {
      // Validar tipo de archivo - solo Excel
      const allowedExtensions = ['.xlsx', '.xls']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))

      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(`Tipo de archivo no permitido. Solo se permiten: ${allowedExtensions.join(', ')}`)
      }

      // Validar tamaño (10 MB máximo)
      const maxSize = 10 * 1024 * 1024 // 10 MB en bytes
      if (file.size > maxSize) {
        throw new Error('El archivo excede el tamaño máximo de 10 MB')
      }

      const formData = new FormData()
      formData.append('file', file)

      // Para FormData, axios establecerá automáticamente el Content-Type con el boundary correcto
      // El interceptor se encargará de eliminar el Content-Type por defecto si es FormData
      const response = await mba3Api.post<UploadPlantillaResponse>(
        '/api/plantillas/upload',
        formData
      )

      // Normalizar claves del backend (validation -> validacion) para el frontend
      const data: any = { ...response.data }
      if (data && data.validation && !data.validacion) {
        data.validacion = data.validation
      }
      if (data && data.validation_sap && !data.validacion_sap) {
        data.validacion_sap = data.validation_sap
      }
      return data as UploadPlantillaResponse
    } catch (error: any) {
      console.error('❌ [uploadPlantilla] Error al subir plantilla:', error)
      console.error('❌ [uploadPlantilla] Response data:', error.response?.data)

      // Extraer mensaje de error más descriptivo
      let message = error.message || 'Error desconocido al subir plantilla'
      let hasBackendMessage = false

      // Si el backend retorna 400 con cuerpo de validación, devolverlo como resultado manejable
      if (error.response?.status === 400 && error.response?.data?.status === 'validation_error') {
        const raw = error.response.data
        const data: any = { ...raw }
        if (data && data.validation && !data.validacion) {
          data.validacion = data.validation
        }
        if (data && data.validation_sap && !data.validacion_sap) {
          data.validacion_sap = data.validation_sap
        }
        // Asegurar campos mínimos
        if (!data.message && data.detail) {
          data.message = data.detail
        }
        return data as UploadPlantillaResponse
      }

      if (error.response?.data) {
        // Prioridad 1: Manejar business_exception (nuevo tipo de error)
        if (error.response.data.type === 'business_exception') {
          hasBackendMessage = true
          message = error.response.data.error || error.response.data.message || 'No se puede procesar: productos no válidos en SAP'
          // Preservar información adicional para mejor manejo
          ; (error as any).isBusinessException = true
          ; (error as any).businessError = error.response.data.error
        }
        // Prioridad 2: Verificar campo 'error' primero (antes que detail)
        else if (error.response.data.error) {
          hasBackendMessage = true
          message = error.response.data.error
        }
        // Prioridad 3: FastAPI puede retornar detail como string, array, o objeto
        else if (error.response.data.detail) {
          hasBackendMessage = true
          const detail = error.response.data.detail

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
            // Intentar convertir a string
            message = String(detail)
          }
        }
        // Prioridad 4: Campo 'message'
        else if (error.response.data.message) {
          hasBackendMessage = true
          message = error.response.data.message
        }
      } else if (error.request) {
        // Error de red (sin respuesta del servidor)
        message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      }

      // Solo usar mensaje genérico si NO tenemos un mensaje del backend y el mensaje es genérico
      if (!hasBackendMessage && (message === 'Request failed with status code 400' ||
        message.includes('status code') ||
        message === 'Error desconocido al subir plantilla')) {
        message = 'Error al procesar el archivo. Verifica que el formato sea correcto y que no sea un pedido duplicado.'
      }

      // Preservar response.data en el error para que useFileUpload pueda acceder a los datos estructurados
      const errorWithResponse = new Error(message) as any
      errorWithResponse.response = error.response
      errorWithResponse.isBusinessException = (error as any).isBusinessException
      errorWithResponse.businessError = (error as any).businessError
      throw errorWithResponse
    }
  },

  /**
   * ⭐ NUEVO: Sube una plantilla Excel con correcciones de códigos aplicadas
   * Similar a uploadPlantilla pero acepta un mapa de correcciones {codigo_original: codigo_sap_corregido}
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
        timeout: 120000 // 120 segundos (2 minutos)
      })

      const data: any = { ...response.data }
      if (data && data.validation && !data.validacion) {
        data.validacion = data.validation
      }
      if (data && data.validation_sap && !data.validacion_sap) {
        data.validacion_sap = data.validation_sap
      }
      
      return data as UploadPlantillaResponse
    } catch (error: any) {
      console.error('❌ [uploadPlantillaConCorrecciones] Error al subir plantilla con correcciones:', error)
      
      // Reutilizar la misma lógica de manejo de errores que uploadPlantilla
      let message = error.message || 'Error desconocido al subir plantilla con correcciones'
      let hasBackendMessage = false

      // Si el backend retorna 400 con cuerpo de validación, devolverlo como resultado manejable
      if (error.response?.status === 400 && error.response?.data?.status === 'validation_error') {
        const raw = error.response.data
        const data: any = { ...raw }
        if (data && data.validation && !data.validacion) {
          data.validacion = data.validation
        }
        if (data && data.validation_sap && !data.validacion_sap) {
          data.validacion_sap = data.validation_sap
        }
        if (!data.message && data.detail) {
          data.message = data.detail
        }
        return data as UploadPlantillaResponse
      }

      if (error.response?.data) {
        if (error.response.data.type === 'business_exception') {
          hasBackendMessage = true
          message = error.response.data.error || error.response.data.message || 'Error al procesar con correcciones aplicadas'
          ;(error as any).isBusinessException = true
          ;(error as any).businessError = error.response.data.error
        } else if (error.response.data.error) {
          hasBackendMessage = true
          message = error.response.data.error
        } else if (error.response.data.detail) {
          hasBackendMessage = true
          const detail = error.response.data.detail
          if (Array.isArray(detail)) {
            message = detail.map((item: any) => {
              if (typeof item === 'string') return item
              if (item?.msg) return item.msg
              if (item?.loc && item?.msg) {
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
        }
      } else if (error.request) {
        message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      }

      if (!hasBackendMessage && (message === 'Request failed with status code 400' ||
        message.includes('status code') ||
        message === 'Error desconocido al subir plantilla con correcciones')) {
        message = 'Error al procesar el archivo con las correcciones aplicadas. Verifica que los códigos corregidos sean válidos en SAP.'
      }

      const errorWithResponse = new Error(message) as any
      errorWithResponse.response = error.response
      errorWithResponse.isBusinessException = (error as any).isBusinessException
      errorWithResponse.businessError = (error as any).businessError
      throw errorWithResponse
    }
  },

  /**
   * Crea un pedido manualmente por pantalla (sin Excel)
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param pedidoData Datos del pedido a crear
   */
  async crearPedidoManual(pedidoData: CrearPedidoRequest): Promise<CrearPedidoResponse> {
    try {
      const response = await mba3Api.post<CrearPedidoResponse>(
        '/api/pedidos',
        pedidoData
      )

      // Normalizar claves del backend (validation -> validacion) para el frontend
      const data: any = { ...response.data }
      if (data && data.validation && !data.validacion) {
        data.validacion = data.validation
      }
      if (data && data.validation_sap && !data.validacion_sap) {
        data.validacion_sap = data.validacion_sap
      }
      return data as CrearPedidoResponse
    } catch (error: any) {
      console.error('❌ [crearPedidoManual] Error al crear pedido:', error)
      console.error('❌ [crearPedidoManual] Response data:', error.response?.data)

      // Extraer mensaje de error más descriptivo
      let message = error.message || 'Error desconocido al crear pedido'
      let hasBackendMessage = false

      // Si el backend retorna 400 con cuerpo de validación, devolverlo como resultado manejable
      if (error.response?.status === 400 && error.response?.data?.status === 'validation_error') {
        const raw = error.response.data
        const data: any = { ...raw }
        if (data && data.validation && !data.validacion) {
          data.validacion = data.validation
        }
        if (data && data.validation_sap && !data.validacion_sap) {
          data.validacion_sap = data.validation_sap
        }
        // Asegurar campos mínimos
        if (!data.message && data.detail) {
          data.message = data.detail
        }
        return data as CrearPedidoResponse
      }

      if (error.response?.data) {
        // Prioridad 1: Manejar business_exception
        if (error.response.data.type === 'business_exception') {
          hasBackendMessage = true
          message = error.response.data.error || error.response.data.message || 'No se puede procesar: productos no válidos en SAP'
          console.log('✅ [crearPedidoManual] Business exception detectada:', message)
          ;(error as any).isBusinessException = true
          ;(error as any).businessError = error.response.data.error
        }
        // Prioridad 2: Manejar array de errores (status: 'error' con errors array)
        else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          hasBackendMessage = true
          const errorMessages = error.response.data.errors.map((err: any) => {
            if (typeof err === 'string') return err
            if (err?.msg) return err.msg
            if (err?.message) return err.message
            if (err?.loc && err?.msg) {
              const location = Array.isArray(err.loc) ? err.loc.join('.') : String(err.loc)
              return `${location}: ${err.msg}`
            }
            return JSON.stringify(err)
          })
          message = errorMessages.join('\n') || error.response.data.detail || error.response.data.message || 'Error de validación en la solicitud'
          console.log('✅ [crearPedidoManual] Errores array detectado:', error.response.data.errors)
          console.log('✅ [crearPedidoManual] Mensajes extraídos:', errorMessages)
        }
        // Prioridad 3: Verificar campo 'error' primero
        else if (error.response.data.error) {
          hasBackendMessage = true
          message = error.response.data.error
          console.log('✅ [crearPedidoManual] Error field detectado:', message)
        }
        // Prioridad 4: FastAPI puede retornar detail como string, array, o objeto
        else if (error.response.data.detail) {
          hasBackendMessage = true
          const detail = error.response.data.detail

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
          console.log('✅ [crearPedidoManual] Detail field detectado:', message)
        }
        // Prioridad 5: Campo 'message'
        else if (error.response.data.message) {
          hasBackendMessage = true
          message = error.response.data.message
          console.log('✅ [crearPedidoManual] Message field detectado:', message)
        }
      } else if (error.request) {
        // Error de red (sin respuesta del servidor)
        message = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      }

      // Solo usar mensaje genérico si NO tenemos un mensaje del backend
      if (!hasBackendMessage && (message === 'Request failed with status code 400' ||
        message.includes('status code') ||
        message === 'Error desconocido al crear pedido')) {
        message = 'Error al crear el pedido. Verifica que los datos sean correctos.'
      }

      console.log('🔴 [crearPedidoManual] Mensaje final de error:', message)
      throw new Error(message)
    }
  },

  /**
   * Obtiene un pedido completo por número de pedido
   * Requiere permiso: mba3-consultas.facturas.view
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param incluirRespuesta Si es true, incluye respuesta_proveedor si existe
   */
  async getPedido(numeroPedido: string, incluirRespuesta: boolean = false): Promise<PedidoCompleto> {
    try {
      const params = incluirRespuesta ? '?incluir_respuesta=true' : ''
      const response = await mba3Api.get<PedidoCompleto>(`/api/plantillas/${numeroPedido}${params}`)
      return response.data
    } catch (error: any) {
      console.error('❌ [getPedido] Error al obtener pedido:', error)

      // Extraer mensaje de error más descriptivo
      let message = error.message || 'Error desconocido al obtener pedido'

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
   * Obtiene el último pedido cargado por el usuario autenticado
   * Requiere permiso: mba3-consultas.facturas.view
   * @param incluirRespuesta Si es true, incluye respuesta_proveedor si existe
   * @returns PedidoCompleto o null si no hay pedidos
   */
  async getUltimoPedido(incluirRespuesta: boolean = false): Promise<PedidoCompleto | null> {
    try {
      const params = incluirRespuesta ? '?incluir_respuesta=true' : ''
      // El backend ahora devuelve el formato directo {cabecera, detalles} igual que getPedido
      // Retorna 200 con null cuando no hay pedidos (evita logs de 404)
      const response = await mba3Api.get<PedidoCompleto | null>(`/api/plantillas/ultimo${params}`)
      
      // Si la respuesta es null o no tiene la estructura esperada, no hay pedidos
      if (!response.data || !response.data.cabecera) {
        return null
      }
      
      return response.data
    } catch (error: any) {
      console.error('❌ [getUltimoPedido] Error al obtener último pedido:', error)

      // Extraer mensaje de error más descriptivo
      let message = error.message || 'Error desconocido al obtener último pedido'

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
   * Exporta un pedido en formato Excel para enviar al proveedor
   * Requiere permiso: mba3-consultas.facturas.view
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @returns Blob del archivo Excel
   */
  async exportarPedidoParaProveedor(numeroPedido: string): Promise<Blob> {
    try {
      const response = await mba3Api.get<Blob>(`/api/pedidos/${encodeURIComponent(numeroPedido)}/exportar-para-proveedor`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error: any) {
      console.error('❌ [exportarPedidoParaProveedor] Error al exportar pedido:', error)

      let message = error.message || 'Error desconocido al exportar pedido'

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
   * Exporta un pedido en formato plano (CSV o TXT) para subir en MBA
   * HU-08: Permite a usuarios de El Rayo descargar el pedido en archivo plano
   * Requiere permiso: mba3-consultas.facturas.view
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param formato Formato de salida: 'csv' o 'txt' (por defecto 'csv')
   * @returns Blob del archivo plano
   */
  async exportarPedidoPlanoMba(numeroPedido: string, formato: 'csv' | 'txt' = 'csv'): Promise<Blob> {
    try {
      const response = await mba3Api.get<Blob>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/exportar-plano-mba?formato=${formato}`,
        {
          responseType: 'blob',
        }
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [exportarPedidoPlanoMba] Error al exportar pedido plano:', error)

      let message = error.message || 'Error desconocido al exportar pedido plano'

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

      // Validar tamaño (10 MB máximo)
      const maxSize = 10 * 1024 * 1024 // 10 MB en bytes
      if (file.size > maxSize) {
        throw new Error('El archivo excede el tamaño máximo de 10 MB')
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
   */
  async crearRespuestaProveedorDesdePedido(numeroPedido: string, pedidoId?: string): Promise<CargarRespuestaProveedorResponse> {
    try {
      // Usar pedido_id si está disponible, sino usar numero_pedido
      const identifier = pedidoId || encodeURIComponent(numeroPedido)
      // El backend usa /crear-respuesta-desde-pedido según la implementación
      const response = await mba3Api.post<CargarRespuestaProveedorResponse>(
        `/api/pedidos/${identifier}/crear-respuesta-desde-pedido`,
        {}
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
   */
  async crearOrdenCompraDesdePedido(numeroPedido: string): Promise<CrearOCDesdePedidoResponse> {
    try {
      const response = await mba3Api.post<CrearOCDesdePedidoResponse>(`/api/pedidos/${encodeURIComponent(numeroPedido)}/crear-orden-compra`)
      return response.data
    } catch (error: any) {
      console.error('❌ [crearOrdenCompraDesdePedido] Error al crear orden de compra:', error)

      let message = error.message || 'Error desconocido al crear orden de compra'

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
   * Actualiza el costo unitario de un detalle de pedido
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param pedidoDetalleId ID del detalle del pedido a actualizar
   * @param nuevoCosto Nuevo costo unitario sin IVA
   */
  async actualizarCostoPedido(
    numeroPedido: string,
    pedidoDetalleId: string,
    nuevoCosto: number
  ): Promise<ActualizarCostoPedidoResponse> {
    try {
      // ⭐ CORRECCIÓN: El backend espera 'costo_doc_sin_iva' en lugar de 'costo'
      const payload = {
        costo_doc_sin_iva: nuevoCosto
      }

      console.log('📤 [actualizarCostoPedido] Enviando:', {
        url: `/api/pedidos/${encodeURIComponent(numeroPedido)}/detalle/${pedidoDetalleId}/costo`,
        payload
      })

      const response = await mba3Api.patch<ActualizarCostoPedidoResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/detalle/${pedidoDetalleId}/costo`,
        payload
      )

      console.log('✅ [actualizarCostoPedido] Respuesta exitosa:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ [actualizarCostoPedido] Error al actualizar costo:', error)

      let message = error.message || 'Error desconocido al actualizar costo'
      let detailedError = ''

      if (error.response?.data) {
        // Loguear los errores detallados del backend
        if (error.response.data.errors) {
          console.error('❌ [actualizarCostoPedido] Errores de validación:', error.response.data.errors)
          detailedError = error.response.data.errors
            .map((e: any) => typeof e === 'string' ? e : e.msg || e.message || JSON.stringify(e))
            .join('; ')
        }

        if (error.response.data.detail) {
          message = error.response.data.detail
        } else if (error.response.data.message) {
          message = error.response.data.message
        }
      }

      const finalMessage = detailedError ? `${message}. Detalles: ${detailedError}` : message
      console.error('❌ [actualizarCostoPedido] Mensaje final:', finalMessage)

      throw new Error(finalMessage)
    }
  },

  /**
   * Actualiza el total de un detalle de pedido
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param pedidoDetalleId ID del detalle del pedido a actualizar
   * @param nuevoTotal Nuevo total
   */
  async actualizarTotalPedido(
    numeroPedido: string,
    pedidoDetalleId: string,
    nuevoTotal: number
  ): Promise<ActualizarCostoPedidoResponse> {
    try {
      const payload = {
        total: nuevoTotal
      }

      console.log('📤 [actualizarTotalPedido] Enviando:', {
        url: `/api/pedidos/${encodeURIComponent(numeroPedido)}/detalle/${pedidoDetalleId}/total`,
        payload
      })

      const response = await mba3Api.patch<ActualizarCostoPedidoResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/detalle/${pedidoDetalleId}/total`,
        payload
      )

      console.log('✅ [actualizarTotalPedido] Respuesta exitosa:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ [actualizarTotalPedido] Error al actualizar total:', error)

      let message = error.message || 'Error desconocido al actualizar total'
      let detailedError = ''

      if (error.response?.data) {
        // Loguear los errores detallados del backend
        if (error.response.data.errors) {
          console.error('❌ [actualizarTotalPedido] Errores de validación:', error.response.data.errors)
          detailedError = error.response.data.errors
            .map((e: any) => typeof e === 'string' ? e : e.msg || e.message || JSON.stringify(e))
            .join('; ')
        }

        if (error.response.data.detail) {
          message = error.response.data.detail
        } else if (error.response.data.message) {
          message = error.response.data.message
        }
      }

      const finalMessage = detailedError ? `${message}. Detalles: ${detailedError}` : message
      console.error('❌ [actualizarTotalPedido] Mensaje final:', finalMessage)

      throw new Error(finalMessage)
    }
  },

  /**
   * Actualiza el comentario de un detalle de pedido
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param pedidoDetalleId ID del detalle del pedido a actualizar
   * @param nuevoComentario Nuevo comentario (puede ser null para eliminar)
   */
  async actualizarComentarioPedido(
    numeroPedido: string,
    pedidoDetalleId: string,
    nuevoComentario: string | null
  ): Promise<ActualizarCostoPedidoResponse> {
    try {
      const payload = {
        comentario: nuevoComentario
      }

      console.log('📤 [actualizarComentarioPedido] Enviando:', {
        url: `/api/pedidos/${encodeURIComponent(numeroPedido)}/detalle/${pedidoDetalleId}/comentario`,
        payload
      })

      const response = await mba3Api.patch<ActualizarCostoPedidoResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/detalle/${pedidoDetalleId}/comentario`,
        payload
      )

      console.log('✅ [actualizarComentarioPedido] Respuesta exitosa:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ [actualizarComentarioPedido] Error al actualizar comentario:', error)

      let message = error.message || 'Error desconocido al actualizar comentario'
      let detailedError = ''

      if (error.response?.data) {
        // Loguear los errores detallados del backend
        if (error.response.data.errors) {
          console.error('❌ [actualizarComentarioPedido] Errores de validación:', error.response.data.errors)
          detailedError = error.response.data.errors
            .map((e: any) => typeof e === 'string' ? e : e.msg || e.message || JSON.stringify(e))
            .join('; ')
        }

        if (error.response.data.detail) {
          message = error.response.data.detail
        } else if (error.response.data.message) {
          message = error.response.data.message
        }
      }

      const finalMessage = detailedError ? `${message}. Detalles: ${detailedError}` : message
      console.error('❌ [actualizarComentarioPedido] Mensaje final:', finalMessage)

      throw new Error(finalMessage)
    }
  },

  /**
   * Actualiza la cabecera de un pedido (HU-06 - Modificar estado y fechas)
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param pedidoId ID del pedido (UUID)
   * @param datosCabecera Datos de la cabecera a modificar (estado, fechas, etc.)
   */
  async actualizarCabeceraPedido(
    pedidoId: string,
    datosCabecera: ModificarPedidoCabeceraRequest
  ): Promise<ModificarPedidoCabeceraResponse> {
    try {
      console.log('📤 [actualizarCabeceraPedido] Enviando:', {
        url: `/api/pedidos/${pedidoId}`,
        payload: datosCabecera
      })

      const response = await mba3Api.put<ModificarPedidoCabeceraResponse>(
        `/api/pedidos/${pedidoId}`,
        datosCabecera
      )

      console.log('✅ [actualizarCabeceraPedido] Respuesta exitosa:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ [actualizarCabeceraPedido] Error al actualizar cabecera:', error)

      let message = error.message || 'Error desconocido al actualizar cabecera'
      let detailedError = ''

      if (error.response?.data) {
        // Loguear los errores detallados del backend
        if (error.response.data.errors) {
          console.error('❌ [actualizarCabeceraPedido] Errores de validación:', error.response.data.errors)
          detailedError = error.response.data.errors
            .map((e: any) => typeof e === 'string' ? e : e.msg || e.message || JSON.stringify(e))
            .join('; ')
        }

        if (error.response.data.detail) {
          message = error.response.data.detail
        } else if (error.response.data.message) {
          message = error.response.data.message
        }
      }

      const finalMessage = detailedError ? `${message}. Detalles: ${detailedError}` : message
      console.error('❌ [actualizarCabeceraPedido] Mensaje final:', finalMessage)

      throw new Error(finalMessage)
    }
  },

  /**
   * Confirma la redistribución de un pedido
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param ajustesDetalle Array de ajustes de redistribución por producto
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
      const response = await mba3Api.post<{
        status: 'success'
        message: string
        pedido_id: string
        redistribucion_id: string
        fecha_confirmacion: string
        resumen: ResumenConfirmacion
        ajustes_aplicados: number
      }>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/redistribucion/confirmar`,
        { ajustes_detalle: ajustesDetalle }
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [confirmarRedistribucion] Error al confirmar redistribución:', error)

      let message = error.message || 'Error desconocido al confirmar redistribución'

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
   * Guarda las modificaciones de columnas (resaltado) para un pedido
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param modificaciones Array de modificaciones de columnas
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

      console.log('📤 [guardarModificacionesColumnas] Enviando:', {
        url: `/api/pedidos/${encodeURIComponent(numeroPedido)}/modificaciones-columnas`,
        payload,
        modificaciones_count: modificaciones.length
      })

      const response = await mba3Api.post<GuardarModificacionesColumnasResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/modificaciones-columnas`,
        payload
      )

      console.log('✅ [guardarModificacionesColumnas] Respuesta exitosa:', response.data)
      return response.data
    } catch (error: any) {
      console.error('❌ [guardarModificacionesColumnas] Error al guardar modificaciones:', error)

      let message = error.message || 'Error desconocido al guardar modificaciones'

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
   * Obtiene las modificaciones de columnas (resaltado) para un pedido
   * Requiere permiso: mba3-consultas.facturas.view
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   */
  async obtenerModificacionesColumnas(
    numeroPedido: string
  ): Promise<ObtenerModificacionesColumnasResponse> {
    try {
      console.log('📤 [obtenerModificacionesColumnas] Obteniendo:', {
        url: `/api/pedidos/${encodeURIComponent(numeroPedido)}/modificaciones-columnas`
      })

      const response = await mba3Api.get<ObtenerModificacionesColumnasResponse>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/modificaciones-columnas`
      )

      console.log('✅ [obtenerModificacionesColumnas] Respuesta exitosa:', {
        modificaciones_count: response.data.modificaciones?.length || 0
      })
      return response.data
    } catch (error: any) {
      console.error('❌ [obtenerModificacionesColumnas] Error al obtener modificaciones:', error)

      // Si es 404, retornar respuesta vacía (no hay modificaciones guardadas)
      if (error.response?.status === 404) {
        return {
          status: 'success',
          numero_pedido: numeroPedido,
          modificaciones: []
        }
      }

      let message = error.message || 'Error desconocido al obtener modificaciones'

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
   * Obtiene lista de pedidos con redistribución confirmada (listos para generar ODC)
   * @param filters Filtros de paginación y búsqueda
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
      const params = new URLSearchParams()
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.pageSize) params.append('pageSize', filters.pageSize.toString())
      if (filters?.estado) params.append('estado', filters.estado)
      
      // Filtrar solo pedidos con redistribución confirmada
      params.append('redistribucion_confirmada', 'true')
      
      const queryString = params.toString()
      const url = queryString ? `/api/pedidos/confirmados?${queryString}` : '/api/pedidos/confirmados'
      
      const response = await mba3Api.get<{
        data: PedidoCompleto[]
        total: number
        page: number
        pageSize: number
        totalPages: number
      }>(url)
      return response.data
    } catch (error: any) {
      console.error('❌ [getPedidosConfirmados] Error al obtener pedidos confirmados:', error)
      
      let message = error.message || 'Error desconocido al obtener pedidos confirmados'
      
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
   * Obtiene el último pedido con redistribución confirmada (para cargar en Redistribución al entrar desde dashboard).
   * Usa la lista de confirmados ordenada por el backend; devuelve el primero como "último".
   * @returns PedidoCompleto o null si no hay pedidos confirmados
   */
  async getUltimoPedidoConfirmado(): Promise<PedidoCompleto | null> {
    try {
      const res = await this.getPedidosConfirmados({ page: 1, pageSize: 1 })
      const first = res.data?.[0]
      return first && (first as PedidoCompleto).cabecera ? (first as PedidoCompleto) : null
    } catch (error: any) {
      console.error('❌ [getUltimoPedidoConfirmado] Error al obtener último pedido confirmado:', error)
      return null
    }
  },

  /**
   * Obtiene el último pedido con estado RESPUESTA_PROVEEDOR_CARGADA (para Redistribución al entrar desde dashboard).
   * Usa el endpoint GET /api/pedidos/ultimo-redistribucion (misma idea que cargar-plantilla y GET /api/plantillas/ultimo).
   * @param soloUsuario Si true (default), último del usuario autenticado; si false, último global.
   * @returns Objeto con numero_pedido para redirigir, o null si no hay ninguno en ese estado.
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
      console.error('❌ [getUltimoPedidoRedistribucion] Error al obtener último pedido redistribución:', error)
      return null
    }
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
  }): Promise<import('../types').PedidosListadoResponse> {
    try {
      const params = new URLSearchParams()
      
      if (filtros?.estado) {
        params.append('estado', filtros.estado)
      }
      if (filtros?.fecha_desde) {
        params.append('fecha_desde', filtros.fecha_desde)
      }
      if (filtros?.fecha_hasta) {
        params.append('fecha_hasta', filtros.fecha_hasta)
      }
      if (filtros?.proveedor_nombre) {
        params.append('proveedor_nombre', filtros.proveedor_nombre)
      }
      if (filtros?.numero_pedido) {
        params.append('numero_pedido', filtros.numero_pedido)
      }
      if (filtros?.creado_por) {
        params.append('creado_por', filtros.creado_por)
      }
      if (filtros?.limit !== undefined) {
        params.append('limit', filtros.limit.toString())
      }
      if (filtros?.offset !== undefined) {
        params.append('offset', filtros.offset.toString())
      }

      const queryString = params.toString()
      const url = queryString ? `/api/pedidos?${queryString}` : '/api/pedidos'
      
      const response = await mba3Api.get<PedidosListadoResponse>(url)
      return response.data
    } catch (error: any) {
      console.error('❌ [getPedidosListado] Error al obtener listado de pedidos:', error)

      let message = error.message || 'Error desconocido al obtener listado de pedidos'

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
   * Ajusta automáticamente las bodegas cuando cambian las tiendas
   * Mantiene el total confirmado constante
   * Requiere permiso: mba3-consultas.proceso.execute
   * @param numeroPedido Número de pedido (ej: "P-12.48 - 12 - 2025")
   * @param ajustesDetalle Array de ajustes de redistribución por producto
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
      const response = await mba3Api.post<{
        status: 'success'
        message: string
        redistribucion_ajustada: AjusteDetalle[]
      }>(
        `/api/pedidos/${encodeURIComponent(numeroPedido)}/redistribucion/ajustar-bodegas`,
        { ajustes_detalle: ajustesDetalle }
      )
      return response.data
    } catch (error: any) {
      console.error('❌ [ajustarBodegas] Error al ajustar bodegas:', error)

      let message = error.message || 'Error desconocido al ajustar bodegas'

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
   * Verifica si existen pedidos en el sistema
   * @returns Respuesta indicando si hay pedidos guardados
   */
  async tienePedidos(): Promise<TienePedidosResponse> {
    try {
      const response = await mba3Api.get<TienePedidosResponse>('/api/pedidos/existe')
      return response.data
    } catch (error: any) {
      console.error('❌ [tienePedidos] Error al verificar existencia de pedidos:', error)

      let message = error.message || 'Error desconocido al verificar existencia de pedidos'

      if (error.response?.data) {
        if (error.response.data.detail) {
          message = error.response.data.detail
        } else if (error.response.data.message) {
          message = error.response.data.message
        }
      }

      // En caso de error, asumir que no hay pedidos para no bloquear la UI
      return {
        status: 'error',
        tiene_pedidos: false,
        message: message
      }
    }
  },
}

