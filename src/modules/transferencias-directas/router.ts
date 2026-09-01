import type { RouteRecordRaw } from 'vue-router'

interface RutaModuloConfig {
  path: string
  name: string
  component: () => Promise<unknown>
  title: string
  permissions: string[]
  icon?: string
}

const crearRuta = ({ path, name, component, title, permissions, icon }: RutaModuloConfig): RouteRecordRaw => ({
  path,
  name,
  component,
  meta: {
    requiresAuth: true,
    title,
    permissions,
    ...(icon ? { icon } : {}),
  },
})

const routes: RouteRecordRaw[] = [
  crearRuta({
    path: '/transferencias-stock',
    name: 'transferencias-stock-dashboard',
    component: () => import('./views/DashboardView.vue'),
    title: 'Transferencia de Stock',
    icon: 'TruckIcon',
    permissions: ['transferenciadirecta.view'],
  }),
  crearRuta({
    path: '/transferencias-stock/crearsolicitud',
    name: 'transferencias-stock-crearsolicitud',
    component: () => import('./views/CrearTransferenciasView.vue'),
    title: 'Crear Transferencia',
    permissions: ['transferenciadirecta.solicitar'],
  }),
  crearRuta({
    path: '/transferencias-stock/historial',
    name: 'transferencias-stock-historial',
    component: () => import('./views/HistorialTransferenciasView.vue'),
    title: 'Historial de Transferencias',
    permissions: ['transferenciadirecta.view'],
  }),
  crearRuta({
    path: '/transferencias-stock/editar/:id',
    name: 'transferencias-stock-editar',
    component: () => import('./views/CrearTransferenciasView.vue'),
    title: 'Editar Transferencia',
    permissions: ['transferenciadirecta.solicitar'],
  }),
  crearRuta({
    path: '/transferencias-stock/configuracion-envios',
    name: 'transferencias-stock-config-envios',
    component: () => import('./views/ConfiguracionEnviosView.vue'),
    title: 'Configuración de Envíos',
    permissions: ['transferenciadirecta.configuracion_envios'],
  }),
  crearRuta({
    path: '/transferencias-stock/configuracion-matriz-aprobacion',
    name: 'transferencias-stock-matriz-aprobacion',
    component: () => import('./views/ConfiguracionMatrizAprobacion.vue'),
    title: 'Matriz de Aprobación',
    permissions: ['transferenciadirecta.matriz_aprobacion'],
  }),
    crearRuta({
    path: '/transferencias-stock/bandeja-aprobacion',
    name: 'transferencias-stock-bandeja-aprobacion',
    component: () => import('./views/BandejaAprobacionView.vue'),
    title: 'Bandeja de Aprobación',
    permissions: ['transferenciadirecta.aprobar'],
  }),

]

export default routes
