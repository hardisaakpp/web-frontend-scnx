import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Mismo calculo que ICurrentUserContext.AlmacenesPermitidos del backend: union del
 * codAlmacen propio de cada acceso mas, si es Supervisor, todos los almacenes de su(s)
 * WarehouseGroup(s). Un usuario Tienda (sin grupo) termina con un solo almacen.
 */
export function useAlmacenesPermitidos() {
  const authStore = useAuthStore()

  const almacenesPermitidos = computed<string[]>(() => {
    const set = new Set<string>()
    for (const acceso of authStore.userWarehouseAccesses) {
      if (acceso.codAlmacen) set.add(acceso.codAlmacen)
      for (const grupo of acceso.warehouseGroups ?? []) {
        for (const almacen of grupo.almacenes ?? []) {
          set.add(almacen)
        }
      }
    }
    return [...set]
  })

  const esSupervisor = computed(() =>
    authStore.userWarehouseAccesses.some((a) => a.accesoAlmacen === 'Supervisor')
  )

  return { almacenesPermitidos, esSupervisor }
}
