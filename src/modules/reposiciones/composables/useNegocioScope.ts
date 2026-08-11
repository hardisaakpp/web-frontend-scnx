import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Un usuario con `reposiciones.negocio` tiene asignado (vía warehouseAccesses,
 * el mismo mecanismo que ya usa `reposiciones.tienda`) el código de su propio
 * Centro de Distribución como `codAlmacen`. El backend ya resuelve "CD -> su
 * grupo completo" en Almacen/Historial, así que basta con reenviar ese código.
 * Se asume un solo CD por usuario negocio (si tuviera más de uno, se usa el primero).
 */
export function useNegocioScope() {
  const authStore = useAuthStore()

  const misCdCodes = computed(() =>
    authStore.userWarehouseAccesses
      .map(a => a.codAlmacen)
      .filter((c): c is string => !!c)
  )

  const miCdCode = computed(() => misCdCodes.value[0])

  return { misCdCodes, miCdCode }
}
