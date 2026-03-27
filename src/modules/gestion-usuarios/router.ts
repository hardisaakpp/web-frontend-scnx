import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: 'gestion-usuarios',
    name: 'gestion-usuarios',
    component: () => import('./views/GestionUsuariosView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Personal de Tiendas',
      icon: 'IdentificationIcon',
      permissions: ['gestionusuarios.view']
    }
  }
]

export default routes
