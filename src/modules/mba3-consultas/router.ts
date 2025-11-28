import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/mba3-consultas',
    name: 'mba3-consultas-dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'MBA3 Consultas',
      icon: 'DocumentTextIcon'
    }
  },
  {
    path: '/mba3-consultas/facturas',
    name: 'mba3-consultas-facturas',
    component: () => import('./views/FacturasView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Facturas MBA3',
      icon: 'DocumentIcon'
    }
  },
  {
    path: '/mba3-consultas/ordenes-compra',
    name: 'mba3-consultas-ordenes-compra',
    component: () => import('./views/OrdenesCompraView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Órdenes de Compra',
      icon: 'ShoppingCartIcon'
    }
  },
  {
    path: '/mba3-consultas/proceso',
    name: 'mba3-consultas-proceso',
    component: () => import('./views/ProcesoCompletoView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Proceso Completo',
      icon: 'CogIcon'
    }
  }
]

export default routes

