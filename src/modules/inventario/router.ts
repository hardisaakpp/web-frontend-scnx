import type { RouteRecordRaw } from 'vue-router'

const INVENTARIO_PLANIFICAR = ['inventario.planificar']
const INVENTARIO_TOMA = ['inventario.toma']
const INVENTARIO_ESTADO_SESION = ['inventario.estado_sesion']
const INVENTARIO_SNAPSHOT = ['inventario.snapshot']
const INVENTARIO_BANDEJA_AJUSTES = ['inventario.bandeja_ajustes']
const INVENTARIO_GESTION_SCANS = ['inventario.gestion_scans']
const INVENTARIO_ANY = [
  'inventario.planificar',
  'inventario.generar',
  'inventario.toma',
  'inventario.estado_sesion',
  'inventario.snapshot',
  'inventario.bandeja_ajustes',
  'inventario.gestion_scans'
]

const routes: RouteRecordRaw[] = [
  {
    path: '/inventario',
    name: 'inventario-dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Inventario',
      permissions: INVENTARIO_ANY
    }
  },
  {
    path: '/inventario/configuracion-usuario/:id',
    name: 'inventario-configuracion-usuario',
    redirect: '/inventario',
    meta: {
      requiresAuth: true,
      title: 'Configuracion de Usuario',
      permissions: INVENTARIO_ANY
    }
  },
  {
    path: '/inventario/planes',
    name: 'inventario-planes',
    component: () => import('./views/PlanesInventarioView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Planes de Inventario',
      permissions: INVENTARIO_PLANIFICAR
    }
  },
  {
    path: '/inventario/planes/historial',
    name: 'inventario-planes-historial',
    component: () => import('./views/HistorialPlanesView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Historial de Planes',
      permissions: INVENTARIO_PLANIFICAR
    }
  },
  {
    path: '/inventario/planificaciones',
    name: 'inventario-planificaciones',
    component: () => import('./views/PlanningWorkbenchView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Planificacion de Inventario',
      permissions: INVENTARIO_PLANIFICAR
    }
  },
  {
    path: '/inventario/planificaciones/:planId',
    name: 'inventario-planificacion-detalle',
    component: () => import('./views/PlanningDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Detalle de Planificacion',
      permissions: INVENTARIO_PLANIFICAR
    }
  },
  {
    path: '/inventario/sesiones',
    name: 'inventario-sesiones',
    component: () => import('./views/SesionesInventarioView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Toma Física',
      permissions: INVENTARIO_TOMA
    }
  },
  {
    path: '/inventario/sesiones/:sessionId',
    name: 'inventario-sesion-detalle',
    component: () => import('./views/SessionCenterView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Toma Física - Detalle',
      permissions: INVENTARIO_ESTADO_SESION
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
    path: '/inventario/mis-inventarios/historial',
    name: 'inventario-historial-conteos',
    component: () => import('./views/HistorialConteosView.vue'),
    meta: {
      // Autoservicio: solo devuelve datos del propio usuario autenticado, sin permiso adicional.
      requiresAuth: true,
      title: 'Historial de Conteos'
    }
  },
  {
    path: '/inventario/mis-inventarios/ajuste/:sessionId',
    name: 'inventario-ajuste-final-tienda',
    component: () => import('./views/AjusteFinalTiendaView.vue'),
    meta: {
      // Autoservicio: el backend valida acceso por bodega (CanAccessWarehouse) y que el ajuste
      // ya esté Approved/SentToSap — sin permiso RBAC adicional aquí.
      requiresAuth: true,
      title: 'Ajuste Final'
    }
  },
  {
    path: '/inventario/sesiones/:sessionId/picking',
    name: 'inventario-picking',
    component: () => import('./views/ConteoPickingView.vue'),
    meta: {
      // Sin permissions: un picker invitado a esta sesión puntual puede no tener
      // inventario.toma. El backend autoriza por asignación de picker (ver
      // EnsureSessionAccessAsync en InventorySessionService), no por permiso RBAC.
      requiresAuth: true,
      title: 'Conteo - Picking'
    }
  },
  {
    path: '/inventario/sesiones/:sessionId/resumen',
    name: 'inventario-resumen-picking',
    component: () => import('./views/ResumenPickingView.vue'),
    meta: {
      // Mismo caso que picking: accesible a pickers invitados sin inventario.toma.
      requiresAuth: true,
      title: 'Resumen de Picking'
    }
  },
  {
    path: '/inventario/sesiones/:sessionId/detalle',
    name: 'inventario-detalle-toma',
    component: () => import('./views/DetalleTomaFisicaView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Toma Física - Detalle',
      permissions: INVENTARIO_SNAPSHOT
    }
  },
  {
    path: '/inventario/sesiones/:sessionId/supervisor',
    name: 'inventario-supervisor-resumen',
    component: () => import('./views/SupervisorResumenView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Toma Física - Resumen',
      permissions: INVENTARIO_ESTADO_SESION
    }
  },
  {
    path: '/inventario/sesiones/:sessionId/contar-articulos',
    name: 'inventario-contar-articulos',
    component: () => import('./views/ContarArticulosView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Conteo de Artículos',
      permissions: INVENTARIO_TOMA
    }
  },
  {
    path: '/inventario/sesiones/:sessionId/gestion-scans',
    name: 'inventario-gestion-scans',
    component: () => import('./views/GestionScansView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Gestión de Scans',
      permissions: INVENTARIO_GESTION_SCANS
    }
  },
  {
    path: '/inventario/ajustes',
    name: 'inventario-ajustes',
    component: () => import('./views/AdjustmentsBoardView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Bandeja de Ajustes',
      permissions: INVENTARIO_BANDEJA_AJUSTES
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
