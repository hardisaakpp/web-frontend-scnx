import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/reposiciones',
    name: 'reposiciones',
    component: () => import('./views/SolicitarView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Reposiciones',
      icon: 'CubeIcon',
      permissions: ['reposiciones.view'],
    },
  },
  {
    path: '/reposiciones/carrito',
    name: 'reposiciones-carrito',
    component: () => import('./views/CarritoView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Carrito de Reposición',
      permissions: ['reposiciones.view'],
    },
  },
  {
    path: '/reposiciones/historial',
    name: 'reposiciones-historial',
    component: () => import('./views/HistorialView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Historial de Reposiciones',
      permissions: ['reposiciones.view'],
    },
  },
]

export default routes
