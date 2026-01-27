import { defineStore } from 'pinia'
import api from '../plugins/axios'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'

interface User {
  id: string
  userName: string
  email: string
  fullName: string
  roles: string[]
  permissions: string[]
}

/** Capabilities expuestas por GET /Auth/me. */
export interface AuthCapabilities {
  /** true solo con permiso odc.view (sin admin override). Botón sidebar "Gestión ODC SAP". */
  can_view_odc_sap?: boolean
  /** true solo con permiso odcsap.view. Botón "Gestionar Pedido" en dashboard. */
  can_manage_order?: boolean
  /** true solo con permiso odcsap.view. Botón/link "Listado de Pedidos" en dashboard. */
  can_view_order_list?: boolean
  [key: string]: boolean | undefined
}

interface AuthState {
  token: string | null
  user: string | null
  role: string | null
  userData: User | null
  /** Rellenado por fetchMe() desde GET /Auth/me. Usar solo capabilities para visibilidad del botón "Gestión ODC SAP". */
  capabilities: AuthCapabilities | null
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
  }
}

interface JwtPayload {
  unique_name: string
  role: string[]
  iss: string
  aud: string
  exp: number
}

/** Respuesta de GET /Auth/me. capabilities.can_view_odc_sap es true solo con permiso odc.view (sin admin override). */
interface MeResponse {
  user?: User
  capabilities?: AuthCapabilities
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: null,
    role: null,
    userData: null,
    capabilities: null
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
    canViewOrderList: (state): boolean => state.capabilities?.can_view_order_list === true
  },

  actions: {
    async login(credentials: LoginCredentials): Promise<boolean> {
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

        // Configure axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        await this.fetchMe()
        return true
      } catch (error) {
        console.error('Login failed:', error)
        return false
      }
    },

    /** Obtiene user y capabilities desde GET /Auth/me. Usar capabilities.can_view_odc_sap para el botón "Gestión ODC SAP". */
    async fetchMe(): Promise<void> {
      if (import.meta.env.DEV) {
        console.log('[fetchMe] token:', this.token ? 'present' : 'null')
      }
      if (!this.token) return
      try {
        const { data } = await api.get<MeResponse>('/Auth/me')
        if (data?.user) {
          this.userData = data.user
          localStorage.setItem('user', JSON.stringify(data.user))
        }
        if (data?.capabilities) {
          if (import.meta.env.DEV) {
            console.log('[fetchMe] capabilities recibidas:', data.capabilities)
          }
          this.capabilities = data.capabilities
        }
      } catch (err: unknown) {
        console.error('fetchMe failed:', err)
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 401) {
          this.logout()
        }
      }
    },

    logout(): void {
      // Clear state
      this.token = null
      this.user = null
      this.role = null
      this.userData = null
      this.capabilities = null

      // Remove from storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Remove axios header
      delete api.defaults.headers.common['Authorization']
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
          
          // Verificar si el token ha expirado
          if (decoded.exp * 1000 < Date.now()) {
            this.logout()
            return
          }

          this.token = token
          this.user = decoded.unique_name
          this.role = decoded.role[0] || null
          
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
        } catch {
          this.logout()
        }
      }
    }
  }
})