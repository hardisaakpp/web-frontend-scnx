import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/pyg',
    name: 'pyg',
    component: () => import('./views/PygUploadView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Importador PYG',
      icon: 'DocumentArrowUpIcon',
      permissions: ['pyg.edit']
    }
  }
]

export default routes
