import { createModuleApi } from '@/lib/http'
import { MBA3_API_BASE_URL } from '@/config/apiBaseUrls'

const API_BASE_URL = MBA3_API_BASE_URL

export const mba3Api = createModuleApi(API_BASE_URL)

mba3Api.interceptors.response.use(
  (response) => {
    const timeoutHeader = response.headers['x-request-timeout']
    const timeoutMinHeader = response.headers['x-request-timeout-min']
    if (import.meta.env.DEV && (timeoutHeader || timeoutMinHeader)) {
      console.debug(`⏱️ [MBA3 API] Backend recomienda timeout: ${timeoutHeader || 'N/A'}s (mín: ${timeoutMinHeader || 'N/A'}s)`)
    }
    return response
  },
  (error: any) => {
    const err = error as { config?: { url?: string; method?: string }; response?: { status?: number; data?: unknown }; request?: unknown }
    const url = err.config?.url ?? ''
    const isExpected404 =
      err.response?.status === 404 &&
      (url.includes('/api/plantillas/ultimo') ||
        url.includes('/api/plantillas/') ||
        url.includes('/api/pedidos/ultimo-redistribucion') ||
        url.includes('/redistribucion/borrador'))

    if (!isExpected404 && import.meta.env.DEV) {
      console.error('🔍 [MBA3 API Interceptor] Error capturado:', error)
      if (err.response) {
        console.error('🔍 [MBA3 API Interceptor] Status:', err.response.status)
        console.error('🔍 [MBA3 API Interceptor] Data completa:', err.response.data)
        console.error('🔍 [MBA3 API Interceptor] URL:', err.config?.url)
        console.error('🔍 [MBA3 API Interceptor] Method:', err.config?.method)
      } else if (err.request) {
        console.error('🔍 [MBA3 API Interceptor] Request Error:', err.request)
        console.error('🔍 [MBA3 API Interceptor] No se recibió respuesta del servidor')
      }
    }

    if (err.response?.data && !error.responseData) {
      error.responseData = err.response.data
    }

    return Promise.reject(error)
  }
)

export { API_BASE_URL }
