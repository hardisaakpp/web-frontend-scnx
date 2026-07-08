import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/transacciones',
    name: 'transacciones-dashboard',
    component: () => import('./views/TransaccionesDashboard.vue'),
    meta: {
      requiresAuth: true,
      title: 'Transacciones',
    },
  },
  {
    path: '/transacciones/cajero',
    name: 'transacciones-cajero',
    component: () => import('./views/CajeroView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Transacciones · Cajero',
      permissions: ['cajero.view'],
    },
  },
  {
    path: '/transacciones/tesoreria',
    name: 'transacciones-tesoreria',
    component: () => import('./views/TesoreriaView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Reporte de Tesorería',
      permissions: ['tesoreria.view'],
    },
  },
]

export default routes
