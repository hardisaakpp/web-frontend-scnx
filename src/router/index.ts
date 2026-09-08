import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MainLayout from '../layouts/MainLayout.vue'
import LoginView from '../views/Login.vue'
import UserView from '../views/UserView.vue'
import Dashboard from '../views/Dashboard.vue'
import ForbiddenView from '../views/ForbiddenView.vue'

// Import module routes

import conciliacionRoutes from '../modules/conciliacion/router'
import usuariosRoutes from '../modules/usuarios/router'
import mba3ConsultasRoutes from '../modules/mba3-consultas/router'
import cajaChicaRoutes from '../modules/caja-chica/router'
import articuloMaestroRoutes from '../modules/articulo-maestro/router'
import gestionUsuariosRoutes from '../modules/gestion-usuarios/router'
import pygRoutes from '../modules/pyg/router'
import articuloScanerRoutes from '../modules/articulo-scaner/router'
import inventarioRoutes from '../modules/inventario/router'
import promocionSobresRoutes from '../modules/promocion-sobres/router'
import transaccionesRoutes from '../modules/transacciones/router'
import reposicionesRoutes from '../modules/reposiciones/router'
import recepcionMercaderiaRoutes from '../modules/recepcion-mercaderia/router'
import ruletaRoutes from '../modules/ruleta/router'
import transferenciasDirectasRoutes from '../modules/transferencias-directas/router'
import integracionesRoutes from '../modules/integraciones/router'

console.log('🔍 DEBUG usuariosRoutes:', usuariosRoutes)
console.log('🔍 DEBUG cajaChicaRoutes:', cajaChicaRoutes)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
          component: () => import('../views/Users.vue'),
          meta: { requiresAuth: true, role: 'Admin' }
        },
        {
          path: 'user',
          name: 'user',
          component: UserView,
          meta: { requiresAuth: true }
        },
        {
          path: 'users',
          redirect: '/admin'
        },
        // Module routes - auto imported
        ...conciliacionRoutes, // Conciliación module
        ...usuariosRoutes,
        ...mba3ConsultasRoutes,
        ...cajaChicaRoutes,
        ...articuloMaestroRoutes,
        ...gestionUsuariosRoutes,
        ...pygRoutes,
        ...articuloScanerRoutes,
        ...inventarioRoutes,
        ...promocionSobresRoutes,
        ...transaccionesRoutes,
        ...transferenciasDirectasRoutes,
        ...reposicionesRoutes,
        ...recepcionMercaderiaRoutes,
        ...ruletaRoutes,
        ...integracionesRoutes,
        {
          path: 'forbidden',
          name: 'forbidden',
          component: ForbiddenView
        }
      ]
    }
  ]
})

// Debug: Verificar rutas registradas (solo en desarrollo)
if (import.meta.env.DEV) {
  const allRoutes = router.getRoutes()
  console.debug('🔍 Todas las rutas registradas:', allRoutes.map(r => ({ path: r.path, name: r.name })))
  console.debug('🔍 Número total de rutas:', allRoutes.length)
}

// ⚠️ SECURITY: Control explícito del acceso sin autenticación
// En producción, DEBE ser false. En desarrollo, puede ser true para facilitar testing.
// Se puede sobrescribir con variable de entorno VITE_ALLOW_UNAUTHENTICATED=true
const ALLOW_UNAUTHENTICATED =
  import.meta.env.DEV &&
  import.meta.env.VITE_ALLOW_UNAUTHENTICATED !== 'false'

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredRole = to.matched.find(record => record.meta.role)?.meta.role
  const requiredPermissions = to.matched.find(record => record.meta.permissions)?.meta.permissions as string[] | undefined

  // Cargar user y capabilities desde GET /Auth/me cuando hay token y aún no tenemos capabilities (p. ej. tras recarga).
  if (requiresAuth && authStore.isAuthenticated && authStore.capabilities === null) {
    await authStore.fetchMe()
  }

  // Verificar autenticación
  if (requiresAuth && !authStore.isAuthenticated) {
    if (ALLOW_UNAUTHENTICATED) {
      // En desarrollo, permitir acceso pero registrar warning
      if (import.meta.env.DEV) {
        console.debug(`⚠️ [Router] Acceso sin autenticación a ruta protegida: ${to.path}`)
      }
      next()
      return
    }
    next({ name: 'login' })
    return
  }

  // Verificar rol si está definido
  if (requiredRole && !authStore.hasRole(requiredRole as string)) {
    if (ALLOW_UNAUTHENTICATED) {
      if (import.meta.env.DEV) {
        console.debug(`⚠️ [Router] Acceso sin rol requerido a: ${to.path}`)
      }
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
        if (ALLOW_UNAUTHENTICATED) {
          // En desarrollo, permitir acceso pero registrar warning
          if (import.meta.env.DEV) {
            console.debug(`⚠️ [Router] Acceso sin permisos requeridos a: ${to.path}. Permisos requeridos:`, requiredPermissions)
          }
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