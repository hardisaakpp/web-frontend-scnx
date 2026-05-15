import axios from 'axios'
import { attachUnauthorizedRedirect } from '@/services/sessionGuard'

const rawBaseUrl = import.meta.env.VITE_PROMOCION_SOBRES_API_URL || '/promocion-sobres-api'
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '')

/** Rutas reales del backend: `/api/promocion-sobres/v1/...` */
export const promocionSobresApiPrefix = '/api/promocion-sobres/v1'

export const promocionSobresApi = axios.create({
  baseURL: normalizedBaseUrl,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

promocionSobresApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    config.headers = config.headers ?? {}
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr) as { userName?: string }
        config.headers['X-User'] = user.userName || 'desconocido'
      } else {
        config.headers['X-User'] = 'desconocido'
      }
    } catch {
      config.headers['X-User'] = 'desconocido'
    }

    config.headers['X-Correlation-Id'] = crypto.randomUUID()

    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => Promise.reject(error)
)

attachUnauthorizedRedirect(promocionSobresApi)

export { normalizedBaseUrl as API_BASE_URL }
