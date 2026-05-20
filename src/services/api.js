import axios from 'axios'
import { attachUnauthorizedRedirect } from '@/services/sessionGuard'

const api = axios.create({
  baseURL: import.meta.env.VITE_CORE_API_URL || import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
})

// Interceptor para agregar token en cada request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Interceptor para manejar errores de autenticación
attachUnauthorizedRedirect(api)

export default api