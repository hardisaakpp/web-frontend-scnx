import { createRouter, createWebHistory, type NavigationGuardNext } from 'vue-router'
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
import recepcionProveedoresRoutes from '../modules/recepcion-proveedores/router'
import ruletaRoutes from '../modules/ruleta/router'
import transferenciasDirectasRoutes from '../modules/transferencias-directas/router'
import integracionesRoutes from '../modules/integraciones/router'
import cediRoutes from '../modules/cedi/router'
import demandaOtbRoutes from '../modules/demanda-otb/router'
import tesoreriaRoutes from '../modules/tesoreria/router'

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
        ...recepcionProveedoresRoutes,
        ...ruletaRoutes,
        ...integracionesRoutes,
        ...cediRoutes,
        ...demandaOtbRoutes,
        ...tesoreriaRoutes,
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

/**
 * Centraliza el "escape hatch" de desarrollo usado por las 3 verificaciones del guard: si
 * ALLOW_UNAUTHENTICATED está activo, registra un warning y permite continuar la navegación en
 * vez de bloquearla. Devuelve true cuando el guard debe dejar pasar la navegación igualmente.
 */
function puedeSaltarRestriccion(mensajeLog: string, ...detalleLog: unknown[]): boolean {
  if (!ALLOW_UNAUTHENTICATED) return false
  if (import.meta.env.DEV) {
    console.debug(mensajeLog, ...detalleLog)
  }
  return true
}

/** Tolera variantes de rol admin ('Administrador Principal', 'admin', etc.) además del flag `isAdmin`. */
function esAdminConTolerancia(authStore: ReturnType<typeof useAuthStore>): boolean {
  if (authStore.isAdmin) return true
  return authStore.userRoles?.some((r) => {
    const s = String(r).toLowerCase()
    return s === 'admin' || s === 'administrador' || s.includes('admin')
  }) ?? false
}

/**
 * Aplica una verificación de acceso del guard: si `bloqueado`, redirige a `routeName` salvo que
 * `puedeSaltarRestriccion` habilite el escape hatch de desarrollo. Devuelve true cuando ya resolvió
 * la navegación (llamó a `next`), para que el guard principal corte la ejecución con `return`.
 */
function aplicarRestriccion(
  bloqueado: boolean,
  routeName: 'login' | 'forbidden',
  next: NavigationGuardNext,
  mensajeLog: string,
  ...detalleLog: unknown[]
): boolean {
  if (!bloqueado) return false
  if (puedeSaltarRestriccion(mensajeLog, ...detalleLog)) {
    next()
    return true
  }
  next({ name: routeName })
  return true
}

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredRole = to.matched.find(record => record.meta.role)?.meta.role as string | undefined
  const requiredPermissions = to.matched.find(record => record.meta.permissions)?.meta.permissions as string[] | undefined

  // Cargar user y capabilities desde GET /Auth/me cuando hay token y aún no tenemos capabilities (p. ej. tras recarga).
  if (requiresAuth && authStore.isAuthenticated && authStore.capabilities === null) {
    await authStore.fetchMe()
  }

  // Verificar autenticación
  if (aplicarRestriccion(
    requiresAuth && !authStore.isAuthenticated,
    'login',
    next,
    `⚠️ [Router] Acceso sin autenticación a ruta protegida: ${to.path}`
  )) return

  // Verificar rol si está definido
  if (aplicarRestriccion(
    !!requiredRole && !authStore.hasRole(requiredRole),
    'forbidden',
    next,
    `⚠️ [Router] Acceso sin rol requerido a: ${to.path}`
  )) return

  // Verificar permisos si están definidos (los administradores tienen acceso automático)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const tienePermiso = esAdminConTolerancia(authStore) || authStore.hasAnyPermission(requiredPermissions)
    if (aplicarRestriccion(
      !tienePermiso,
      'forbidden',
      next,
      `⚠️ [Router] Acceso sin permisos requeridos a: ${to.path}. Permisos requeridos:`,
      requiredPermissions
    )) return
  }

  next()
})

export default router
