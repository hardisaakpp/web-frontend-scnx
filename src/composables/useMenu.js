import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useMenu() {
  const authStore = useAuthStore()

  const menuItems = computed(() => {
    const items = [
      {
        name: 'Dashboard',
        icon: 'HomeIcon',
        path: '/',
        permissions: [] // Visible para todos los autenticados
      },
      {
        name: 'Usuarios',
        icon: 'UsersIcon',
        path: '/users',
        permissions: ['users.view']
      },
      {
        name: 'Depósitos',
        icon: 'CreditCardIcon',
        path: '/depositos',
        permissions: ['depositos.view']
      },
      {
        name: 'Contabilidad',
        icon: 'CalculatorIcon',
        path: '/contabilidad',
        permissions: ['contabilidad.view']
      },
      {
        name: 'Reportes',
        icon: 'ChartBarIcon',
        path: '/reportes',
        permissions: ['reportes.view']
      }
    ]

    // Filtrar items según permisos del usuario
    return items.filter(item => {
      if (item.permissions.length === 0) return true
      return item.permissions.some(p => authStore.hasPermission(p))
    })
  })

  return { menuItems }
}