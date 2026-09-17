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
      permissions: ['conciliacion.importacion'],
    },
  },
  {
    path: '/conciliacion/bancos',
    name: 'conciliacion-bancos',
    component: () => import('./views/CatalogoBancosView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Catálogo de Bancos',
      permissions: ['conciliacion.catalogo'],
    },
  },
  {
    path: '/conciliacion/sincronizar-sap',
    name: 'conciliacion-sync-sap',
    component: () => import('./views/SincronizarSAPView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Sincronizar SAP',
      permissions: ['conciliacion.importacion'],
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
      permissions: ['conciliacion.historial'],
    },
  },
  {
    path: '/conciliacion/partidas-abiertas',
    name: 'conciliacion-partidas',
    component: () => import('./views/PartidasAbiertasView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Movimientos Pendientes',
      breadcrumb: 'Pendientes',
      permissions: ['conciliacion.conciliar'],
    },
  },
  {
    path: '/conciliacion/sap-incompletos',
    name: 'conciliacion-sap-incompletos',
    component: () => import('./views/SAPIncompletosView.vue'),
    meta: {
      requiresAuth: true,
      title: 'SAP Incompletos',
      permissions: ['conciliacion.imcompletos'],
    },
  },
  {
    path: '/conciliacion/reporte-maestro',
    name: 'conciliacion-reporte-maestro',
    component: () => import('./views/ReporteMaestroView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Reporte Maestro',
      permissions: ['conciliacion.reporte'],
    },
  },
]

export default routes
