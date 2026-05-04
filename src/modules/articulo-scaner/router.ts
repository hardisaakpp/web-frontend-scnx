import type { RouteRecordRaw } from 'vue-router'
import { ARTICULO_SCANER_ACCESS_PERMISSIONS } from './permissions'

const routes: RouteRecordRaw[] = [
  {
    path: '/articulo-scaner',
    name: 'articulo-scaner',
    component: () => import('./views/ArticuloScanerView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Validación de Artículos',
      icon: 'QrCodeIcon',
      permissions: [...ARTICULO_SCANER_ACCESS_PERMISSIONS]
    }
  }
]

export default routes
