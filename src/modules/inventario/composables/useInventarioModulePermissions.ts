import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Permisos de pantalla/botón del módulo Inventario (creados en CORE como inventario.*).
 * Admin siempre pasa. El acceso por bodega/almacén se valida aparte en el backend
 * (CurrentUserContextMiddleware), esto solo gatea qué pantallas ve el usuario.
 */
export function useInventarioModulePermissions() {
  const authStore = useAuthStore()

  const isAdmin = computed(() => authStore.isAdmin)

  function has(permission: string): boolean {
    return isAdmin.value || authStore.hasPermission(permission)
  }

  const canPlanificar = computed(() => has('inventario.planificar'))
  const canGenerar = computed(() => has('inventario.generar'))
  const canTomar = computed(() => has('inventario.toma'))
  const canVerEstadoSesion = computed(() => has('inventario.estado_sesion'))
  const canVerSnapshot = computed(() => has('inventario.snapshot'))
  const canVerBandejaAjustes = computed(() => has('inventario.bandeja_ajustes'))
  const canGestionarScans = computed(() => has('inventario.gestion_scans'))
  const canEditarAjuste = computed(() => has('inventario.edicion_ajuste'))
  const canRevisarAjuste = computed(() => has('inventario.revision'))
  const canIntegrarSap = computed(() => has('inventario.integracion_sap'))

  return {
    isAdmin,
    canPlanificar,
    canGenerar,
    canTomar,
    canVerEstadoSesion,
    canVerSnapshot,
    canVerBandejaAjustes,
    canGestionarScans,
    canEditarAjuste,
    canRevisarAjuste,
    canIntegrarSap
  }
}
