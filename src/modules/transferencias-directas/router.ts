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
  // Dashboard principal: agrupa las tres áreas del módulo
  crearRuta({
    path: '/transferencias-stock',
    name: 'transferencias-stock-dashboard',
    component: () => import('./views/DashboardPrincipalView.vue'),
    title: 'Transferencia de Stock',
    icon: 'Forklift',
    permissions: [
      'transferenciadirecta.mod_transferencias',
      'transferenciadirecta.mod_transitorias',
      'transferenciadirecta.mod_administracion',
    ],
  }),
  // Submenú: transferencias (envíos)
  crearRuta({
    path: '/transferencias-stock/transferencias',
    name: 'transferencias-stock-transferencias',
    component: () => import('./views/DashboardView.vue'),
    title: 'Transferencias',
    permissions: ['transferenciadirecta.mod_transferencias'],
  }),
  // Submenú: gestión de transitorias (recepciones)
  crearRuta({
    path: '/transferencias-stock/transitorias',
    name: 'transferencias-stock-transitorias',
    component: () => import('./views/TransitoriasDashboardView.vue'),
    title: 'Gestión de Transitorias',
    permissions: ['transferenciadirecta.mod_transitorias'],
  }),
  // Submenú: configuración
  crearRuta({
    path: '/transferencias-stock/configuracion',
    name: 'transferencias-stock-configuracion',
    component: () => import('./views/ConfiguracionDashboardView.vue'),
    title: 'Configuración',
    permissions: ['transferenciadirecta.mod_administracion'],
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
  // Historial de transitorias (dentro del submenú de transitorias)
  crearRuta({
    path: '/transferencias-stock/transitorias/historial',
    name: 'transitorias-historial',
    component: () => import('./views/HistorialTransitoriasView.vue'),
    title: 'Historial de Transitorias',
    permissions: ['transferenciadirecta.transitorias'],
  }),
  crearRuta({
    path: '/transferencias-stock/configuracion/dias-transitoria',
    name: 'transferencias-stock-config-dias-transitoria',
    component: () => import('./views/ConfiguracionDiasTransitoriaView.vue'),
    title: 'Configuración de Transitorias',
    permissions: ['transferenciadirecta.configuracion_transitorias'],
  })


]

export default routes
