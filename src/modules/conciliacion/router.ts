import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/conciliacion',
    name: 'conciliacion',
    component: () => import('./views/ConciliacionView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Conciliación',
      icon: 'ClipboardDocumentCheckIcon',
      permissions: ['conciliacion.view']
    }
  },
  {
    path: '/conciliacion/crear',
    name: 'conciliacion-create',
    component: () => import('./views/ConciliacionCreateView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Crear Conciliación',
      permissions: ['conciliacion.create']
    }
  }
]

export default routes
