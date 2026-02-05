// Rutas del módulo Caja Chica
import CajaChicaHome from './CajaChicaHome.vue'

export default [
  {
    path: '/caja-chica',
    name: 'caja-chica',
    component: CajaChicaHome,
    meta: { requiresAuth: true },
  },
]
