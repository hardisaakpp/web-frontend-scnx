import type { RouteRecordRaw } from 'vue-router'
import { useTesoreriaAccess } from '../composables/useTesoreriaAccess'
import { TESORERIA_PERMISOS } from '../types/tesoreria.types'

const routes: RouteRecordRaw[] = [
  {
    path: '/tesoreria',
    name: 'tesoreria-hub',
    component: () => import('../views/TesoreriaHubView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Tesorería',
      icon: 'BuildingLibraryIcon',
      permissions: [TESORERIA_PERMISOS.Consultar] // <-- Permiso base para ver el módulo en el Sidebar
    },
    beforeEnter: (_to, _from, next) => {
      const { esAdmin, puedeConsultar } = useTesoreriaAccess()
      if (esAdmin.value || puedeConsultar.value) {
        next()
      } else {
        next({ name: 'forbidden' })
      }
    }
  },
  {
    path: '/tesoreria/mis-depositos',
    name: 'tesoreria-mis-depositos',
    component: () => import('../views/MisDepositosView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Mis Depósitos',
      icon: 'BanknotesIcon',
      permissions: [TESORERIA_PERMISOS.Consultar]
    },
    beforeEnter: (_to, _from, next) => {
      const { esAdmin, puedeConsultar } = useTesoreriaAccess()
      if (esAdmin.value || puedeConsultar.value) {
        next()
      } else {
        next({ name: 'forbidden' })
      }
    }
  },
  {
    path: '/tesoreria/auditoria',
    name: 'tesoreria-auditoria',
    component: () => import('../views/AuditoriaGlobalView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Auditoría Global (Sábana Mabel)',
      icon: 'BuildingLibraryIcon',
      permissions: [TESORERIA_PERMISOS.AuditarGlobal]
    },
    beforeEnter: (_to, _from, next) => {
      const { esAdmin, puedeAuditarGlobal } = useTesoreriaAccess()
      if (esAdmin.value || puedeAuditarGlobal.value) {
        next()
      } else {
        next({ name: 'forbidden' })
      }
    }
  },
  {
    path: '/tesoreria/configuracion',
    name: 'tesoreria-configuracion',
    component: () => import('../views/ConfiguracionTesoreriaView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Configuración y Días de Gracia',
      icon: 'Cog6ToothIcon',
      permissions: [TESORERIA_PERMISOS.ConfigurarBloqueos]
    },
    beforeEnter: (_to, _from, next) => {
      const { esAdmin, puedeConfigurar } = useTesoreriaAccess()
      if (esAdmin.value || puedeConfigurar.value) {
        next()
      } else {
        next({ name: 'forbidden' })
      }
    }
  }
]

export default routes