import type { RouteRecordRaw } from 'vue-router'

// Permiso unico 'recepcionproveedores.view' para todo el modulo (sidebar + rutas): ver
// MainLayout.vue hasModuleAccess, que resuelve 'recepcionproveedores' por la regla generica
// (permission.startsWith('recepcionproveedores.')), igual que 'promocionsobres'/'inventario'.
const MODULE_PERMISSIONS = ['recepcionproveedores.view']

function route(
  path: string,
  name: string,
  component: () => Promise<unknown>,
  meta: { title: string; icon?: string }
): RouteRecordRaw {
  return {
    path,
    name,
    component,
    meta: { requiresAuth: true, permissions: MODULE_PERMISSIONS, ...meta },
  } as RouteRecordRaw
}

const routes: RouteRecordRaw[] = [
  route('/recepcion-proveedores', 'recepcion-proveedores-dashboard', () => import('./views/DashboardView.vue'), {
    title: 'Recepción Proveedores',
    icon: 'MagnifyingGlassIcon',
  }),
  route('/recepcion-proveedores/buscar', 'recepcion-proveedores-buscar', () => import('./views/BuscarOrdenView.vue'), {
    title: 'Buscar Orden de Compra',
  }),
  route(
    '/recepcion-proveedores/ordenes-compra/:docNum',
    'recepcion-proveedores-detalle',
    () => import('./views/OrdenCompraDetailView.vue'),
    { title: 'Detalle de Orden de Compra' }
  ),
  route(
    '/recepcion-proveedores/picking/:sesionId',
    'recepcion-proveedores-picking',
    () => import('./views/PickingView.vue'),
    { title: 'Picking' }
  ),
  route('/recepcion-proveedores/logs', 'recepcion-proveedores-logs', () => import('./views/LogsView.vue'), {
    title: 'Logs de Picking',
  }),
]

export default routes
