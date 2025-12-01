import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MainLayout from '../layouts/MainLayout.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import UserView from '../views/UserView.vue'
import Dashboard from '../views/Dashboard.vue'
import ForbiddenView from '../views/ForbiddenView.vue'

// Import module routes
import contabilidadRoutes from '../modules/contabilidad/router'
import depositosRoutes from '../modules/depositos/router'
import reportesRoutes from '../modules/reportes/router'
import usuariosRoutes from '../modules/usuarios/router'
import mba3ConsultasRoutes from '../modules/mba3-consultas/router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: Dashboard,
          meta: { requiresAuth: true }
        },
        {
          path: 'admin',
          name: 'admin',
          component: AdminView,
          meta: { requiresAuth: true, role: 'Admin' }
        },
        {
          path: 'user',
          name: 'user',
          component: UserView,
          meta: { requiresAuth: true, role: 'User' }
        },
        // Module routes - auto imported
        ...contabilidadRoutes,
        ...depositosRoutes,
        ...reportesRoutes,
        ...usuariosRoutes,
        ...mba3ConsultasRoutes,
        {
          path: 'forbidden',
          name: 'forbidden',
          component: ForbiddenView
        }
      ]
    }
  ]
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredRole = to.matched.find(record => record.meta.role)?.meta.role
  const requiredPermissions = to.matched.find(record => record.meta.permissions)?.meta.permissions as string[] | undefined

  // Verificar autenticación
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
    return
  }

  // Verificar rol si está definido
  if (requiredRole && !authStore.hasRole(requiredRole)) {
    next({ name: 'forbidden' })
    return
  }

  // Verificar permisos si están definidos (los administradores tienen acceso automático)
  if (requiredPermissions && requiredPermissions.length > 0) {
    // Verificar si es admin desde userRoles (ya que isAdmin getter no funciona)
    const isAdmin = authStore.userRoles?.includes('Admin') || false
    if (!isAdmin) {
      const hasPermission = authStore.hasAnyPermission(requiredPermissions)
      if (!hasPermission) {
        next({ name: 'forbidden' })
        return
      }
    }
  }

  next()
})

export default router