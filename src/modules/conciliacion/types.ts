// Tipos para el módulo de Conciliación

export interface Conciliacion {
  id: string  // UUID
  nombre: string
  tipo: 'bancaria' | 'contable'
  fecha_inicio: string  // ISO date string: "YYYY-MM-DD"
  fecha_fin: string     // ISO date string: "YYYY-MM-DD"
  cuenta_id: string
  moneda: string        // ISO 4217 code: "USD", "EUR", etc.
  documento_id: string  // UUID
  observaciones?: string
  fechaCreacion?: string
  usuarioCreacion?: string
  fechaModificacion?: string
  estado?: string
}

export interface ConciliacionCreateData {
  nombre: string
  tipo: 'bancaria' | 'contable'
  fecha_inicio: string
  fecha_fin: string
  cuenta_id: string
  moneda: string
  documento_id: string
  observaciones?: string
}

export interface BackendValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface BackendErrorResponse {
  detail: BackendValidationError[]
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
