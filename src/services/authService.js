import api from './api'

export default {
  // Login
  async login(username, password, useActiveDirectory = false) {
    const response = await api.post('/auth/login', {
      userName: username,
      password: password,
      useActiveDirectory: useActiveDirectory
    })
    
    const { token, user } = response.data
    
    // Guardar en localStorage
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    
    return response.data
  },

  // Logout
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  // Obtener usuario actual
  async getCurrentUser() {
    const response = await api.get('/auth/me')
    const user = response.data.user
    localStorage.setItem('user', JSON.stringify(user))
    return user
  },

  // Validar token
  async validateToken(token) {
    const response = await api.post('/auth/validate', { token })
    return response.data
  },

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    return !!localStorage.getItem('token')
  },

  // Obtener usuario del localStorage
  getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  // Verificar si el usuario tiene un rol específico
  hasRole(role) {
    const user = this.getUser()
    return user?.roles?.includes(role) || false
  },

  // Verificar si el usuario tiene un permiso específico
  hasPermission(permission) {
    const user = this.getUser()
    return user?.permissions?.includes(permission) || false
  },

  // Verificar si el usuario tiene alguno de varios permisos
  hasAnyPermission(permissions) {
    const user = this.getUser()
    return permissions.some(p => user?.permissions?.includes(p))
  },

  // Verificar si el usuario tiene todos los permisos
  hasAllPermissions(permissions) {
    const user = this.getUser()
    return permissions.every(p => user?.permissions?.includes(p))
  }
}