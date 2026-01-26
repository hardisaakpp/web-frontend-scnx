import { defineStore } from 'pinia'
import authService from '@/services/authService'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: authService.getUser(),
    token: localStorage.getItem('token'),
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRoles: (state) => state.user?.roles || [],
    userPermissions: (state) => state.user?.permissions || [],
    userName: (state) => state.user?.userName || '',
    userEmail: (state) => state.user?.email || '',
    fullName: (state) => state.user?.fullName || ''
  },

  actions: {
    async login(username, password, useActiveDirectory = false) {
      this.loading = true
      this.error = null
      
      try {
        const data = await authService.login(username, password, useActiveDirectory)
        this.token = data.token
        this.user = data.user
        router.push('/')
        return data
      } catch (error) {
        this.error = error.response?.data?.message || 'Error al iniciar sesión'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchCurrentUser() {
      try {
        this.user = await authService.getCurrentUser()
      } catch (error) {
        console.error('Error fetching user:', error)
        this.logout()
      }
    },

    logout() {
      authService.logout()
      this.user = null
      this.token = null
      router.push('/login')
    },

    hasRole(role) {
      return this.userRoles.includes(role)
    },

    hasPermission(permission) {
      return this.userPermissions.includes(permission)
    },

    hasAnyPermission(permissions) {
      return permissions.some(p => this.userPermissions.includes(p))
    },

    hasAllPermissions(permissions) {
      return permissions.every(p => this.userPermissions.includes(p))
    }
  }
})
