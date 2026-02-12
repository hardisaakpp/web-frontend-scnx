import type { RouteRecordRaw } from 'vue-router'

/**
 * Permisos simplificados para el módulo MBA3 Consultas:
 * 
 * - odcsap.view: Acceso a funcionalidades de EL RAYO
 *   → Gestionar Pedido, Listado de Pedidos, Detalle del Pedido,
 *     Revisar Redistribución, ODC a SAP (Proceso Completo)
 * 
 * - mabel.view: Acceso a funcionalidades de MABEL TRADING
 *   → Cargar Plantilla, Redistribución, Procesamiento SAP,
 *     Homologaciones, Órdenes de Compra, Remisiones, ODC Errores,
 *     ODC a SAP (Proceso Completo), etc.
 * 
 * El dashboard y ODC a SAP permiten acceso con cualquiera de los dos permisos.
 */

const routes: RouteRecordRaw[] = [
  // =============================================
  // Dashboard - acceso con cualquier permiso
  // =============================================
  {
    path: '/mba3-consultas',
    name: 'mba3-consultas-dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Gestión ODC SAP',
      icon: 'DocumentTextIcon',
      permissions: ['odcsap.view', 'mabel.view']
    }
  },

  // =============================================
  // EL RAYO - permiso: odcsap.view
  // =============================================
  {
    path: '/mba3-consultas/gestionar-pedido',
    name: 'mba3-consultas-gestionar-pedido',
    component: () => import('./views/CargarPlantillasView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Gestionar Pedido',
      icon: 'DocumentArrowUpIcon',
      permissions: ['odcsap.view']
    }
  },
  {
    path: '/mba3-consultas/pedidos',
    name: 'mba3-consultas-pedidos-listado',
    component: () => import('./views/PedidosListView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Listado de Pedidos - EL RAYO',
      icon: 'DocumentTextIcon',
      permissions: ['odcsap.view']
    }
  },
  {
    path: '/mba3-consultas/pedidos/:id',
    name: 'mba3-consultas-pedido-detalle',
    component: () => import('./views/PedidoDetalleView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Detalle del Pedido - EL RAYO',
      icon: 'DocumentTextIcon',
      permissions: ['odcsap.view']
    }
  },

  // =============================================
  // MABEL TRADING - permiso: mabel.view
  // =============================================
  {
    path: '/mba3-consultas/ordenes-compra',
    name: 'mba3-consultas-ordenes-compra',
    component: () => import('./views/OrdenesCompraView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Órdenes de Compra',
      icon: 'ShoppingCartIcon',
      permissions: ['mabel.view']
    }
  },
  {
    path: '/mba3-consultas/proceso',
    name: 'mba3-consultas-proceso',
    component: () => import('./views/ProcesoCompletoView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'ODC a SAP',
      icon: 'CogIcon',
      permissions: ['mabel.view', 'odcsap.view']
    }
  },
  {
    path: '/mba3-consultas/remisiones',
    name: 'mba3-consultas-remisiones',
    component: () => import('./views/RemisionesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Documentos de Remisión',
      icon: 'DocumentIcon',
      permissions: ['mabel.view']
    }
  },
  {
    path: '/mba3-consultas/homologaciones',
    name: 'mba3-consultas-homologaciones',
    component: () => import('./views/HomologacionesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Homologaciones de SKU',
      icon: 'LinkIcon',
      permissions: ['mabel.view']
    }
  },
  {
    path: '/mba3-consultas/odc-errores',
    name: 'mba3-consultas-odc-errores',
    component: () => import('./views/ODCErroresView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'ODC con Errores',
      icon: 'ExclamationTriangleIcon',
      permissions: ['mabel.view']
    }
  },
  {
    path: '/mba3-consultas/cargar-plantilla',
    name: 'mba3-consultas-cargar-plantilla',
    component: () => import('./views/CargarPlantillaListadoView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Cargar Plantilla - MABEL TRADING',
      icon: 'DocumentArrowUpIcon',
      permissions: ['mabel.view']
    }
  },
  {
    path: '/mba3-consultas/cargar-plantilla/:id',
    name: 'mba3-consultas-cargar-plantilla-detalle',
    component: () => import('./views/CargarPlantillaView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Cargar Plantilla - MABEL TRADING',
      icon: 'DocumentArrowUpIcon',
      permissions: ['mabel.view']
    }
  },
  {
    path: '/mba3-consultas/pedidos/crear',
    name: 'mba3-consultas-pedido-crear',
    component: () => import('./views/PedidoCrearView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Crear Pedido Manual',
      icon: 'DocumentPlusIcon',
      permissions: ['mabel.view']
    }
  },
  {
    path: '/mba3-consultas/redistribucion',
    name: 'mba3-consultas-redistribucion',
    component: () => import('./views/RedistribucionListadoView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Redistribución - MABEL TRADING',
      icon: 'ChartBarIcon',
      permissions: ['mabel.view']
    }
  },
  {
    path: '/mba3-consultas/revisar-redistribucion',
    name: 'mba3-consultas-revisar-redistribucion',
    component: () => import('./views/RevisarRedistribucionListadoView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Revisar Redistribución - EL RAYO',
      icon: 'ChartBarIcon',
      permissions: ['odcsap.view']
    }
  },
  {
    path: '/mba3-consultas/pedidos/:id/redistribucion',
    name: 'mba3-consultas-pedido-redistribucion',
    component: () => import('./views/MabelTradingRedistribucionView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Redistribución - MABEL TRADING',
      icon: 'ChartBarIcon',
      permissions: ['mabel.view', 'odcsap.view']
    }
  },
  {
    path: '/mba3-consultas/pedidos/:id/procesamiento-sap',
    name: 'mba3-consultas-pedido-procesamiento-sap',
    component: () => import('./views/ProcesamientoSAPView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Procesamiento SAP del Pedido - MABEL TRADING',
      icon: 'CogIcon',
      permissions: ['mabel.view']
    }
  },
  {
    path: '/mba3-consultas/reporte-diferencias/:id?',
    name: 'mba3-consultas-reporte-diferencias',
    component: () => import('./views/ReporteDiferenciasView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Reporte de Diferencias',
      icon: 'ChartBarIcon',
      permissions: ['mabel.view']
    }
  }
]

export default routes

