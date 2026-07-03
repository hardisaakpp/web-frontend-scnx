import axios from 'axios'
import { TRANSACCIONES_API_BASE_URL } from '@/config/apiBaseUrls'

export const transaccionesApi = axios.create({
  baseURL: TRANSACCIONES_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

transaccionesApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

transaccionesApi.interceptors.response.use(
  response => response,
  error => {
    if (import.meta.env.DEV) {
      console.error('[transaccionesApi]', error?.response?.status, error?.config?.url, error?.response?.data)
    }
    return Promise.reject(error)
  }
)
