import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/mba3-consultas',
    name: 'mba3-consultas-dashboard',
    component: () => import('./views/DashboardView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Integración MBA3-SAP',
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
  }
]

export default routes

