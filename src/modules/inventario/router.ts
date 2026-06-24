import type { RouteRecordRaw } from 'vue-router'

const INVENTARIO_VIEW_PERMISSIONS = ['storecontrol.inventory.view', 'storecontrol.inventory.edit']
const INVENTARIO_EDIT_PERMISSIONS = ['storecontrol.inventory.edit']

const routes: RouteRecordRaw[] = [
  {
    path: '/inventario',
    name: 'inventario-dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Inventario',
      permissions: INVENTARIO_VIEW_PERMISSIONS
    }
  },
  {
    path: '/inventario/configuracion-usuario/:id',
    name: 'inventario-configuracion-usuario',
    redirect: '/inventario',
    meta: {
      requiresAuth: true,
      title: 'Configuracion de Usuario',
      permissions: INVENTARIO_EDIT_PERMISSIONS
    }
  },
  {
    path: '/inventario/planes',
    name: 'inventario-planes',
    component: () => import('./views/PlanesInventarioView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Planes de Inventario',
      permissions: INVENTARIO_VIEW_PERMISSIONS
    }
  },
  {
    path: '/inventario/planificaciones',
    name: 'inventario-planificaciones',
    component: () => import('./views/PlanningWorkbenchView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Planificacion de Inventario',
      permissions: INVENTARIO_VIEW_PERMISSIONS
    }
  },
  {
    path: '/inventario/planificaciones/:planId',
    name: 'inventario-planificacion-detalle',
    component: () => import('./views/PlanningDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Detalle de Planificacion',
      permissions: INVENTARIO_VIEW_PERMISSIONS
    }
  },
  {
    path: '/inventario/sesiones',
    name: 'inventario-sesiones',
    component: () => import('./views/SesionesInventarioView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Sesiones de Conteo',
      permissions: INVENTARIO_VIEW_PERMISSIONS
    }
  },
  {
    path: '/inventario/sesiones/:sessionId',
    name: 'inventario-sesion-detalle',
    component: () => import('./views/SessionCenterView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Toma de Inventario'
    }
  },
  {
    path: '/inventario/mis-inventarios',
    name: 'inventario-mis-inventarios',
    component: () => import('./views/MisInventariosView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Mis Inventarios'
    }
  },
  {
    path: '/inventario/sesiones/:sessionId/picking',
    name: 'inventario-picking',
    component: () => import('./views/ConteoPickingView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Conteo - Picking'
    }
  },
  {
    path: '/inventario/ajustes',
    name: 'inventario-ajustes',
    component: () => import('./views/AdjustmentsBoardView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Bandeja de Ajustes',
      permissions: INVENTARIO_VIEW_PERMISSIONS
    }
  },
  {
    path: '/inventario/generados',
    redirect: '/inventario/planificaciones'
  },
  {
    path: '/inventario/generados/:id',
    redirect: '/inventario/sesiones'
  }
]

export default routes
