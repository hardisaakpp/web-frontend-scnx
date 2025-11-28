import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/depositos',
    name: 'depositos',
    component: () => import('./views/DepositosView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Depósitos',
      icon: 'BuildingLibraryIcon'
    }
  }
]

export default routes
