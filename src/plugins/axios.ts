import axios from 'axios'

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

/** MBA3 API: /Auth/me, capabilities, preferencias (microservicio distinto al Core). */
export const mba3Api = axios.create({
  ...baseConfig,
  baseURL: import.meta.env.VITE_MBA3_API_URL || '/api',
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
  instance.interceptors.response.use(
    (response: any) => response,
    (error: any) => Promise.reject(error)
  )
}

addAuthInterceptor(coreApi)
addAuthInterceptor(mba3Api)

/** API principal: apunta al Core (retrocompatibilidad con código que usa "api"). */
const api = coreApi
export default api