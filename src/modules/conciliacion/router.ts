import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/conciliacion',
    name: 'conciliacion',
    component: () => import('./views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Conciliación Bancaria',
      icon: 'ClipboardDocumentCheckIcon',
      permissions: ['conciliacion.view'],
    },
  },
  {
    path: '/conciliacion/importar',
    name: 'conciliacion-importar',
    component: () => import('./views/ImportarMovimientosView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Importar Movimientos',
      permissions: ['conciliacion.import'],
    },
  },
  {
    path: '/conciliacion/sincronizar-sap',
    name: 'conciliacion-sync-sap',
    component: () => import('./views/SincronizarSAPView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Sincronizar SAP',
      permissions: ['conciliacion.sync'],
    },
  },
  {
    path: '/conciliacion/conciliar',
    name: 'conciliacion-automatica',
    component: () => import('./views/ConciliacionAutomaticaView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Conciliación Automática',
      permissions: ['conciliacion.conciliar'],
    },
  },
  {
    path: '/conciliacion/novedades',
    name: 'conciliacion-novedades',
    component: () => import('./views/NovedadesView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Novedades',
      permissions: ['conciliacion.conciliar'],
    },
  },
  {
    path: '/conciliacion/historial',
    name: 'conciliacion-historial',
    component: () => import('./views/HistorialView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Historial',
      permissions: ['conciliacion.view'],
    },
  },
  {
    path: '/conciliacion/partidas-abiertas',
    name: 'conciliacion-partidas-abiertas',
    component: () => import('./views/PartidasAbiertasView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Partidas Abiertas',
      permissions: ['conciliacion.view'],
    },
  },
  {
    path: '/conciliacion/sap-incompletos',
    name: 'conciliacion-sap-incompletos',
    component: () => import('./views/SAPIncompletosView.vue'),
    meta: {
      requiresAuth: true,
      title: 'SAP Incompletos',
      permissions: ['conciliacion.view'],
    },
  },
]

export default routes
