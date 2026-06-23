import axios from 'axios'
import { attachUnauthorizedRedirect } from '@/services/sessionGuard'

type AxiosInstanceType = ReturnType<typeof axios.create>

export interface ApiClientOptions {
  timeout?: number
  /** Agrega X-Correlation-Id UUID en cada request */
  correlationId?: boolean
  /** Agrega X-User desde localStorage en cada request */
  userHeader?: boolean
  /** También busca el token en sessionStorage si no está en localStorage */
  sessionStorageFallback?: boolean
  /** Interceptor de respuesta exitosa (corre antes del guard de 401) */
  onResponse?: (response: any) => any
  /** Interceptor de respuesta con error (corre antes del guard de 401) */
  onResponseError?: (error: any) => any
}

export function createApiClient(rawBaseUrl: string, options: ApiClientOptions = {}): AxiosInstanceType {
  const {
    timeout = 30000,
    correlationId = false,
    userHeader = false,
    sessionStorageFallback = false,
    onResponse,
    onResponseError,
  } = options

  const client = axios.create({
    baseURL: rawBaseUrl.replace(/\/+$/, ''),
    timeout,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  client.interceptors.request.use(
    (config: any) => {
      const token =
        localStorage.getItem('token') ||
        (sessionStorageFallback ? sessionStorage.getItem('token') : null)

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }

      if (config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type']
      }

      if (correlationId) {
        config.headers = config.headers ?? {}
        config.headers['X-Correlation-Id'] = crypto.randomUUID()
      }

      if (userHeader) {
        config.headers = config.headers ?? {}
        try {
          const raw = localStorage.getItem('user')
          const user = raw ? (JSON.parse(raw) as { userName?: string }) : null
          config.headers['X-User'] = user?.userName || 'desconocido'
        } catch {
          config.headers['X-User'] = 'desconocido'
        }
      }

      return config
    },
    (error: any) => Promise.reject(error)
  )

  if (onResponse || onResponseError) {
    client.interceptors.response.use(
      onResponse ?? ((r: any) => r),
      onResponseError ?? ((e: any) => Promise.reject(e))
    )
  }

  attachUnauthorizedRedirect(client)

  return client
}
