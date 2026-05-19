import axios from 'axios'
import { attachUnauthorizedRedirect } from '@/services/sessionGuard'
import { MBA3_AUTH_API_URL } from '@/config/apiBaseUrls'

type AxiosInstanceType = ReturnType<typeof axios.create>

const baseConfig = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true
}

/** Core API: login, Auth y resto de endpoints del Core. */
const coreApi = axios.create({
  ...baseConfig,
  baseURL: import.meta.env.VITE_CORE_API_URL || import.meta.env.VITE_API_URL || '/api',
})

/** MBA3 API: GET /api/Auth/me (capabilities); no usar para rutas bajo /api/mba3 (ver mba3ConsultasApi). */
export const mba3Api = axios.create({
  ...baseConfig,
  baseURL: MBA3_AUTH_API_URL,
})

function addAuthInterceptor(instance: AxiosInstanceType): void {
  instance.interceptors.request.use(
    (config: any) => {
      const token = localStorage.getItem('token')
      if (token && config?.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error: any) => Promise.reject(error)
  )
  attachUnauthorizedRedirect(instance, { ignoreUrlIncludes: ['/auth/login'] })
}

addAuthInterceptor(coreApi)
addAuthInterceptor(mba3Api)

/** API principal: apunta al Core (retrocompatibilidad con código que usa "api"). */
const api = coreApi
export default api