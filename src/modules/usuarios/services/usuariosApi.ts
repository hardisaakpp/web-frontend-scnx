import axios from 'axios'
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

const API_URL = '/api'

// ==================== USUARIOS ====================
export const usuariosService = {
  // Obtener todos los usuarios
  async getUsuarios(filtros?: UsuarioFiltros): Promise<PaginatedResponse<Usuario>> {
    const response = await axios.get<PaginatedResponse<Usuario>>(`${API_URL}/Users`, {
      params: filtros
    })
    return response.data
  },

  // Obtener un usuario por ID
  async getUsuario(id: string): Promise<Usuario> {
    const response = await axios.get<Usuario>(`${API_URL}/Users/${id}`)
    return response.data
  },

  // Crear usuario
  async createUsuario(data: CreateUsuarioDto): Promise<Usuario> {
    const response = await axios.post<Usuario>(`${API_URL}/Users`, data)
    return response.data
  },

  // Actualizar usuario
  async updateUsuario(id: string, data: UpdateUsuarioDto): Promise<Usuario> {
    const response = await axios.put<Usuario>(`${API_URL}/Users/${id}`, data)
    return response.data
  },

  // Eliminar usuario
  async deleteUsuario(id: string): Promise<void> {
    await axios.delete(`${API_URL}/Users/${id}`)
  },

  // Asignar rol a usuario
  async asignarRol(userId: string, data: AsignarRolDto): Promise<void> {
    await axios.post(`${API_URL}/Users/${userId}/roles`, data)
  },

  // Remover rol de usuario
  async removerRol(userId: string, roleName: string): Promise<void> {
    await axios.delete(`${API_URL}/Users/${userId}/roles/${roleName}`)
  },

  // Obtener roles de un usuario
  async getRolesUsuario(userId: string): Promise<string[]> {
    const response = await axios.get<string[]>(`${API_URL}/Users/${userId}/roles`)
    return response.data
  }
}

// ==================== ROLES ====================
export const rolesService = {
  // Obtener todos los roles
  async getRoles(): Promise<Rol[]> {
    const response = await axios.get<Rol[]>(`${API_URL}/Roles`)
    return response.data
  },

  // Obtener un rol por ID
  async getRol(id: string): Promise<Rol> {
    const response = await axios.get<Rol>(`${API_URL}/Roles/${id}`)
    return response.data
  },

  // Obtener rol por nombre
  async getRolByName(name: string): Promise<Rol> {
    const response = await axios.get<Rol>(`${API_URL}/Roles/name/${name}`)
    return response.data
  },

  // Crear rol
  async createRol(data: CreateRolDto): Promise<Rol> {
    const response = await axios.post<Rol>(`${API_URL}/Roles`, data)
    return response.data
  },

  // Actualizar rol
  async updateRol(id: string, data: UpdateRolDto): Promise<Rol> {
    const response = await axios.put<Rol>(`${API_URL}/Roles/${id}`, data)
    return response.data
  },

  // Eliminar rol
  async deleteRol(id: string): Promise<void> {
    await axios.delete(`${API_URL}/Roles/${id}`)
  },

  // Obtener permisos de un rol
  async getPermisosRol(roleName: string): Promise<Permiso[]> {
    const response = await axios.get<Permiso[]>(`${API_URL}/Roles/${roleName}/permissions`)
    return response.data
  }
}

// ==================== PERMISOS ====================
export const permisosService = {
  // Obtener todos los permisos
  async getPermisos(): Promise<Permiso[]> {
    const response = await axios.get<Permiso[]>(`${API_URL}/Permissions`)
    return response.data
  },

  // Obtener un permiso por ID
  async getPermiso(id: number): Promise<Permiso> {
    const response = await axios.get<Permiso>(`${API_URL}/Permissions/${id}`)
    return response.data
  },

  // Obtener permisos por módulo
  async getPermisosPorModulo(module: string): Promise<Permiso[]> {
    const response = await axios.get<Permiso[]>(`${API_URL}/Permissions/module/${module}`)
    return response.data
  },

  // Crear permiso
  async createPermiso(data: CreatePermisoDto): Promise<Permiso> {
    const response = await axios.post<Permiso>(`${API_URL}/Permissions`, data)
    return response.data
  },

  // Actualizar permiso
  async updatePermiso(id: number, data: UpdatePermisoDto): Promise<Permiso> {
    const response = await axios.put<Permiso>(`${API_URL}/Permissions/${id}`, data)
    return response.data
  },

  // Eliminar permiso
  async deletePermiso(id: number): Promise<void> {
    await axios.delete(`${API_URL}/Permissions/${id}`)
  },

  // Asignar permiso a rol
  async asignarPermiso(data: AsignarPermisoDto): Promise<void> {
    await axios.post(`${API_URL}/Permissions/assign`, data)
  },

  // Remover permiso de rol
  async removerPermiso(data: RemoverPermisoDto): Promise<void> {
    await axios.post(`${API_URL}/Permissions/remove`, data)
  },

  // Obtener permisos de un usuario (derivados de sus roles)
  async getPermisosUsuario(userId: string): Promise<string[]> {
    const response = await axios.get<string[]>(`${API_URL}/Users/${userId}/permissions`)
    return response.data
  }
}
