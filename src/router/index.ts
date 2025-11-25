import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import MainLayout from '../layouts/MainLayout.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import UserView from '../views/UserView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'

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
          redirect: () => {
            const authStore = useAuthStore()
            if (authStore.isAdmin) return { name: 'admin' }
            if (authStore.isUser) return { name: 'user' }
            return { name: 'login' }
          }
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

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' })
    return
  }

  if (requiredRole && authStore.role !== requiredRole) {
    next({ name: 'forbidden' })
    return
  }

  next()
})

export default router