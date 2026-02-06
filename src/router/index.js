import { createRouter, createWebHistory } from 'vue-router'
import authService from '@/services/authService'
import MainLayout from '@/layouts/MainLayout.vue'

// Import module routes
import mba3ConsultasRoutes from '@/modules/mba3-consultas/router'
import usuariosRoutes from '@/modules/usuarios/router'
import cajaChicaRoutes from '@/modules/caja-chica/router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'Dashboard',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { 
            requiresAuth: true,
            permissions: []
          }
        },
        {
          path: '/users',
          name: 'Users',
          component: () => import('@/views/Users.vue'),
          meta: { 
            requiresAuth: true,
            permissions: ['users.view']
          }
        },
        {
          path: '/depositos',
          name: 'Depositos',
          component: () => import('@/views/Depositos.vue'),
          meta: { 
            requiresAuth: true,
            permissions: ['depositos.view']
          }
        },
        {
          path: '/contabilidad',
          name: 'Contabilidad',
          component: () => import('@/views/Contabilidad.vue'),
          meta: { 
            requiresAuth: true,
            permissions: ['contabilidad.view']
          }
        },
        {
          path: '/reportes',
          name: 'Reportes',
          component: () => import('@/views/Reportes.vue'),
          meta: { 
            requiresAuth: true,
            permissions: ['reportes.view']
          }
        },
        {
          path: '/conciliacion',
          name: 'Conciliacion',
          component: () => import('@/modules/conciliacion/views/ConciliacionView.vue'),
          meta: { 
            requiresAuth: true,
            permissions: ['conciliacion.view']
          }
        },
        // MBA3 Consultas routes
        ...mba3ConsultasRoutes,
        // Usuarios routes
        ...usuariosRoutes,
        // Caja Chica routes
        ...cajaChicaRoutes,
        {
          path: '/unauthorized',
          name: 'Unauthorized',
          component: () => import('@/views/Unauthorized.vue')
        },
        {
          path: '/forbidden',
          name: 'Forbidden',
          component: () => import('@/views/ForbiddenView.vue')
        }
      ]
    }
  ]
})

// Guard global
router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth
  const requiredPermissions = to.meta.permissions || []
  const isAuthenticated = authService.isAuthenticated()

  // Si la ruta requiere autenticación
  if (requiresAuth && !isAuthenticated) {
    return next('/login')
  }

  // Si está autenticado y va al login, redirigir al dashboard
  if (to.path === '/login' && isAuthenticated) {
    return next('/')
  }

  // Verificar permisos si están definidos (los administradores tienen acceso automático)
  if (requiredPermissions.length > 0 && isAuthenticated) {
    // Verificar si es admin desde userRoles
    const user = authService.getUser()
    const isAdmin = user?.roles?.includes('Admin') || false
    
    if (!isAdmin) {
      const hasPermission = requiredPermissions.some(p => 
        authService.hasPermission(p)
      )
      
      if (!hasPermission) {
        return next('/unauthorized')
      }
    }
  }

  next()
})

export default router