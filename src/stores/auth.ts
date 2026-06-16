import { defineStore } from 'pinia'
import api, { mba3Api } from '../plugins/axios'
import { jwtDecode } from 'jwt-decode'

/** Timeout ID para redirigir al login cuando caduca el token. Se limpia en logout. */
let expiryTimeoutId: ReturnType<typeof setTimeout> | null = null

const LOGIN_REDIRECT_URL =
  (import.meta.env.VITE_LOGIN_REDIRECT_URL as string) || `${typeof window !== 'undefined' ? window.location.origin : ''}/login`

/** Programa logout y redirección al login cuando el token expire (60 s antes). */
function scheduleRedirectOnTokenExpiry(token: string, store: { logout: () => void }): void {
  if (expiryTimeoutId) {
    clearTimeout(expiryTimeoutId)
    expiryTimeoutId = null
  }
  try {
    const decoded = jwtDecode<JwtPayload>(token)
    const expiresAtMs = decoded.exp * 1000
    const msUntilExpire = expiresAtMs - Date.now()
    if (msUntilExpire <= 0) {
      store.logout()
      if (typeof window !== 'undefined') window.location.href = LOGIN_REDIRECT_URL
      return
    }
    const redirectMs = Math.max(0, msUntilExpire - 60_000) // 60 s antes de caducar
    expiryTimeoutId = setTimeout(() => {
      expiryTimeoutId = null
      store.logout()
      if (typeof window !== 'undefined') window.location.href = LOGIN_REDIRECT_URL
    }, redirectMs)
  } catch {
    // Token inválido; no programar
  }
}

function clearExpiryTimeout(): void {
  if (expiryTimeoutId) {
    clearTimeout(expiryTimeoutId)
    expiryTimeoutId = null
  }
}

export interface WarehouseAccessInfo {
  codAlmacen: string
  accesoAlmacen: string
  warehouseGroupId: string | null
  warehouseGroupName: string | null
}

interface User {
  id: string
  userName: string
  email: string
  fullName: string
  roles: string[]
  permissions: string[]
  warehouseAccesses: WarehouseAccessInfo[]
}

/** Capabilities expuestas por GET /Auth/me (snake_case). */
export interface AuthCapabilities {
  /** true solo con permiso odc.view (sin admin override). Botón sidebar "Gestión ODC SAP". */
  can_view_odc_sap?: boolean
  /** true solo con permiso odcsap.view. Botón "Gestionar Pedido" en dashboard. */
  can_manage_order?: boolean
  /** true solo con permiso odcsap.view. Botón/link "Listado de Pedidos" en dashboard. */
  can_view_order_list?: boolean
  /** true solo con permiso mabel.view. Cargar Plantilla, Redistribución, Procesamiento SAP, Procesos, Homologaciones. */
  mabel_view?: boolean
  /** true con permiso mabel.view o admin. Botón "Listado Pedidos Originales" para ver/descargar/eliminar archivos Excel en MinIO. */
  can_view_plantillas_originales?: boolean
  [key: string]: boolean | undefined
}

interface AuthState {
  token: string | null
  user: string | null
  role: string | null
  userData: User | null
  /** Rellenado por fetchMe() desde GET /Auth/me. Usar solo capabilities para visibilidad del botón "Gestión ODC SAP". */
  capabilities: AuthCapabilities | null
  loading: boolean
  error: string | null
}

interface LoginCredentials {
  username: string
  password: string
  useActiveDirectory?: boolean
}

interface LoginResponse {
  token: string
  expiresIn: number
  user: {
    id: string
    userName: string
    email: string
    fullName: string
    roles: string[]
    permissions: string[]
    warehouseAccesses: WarehouseAccessInfo[]
  }
}

interface JwtPayload {
  exp: number
  iss?: string
  aud?: string
  unique_name?: string
  role?: string[] | string
  [claim: string]: unknown
}

/** Respuesta de GET /Auth/me. capabilities.can_view_odc_sap es true solo con permiso odc.view (sin admin override). */
interface MeResponse {
  user?: User
  capabilities?: AuthCapabilities
}

/** Claves de capabilities MBA3; aliases = nombres típicos en respuestas .NET (PascalCase). */
const MBA3_CAPABILITY_DEFS: { snake: keyof AuthCapabilities; aliases: string[] }[] = [
  { snake: 'can_view_odc_sap', aliases: ['CanViewOdcSap'] },
  { snake: 'can_manage_order', aliases: ['CanManageOrder'] },
  { snake: 'can_view_order_list', aliases: ['CanViewOrderList'] },
  { snake: 'mabel_view', aliases: ['MabelView'] },
  { snake: 'can_view_plantillas_originales', aliases: ['CanViewPlantillasOriginales'] },
]

function capabilitiesFromApiCapabilitiesObject(raw: unknown): Partial<AuthCapabilities> {
  if (!raw || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const partial: Partial<AuthCapabilities> = {}
  for (const { snake, aliases } of MBA3_CAPABILITY_DEFS) {
    for (const key of [snake, ...aliases]) {
      if (key in o && typeof o[key] === 'boolean') {
        partial[snake] = o[key] as boolean
        break
      }
    }
  }
  return partial
}

/** Fallback cuando el Core omite parte de `capabilities`: mismas reglas que docs/FRONTEND.md § 0.5.7. */
function deriveCapabilitiesFromPermissions(permissions: string[], roles: string[]): AuthCapabilities {
  const p = new Set((permissions || []).map((x) => String(x).toLowerCase()))
  const isAdmin = (roles || []).some((r) => String(r) === 'Admin')
  const odcsap = p.has('odcsap.view')
  const mabel = p.has('mabel.view')
  const odc = p.has('odc.view')
  return {
    can_view_odc_sap: odc,
    can_manage_order: odcsap,
    can_view_order_list: odcsap,
    mabel_view: mabel,
    can_view_plantillas_originales: mabel || isAdmin,
  }
}

function mergeCapabilitiesWithDerived(
  fromApi: Partial<AuthCapabilities>,
  derived: AuthCapabilities
): AuthCapabilities {
  const out: AuthCapabilities = {}
  for (const { snake } of MBA3_CAPABILITY_DEFS) {
    if (fromApi[snake] !== undefined) {
      out[snake] = fromApi[snake] === true
    } else {
      out[snake] = derived[snake] === true
    }
  }
  return out
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: null,
    role: null,
    userData: null,
    capabilities: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    isAdmin(state): boolean {
      // Verificar en state.role primero
      if (state.role === 'Admin') return true
      // Verificar en userData.roles
      if (state.userData?.roles?.includes('Admin')) return true
      // Verificar en localStorage
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr) as User
          return user.roles?.includes('Admin') || false
        }
      } catch {
        return false
      }
      return false
    },
    isUser(state): boolean {
      // Verificar en state.role primero
      if (state.role === 'User') return true
      // Verificar en userData.roles
      if (state.userData?.roles?.includes('User')) return true
      // Verificar en localStorage
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr) as User
          return user.roles?.includes('User') || false
        }
      } catch {
        return false
      }
      return false
    },
    /** Rol principal del usuario (evita colisión con state.role). */
    currentRole(state): string | null {
      if (state.role) return state.role
      if (state.userData?.roles && state.userData.roles.length > 0) {
        return state.userData.roles[0]
      }
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr) as User
          return user.roles?.[0] || null
        }
      } catch {
        return null
      }
      return null
    },
    userPermissions: (state): string[] => {
      if (state.userData?.permissions) {
        return state.userData.permissions
      }
      // Intentar obtener desde localStorage si no está en state
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr) as User
          return user.permissions || []
        }
      } catch {
        return []
      }
      return []
    },
    userWarehouseAccesses: (state): WarehouseAccessInfo[] => {
      if (state.userData?.warehouseAccesses) {
        return state.userData.warehouseAccesses
      }
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr) as User
          return user.warehouseAccesses || []
        }
      } catch {
        return []
      }
      return []
    },
    userRoles: (state): string[] => {
      if (state.userData?.roles) {
        return state.userData.roles
      }
      // Intentar obtener desde localStorage si no está en state
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr) as User
          return user.roles || []
        }
      } catch {
        return []
      }
      return []
    },
    userName: (state): string => {
      if (state.userData?.userName) {
        return state.userData.userName
      }
      // Fallback al user del state o localStorage
      if (state.user) {
        return state.user
      }
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr) as User
          return user.userName || ''
        }
      } catch {
        return ''
      }
      return ''
    },
    userEmail: (state): string => {
      if (state.userData?.email) {
        return state.userData.email
      }
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr) as User
          return user.email || ''
        }
      } catch {
        return ''
      }
      return ''
    },
    fullName: (state): string => {
      if (state.userData?.fullName) {
        return state.userData.fullName
      }
      // Intentar obtener desde localStorage si no está en state
      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr) as User
          return user.fullName || ''
        }
      } catch {
        return ''
      }
      return ''
    },
    /** true solo si GET /Auth/me devolvió capabilities.can_view_odc_sap === true (permiso odc.view, sin admin override). Única fuente para mostrar el botón "Gestión ODC SAP". */
    canViewOdcSap: (state): boolean => state.capabilities?.can_view_odc_sap === true,
    /** true solo si capabilities.can_manage_order === true (permiso odcsap.view). Botón "Gestionar Pedido". Ver docs/FRONTEND.md § 0.5.7.2. */
    canManageOrder: (state): boolean => state.capabilities?.can_manage_order === true,
    /** true solo si capabilities.can_view_order_list === true (permiso odcsap.view). Botón "Listado de Pedidos". Ver docs/FRONTEND.md § 0.5.7.2. */
    canViewOrderList: (state): boolean => state.capabilities?.can_view_order_list === true,
    /** true solo si capabilities.mabel_view === true (permiso mabel.view). Cargar Plantilla, Redistribución, Procesamiento SAP, Procesos, Homologaciones. Solo leer de capabilities. */
    canViewMabel: (state): boolean => state.capabilities?.mabel_view === true,
    /** true solo si capabilities.can_view_plantillas_originales === true (permiso mabel.view o admin). Botón "Listado Pedidos Originales" en sección Información ODC. */
    canViewPlantillasOriginales: (state): boolean => state.capabilities?.can_view_plantillas_originales === true
  },

  actions: {
    async login(credentials: LoginCredentials): Promise<boolean> {
      this.loading = true
      this.error = null

      try {
        // Transformar el body para que coincida con la API
        const requestBody = {
          userName: credentials.username,
          password: credentials.password,
          useActiveDirectory: credentials.useActiveDirectory ?? false
        }

        const response = await api.post<LoginResponse>('/Auth/login', requestBody)
        const { token, user } = response.data

        // Usar la información del user de la respuesta
        this.token = token
        this.user = user.userName
        this.role = user.roles[0] || null
        this.userData = user

        // Guardar token y user completo en localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

        // Configurar token en ambas instancias (Core y MBA3)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        mba3Api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        scheduleRedirectOnTokenExpiry(token, this)
        await this.fetchMe()
        return true
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Login failed:', error)
        }
        this.error = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Error al iniciar sesión'
        return false
      } finally {
        this.loading = false
      }
    },

    /** Obtiene user y capabilities desde GET /Auth/me. Usar capabilities.can_view_odc_sap para el botón "Gestión ODC SAP". */
    async fetchMe(): Promise<void> {
      if (!this.token) return
      try {
        const { data } = await mba3Api.get<MeResponse & { Capabilities?: unknown }>('/Auth/me')
        if (data?.user) {
          this.userData = data.user
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        const rawCaps =
          (data as Record<string, unknown> | undefined)?.capabilities ??
          (data as Record<string, unknown> | undefined)?.Capabilities
        const fromApi = capabilitiesFromApiCapabilitiesObject(rawCaps)
        const permissions = data?.user?.permissions ?? this.userData?.permissions ?? []
        const roles = data?.user?.roles ?? this.userData?.roles ?? []
        const derived = deriveCapabilitiesFromPermissions(permissions, roles)
        this.capabilities = mergeCapabilitiesWithDerived(fromApi, derived)
      } catch (err: unknown) {
        if (import.meta.env.DEV) {
          console.error('fetchMe failed:', err)
        }

        const status = (err as { response?: { status?: number } })?.response?.status

        // Solo cerrar sesión si realmente hay un problema con el token (expirado o inválido).
        if (status === 401) {
          try {
            const token = this.token || localStorage.getItem('token')
            if (!token) {
              this.logout()
              return
            }

            const decoded = jwtDecode<JwtPayload>(token)

            // Si el token ya expiró, cerrar sesión.
            if (decoded.exp * 1000 < Date.now()) {
              this.logout()
            }
            // Si el token sigue siendo válido, no hacer logout: el error es del microservicio, no de la sesión global.
          } catch {
            // Si no se puede decodificar el token, considerarlo inválido y cerrar sesión.
            this.logout()
          }
        } else {
          // Error de red (504, sin conexión, etc.): derivar capabilities desde userData/JWT
          // para que el router no reintente fetchMe() en cada navegación posterior.
          const permissions = this.userData?.permissions ?? []
          const roles = this.userData?.roles ?? []
          if (permissions.length > 0 || roles.length > 0) {
            this.capabilities = deriveCapabilitiesFromPermissions(permissions, roles)
          }
        }
      }
    },

    logout(): void {
      clearExpiryTimeout()
      // Clear state
      this.token = null
      this.user = null
      this.role = null
      this.userData = null
      this.capabilities = null
      this.error = null
      this.loading = false

      // Remove from storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Remove axios header
      delete api.defaults.headers.common['Authorization']
      delete mba3Api.defaults.headers.common['Authorization']
    },

    hasPermission(permission: string): boolean {
      return this.userPermissions.includes(permission)
    },

    hasAnyPermission(permissions: string[]): boolean {
      return permissions.some(p => this.userPermissions.includes(p))
    },

    hasAllPermissions(permissions: string[]): boolean {
      return permissions.every(p => this.userPermissions.includes(p))
    },

    hasRole(role: string): boolean {
      return this.userRoles.includes(role)
    },

    initializeAuth(): void {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const decoded = jwtDecode<JwtPayload>(token)

          const CLAIM_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
          const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

          // Verificar si el token ha expirado
          if (decoded.exp * 1000 < Date.now()) {
            this.logout()
            return
          }

          this.token = token

          // Usuario: preferir claims .NET; fallback a tokens "simples" si existieran
          const userFromClaims =
            (typeof decoded[CLAIM_NAME] === 'string' ? (decoded[CLAIM_NAME] as string) : undefined) ||
            (typeof decoded.unique_name === 'string' ? decoded.unique_name : undefined) ||
            (typeof decoded.name === 'string' ? (decoded.name as string) : undefined)

          this.user = userFromClaims || null

          // Roles: preferir claim .NET; fallback a "role" si existiera
          const roleClaim =
            decoded[CLAIM_ROLE] ??
            decoded.role

          const roles = Array.isArray(roleClaim)
            ? roleClaim.filter((r): r is string => typeof r === 'string')
            : typeof roleClaim === 'string'
              ? [roleClaim]
              : []

          this.role = roles[0] || null

          // Cargar datos del usuario desde localStorage
          const userStr = localStorage.getItem('user')
          if (userStr) {
            try {
              this.userData = JSON.parse(userStr) as User
            } catch {
              // Si no se puede parsear, mantener null
            }
          }

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          scheduleRedirectOnTokenExpiry(token, this)
        } catch {
          this.logout()
        }
      }
    }
  }
})
