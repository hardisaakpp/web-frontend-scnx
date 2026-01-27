import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/mba3-consultas',
    name: 'mba3-consultas-dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Gestión ODC SAP',
      icon: 'DocumentTextIcon',
      permissions: ['mba3-consultas.view']
    }
  },
  {
    path: '/mba3-consultas/ordenes-compra',
    name: 'mba3-consultas-ordenes-compra',
    component: () => import('./views/OrdenesCompraView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Órdenes de Compra',
      icon: 'ShoppingCartIcon',
      permissions: ['mba3-consultas.ordenes-compra.view']
    }
  },
  {
    path: '/mba3-consultas/proceso',
    name: 'mba3-consultas-proceso',
    component: () => import('./views/ProcesoCompletoView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Procesos de Integración',
      icon: 'CogIcon',
      permissions: ['mba3-consultas.proceso.execute']
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
      permissions: ['mba3-consultas.view']
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
      permissions: ['mba3-consultas.view']
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
      permissions: ['mba3-consultas.view']
    }
  },
  {
    path: '/mba3-consultas/gestionar-pedido',
    name: 'mba3-consultas-gestionar-pedido',
    component: () => import('./views/CargarPlantillasView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Gestionar Pedido',
      icon: 'DocumentArrowUpIcon',
      permissions: ['mba3-consultas.view']
    }
  },
  {
    path: '/mba3-consultas/cargar-plantilla/:id?',
    name: 'mba3-consultas-cargar-plantilla',
    component: () => import('./views/CargarPlantillaView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Cargar Plantilla',
      icon: 'DocumentArrowUpIcon',
      permissions: ['mba3-consultas.view']
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
      permissions: ['mba3-consultas.proceso.execute']
    }
  },
  {
    path: '/mba3-consultas/pedidos/:id',
    name: 'mba3-consultas-pedido-detalle',
    component: () => import('./views/PedidoDetalleView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Detalle del Pedido',
      icon: 'DocumentTextIcon',
      permissions: ['mba3-consultas.facturas.view']
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
      permissions: ['mba3-consultas.facturas.view']
    }
  },
  {
    path: '/mba3-consultas/pedidos/:id/procesamiento-sap',
    name: 'mba3-consultas-pedido-procesamiento-sap',
    component: () => import('./views/ProcesamientoSAPView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Procesamiento SAP del Pedido',
      icon: 'CogIcon',
      permissions: ['mba3-consultas.facturas.view']
    }
  },
  {
    path: '/mba3-consultas/pedidos',
    name: 'mba3-consultas-pedidos-listado',
    component: () => import('./views/PedidosListView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Listado de Pedidos',
      icon: 'DocumentTextIcon',
      permissions: ['mba3-consultas.facturas.view']
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
      permissions: ['mba3-consultas.view']
    }
  }
]

export default routes

