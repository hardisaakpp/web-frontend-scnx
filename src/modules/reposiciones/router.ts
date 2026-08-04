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

      if (isTienda && !isAdmin) {
        next('/reposiciones/catalogo') // Solo tienda: única vista operativa, acceso directo
      } else if (isTienda || isAdmin) {
        next() // Admin (con o sin tienda): tiene múltiples vistas, debe elegir en el Dashboard
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
  },
  {
    path: '/reposiciones/admin/catalogo',
    name: 'reposiciones-admin-catalogo',
    component: () => import('./views/AdminCatalogoView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Catálogo (Administrador)',
      permissions: ['reposiciones.administrador'],
    },
  },
]

export default routes
