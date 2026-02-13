import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/reportes',
    name: 'reportes',
    component: () => import('./views/ReportesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Reportes',
      icon: 'DocumentChartBarIcon'
    }
  }
]

export default routes
