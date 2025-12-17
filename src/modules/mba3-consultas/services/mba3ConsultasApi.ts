import axios from 'axios'
import router from '@/router'
import type { 
  Despacho,
  DespachoDetalle
} from '../types'
import type { OrdenCompraResponse, OrdenCompraLogResponse, RemisionResponse } from '../types'
import type { HealthResponse, ProcesoResponse } from '../types'
import type { SkuHomologacionResponse, SkuHomologacionUpdateRequest } from '../types'

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
    
    return config
  },
  error => {
    console.error('❌ [MBA3 API Request] Error en interceptor:', error)
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores y autenticación
mba3Api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores 401 (token inválido o expirado)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    
    // Log detallado del error para debugging
    console.error('MBA3 API Error:', error)
    if (error.response) {
      console.error('Response Status:', error.response.status)
      console.error('Response Data:', error.response.data)
      console.error('Response Headers:', error.response.headers)
      console.error('Request URL:', error.config?.url)
      console.error('Request Method:', error.config?.method)
    } else if (error.request) {
      console.error('Request Error:', error.request)
      console.error('No se recibió respuesta del servidor')
    }
    
    // Extraer mensaje de error más descriptivo
    let message = error.message || 'Error desconocido'
    
    if (error.response?.data) {
      // Verificar si es un error de SAP
      const errorSource = error.response.data.error_source
      const errorCode = error.response.data.error_code
      
      if (errorSource?.toUpperCase() === 'SAP' && errorCode) {
        // Usar mensajes amigables para errores de SAP
        const sapErrorMessages: Record<string, string> = {
          '401': 'Error de autenticación con SAP. Las credenciales no son válidas o han expirado.',
          '403': 'Sin permisos para realizar esta operación en SAP.',
          'VALIDATION_ERROR': 'Error de validación en los datos enviados a SAP.',
          'MISSING_FIELD': 'Falta un campo obligatorio en la solicitud a SAP.',
          'INVALID_FORMAT': 'El formato de uno o más campos no es válido para SAP.',
          'INVALID_CARDCODE': 'El código del proveedor no existe en SAP.',
          'INVALID_ITEMCODE': 'Uno o más códigos de artículo no existen en SAP.',
          'DUPLICATE_DOCUMENT': 'Ya existe un documento con estos datos en SAP.',
          'CONNECTION_ERROR': 'No se pudo establecer conexión con el servidor SAP.',
          'TIMEOUT': 'La solicitud a SAP tardó demasiado tiempo en responder.',
          'INTERNAL_ERROR': 'Error interno en el servidor SAP.',
        }
        const friendlyMessage = sapErrorMessages[errorCode.toUpperCase()] || `Error SAP (${errorCode})`
        message = friendlyMessage + (error.response.data.error_message ? ` - ${error.response.data.error_message}` : '')
      }
      // Si hay un mensaje en el response
      else if (error.response.data.message) {
        message = error.response.data.message
      } 
      // Si hay un detalle en el response (típico de FastAPI)
      else if (error.response.data.detail) {
        message = error.response.data.detail
      }
      // Si es un error 500 relacionado con serialización
      else if (error.response.status === 500 && typeof error.response.data === 'string') {
        if (error.response.data.includes('Decimal') || error.response.data.includes('not JSON serializable')) {
          message = 'Error de serialización en el servidor: El backend necesita convertir los valores Decimal a números antes de enviar la respuesta. Por favor, contacte al administrador.'
        } else {
          message = error.response.data
        }
      }
      // Si es un error 500 sin mensaje específico
      else if (error.response.status === 500) {
        if (!message || message === 'Error desconocido') {
          message = 'Error interno del servidor (500). Por favor, verifique los logs del backend o contacte al administrador.'
        }
      }
    }
    
    // Si no hay respuesta del servidor (error de red)
    if (!error.response && error.request) {
      message = 'No se pudo conectar con el servidor. Verifique su conexión a internet o que el servidor esté en ejecución.'
    }
    
    return Promise.reject(new Error(message))
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
        
        const response = await mba3Api.get<ProcesoResponse>('/migrar/completo')
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
  async integrarSAP(referenciaDespacho?: string | string[], almacenDestino?: string): Promise<any> {
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
    const response = await mba3Api.post(url)
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
      throw new Error(`No se pudieron obtener las remisiones desde el backend. Error: ${error.message}`)
    }
  },

  // Consultar remisiones desde MBA3
  async consultarRemisionesDesdeMBA3(): Promise<any> {
    try {
      const response = await mba3Api.get('/remisiones/consultar')
      return response.data
    } catch (error: any) {
      console.error('❌ [consultarRemisionesDesdeMBA3] Error al consultar remisiones desde MBA3:', error)
      throw new Error(`No se pudieron consultar las remisiones desde MBA3. Error: ${error.message}`)
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
}

