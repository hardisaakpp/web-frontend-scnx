import { useAuthStore } from '@/stores/auth'

export default {
  mounted(el: HTMLElement, binding: { value: string | string[] }) {
    const { value } = binding

    if (!value) return

    const authStore = useAuthStore()

    let hasPermission = false

    if (typeof value === 'string') {
      hasPermission = authStore.hasPermission(value)
    } else if (Array.isArray(value)) {
      hasPermission = value.some(p => authStore.hasPermission(p))
    }

    if (!hasPermission) {
      el.style.display = 'none'
    }
  }
}
