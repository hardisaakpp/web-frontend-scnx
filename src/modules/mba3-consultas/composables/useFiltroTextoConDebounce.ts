import type { Ref } from 'vue'
import { useDebouncedFilterInput } from './useDebouncedFilterInput'

/**
 * Envuelve useDebouncedFilterInput para actualizar un campo de texto de un objeto `filtros`
 * reactivo y re-aplicar filtros solo cuando el valor efectivamente cambió (evita recargas
 * redundantes). Mismo patrón repetido en los listados de pedidos (número de pedido, creado por).
 */
export function useFiltroTextoConDebounce<T extends Record<string, unknown>, K extends keyof T>(
  filtros: Ref<T>,
  campo: K,
  aplicarFiltros: () => void
) {
  return useDebouncedFilterInput((valor: string) => {
    if (filtros.value[campo] !== valor) {
      (filtros.value[campo] as unknown) = valor
      aplicarFiltros()
    }
  })
}
