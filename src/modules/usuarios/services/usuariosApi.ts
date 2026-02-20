import api from '@/services/api'
import type { 
  Usuario, 
  CreateUsuarioDto, 
  UpdateUsuarioDto,
  Rol,
  CreateRolDto,
  UpdateRolDto,
  Permiso,
  CreatePermisoDto,
  UpdatePermisoDto,
  AsignarRolDto,
  AsignarPermisoDto,
  RemoverPermisoDto,
  PaginatedResponse,
  UsuarioFiltros
} from '../types'

// ==================== USUARIOS ====================
export const usuariosService = {
  // Obtener todos los usuarios
  async getUsuarios(filtros?: UsuarioFiltros): Promise<PaginatedResponse<Usuario>> {
    const response = await api.get<PaginatedResponse<Usuario>>('/Users', {
      params: filtros
    })
    return response.data
  },

  // Obtener un usuario por ID
  async getUsuario(id: string): Promise<Usuario> {
    const response = await api.get<Usuario>(`/Users/${id}`)
    return response.data
  },

  // Crear usuario
  async createUsuario(data: CreateUsuarioDto): Promise<Usuario> {
    const response = await api.post<Usuario>('/Users', data)
    return response.data
  },

  // Actualizar usuario
  async updateUsuario(id: string, data: UpdateUsuarioDto): Promise<Usuario> {
    const response = await api.put<Usuario>(`/Users/${id}`, data)
    return response.data
  },

  // Eliminar usuario
  async deleteUsuario(id: string): Promise<void> {
    await api.delete(`/Users/${id}`)
  },

  // Asignar rol a usuario
  async asignarRol(userId: string, data: AsignarRolDto): Promise<void> {
    await api.post(`/Users/${userId}/roles`, data)
  },

  // Remover rol de usuario
  async removerRol(userId: string, roleName: string): Promise<void> {
    await api.delete(`/Users/${userId}/roles/${roleName}`)
  },

  // Obtener roles de un usuario
  async getRolesUsuario(userId: string): Promise<string[]> {
    const response = await api.get<string[]>(`/Users/${userId}/roles`)
    return response.data
  }
}

// ==================== ROLES ====================
export const rolesService = {
  // Obtener todos los roles
  async getRoles(): Promise<Rol[]> {
    const response = await api.get<any[]>('/Roles')
    // Mapear a la estructura Rol esperada
    return response.data.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      normalizedName: r.normalizedName || r.normalized_name || '',
      createdAt: r.createdAt || '',
      permissions: [], // Se llenará después
      usersCount: r.usersCount || 0
    }))
  },

  // Obtener un rol por ID
  async getRol(id: string): Promise<Rol> {
    const response = await api.get<Rol>(`/Roles/${id}`)
    return response.data
  },

  // Obtener rol por nombre
  async getRolByName(name: string): Promise<Rol> {
    const response = await api.get<Rol>(`/Roles/name/${name}`)
    return response.data
  },

  // Crear rol
  async createRol(data: CreateRolDto): Promise<Rol> {
    const response = await api.post<Rol>('/Roles', data)
    return response.data
  },

  // Actualizar rol
  async updateRol(id: string, data: UpdateRolDto): Promise<Rol> {
    const response = await api.put<Rol>(`/Roles/${id}`, data)
    return response.data
  },

  // Eliminar rol
  async deleteRol(id: string): Promise<void> {
    await api.delete(`/Roles/${id}`)
  },

  // Obtener permisos de un rol
  async getPermisosRol(roleName: string): Promise<Permiso[]> {
    const response = await api.get<Permiso[]>(`/Permissions/role/${roleName}`)
    return response.data
  }
}

// ==================== PERMISOS ====================
export const permisosService = {
  // Obtener todos los permisos
  async getPermisos(): Promise<Permiso[]> {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
    const authHeader = token ? `Bearer ${token}` : ''
    if (authHeader) {
      api.defaults.headers.common['Authorization'] = authHeader
    }
    const response = await api.get<Permiso[]>('/Permissions', {
      headers: authHeader ? { Authorization: authHeader } : undefined
    })
    return response.data
  },

  // Obtener un permiso por ID
  async getPermiso(id: number): Promise<Permiso> {
    const response = await api.get<Permiso>(`/Permissions/${id}`)
    return response.data
  },

  // Obtener permisos por módulo
  async getPermisosPorModulo(module: string): Promise<Permiso[]> {
    const response = await api.get<Permiso[]>(`/Permissions/module/${module}`)
    return response.data
  },

  // Obtener permisos por rol
  async getPermisosPorRol(roleName: string): Promise<Permiso[]> {
    const response = await api.get<Permiso[]>(`/Permissions/role/${roleName}`)
    return response.data
  },

  // Crear permiso
  async createPermiso(data: CreatePermisoDto): Promise<Permiso> {
    const response = await api.post<Permiso>('/Permissions', data)
    return response.data
  },

  // Actualizar permiso
  async updatePermiso(id: number, data: UpdatePermisoDto): Promise<Permiso> {
    const response = await api.put<Permiso>(`/Permissions/${id}`, data)
    return response.data
  },

  // Eliminar permiso
  async deletePermiso(id: number): Promise<void> {
    await api.delete(`/Permissions/${id}`)
  },

  // Asignar permiso a rol
    async asignarPermiso(data: AsignarPermisoDto): Promise<void> {
      await api.post('/Permissions/assign', data)
  },

  // Remover permiso de rol
    async removerPermiso(data: RemoverPermisoDto): Promise<void> {
      try {
        await api.delete(`/Permissions/role/${encodeURIComponent(data.roleName)}/permission/${data.permissionId}`)
      } catch (error: any) {
        const status = error?.response?.status
        if (status === 404 || status === 405) {
          await api.request({
            method: 'delete',
            url: '/Permissions/unassign',
            data
          })
          return
        }
        throw error
      }
  },

  // Obtener permisos de un usuario (derivados de sus roles)
  async getPermisosUsuario(userId: string): Promise<string[]> {
    const response = await api.get<string[]>(`/Users/${userId}/permissions`)
    return response.data
  }
}
