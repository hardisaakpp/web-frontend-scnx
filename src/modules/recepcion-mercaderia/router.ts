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
function route(
  path: string,
  name: string,
  component: () => Promise<unknown>,
  meta: { title: string; icon?: string; permissions?: string[] }
): RouteRecordRaw {
  return {
    path,
    name,
    component,
    meta: { requiresAuth: true, ...meta },
  } as RouteRecordRaw
}

const routes: RouteRecordRaw[] = [
  route('/recepcion-mercaderia', 'recepcion-dashboard', () => import('./views/DashboardView.vue'), {
    title: 'Recepción Mercadería',
    icon: 'TruckIcon',
  }),
  route('/recepcion-mercaderia/pendientes', 'recepcion-pendientes', () => import('./views/PendingTransfersView.vue'), {
    title: 'Transferencias Pendientes',
    icon: 'InboxIcon',
    permissions: ['recepcion.reception.view'],
  }),
  route('/recepcion-mercaderia/transitorias', 'recepcion-transitorias', () => import('./views/TransitTransfersView.vue'), {
    title: 'Transferencias en Tránsito',
    icon: 'ArrowsRightLeftIcon',
    permissions: ['recepcion.reception.transit.view'],
  }),
  route('/recepcion-mercaderia/en-curso', 'recepcion-en-curso', () => import('./views/InProgressView.vue'), {
    title: 'Transferencias en Curso',
    icon: 'ArrowPathIcon',
    permissions: ['recepcion.reception.view'],
  }),
  route('/recepcion-mercaderia/en-curso/:id', 'recepcion-detalle', () => import('./views/TransferDetailView.vue'), {
    title: 'Detalle de Transferencia',
    permissions: ['recepcion.reception.view'],
  }),
  route('/recepcion-mercaderia/historial', 'recepcion-historial', () => import('./views/HistoryView.vue'), {
    title: 'Historial',
    icon: 'ClockIcon',
    permissions: ['recepcion.history.view'],
  }),
  {
    // Old bookmark/link compatibility — the admin/global view is now an in-page toggle
    // inside HistoryView.vue (gated on recepcion.history.viewall client-side), not a
    // separate route.
    path: '/recepcion-mercaderia/historial/admin',
    redirect: '/recepcion-mercaderia/historial',
  },
]

export default routes
