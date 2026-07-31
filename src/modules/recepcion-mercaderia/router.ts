import type { RouteRecordRaw } from 'vue-router'

// Route -> permission map per design.md "Interfaces":
// Pending/InProgress/Detail -> recepcion.reception.view; History -> recepcion.history.view.
// recepcion.history.viewall no longer gates a separate route — HistoryView.vue checks it
// in-component to show/hide the "Todos los almacenes" toggle, same pattern as the per-action
// permissions inside TransferDetailView (picking.scan, reception.confirm[.partial],
// diferencias.gestionar), which are also checked in-component rather than at the route level.
//
// Only `meta.permissions` guards routes here — no per-route `beforeEnter`. design.md explicitly
// drops that reposiciones pattern as redundant noise: the global guard in `src/router/index.ts`
// already enforces `meta.permissions` (plus the Admin bypass).
const routes: RouteRecordRaw[] = [
  {
    path: '/recepcion-mercaderia',
    name: 'recepcion-dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Recepción Mercadería',
      icon: 'TruckIcon',
    },
  },
  {
    path: '/recepcion-mercaderia/pendientes',
    name: 'recepcion-pendientes',
    component: () => import('./views/PendingTransfersView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Transferencias Pendientes',
      icon: 'InboxIcon',
      permissions: ['recepcion.reception.view'],
    },
  },
  {
    path: '/recepcion-mercaderia/en-curso',
    name: 'recepcion-en-curso',
    component: () => import('./views/InProgressView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Transferencias en Curso',
      icon: 'ArrowPathIcon',
      permissions: ['recepcion.reception.view'],
    },
  },
  {
    path: '/recepcion-mercaderia/en-curso/:id',
    name: 'recepcion-detalle',
    component: () => import('./views/TransferDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Detalle de Transferencia',
      permissions: ['recepcion.reception.view'],
    },
  },
  {
    path: '/recepcion-mercaderia/historial',
    name: 'recepcion-historial',
    component: () => import('./views/HistoryView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Historial',
      icon: 'ClockIcon',
      permissions: ['recepcion.history.view'],
    },
  },
  {
    // Old bookmark/link compatibility — the admin/global view is now an in-page toggle
    // inside HistoryView.vue (gated on recepcion.history.viewall client-side), not a
    // separate route.
    path: '/recepcion-mercaderia/historial/admin',
    redirect: '/recepcion-mercaderia/historial',
  },
]

export default routes
