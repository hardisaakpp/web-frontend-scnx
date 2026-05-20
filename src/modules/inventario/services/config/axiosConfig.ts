import axios from 'axios'
import { attachUnauthorizedRedirect } from '@/services/sessionGuard'

const rawInventarioBaseUrl = import.meta.env.VITE_INVENTARIO_API_URL || '/inventario-api'
const normalizedInventarioBaseUrl = rawInventarioBaseUrl.replace(/\/+$/, '')
const inventoryApiPrefix = /\/api$/i.test(normalizedInventarioBaseUrl) ? '/v1' : '/api/v1'

export const inventarioApi = axios.create({
  baseURL: normalizedInventarioBaseUrl,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

inventarioApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }

    config.headers = config.headers ?? {}
    config.headers['X-Correlation-Id'] = crypto.randomUUID()
    return config
  },
  (error) => Promise.reject(error)
)

attachUnauthorizedRedirect(inventarioApi)

export { normalizedInventarioBaseUrl as API_BASE_URL, inventoryApiPrefix }
