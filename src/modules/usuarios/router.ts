import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/usuarios',
    name: 'usuarios',
    component: () => import('./views/UsuariosView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Usuarios',
      icon: 'UserGroupIcon',
      role: 'Admin'  // Solo administradores
    }
  },
  {
    path: '/roles',
    name: 'roles',
    component: () => import('./views/RolesView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Roles',
      icon: 'ShieldCheckIcon',
      role: 'Admin'
    }
  },
  {
    path: '/permisos',
    name: 'permisos',
    component: () => import('./views/PermisosView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Permisos',
      icon: 'LockClosedIcon',
      role: 'Admin'
    }
  }
]

export default routes
