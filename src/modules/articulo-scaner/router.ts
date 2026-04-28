import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/articulo-scaner',
    name: 'articulo-scaner',
    component: () => import('./views/ArticuloScanerView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Articulo Scaner',
      icon: 'QrCodeIcon',
      permissions: ['articuloscaner.view']
    }
  }
]

export default routes
