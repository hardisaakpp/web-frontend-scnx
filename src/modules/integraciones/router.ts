import type { RouteRecordRaw } from 'vue-router'
import { INTEGRACIONES_VIEW_PERMISSIONS } from './permissions'

/**
 * Módulo Integraciones: pantallas de soporte sobre api-middleware-sap.
 * Un solo permiso de lectura para las tres pestañas; el reintento a HITELL se controla en la vista
 * con `integraciones.hitell.retry`.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/integraciones',
    name: 'integraciones',
    redirect: { name: 'integraciones-hitell' },
    meta: {
      requiresAuth: true,
      title: 'Integraciones',
      icon: 'ArrowPathRoundedSquareIcon',
      permissions: INTEGRACIONES_VIEW_PERMISSIONS,
    },
  },
  {
    path: '/integraciones/hitell',
    name: 'integraciones-hitell',
    component: () => import('./views/HitellSyncView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Integración HITELL',
      permissions: INTEGRACIONES_VIEW_PERMISSIONS,
    },
  },
  {
    path: '/integraciones/cola-sap',
    name: 'integraciones-cola-sap',
    component: () => import('./views/SapJobsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Cola de peticiones SAP',
      permissions: INTEGRACIONES_VIEW_PERMISSIONS,
    },
  },
  {
    path: '/integraciones/bitacora',
    name: 'integraciones-bitacora',
    component: () => import('./views/BitacoraView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Bitácora de peticiones',
      permissions: INTEGRACIONES_VIEW_PERMISSIONS,
    },
  },
]

export default routes
