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
      permissions: ['transacciones.cajero'],
    },
  },
  {
    path: '/transacciones/tesoreria',
    name: 'transacciones-tesoreria',
    component: () => import('./views/TesoreriaView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Reporte de Tesorería',
      permissions: ['transacciones.tesoreria'],
    },
  },
  {
    path: '/transacciones/historial-reserva',
    name: 'transacciones-historial-reserva',
    component: () => import('./views/HistorialReservaView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Historial de Reservas',
      permissions: ['transacciones.cajero'],
    },
  },
]

export default routes
