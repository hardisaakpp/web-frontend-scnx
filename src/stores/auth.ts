import { defineStore } from 'pinia'
import api from '../plugins/axios'
import { jwtDecode } from 'jwt-decode'

interface AuthState {
  token: string | null
  user: string | null
  role: string | null
}

interface LoginCredentials {
  username: string
  password: string
}

interface JwtPayload {
  unique_name: string
  role: string[]
  iss: string
  aud: string
  exp: number
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: localStorage.getItem('token'),
    user: null,
    role: null
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.token,
    isAdmin: (state): boolean => state.role === 'Admin',
    isUser: (state): boolean => state.role === 'User'
  },

  actions: {
    async login(credentials: LoginCredentials): Promise<boolean> {
      try {
        const response = await api.post('/Auth/login', credentials)
        const token = response.data.token

        // Decode token
        const decoded = jwtDecode<JwtPayload>(token)

        // Set state
        this.token = token
        this.user = decoded.unique_name
        this.role = decoded.role[0]

        // Store token
        localStorage.setItem('token', token)

        // Configure axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        return true
      } catch (error) {
        console.error('Login failed:', error)
        return false
      }
    },

    logout(): void {
      // Clear state
      this.token = null
      this.user = null
      this.role = null

      // Remove from storage
      localStorage.removeItem('token')

      // Remove axios header
      delete api.defaults.headers.common['Authorization']
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
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch {
          this.logout()
        }
      }
    }
  }
})