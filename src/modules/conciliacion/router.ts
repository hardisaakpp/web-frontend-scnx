import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/conciliacion',
    name: 'conciliacion',
    component: () => import('./views/ConciliacionView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Conciliación',
      icon: 'DocumentChartBarIcon',
      permissions: ['conciliacion.view']
    }
  }
]

export default routes
