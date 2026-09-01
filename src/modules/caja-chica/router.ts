import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/caja-chica',
    name: 'caja-chica',
    component: () => import('./views/DashboardView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Caja Chica',
      icon: 'BanknotesIcon',
      permissions: [
        'cajachica.liquidacion.view',
        'cajachica.liquidaciones.view',
        'cajachica.liquidacion.create',
        'cajachica.liquidaciones.create',
        'cajachica.aprobadores.view',
        'cajachica.almacenes.view',
        'cajachica.catalogo.view',
        'cajachica.aprobaciones.view',
        'cajachica.aprobaciones.supervisor.view',
        'cajachica.aprobaciones.supervisor.approve',
        'cajachica.aprobaciones.supervisor.history',
        'cajachica.aprobaciones.contabilidad.view',
        'cajachica.aprobaciones.contabilidad.approve',
        'cajachica.aprobaciones.contabilidad.history',
        'cajachica.formas-pago.view',
        'cajachica.empresas.view',
        'cajachica.grupos-almacenes.view',
        'cajachica.usuarios-almacenes.view',
        'cajachica.adjuntos.view',
        'cajachica.tiposiva.admin'
      ]
    },
  },
  {
    path: '/caja-chica/liquidaciones',
    name: 'caja-chica-liquidaciones',
    component: () => import('./views/LiquidacionesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Liquidaciones',
      permissions: [
        'cajachica.liquidacion.view',
        'cajachica.liquidaciones.view',
        'cajachica.liquidacion.create',
        'cajachica.liquidaciones.create'
      ]
    },
  },
  {
    path: '/caja-chica/liquidaciones-pendientes',
    name: 'caja-chica-liquidaciones-pendientes',
    component: () => import('./views/LiquidacionesPendientesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Liquidaciones pendientes',
      permissions: ['cajachica.liquidaciones.view']
    },
  },
  {
    path: '/caja-chica/liquidaciones-aprobadas',
    name: 'caja-chica-liquidaciones-aprobadas',
    component: () => import('./views/LiquidacionesAprobadasView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Liquidaciones aprobadas',
      permissions: ['cajachica.liquidaciones.view']
    },
  },
  {
    path: '/caja-chica/liquidaciones/:id/detalle',
    name: 'caja-chica-liquidaciones-detalle',
    component: () => import('./views/LiquidacionDetalleView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Detalle de Liquidacion',
      permissions: ['cajachica.liquidaciones.view']
    },
  },
  {
    path: '/caja-chica/aprobaciones',
    name: 'caja-chica-aprobaciones',
    component: () => import('./views/AprobacionesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Aprobaciones',
      permissions: ['cajachica.aprobaciones.view']
    },
  },
  {
    path: '/caja-chica/aprobaciones-pendientes',
    name: 'caja-chica-aprobaciones-pendientes',
    component: () => import('./views/AprobacionesPendientesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Aprobaciones pendientes',
      permissions: ['cajachica.aprobaciones.supervisor.view']
    },
  },
  {
    path: '/caja-chica/aprobaciones-supervisor-historial',
    name: 'caja-chica-aprobaciones-supervisor-historial',
    component: () => import('./views/AprobacionesSupervisorHistorialView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Historial supervisor',
      permissions: ['cajachica.aprobaciones.supervisor.history']
    },
  },
  {
    path: '/caja-chica/listado-general',
    name: 'caja-chica-listado-general',
    component: () => import('./views/ListadoGeneralLiquidacionesView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Listado General de Liquidaciones',
      permissions: ['cajachica.liquidaciones.listado-general']
    },
  },
  {
    path: '/caja-chica/aprobaciones-contabilidad',
    name: 'caja-chica-aprobaciones-contabilidad',
    component: () => import('./views/AprobacionesContabilidadView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Aprobaciones contabilidad',
      permissions: ['cajachica.aprobaciones.contabilidad.view']
    },
  },
  {
    path: '/caja-chica/aprobaciones-contabilidad-historial',
    name: 'caja-chica-aprobaciones-contabilidad-historial',
    component: () => import('./views/AprobacionesContabilidadHistorialView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Historial contabilidad',
      permissions: ['cajachica.aprobaciones.contabilidad.history']
    },
  },
  {
    path: '/caja-chica/catalogo-gastos',
    name: 'caja-chica-catalogo-gastos',
    component: () => import('./views/CatalogoGastosView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Catálogo de Gastos',
      permissions: ['cajachica.catalogo.view']
    },
  },
  {
    path: '/caja-chica/aprobadores',
    name: 'caja-chica-aprobadores',
    component: () => import('./views/AprobadoresView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Aprobadores',
      permissions: ['cajachica.aprobadores.view']
    },
  },
  {
    path: '/caja-chica/reasignar-aprobadores',
    name: 'caja-chica-reasignar-aprobadores',
    component: () => import('./views/ReasignarAprobadoresView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Reasignar Aprobador',
      permissions: ['cajachica.aprobadores.view']
    },
  },
  {
    path: '/caja-chica/formas-pago',
    name: 'caja-chica-formas-pago',
    component: () => import('./views/FormasPagoView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Formas de Pago',
      permissions: ['cajachica.formaspago.view']
    },
  },
  {
    path: '/caja-chica/tipos-iva',
    name: 'caja-chica-tipos-iva',
    component: () => import('./views/TiposIvaView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Tipos de IVA',
      permissions: ['cajachica.tiposiva.admin']
    },
  },
]

export default routes
