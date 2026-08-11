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
      permissions: ['reposiciones.tienda', 'reposiciones.administrador', 'reposiciones.negocio'],
    },
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore()
      const isTienda = authStore.hasPermission('reposiciones.tienda')
      const isAdmin = authStore.hasPermission('reposiciones.administrador')
      const isNegocio = authStore.hasPermission('reposiciones.negocio')

      if (isTienda && !isAdmin && !isNegocio) {
        next('/reposiciones/catalogo') // Solo tienda: única vista operativa, acceso directo
      } else if (isTienda || isAdmin || isNegocio) {
        next() // Tiene más de un perfil o vistas de gestión: debe elegir en el Dashboard
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
      permissions: ['reposiciones.administrador', 'reposiciones.negocio'],
    },
  },
  {
    path: '/reposiciones/admin/catalogo',
    name: 'reposiciones-admin-catalogo',
    component: () => import('./views/AdminCatalogoView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Catálogo (Administrador)',
      permissions: ['reposiciones.administrador', 'reposiciones.negocio'],
    },
  },
  {
    path: '/reposiciones/admin/configuracion',
    name: 'reposiciones-admin-configuracion',
    component: () => import('./views/AdminConfiguracionView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Configuración (Administrador)',
      permissions: ['reposiciones.administrador'],
    },
  },
]

export default routes
