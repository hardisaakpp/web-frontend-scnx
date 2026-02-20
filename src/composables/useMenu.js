import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useMenu() {
  const authStore = useAuthStore()

  const menuItems = computed(() => {
    const items = [
      {
        name: 'Usuarios',
        icon: 'UsersIcon',
        path: '/users',
        permissions: ['users.view']
      },
      {
        name: 'Conciliación',
        icon: 'ScaleIcon',
        path: '/conciliacion',
        permissions: ['conciliacion.view']
      },
      {
        name: 'Gestión ODC SAP',
        icon: 'DocumentTextIcon',
        path: '/mba3-consultas',
        permissions: ['mba3-consultas.view']
      }
    ]

    // Verificar si es admin desde userRoles
    const isAdmin = authStore.userRoles?.includes('Admin') || false

    // Filtrar items según permisos del usuario (los administradores tienen acceso automático)
    return items.filter(item => {
      // Los administradores ven todos los items
      if (isAdmin) return true
      // Items sin permisos son visibles para todos
      if (item.permissions.length === 0) return true
      // Verificar si el usuario tiene alguno de los permisos requeridos
      return item.permissions.some(p => authStore.hasPermission(p))
    })
  })

  return { menuItems }
}
