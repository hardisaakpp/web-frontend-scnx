import { computed } from 'vue'
import { useAuthStore, type WarehouseAccessInfo } from '@/stores/auth'

function normalizeAccesses(raw: WarehouseAccessInfo[] | WarehouseAccessInfo | null): WarehouseAccessInfo[] {
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

/**
 * Deriva el tipo de acceso a almacén del usuario (Tienda | Supervisor | Administrador)
 * desde authStore.userWarehouseAccesses. No confundir con los roles .NET (Admin/User).
 */
export function useWarehouseAccessType() {
  const authStore = useAuthStore()

  const accesses = computed(() => normalizeAccesses(authStore.userWarehouseAccesses))

  const isTienda = computed(() => accesses.value.some(a => a.accesoAlmacen === 'Tienda'))

  function isTiendaAssignedTo(warehouseCode: string | null | undefined): boolean {
    if (!warehouseCode) return false
    return accesses.value.some(a => a.accesoAlmacen === 'Tienda' && a.codAlmacen === warehouseCode)
  }

  return { accesses, isTienda, isTiendaAssignedTo }
}
