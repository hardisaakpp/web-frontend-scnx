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
import conciliacionRoutes from '../modules/conciliacion/router'
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
        ...conciliacionRoutes, // Conciliación module
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

// Debug: Verificar rutas registradas
if (import.meta.env.DEV) {
  const allRoutes = router.getRoutes()
  console.log('🔍 Todas las rutas registradas:', allRoutes.map(r => ({ path: r.path, name: r.name })))
  console.log('🔍 Número total de rutas:', allRoutes.length)
}

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredRole = to.matched.find(record => record.meta.role)?.meta.role
  const requiredPermissions = to.matched.find(record => record.meta.permissions)?.meta.permissions as string[] | undefined

  // En desarrollo, permitir acceso sin autenticación para facilitar el debugging
  const isDevelopment = import.meta.env.DEV
  const allowUnauthenticatedAccess = isDevelopment

  // Verificar autenticación
  if (requiresAuth && !authStore.isAuthenticated) {
    if (allowUnauthenticatedAccess) {
      // En desarrollo, permitir acceso pero registrar warning
      console.warn(`⚠️ [Router] Acceso sin autenticación a ruta protegida: ${to.path}`)
      next()
      return
    }
    next({ name: 'login' })
    return
  }

  // Verificar rol si está definido
  if (requiredRole && !authStore.hasRole(requiredRole as string)) {
    if (allowUnauthenticatedAccess) {
      console.warn(`⚠️ [Router] Acceso sin rol requerido a: ${to.path}`)
      next()
      return
    }
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
        if (allowUnauthenticatedAccess) {
          // En desarrollo, permitir acceso pero registrar warning
          console.warn(`⚠️ [Router] Acceso sin permisos requeridos a: ${to.path}. Permisos requeridos:`, requiredPermissions)
          next()
          return
        }
        next({ name: 'forbidden' })
        return
      }
    }
  }

  next()
})

export default router