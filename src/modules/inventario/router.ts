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
    component: () => import('./views/UserSettingsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Configuracion de Usuario',
      permissions: INVENTARIO_EDIT_PERMISSIONS
    }
  },
  {
    path: '/inventario/planificaciones',
    name: 'inventario-planificaciones',
    component: () => import('./views/InventoryPlanningsView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Planificacion de Inventario',
      permissions: INVENTARIO_VIEW_PERMISSIONS
    }
  },
  {
    path: '/inventario/generados',
    name: 'inventario-generados',
    component: () => import('./views/GeneratedInventoriesView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Inventarios Generados',
      permissions: INVENTARIO_VIEW_PERMISSIONS
    }
  },
  {
    path: '/inventario/generados/:id',
    name: 'inventario-detalle',
    component: () => import('./views/InventoryDetailView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Detalle de Inventario',
      permissions: INVENTARIO_VIEW_PERMISSIONS
    }
  }
]

export default routes
