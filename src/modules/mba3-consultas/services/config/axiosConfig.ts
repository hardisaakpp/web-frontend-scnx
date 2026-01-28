import axios from 'axios'
import router from '@/router'

const API_BASE_URL = import.meta.env.VITE_MBA3_API_BASE_URL || 'http://localhost:8000'

export const mba3Api = axios.create({
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
    if (import.meta.env.DEV) {
      console.error('❌ [MBA3 API Request] Error en interceptor:', error)
    }
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
    
    if (import.meta.env.DEV && (timeoutHeader || timeoutMinHeader)) {
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

    // Solo loguear errores que no sean 404 esperados (solo en desarrollo)
    if (!isExpected404 && import.meta.env.DEV) {
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

export { API_BASE_URL }
