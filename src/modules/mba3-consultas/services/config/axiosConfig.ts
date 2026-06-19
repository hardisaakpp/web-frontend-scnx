import { createModuleApi } from '@/lib/http'
import { MBA3_API_BASE_URL } from '@/config/apiBaseUrls'

const API_BASE_URL = MBA3_API_BASE_URL

export const mba3Api = createModuleApi(API_BASE_URL)

/**
 * ⭐ SISTEMA DE TIMEOUT SINCRONIZADO FRONTEND-BACKEND
 * 
 * El backend puede comunicar el timeout recomendado mediante headers HTTP:
 */
mba3Api.interceptors.response.use(
  (response) => {
    const timeoutHeader = response.headers['x-request-timeout']
    const timeoutMinHeader = response.headers['x-request-timeout-min']
    
    if (import.meta.env.DEV && (timeoutHeader || timeoutMinHeader)) {
      console.debug(`⏱️ [MBA3 API] Backend recomienda timeout: ${timeoutHeader || 'N/A'}s (mín: ${timeoutMinHeader || 'N/A'}s)`)
    }
    
    return response
  },
  (error) => {
    const url = error.config?.url || ''
    const isExpected404 = error.response?.status === 404 && (
      url.includes('/api/plantillas/ultimo') || 
      url.includes('/api/plantillas/') || 
      url.includes('/api/pedidos/ultimo-redistribucion') || 
      url.includes('/redistribucion/borrador')
    )

    if (!isExpected404 && import.meta.env.DEV) {
      console.error('🔍 [MBA3 API Interceptor] Error capturado:', error)
    }

    if (error.response?.data && !error.responseData) {
      error.responseData = error.response.data
    }

    return Promise.reject(error)
  }
)

export { API_BASE_URL }
