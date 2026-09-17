import type { RouteRecordRaw } from 'vue-router'

// Permisos por tipo de usuario (requerimiento explicito del negocio): 'recepcionproveedores.tienda'
// da acceso total a las pantallas operativas de tienda (Buscar/Detalle/Picking/Logs, En Curso/Picking
// e Historial con su descarga a Excel). 'recepcionproveedores.view' es el permiso de Supervisor y da
// acceso total a TODO el modulo: todo lo anterior mas 'Ordenes de Compra Pendientes', que es exclusiva
// de Supervisor. Ambos comparten el prefijo 'recepcionproveedores.' asi que MainLayout.vue
// hasModuleAccess (regla generica permission.startsWith('recepcionproveedores.')) sigue mostrando el
// modulo en el sidebar para cualquiera de los dos, sin cambios ahi.
const TIENDA = 'recepcionproveedores.tienda'
const SUPERVISOR = 'recepcionproveedores.view'

function route(
  path: string,
  name: string,
  component: () => Promise<unknown>,
  meta: { title: string; icon?: string; permissions: string[] }
): RouteRecordRaw {
  return {
    path,
    name,
    component,
    meta: { requiresAuth: true, ...meta },
  } as RouteRecordRaw
}

const routes: RouteRecordRaw[] = [
  route('/recepcion-proveedores', 'recepcion-proveedores-dashboard', () => import('./views/DashboardView.vue'), {
    title: 'Recepción ODC de Proveedores',
    icon: 'MagnifyingGlassIcon',
    // Landing del modulo: la pantalla misma reparte sus tarjetas segun el permiso (ver DashboardView.vue).
    permissions: [TIENDA, SUPERVISOR],
  }),
  route('/recepcion-proveedores/buscar', 'recepcion-proveedores-buscar', () => import('./views/BuscarOrdenView.vue'), {
    title: 'Buscar Orden de Compra',
    permissions: [TIENDA, SUPERVISOR],
  }),
  route(
    '/recepcion-proveedores/ordenes-compra/:docNum',
    'recepcion-proveedores-detalle',
    () => import('./views/OrdenCompraDetailView.vue'),
    { title: 'Detalle de Orden de Compra', permissions: [TIENDA, SUPERVISOR] }
  ),
  route(
    '/recepcion-proveedores/picking/:sesionId',
    'recepcion-proveedores-picking',
    () => import('./views/PickingView.vue'),
    { title: 'Picking', permissions: [TIENDA, SUPERVISOR] }
  ),
  route('/recepcion-proveedores/logs', 'recepcion-proveedores-logs', () => import('./views/LogsView.vue'), {
    title: 'Logs de Picking',
    permissions: [TIENDA, SUPERVISOR],
  }),
  route('/recepcion-proveedores/historial', 'recepcion-proveedores-historial', () => import('./views/HistorialView.vue'), {
    title: 'Historial de Recepciones',
    // Tienda y Supervisor lo ven, incluida la descarga a Excel con detalle por ODC/producto
    // (ver HistorialView.vue).
    permissions: [TIENDA, SUPERVISOR],
  }),
  route('/recepcion-proveedores/recepcion-parcial', 'recepcion-proveedores-parcial', () => import('./views/RecepcionParcialView.vue'), {
    title: 'En Curso/Picking',
    permissions: [TIENDA, SUPERVISOR],
  }),
  route(
    '/recepcion-proveedores/pendientes',
    'recepcion-proveedores-pendientes',
    () => import('./views/OrdenesCompraPendientesView.vue'),
    { title: 'Órdenes de Compra Pendientes', permissions: [SUPERVISOR] }
  ),
]

export default routes
