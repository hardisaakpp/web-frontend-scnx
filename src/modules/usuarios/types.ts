// Tipos para el módulo de Usuarios, Roles y Permisos

// ============= USUARIOS =============
export interface Usuario {
  id: string
  userName: string
  email: string
  fullName: string
  isActive: boolean
  createdAt: string
  roles: string[]  // Array de nombres de roles
  permissions?: string[]  // Permisos derivados de roles (opcional)
}

export interface CreateUsuarioDto {
  userName: string
  email: string
  fullName: string
  password: string
  roles?: string[]
}

export interface UpdateUsuarioDto {
  email?: string
  fullName?: string
  isActive?: boolean
}

// ============= ROLES =============
export interface Rol {
  id: string
  name: string
  description?: string
  normalizedName?: string
  createdAt?: string
  permissions: Permiso[]  // Permisos asociados al rol
  usersCount?: number  // Cantidad de usuarios con este rol
}

export interface CreateRolDto {
  name: string
  description?: string
}

export interface UpdateRolDto {
  name?: string
  description?: string
}

// ============= PERMISOS =============
export interface Permiso {
  id: number
  key: string  // ej: "depositos.view", "users.create"
  description: string
  module: string  // ej: "depositos", "usuarios", "reportes"
  createdAt?: string
}

export interface CreatePermisoDto {
  key: string
  description: string
  module: string
}

export interface UpdatePermisoDto {
  key?: string
  description?: string
  module?: string
}

// ============= ASIGNACIONES =============

// Asignar rol a usuario
export interface AsignarRolDto {
  role: string  // Nombre del rol
}

// Asignar permiso a rol
export interface AsignarPermisoDto {
  roleName: string
  permissionId: number
}

// Remover permiso de rol
export interface RemoverPermisoDto {
  roleName: string
  permissionId: number
}

// ============= STATES =============
export interface UsuariosState {
  usuarios: Usuario[]
  selectedUsuario: Usuario | null
  loading: boolean
  error: string | null
  total: number
  currentPage: number
  pageSize: number
  totalPages: number
}

export interface RolesState {
  roles: Rol[]
  selectedRol: Rol | null
  loading: boolean
  error: string | null
}

export interface PermisosState {
  permisos: Permiso[]
  permisosPorModulo: Record<string, Permiso[]>
  loading: boolean
  error: string | null
}

// ============= FILTROS Y PAGINACIÓN =============
export interface UsuarioFiltros {
  search?: string
  role?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
