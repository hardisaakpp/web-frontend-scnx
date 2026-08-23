import type { RouteRecordRaw } from 'vue-router'

// Permiso "cedi.view" — igual que el resto de módulos (docs/SISTEMA_PERMISOS.md), debe
// existir primero en el catálogo del Core (POST /api/Permissions) y asignarse a los roles
// de bodega/CEDI antes de que esto autorice en un entorno real. En dev, ALLOW_UNAUTHENTICATED
// deja pasar igual mientras tanto (ver src/router/index.ts).
const routes: RouteRecordRaw[] = [
  {
    path: '/cedi',
    name: 'cedi-dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      title: 'CEDI',
      icon: 'ArchiveBoxIcon',
      permissions: ['cedi.view'],
    },
  },
  {
    path: '/cedi/odc',
    name: 'cedi-odc-list',
    component: () => import('./views/OdcListView.vue'),
    meta: {
      requiresAuth: true,
      title: 'ODC — Ingreso de Mercadería',
      permissions: ['cedi.odc.view'],
    },
  },
  {
    path: '/cedi/odc/:numDoc',
    name: 'cedi-odc-detail',
    component: () => import('./views/OdcDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Detalle de ODC',
      permissions: ['cedi.odc.view'],
    },
  },
  {
    path: '/cedi/odc/:numDoc/picking/:sessionId',
    name: 'cedi-odc-picking-work',
    component: () => import('./views/OdcPickingWorkView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Escaneo de Picking',
      permissions: ['cedi.odc.picking'],
    },
  },

  // ── Distribución / Crossdocking (P-008 a P-011) ──────────────────────────────────────
  {
    path: '/cedi/distribucion',
    name: 'cedi-sot-list',
    component: () => import('./views/SotListView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Distribución — Solicitudes de Transferencia',
      permissions: ['cedi.sot.view'],
    },
  },
  {
    path: '/cedi/distribucion/grupos',
    name: 'cedi-grupo-list',
    component: () => import('./views/GrupoListView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Grupos de Distribución',
      permissions: ['cedi.grupo.view'],
    },
  },
  {
    path: '/cedi/distribucion/grupos/:id',
    name: 'cedi-grupo-detail',
    component: () => import('./views/GrupoDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Detalle de Grupo',
      permissions: ['cedi.grupo.view'],
    },
  },
  {
    path: '/cedi/distribucion/grupos/:id/picking/:sessionId',
    name: 'cedi-grupo-picking-work',
    component: () => import('./views/GrupoPickingWorkView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Picking de Distribución',
      permissions: ['cedi.grupo.picking'],
    },
  },
]

export default routes
