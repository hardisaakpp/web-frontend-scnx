import axios from 'axios'
import router from '@/router'
import type { Conciliacion, ConciliacionCreateData, ModuleInfo, PermisosResponse, HealthResponse, BackendErrorResponse } from '../types'

// URL base del backend de Conciliación Tesorería
const API_BASE_URL = import.meta.env.VITE_CONCILIACION_API_BASE_URL || 'http://localhost:8002'

// Crear instancia de axios específica para este módulo
const conciliacionApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
})

// Interceptor para agregar token JWT en cada request
conciliacionApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    return config
  },
  error => {
    console.error('❌ [Conciliación API Request] Error en interceptor:', error)
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores y autenticación
conciliacionApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      const { status, data } = error.response
      
      // 401: Token expirado o inválido
      if (status === 401) {
        console.warn('⚠️ [Conciliación API] Token inválido o expirado')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push({ name: 'login' })
      }
      
      // 403: Sin permisos
      if (status === 403) {
        console.warn('⚠️ [Conciliación API] Sin permisos para esta acción')
      }
      
      // 422: Errores de validación
      if (status === 422) {
        console.warn('⚠️ [Conciliación API] Errores de validación:', data)
        // Mantener el error para que el componente pueda manejarlo
        const validationError = {
          ...error,
          validationErrors: (data as BackendErrorResponse).detail || [],
          message: error.message || 'Errores de validación'
        }
        return Promise.reject(validationError)
      }
    }
    
    return Promise.reject(error)
  }
)

export const conciliacionService = {
  // Endpoints públicos (sin autenticación)
  
  /**
   * Health check del módulo
   */
  async getHealth(): Promise<HealthResponse> {
    const response = await conciliacionApi.get<HealthResponse>('/conciliacion-tesoreria/health')
    return response.data
  },

  // Endpoints protegidos (requieren JWT)

  /**
   * Información del módulo para usuarios autenticados
   */
  async getInfo(): Promise<ModuleInfo> {
    const response = await conciliacionApi.get<ModuleInfo>('/conciliacion-tesoreria/info')
    return response.data
  },

  /**
   * Obtener permisos del usuario actual
   */
  async getPermisos(): Promise<PermisosResponse> {
    const response = await conciliacionApi.get<PermisosResponse>('/conciliacion-tesoreria/permisos')
    return response.data
  },

  // CRUD de conciliaciones (requieren permisos específicos)

  /**
   * Listar todas las conciliaciones
   * Requiere permiso: conciliacion-tesoreria.ver
   */
  async getConciliaciones(): Promise<Conciliacion[]> {
    const response = await conciliacionApi.get<Conciliacion[]>('/conciliacion-tesoreria/conciliaciones')
    return response.data
  },

  /**
   * Obtener una conciliación por ID
   * Requiere permiso: conciliacion-tesoreria.ver
   */
  async getConciliacion(id: string): Promise<Conciliacion> {
    const response = await conciliacionApi.get<Conciliacion>(`/conciliacion-tesoreria/conciliaciones/${id}`)
    return response.data
  },

  /**
   * Crear nueva conciliación
   * Requiere permiso: conciliacion-tesoreria.crear
   */
  async createConciliacion(data: ConciliacionCreateData): Promise<Conciliacion> {
    const response = await conciliacionApi.post<Conciliacion>('/conciliacion-tesoreria/conciliaciones', data)
    return response.data
  },

  /**
   * Actualizar conciliación
   * Requiere permiso: conciliacion-tesoreria.editar
   */
  async updateConciliacion(id: string, data: Partial<Conciliacion>): Promise<Conciliacion> {
    const response = await conciliacionApi.put<Conciliacion>(`/conciliacion-tesoreria/conciliaciones/${id}`, data)
    return response.data
  },

  /**
   * Eliminar conciliación
   * Requiere permiso: conciliacion-tesoreria.eliminar
   */
  async deleteConciliacion(id: string): Promise<void> {
    await conciliacionApi.delete(`/conciliacion-tesoreria/conciliaciones/${id}`)
  },

  // Upload de documentos

  /**
   * Subir documento
   * Requiere permiso: conciliacion-tesoreria.crear
   * Tipos permitidos: .xlsx, .xls (solo archivos Excel)
   * Tamaño máximo: 10 MB
   * 
   * Nota: Las validaciones de tipo y tamaño también se realizan en el backend.
   * Esta validación en el frontend es para mejor UX (feedback inmediato).
   */
  async uploadDocumento(file: File): Promise<{ message: string; file_id?: string; filename?: string }> {
    // Validar tipo de archivo - solo Excel
    const allowedExtensions = ['.xlsx', '.xls']
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`Tipo de archivo no permitido. Solo se permiten: ${allowedExtensions.join(', ')}`)
    }

    // Validar tamaño (10 MB máximo - coincide con validación del backend)
    const maxSize = 10 * 1024 * 1024 // 10 MB en bytes
    if (file.size > maxSize) {
      throw new Error('El archivo excede el tamaño máximo de 10 MB')
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await conciliacionApi.post<{ message: string; file_id?: string; filename?: string }>(
      '/conciliacion-tesoreria/documentos/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },
}

