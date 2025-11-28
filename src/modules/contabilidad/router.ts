import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/contabilidad',
    name: 'contabilidad',
    component: () => import('./views/ContabilidadView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Contabilidad',
      icon: 'CalculatorIcon'
    }
  }
]

export default routes
