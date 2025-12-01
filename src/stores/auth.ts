import { defineStore } from 'pinia'
import api from '../plugins/axios'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'

interface AuthState {
  token: string | null
  user: string | null
  role: string | null
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

        // Guardar token y user completo en localStorage
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))

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