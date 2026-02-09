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
      permissions: ['cajachica.view']
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
