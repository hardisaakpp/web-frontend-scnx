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
      permissions: ['cajachica.liquidacion.view']
    },
  },
  {
    path: '/caja-chica/liquidaciones',
    name: 'caja-chica-liquidaciones',
    component: () => import('./views/LiquidacionesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Liquidaciones',
      permissions: ['cajachica.liquidaciones.view']
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
      permissions: ['cajachica.aprobaciones.view']
    },
  },
  {
    path: '/caja-chica/aprobaciones-contabilidad',
    name: 'caja-chica-aprobaciones-contabilidad',
    component: () => import('./views/AprobacionesContabilidadView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Aprobaciones contabilidad',
      permissions: ['cajachica.aprobaciones.view']
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
    path: '/caja-chica/almacenes',
    name: 'caja-chica-almacenes',
    component: () => import('./views/AlmacenesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Almacenes',
      permissions: ['cajachica.almacenes.view']
    },
  },
  {
    path: '/caja-chica/asignacion-almacenes',
    name: 'caja-chica-asignacion-almacenes',
    component: () => import('./views/AsignacionAlmacenesUsuariosView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Asignacion de almacenes',
      permissions: ['cajachica.almacenes.view']
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
]

export default routes
