import type { RouteRecordRaw } from 'vue-router'
import { PROMOCION_SOBRES_OPERATE_PERMISSIONS } from './permissions'

const routes: RouteRecordRaw[] = [
  {
    path: '/promocion-sobres',
    redirect: '/promocion-sobres/entrega'
  },
  {
    path: '/promocion-sobres/entrega',
    name: 'promocion-sobres-entrega',
    component: () => import('./views/EntregaView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Promoción Sobres',
      icon: 'GiftIcon',
      permissions: [...PROMOCION_SOBRES_OPERATE_PERMISSIONS]
    }
  }
]

export default routes
