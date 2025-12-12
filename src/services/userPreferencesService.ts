import axios from 'axios'
import router from '@/router'

export interface TablePreferences {
  visibleColumns: string[]
  columnOrder: string[]
  filters?: Record<string, any>
  pageSize?: number
}

export interface UserPreferencesResponse {
  preferences: TablePreferences | null
}

export interface AllPreferencesResponse {
  preferences: Record<string, TablePreferences>
}

// Crear instancia de axios específica para preferencias
// Conecta directamente al backend de Python (puerto 8000)
// Similar a como mba3ConsultasApi.ts maneja el módulo MBA3
const API_BASE_URL = import.meta.env.VITE_PREFERENCES_API_URL || import.meta.env.VITE_MBA3_API_BASE_URL || 'http://localhost:8000'

const preferencesApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
})

// Interceptor para agregar token JWT en cada request
preferencesApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    
    if (token) {
      if (!config.headers) {
        config.headers = {}
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    console.error('❌ [Preferences API Request] Error en interceptor:', error)
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores y autenticación
preferencesApi.interceptors.response.use(
  response => response,
  error => {
    // Manejar errores 401 (token inválido o expirado)
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
    
    return Promise.reject(error)
  }
)

/**
 * Servicio para gestionar preferencias de usuario desde el backend
 * Conecta directamente al backend de Python sin pasar por el Core
 */
export const userPreferencesService = {
  /**
   * Obtener preferencias de una tabla específica
   * @param tableId Identificador de la tabla (ej: 'despachos', 'ordenes-compra', 'historial-ordenes')
   * @returns Preferencias de la tabla o null si no existen
   */
  async getTablePreferences(tableId: string): Promise<TablePreferences | null> {
    try {
      // Usar /api/users/preferences (minúsculas) para coincidir con el backend de Python
      const response = await preferencesApi.get<UserPreferencesResponse>(`/api/users/preferences/${tableId}`)
      return response.data.preferences
    } catch (error: any) {
      // Si el endpoint no existe (404) o hay error, retornar null
      // Esto permite que funcione con localStorage mientras se implementa el backend
      if (error.response?.status === 404) {
        console.debug(`Endpoint de preferencias no disponible para ${tableId}, usando localStorage`)
      } else {
        console.warn(`Error obteniendo preferencias de ${tableId}:`, error.message)
      }
      return null
    }
  },

  /**
   * Guardar preferencias de una tabla específica
   * @param tableId Identificador de la tabla
   * @param preferences Preferencias a guardar
   */
  async saveTablePreferences(tableId: string, preferences: TablePreferences): Promise<void> {
    try {
      // Usar /api/users/preferences (minúsculas) para coincidir con el backend de Python
      await preferencesApi.post(`/api/users/preferences/${tableId}`, { preferences })
    } catch (error: any) {
      // Si el endpoint no existe (404), solo loguear warning
      // No lanzar error para que localStorage siga funcionando
      if (error.response?.status === 404) {
        console.debug(`Endpoint de preferencias no disponible para ${tableId}, solo usando localStorage`)
      } else {
        console.warn(`Error guardando preferencias de ${tableId}:`, error.message)
        // No lanzar el error para que la app siga funcionando con localStorage
      }
    }
  },

  /**
   * Obtener todas las preferencias del usuario actual
   * @returns Objeto con todas las preferencias por tabla
   */
  async getAllPreferences(): Promise<Record<string, TablePreferences>> {
    try {
      // Usar /api/users/preferences (minúsculas) para coincidir con el backend de Python
      const response = await preferencesApi.get<AllPreferencesResponse>('/api/users/preferences')
      return response.data.preferences || {}
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.debug('Endpoint de preferencias no disponible, usando localStorage')
      } else {
        console.warn('Error obteniendo todas las preferencias:', error.message)
      }
      return {}
    }
  },

  /**
   * Eliminar preferencias de una tabla específica
   * @param tableId Identificador de la tabla
   */
  async deleteTablePreferences(tableId: string): Promise<void> {
    try {
      // Usar /api/users/preferences (minúsculas) para coincidir con el backend de Python
      await preferencesApi.delete(`/api/users/preferences/${tableId}`)
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.debug(`Endpoint de preferencias no disponible para ${tableId}`)
      } else {
        console.warn(`Error eliminando preferencias de ${tableId}:`, error.message)
      }
    }
  }
}

