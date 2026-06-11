import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/reposiciones',
    name: 'reposiciones-index',
    component: () => import('./views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Reposiciones',
      icon: 'CubeIcon',
      permissions: ['reposiciones.tienda', 'reposiciones.administrador'],
    },
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore()
      const isTienda = authStore.hasPermission('reposiciones.tienda')
      const isAdmin = authStore.hasPermission('reposiciones.administrador')

      if (isTienda && isAdmin) {
        next() // Tiene ambos, mostrar Dashboard de elección
      } else if (isTienda) {
        next('/reposiciones/catalogo') // Solo tienda
      } else if (isAdmin) {
        next('/reposiciones/admin/historial') // Solo admin
      } else {
        next('/login') // No debería pasar si hay guardia global
      }
    }
  },
  {
    path: '/reposiciones/catalogo',
    name: 'reposiciones-catalogo',
    component: () => import('./views/SolicitarView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Catálogo de Reposición',
      permissions: ['reposiciones.tienda'],
    },
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) next('/login')
      else if (!authStore.hasPermission('reposiciones.tienda')) next('/forbidden')
      else next()
    }
  },
  {
    path: '/reposiciones/carrito',
    name: 'reposiciones-carrito',
    component: () => import('./views/CarritoView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Carrito de Reposición',
      permissions: ['reposiciones.tienda'],
    },
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) next('/login')
      else if (!authStore.hasPermission('reposiciones.tienda')) next('/forbidden')
      else next()
    }
  },
  {
    path: '/reposiciones/historial',
    name: 'reposiciones-historial',
    component: () => import('./views/HistorialView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Mi Historial',
      permissions: ['reposiciones.tienda'],
    },
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) next('/login')
      else if (!authStore.hasPermission('reposiciones.tienda')) next('/forbidden')
      else next()
    }
  },
  {
    path: '/reposiciones/admin/historial',
    name: 'reposiciones-admin-historial',
    component: () => import('./views/AdminHistorialView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Historial Global',
      permissions: ['reposiciones.administrador'],
    },
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) next('/login')
      else if (!authStore.hasPermission('reposiciones.administrador')) next('/forbidden')
      else next()
    }
  },
]

export default routes
