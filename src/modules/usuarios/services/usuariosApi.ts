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

function isAxios404(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('response' in err)) return false
  const status = (err as { response?: { status?: number } }).response?.status
  return status === 404
}

type UserRecord = Record<string, unknown>

function num(...vals: unknown[]): number | undefined {
  for (const v of vals) {
    if (typeof v === 'number' && !Number.isNaN(v)) return v
    if (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v))) return Number(v)
  }
  return undefined
}

/** Alineado con UsersView: el Core puede devolver strings u objetos { name, roleName, ... }. */
function normalizeRoleEntry(role: unknown): string {
  if (role === null || role === undefined) return ''
  if (typeof role === 'string' || typeof role === 'number') return String(role)
  if (typeof role === 'object') {
    const record = role as Record<string, unknown>
    const candidates = [record.name, record.roleName, record.title, record.code, record.Name, record.RoleName]
    const found = candidates.find((value) => value !== undefined && value !== null && value !== '')
    return found !== undefined ? String(found) : ''
  }
  return ''
}

function getUserRecordId(row: UserRecord): string | null {
  const v = row.id ?? row.userId ?? row.Id ?? row.UserId
  if (v === undefined || v === null || v === '') return null
  return String(v)
}

function extractRoleNamesFromUserRecord(row: UserRecord): string[] {
  for (const key of ['roles', 'Roles', 'userRoles', 'UserRoles'] as const) {
    const v = row[key]
    if (!Array.isArray(v) || v.length === 0) continue
    const names = v.map(normalizeRoleEntry).filter(Boolean)
    if (names.length) return names
  }
  return []
}

function parseRolesSubresourcePayload(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.map(normalizeRoleEntry).filter(Boolean)
  }
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (Array.isArray(o.data)) return o.data.map(normalizeRoleEntry).filter(Boolean)
    if (Array.isArray(o.roles)) return o.roles.map(normalizeRoleEntry).filter(Boolean)
    if (Array.isArray(o.Roles)) return o.Roles.map(normalizeRoleEntry).filter(Boolean)
  }
  return []
}

function parseUsersPayloadToRows(data: unknown): UserRecord[] {
  if (Array.isArray(data)) return data as UserRecord[]
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (Array.isArray(o.data)) return o.data as UserRecord[]
    if (Array.isArray(o.users)) return o.users as UserRecord[]
    if (Array.isArray(o.Users)) return o.Users as UserRecord[]
  }
  return []
}

/**
 * Lista completa de usuarios: primero sin params (como UsersView); si hay paginación, pide el resto.
 */
async function fetchAllUserRowsForAggregation(): Promise<UserRecord[]> {
  const pageSize = 500
  const { data: first } = await api.get<unknown>('/Users')
  let rows = parseUsersPayloadToRows(first)

  const o = !Array.isArray(first) && first && typeof first === 'object' ? (first as UserRecord) : null
  if (o && Array.isArray(o.data)) {
    const total = num(o.total, o.Total) ?? 0
    const tp = num(o.totalPages, o.TotalPages)
    const ps = num(o.pageSize, o.PageSize) ?? pageSize
    const current = num(o.page, o.Page) ?? 1
    const totalPages =
      tp && tp > 0 ? tp : total > 0 ? Math.max(1, Math.ceil(total / Math.max(1, ps))) : 1

    if (totalPages > current && rows.length > 0) {
      const rest: UserRecord[] = []
      for (let p = current + 1; p <= totalPages; p++) {
        const { data } = await api.get<unknown>('/Users', { params: { page: p, pageSize: ps } })
        const chunk = parseUsersPayloadToRows(data)
        rest.push(...chunk)
        if (chunk.length === 0) break
      }
      rows = [...rows, ...rest]
    }
  }

  if (rows.length === 0) {
    let page = 1
    const maxPages = 200
    while (page <= maxPages) {
      const { data } = await api.get<unknown>('/Users', { params: { page, pageSize } })
      const chunk = parseUsersPayloadToRows(data)
      if (chunk.length === 0) break
      rows.push(...chunk)
      let hasMore = false
      if (!Array.isArray(data) && data && typeof data === 'object') {
        const d = data as Record<string, unknown>
        const tp = num(d.totalPages, d.TotalPages)
        const cur = num(d.page, d.Page) ?? page
        hasMore = tp !== undefined && tp > 0 ? cur < tp : chunk.length >= pageSize
      }
      if (!hasMore) break
      page++
    }
  }

  const seen = new Set<string>()
  const deduped: UserRecord[] = []
  for (const r of rows) {
    const id = getUserRecordId(r)
    const key = id ?? `__idx_${deduped.length}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(r)
  }
  return deduped
}

async function mergeRoleNamesFromUserRoleEndpoints(names: Set<string>, userIds: string[]): Promise<void> {
  const batchSize = 15
  for (let i = 0; i < userIds.length; i += batchSize) {
    const chunk = userIds.slice(i, i + batchSize)
    const batches = await Promise.all(
      chunk.map(async (id) => {
        try {
          const { data } = await api.get<unknown>(`/Users/${id}/roles`)
          return parseRolesSubresourcePayload(data)
        } catch {
          return []
        }
      })
    )
    for (const list of batches) {
      list.forEach((r) => names.add(r))
    }
  }
}

/**
 * El Core actual no expone GET /api/Roles (ver Swagger). Se obtienen nombres de rol
 * desde el listado de usuarios y, si no vienen incrustados, desde GET /Users/{id}/roles.
 */
async function aggregateRolesFromUsers(): Promise<Rol[]> {
  const names = new Set<string>()
  const rows = await fetchAllUserRowsForAggregation()

  for (const row of rows) {
    for (const r of extractRoleNamesFromUserRecord(row)) {
      names.add(r)
    }
  }

  if (names.size === 0 && rows.length > 0) {
    const ids = rows.map(getUserRecordId).filter((id): id is string => id !== null)
    await mergeRoleNamesFromUserRoleEndpoints(names, ids)
  }

  return [...names]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({
      id: name,
      name,
      description: '',
      normalizedName: name.toUpperCase(),
      createdAt: '',
      permissions: [],
      usersCount: 0
    }))
}

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
    if (import.meta.env.VITE_ROLES_LIST_FROM_USERS === 'true') {
      return aggregateRolesFromUsers()
    }
    try {
      const response = await api.get<any[]>('/Roles')
      return response.data.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        normalizedName: r.normalizedName || r.normalized_name || '',
        createdAt: r.createdAt || '',
        permissions: [],
        usersCount: r.usersCount || 0
      }))
    } catch (e: unknown) {
      if (isAxios404(e)) {
        return aggregateRolesFromUsers()
      }
      throw e
    }
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
          await api.post('/Permissions/unassign', data)
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
