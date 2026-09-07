/**
 * Paginación offset/limit duplicada idéntica en los 4 listados de pedidos del módulo (solo cambia
 * el nombre local de las variables: pedidosListCurrentPage/plantillaListCurrentPage/
 * redistribucionListCurrentPage/redistListCurrentPage): computeds de página actual/total a partir
 * de un `metadata` con { total, limit, offset }, y las funciones que cambian de página o de tamaño
 * de página, sincronizan ese cambio hacia otro lado si hace falta, y vuelven a pedir datos.
 *
 * Genérico: no conoce "pedidos" ni ningún array de filas -- solo opera sobre el objeto metadata y
 * un callback `refetch`. Sirve igual para cualquier listado paginado por offset/limit del backend.
 */
import { computed, type Ref, type WritableComputedRef, type ComputedRef } from '@vue/reactivity'

export interface OffsetPaginationMetadataLike {
  total: number
  limit: number
  offset: number
}

export interface UseOffsetPaginationOptions {
  /**
   * Se ejecuta cada vez que `metadata.offset` cambia (click de página, cambio de tamaño de
   * página, goToOffset o resetToFirstPage), ANTES de refetch. Opcional: en los 4 listados actuales
   * el offset también vive espejado en `filtros.value.offset` (el objeto que se envía tal cual al
   * backend) -- pásalo aquí para mantenerlo en sync, ej. `(offset) => { filtros.value.offset = offset }`.
   * Si el offset no se guarda en ningún otro lado, se puede omitir.
   */
  onOffsetChange?: (offset: number) => void
  /**
   * Se ejecuta cuando cambia el tamaño de página, ANTES de refetch -- para persistir la
   * preferencia. En los 4 listados actuales es la función `guardar` que devuelve
   * usePageSizePreference(...). Opcional.
   */
  onPageSizeChange?: (limit: number) => void
}

/**
 * @param metadata Ref con `{ total, limit, offset }` (p. ej. PedidosListadoMetadata -- solo se leen/
 *   escriben esos 3 campos, cualquier campo extra como `has_more` se preserva intacto).
 * @param refetch Función que vuelve a pedir los datos al backend con el offset/limit actuales
 *   (p. ej. `cargarPedidos`). Se llama automáticamente tras cada cambio de página/tamaño.
 */
export function useOffsetPagination(
  metadata: Ref<OffsetPaginationMetadataLike>,
  refetch: () => void,
  options: UseOffsetPaginationOptions = {}
): {
  totalPages: ComputedRef<number>
  currentPage: WritableComputedRef<number>
  goToOffset: (offset: number) => void
  setPageSize: (limit: number) => void
  resetToFirstPage: () => void
} {
  const totalPages = computed(() =>
    metadata.value.total > 0 ? Math.max(1, Math.ceil(metadata.value.total / metadata.value.limit)) : 1
  )

  /** Fija el offset, sincroniza (onOffsetChange) y refresca. Función de bajo nivel: currentPage,
   * resetToFirstPage y setPageSize se apoyan en esta para no repetir la secuencia 3 veces. */
  function goToOffset(nuevoOffset: number) {
    metadata.value.offset = nuevoOffset
    options.onOffsetChange?.(nuevoOffset)
    refetch()
  }

  /** Página actual 1-based, lista para `v-model` de QuickTablePagination. Al asignarla, convierte
   * la página a offset (clamp entre 1 y totalPages) y dispara goToOffset. */
  const currentPage = computed({
    get(): number {
      if (metadata.value.limit <= 0) return 1
      return Math.floor(metadata.value.offset / metadata.value.limit) + 1
    },
    set(pagina: number) {
      const limit = metadata.value.limit
      const max = totalPages.value
      const n = Math.min(max, Math.max(1, Math.round(pagina)))
      goToOffset((n - 1) * limit)
    }
  })

  /** Para `@update:page-size` de QuickTablePagination: persiste la preferencia, aplica el nuevo
   * límite, vuelve a la página 1 y refresca. */
  function setPageSize(nuevoLimit: number) {
    options.onPageSizeChange?.(nuevoLimit)
    metadata.value.limit = nuevoLimit
    metadata.value.offset = 0
    options.onOffsetChange?.(0)
    refetch()
  }

  /** Vuelve a la página 1 y refresca -- equivalente a `goToOffset(0)`. Pensado para
   * aplicarFiltros()/limpiarFiltros(): en los 4 listados, aplicar o limpiar filtros siempre
   * reinicia la paginación a la primera página. */
  function resetToFirstPage() {
    goToOffset(0)
  }

  return { totalPages, currentPage, goToOffset, setPageSize, resetToFirstPage }
}
