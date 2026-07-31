import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/demanda-otb',
    name: 'demanda-otb',
    component: () => import('./views/DemandaOtbSelectorView.vue'),
    meta: {
      requiresAuth: true,
      permissions: ['demandaotb.view'],
      title: 'Demanda OTB',
      icon: 'ChartBarIcon'
    }
  },
  {
    path: '/demanda-otb/roland',
    name: 'demanda-otb-roland',
    component: () => import('./views/DemandaOtbFrameView.vue'),
    props: { dashboardPath: 'dashboard_roland' },
    meta: {
      requiresAuth: true,
      permissions: ['demandaotb.view'],
      title: 'Demanda OTB · ROLAND',
      icon: 'ChartBarIcon',
      fullBleed: true
    }
  },
  {
    path: '/demanda-otb/descuenton',
    name: 'demanda-otb-descuenton',
    component: () => import('./views/DemandaOtbFrameView.vue'),
    props: { dashboardPath: 'dashboard_descuenton' },
    meta: {
      requiresAuth: true,
      permissions: ['demandaotb.view'],
      title: 'Demanda OTB · DESCUENTON',
      icon: 'ChartBarIcon',
      fullBleed: true
    }
  }
]

export default routes
