import axios from 'axios'
import { attachUnauthorizedRedirect } from '@/services/sessionGuard'
import { randomUUID } from '@/utils/uuid'

export const invPlanesApi = axios.create({
  baseURL: '/inv-planes-api',
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

invPlanesApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers = config.headers ?? {}
    config.headers['X-Correlation-Id'] = randomUUID()
    return config
  },
  (error) => Promise.reject(error instanceof Error ? error : new Error(String(error)))
)

attachUnauthorizedRedirect(invPlanesApi)
