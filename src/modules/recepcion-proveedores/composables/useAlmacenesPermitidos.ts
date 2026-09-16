import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Mismo calculo que ICurrentUserContext.AlmacenesPermitidos del backend: union del
 * codAlmacen propio de cada acceso mas, si accesoAlmacen es "Supervisor", todos los
 * almacenes Y la bodegaCentral de cada uno de sus WarehouseGroup(s). El chequeo de
 * accesoAlmacen es explicito (no se asume que Tienda nunca trae grupo poblado).
 */
export function useAlmacenesPermitidos() {
  const authStore = useAuthStore()

  const almacenesPermitidos = computed<string[]>(() => {
    const set = new Set<string>()
    for (const acceso of authStore.userWarehouseAccesses) {
      if (acceso.codAlmacen) set.add(acceso.codAlmacen)
      if (acceso.accesoAlmacen !== 'Supervisor') continue
      for (const grupo of acceso.warehouseGroups ?? []) {
        for (const almacen of grupo.almacenes ?? []) {
          set.add(almacen)
        }
        if (grupo.bodegaCentral) set.add(grupo.bodegaCentral)
      }
    }
    return [...set]
  })

  const esSupervisor = computed(() =>
    authStore.userWarehouseAccesses.some((a) => a.accesoAlmacen === 'Supervisor')
  )

  return { almacenesPermitidos, esSupervisor }
}
