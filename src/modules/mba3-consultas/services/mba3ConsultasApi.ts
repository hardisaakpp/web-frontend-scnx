import axios from 'axios'
import router from '@/router'
import type { 
  PrefacturaResponse, 
  PrefacturaFilters,
  Prefactura,
  Despacho,
  DespachoDetalle
} from '../types'
import type { OrdenCompraResponse } from '../types'
import type { HealthResponse, ProcesoResponse } from '../types'

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
    console.log('🔐 [MBA3 API Request] URL:', config.url)
    console.log('🔐 [MBA3 API Request] Token disponible:', !!token)
    
    if (token) {
      // Usar la misma sintaxis que funciona en api.js
      if (!config.headers) {
        config.headers = {}
      }
      config.headers.Authorization = `Bearer ${token}`
      console.log('✅ [MBA3 API Request] Token agregado al header Authorization')
    } else {
      console.warn('⚠️ [MBA3 API Request] No hay token disponible en localStorage')
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
    console.error('MBA3 API Error:', error)
    
    // Extraer mensaje de error más descriptivo
    let message = error.message || 'Error desconocido'
    
    if (error.response?.data) {
      // Si hay un mensaje en el response
      if (error.response.data.message) {
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

  // Facturas
  async getFacturas(filters?: PrefacturaFilters): Promise<PrefacturaResponse> {
    const params = new URLSearchParams()
    if (filters?.anulada !== undefined && filters.anulada !== null) {
      params.append('anulada', String(filters.anulada))
    }
    if (filters?.confirmado !== undefined && filters.confirmado !== null) {
      params.append('confirmado', String(filters.confirmado))
    }
    if (filters?.remision_facturada !== undefined && filters.remision_facturada !== null) {
      params.append('remision_facturada', String(filters.remision_facturada))
    }
    if (filters?.include_obj_datos !== undefined) {
      params.append('include_obj_datos', String(filters.include_obj_datos))
    }
    if (filters?.save_to_db !== undefined) {
      params.append('save_to_db', String(filters.save_to_db))
    }

    const queryString = params.toString()
    const url = queryString ? `/facturas?${queryString}` : '/facturas'
    const response = await mba3Api.get<PrefacturaResponse>(url)
    return response.data
  },

  // Consultar (solo lectura)
  async consultar(): Promise<any> {
    const response = await mba3Api.get('/consultar')
    return response.data
  },

  // Migrar
  async migrar(): Promise<ProcesoResponse> {
    const response = await mba3Api.get<ProcesoResponse>('/migrar')
    return response.data
  },

  // Procesar OC
  async procesarOC(): Promise<any> {
    const response = await mba3Api.get('/procesar-oc')
    return response.data
  },

  // Integrar SAP
  async integrarSAP(referenciaDespacho?: string): Promise<any> {
    const params = referenciaDespacho 
      ? `?referencia_despacho=${referenciaDespacho}`
      : ''
    const response = await mba3Api.post(`/integrar-sap${params}`)
    return response.data
  },

  // Órdenes de compra
  async getOrdenesCompra(estado?: string, page: number = 1, pageSize: number = 10): Promise<OrdenCompraResponse> {
    const params = new URLSearchParams()
    if (estado) params.append('estado', estado)
    params.append('page', page.toString())
    params.append('pageSize', pageSize.toString())
    
    const queryString = params.toString()
    const url = queryString ? `/ordenes-compra?${queryString}` : '/ordenes-compra'
    const response = await mba3Api.get<OrdenCompraResponse>(url)
    return response.data
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
      console.log('🔍 [getDespachos] Obteniendo despachos desde /despachos/count')
      
      // El endpoint /despachos/count ahora devuelve: { count, disponible, data: Prefactura[] }
      // O podría devolver: { count, disponible, despachos: Prefactura[] } o directamente un array
      const response = await mba3Api.get<any>('/despachos/count')
      
      // Log completo de la respuesta para diagnosticar
      console.log('📦 [getDespachos] Respuesta completa del backend:', response.data)
      console.log('📦 [getDespachos] Estructura de respuesta:', {
        tieneData: 'data' in response.data,
        tieneDespachos: 'despachos' in response.data,
        esArray: Array.isArray(response.data),
        keys: Object.keys(response.data || {}),
      })
      
      // Intentar obtener los datos de diferentes formas posibles
      let despachosData: Despacho[] = []
      
      if (Array.isArray(response.data)) {
        // Si la respuesta es directamente un array
        despachosData = response.data
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Si viene en data.data
        despachosData = response.data.data
      } else if (response.data.despachos && Array.isArray(response.data.despachos)) {
        // Si viene en data.despachos
        despachosData = response.data.despachos
      } else if (response.data.resultado && Array.isArray(response.data.resultado)) {
        // Si viene en data.resultado
        despachosData = response.data.resultado
      } else if (response.data.despatches && Array.isArray(response.data.despatches)) {
        // Si viene en data.despatches (en inglés)
        despachosData = response.data.despatches
      }
      
      console.log('✅ [getDespachos] Despachos obtenidos:', despachosData.length)
      console.log('📋 [getDespachos] Primer despacho (ejemplo):', despachosData[0])
      
      // Verificar si los despachos ya tienen detalles incluidos
      if (despachosData[0] && 'despacho_detalles' in despachosData[0]) {
        console.log('ℹ️ [getDespachos] Los despachos incluyen detalles (despacho_detalles) en la respuesta')
        const detallesCount = despachosData.reduce((acc, d) => acc + (d.despacho_detalles?.length || 0), 0)
        console.log(`ℹ️ [getDespachos] Total de detalles incluidos: ${detallesCount}`)
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
      console.log('🔍 [getDespachoDetalles] Obteniendo detalles para despacho:', despachoId)
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
      
      console.log('✅ [getDespachoDetalles] Detalles obtenidos:', detalles.length)
      return detalles
    } catch (error: any) {
      console.error('❌ [getDespachoDetalles] Error:', error)
      throw new Error(`No se pudieron obtener los detalles del despacho. Error: ${error.message}`)
    }
  },
}

