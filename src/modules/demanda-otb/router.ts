import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/demanda-otb',
    name: 'demanda-otb',
    component: () => import('./views/DemandaOtbView.vue'),
    meta: {
      requiresAuth: true,
      permissions: ['demandaotb.view'],
      title: 'Demanda OTB',
      icon: 'ChartBarIcon',
      fullBleed: true
    }
  }
]

export default routes
