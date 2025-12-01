import axios from 'axios'
import router from '@/router'
import type { 
  FacturaResponse, 
  FacturaFilters 
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

// Interceptor para agregar token en cada request
mba3Api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para manejar errores y autenticación
mba3Api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar errores de autenticación (401)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Redirigir al login si es necesario
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    }
    
    // Manejar errores de permisos (403)
    if (error.response?.status === 403) {
      // Redirigir a página de acceso denegado
      if (router.currentRoute.value.path !== '/forbidden') {
        router.push('/forbidden')
      }
    }
    
    console.error('MBA3 API Error:', error)
    const message = error.response?.data?.message || error.message || 'Error desconocido'
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
  async getFacturas(filters?: FacturaFilters): Promise<FacturaResponse> {
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
    const response = await mba3Api.get<FacturaResponse>(url)
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
  async getOrdenesCompra(estado?: string): Promise<OrdenCompraResponse> {
    const params = estado ? `?estado=${estado}` : ''
    const response = await mba3Api.get<OrdenCompraResponse>(`/ordenes-compra${params}`)
    return response.data
  },

  // Pruebas (endpoint completo)
  async pruebas(): Promise<ProcesoResponse> {
    const response = await mba3Api.get<ProcesoResponse>('/pruebas')
    return response.data
  },
}

