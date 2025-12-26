// Tipos para el módulo de Conciliación

export interface Conciliacion {
  id: number
  nombre: string
  tipo: 'financiero' | 'operativo' | 'estadistico'
  fechaCreacion: string
  formato: 'pdf' | 'excel' | 'csv'
  url?: string
  // Campos adicionales que pueden venir del backend
  descripcion?: string
  estado?: string
  usuarioCreacion?: string
  fechaModificacion?: string
}

export interface ConciliacionState {
  conciliaciones: Conciliacion[]
  loading: boolean
  error: string | null
}

// Tipos para respuestas del backend

export interface HealthResponse {
  status: string
  message?: string
  timestamp?: string
}

export interface ModuleInfo {
  name: string
  version: string
  description?: string
  endpoints?: string[]
}

export interface PermisosResponse {
  permisos: string[]
  roles?: string[]
  is_admin?: boolean
}

export interface UploadResponse {
  message: string
  file_id?: string
  filename?: string
  size?: number
}
