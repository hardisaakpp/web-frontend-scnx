import authService from '@/services/authService'

export default {
  mounted(el, binding) {
    const { value } = binding
    
    if (!value) return

    let hasPermission = false

    if (typeof value === 'string') {
      hasPermission = authService.hasPermission(value)
    } else if (Array.isArray(value)) {
      hasPermission = value.some(p => authService.hasPermission(p))
    }

    if (!hasPermission) {
      el.style.display = 'none'
    }
  }
}