import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/usuarios',
    name: 'usuarios',
    component: () => import('../../views/Users.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Usuarios',
      icon: 'UserGroupIcon'
    }
  },
  {
    path: '/usuarios/users',
    name: 'usuarios-users',
    component: () => import('./views/UsersView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Users',
      icon: 'UserIcon'
    }
  },
  {
    path: '/datos-adicionales',
    name: 'datos-adicionales',
    component: () => import('./views/DatosAdicionalesGeneralView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Datos adicionales',
      icon: 'UserIcon'
    }
  },
  {
    path: '/usuarios/users/:id/datos-adicionales',
    name: 'usuarios-datos-adicionales',
    component: () => import('./views/DatosAdicionalesView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Datos adicionales',
      icon: 'UserIcon'
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
