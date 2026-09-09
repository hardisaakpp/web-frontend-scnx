import type { RouteRecordRaw } from 'vue-router'

// Sin meta.permissions todavia: los strings 'recepcion-proveedores.*' aun no existen en el
// catalogo de permisos de scnexus-core. Agregarlos aqui antes de darlos de alta alla dejaria
// al propio usuario bloqueado por el guard global. Ver plan de este modulo.
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
    meta: { requiresAuth: true, ...meta },
  } as RouteRecordRaw
}

const routes: RouteRecordRaw[] = [
  route('/recepcion-proveedores', 'recepcion-proveedores-buscar', () => import('./views/BuscarOrdenView.vue'), {
    title: 'Recepción Proveedores',
    icon: 'MagnifyingGlassIcon',
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
