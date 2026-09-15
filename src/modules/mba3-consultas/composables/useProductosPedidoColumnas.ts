/**
 * Orquestación de columnas de la tabla "productos-pedido": preferencias persistidas
 * (useTablePreferences), selector de visibilidad (useColumnVisibilityToggle), drag & drop
 * de reordenamiento (useColumnDragAndDrop), y totales/numeroPedido derivados. Compartido
 * entre PedidoDetalleView.vue y CargarPlantillaView.vue (mismo tableId, mismo wiring).
 */
import { computed, watch, type Ref } from '@vue/reactivity'
import { useRoute } from 'vue-router'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { useColumnVisibilityToggle } from './useColumnVisibilityToggle'
import { useColumnDragAndDrop } from './useColumnDragAndDrop'
import { useColumnasModificadasStorage } from './useColumnasModificadasStorage'
import type { ColumnConfig } from '../utils/formatters'
import type { PedidoCompleto } from '../types'

export function useProductosPedidoColumnas(
  availableColumns: ColumnConfig[],
  pedido: Ref<PedidoCompleto | null>,
  columnasModificadas: Ref<Set<string>>,
  rolesModificacion: Ref<Map<string, string | null>>
) {
  const route = useRoute()

  const defaultVisibleColumns = availableColumns.filter(col => col.visible || col.fixed).map(col => col.key)
  const defaultColumnOrder = availableColumns.map(col => col.key)

  const {
    visibleColumns,
    columnOrder,
    orderedVisibleColumns: orderedVisibleColumnKeys,
    savePreferences,
    resetPreferences: resetTablePreferences,
    selectAllColumns: selectAllTableColumns,
    isSyncing
  } = useTablePreferences({
    tableId: 'productos-pedido',
    defaultVisibleColumns,
    defaultColumnOrder,
    enableFilters: false,
    enablePageSize: false
  })

  // Selector de columnas (dropdown): estado abierto/cerrado, click-outside y toggle de
  // visibilidad compartidos vía useColumnVisibilityToggle (ver ColumnSelectorDropdown.vue)
  const columnVisibility = useColumnVisibilityToggle({
    columns: availableColumns,
    visibleColumns,
    persist: savePreferences
  })

  // Drag & drop de columnas (reordenar el <th>): variante "con columnas fijas" del composable
  // compartido useColumnDragAndDrop (ver JSDoc del composable) -- columnas `fixed` no se pueden
  // arrastrar ni recibir el drop, columnOrder incluye columnas ocultas (se valida contra el
  // subconjunto visible orderedVisibleColumnKeys), el índice de inserción tras el drop se ajusta
  // para que la columna arrastrada termine en la posición exacta del target, se fuerza que
  // 'numero' quede siempre primero tras reordenar, y se evita el parpadeo visual en dragover/dragleave.
  function pinNumeroFirst(order: string[]) {
    const numeroIndex = order.indexOf('numero')
    if (numeroIndex > 0) {
      order.splice(numeroIndex, 1)
      order.unshift('numero')
    }
    return order
  }

  const {
    draggedColumn: draggedColumnKey,
    dragOverColumn: dragOverColumnKey,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  } = useColumnDragAndDrop({
    columnOrder,
    visibleOrder: orderedVisibleColumnKeys,
    isColumnFixed: (key) => availableColumns.find(col => col.key === key)?.fixed ?? false,
    adjustTargetIndexAfterRemoval: true,
    postReorder: pinNumeroFirst,
    avoidHoverFlicker: true,
    persist: savePreferences
  })

  // Computed para obtener objetos ColumnConfig ordenados
  // Asegurar que la columna 'numero' siempre esté al inicio
  const orderedVisibleColumns = computed(() => {
    const ordered = orderedVisibleColumnKeys.value
      .map(key => availableColumns.find(col => col.key === key))
      .filter((col): col is ColumnConfig => col !== undefined)

    // Separar columnas fijas y no fijas
    const fixedColumns = ordered.filter(col => col.fixed)
    const nonFixedColumns = ordered.filter(col => !col.fixed)

    // Asegurar que 'numero' esté al inicio si existe
    const numeroColumn = fixedColumns.find(col => col.key === 'numero')
    const otherFixedColumns = fixedColumns.filter(col => col.key !== 'numero')

    // Reconstruir el orden: primero 'numero', luego otras fijas, luego no fijas
    return [
      ...(numeroColumn ? [numeroColumn] : []),
      ...otherFixedColumns,
      ...nonFixedColumns
    ]
  })

  // Computed para obtener todas las columnas con su estado de visibilidad
  const availableColumnsWithVisibility = computed(() => {
    return availableColumns.map(col => ({
      ...col,
      visible: col.fixed ? true : visibleColumns.value.includes(col.key)
    }))
  })

  // Asegurar que la columna 'numero' siempre esté visible
  watch(
    () => visibleColumns.value,
    (newVisible) => {
      if (!newVisible.includes('numero')) {
        visibleColumns.value = ['numero', ...newVisible.filter((key: string) => key !== 'numero')]
        savePreferences()
      }
    },
    { immediate: true }
  )

  // Totales: usar pedido.totales del backend cuando exista; si no, recalcular desde detalles (fallback)
  const totalesCostoUnitario = computed(() => {
    const t = pedido.value?.totales
    if (t != null && typeof t.total_costo_unitario === 'number') return t.total_costo_unitario
    if (!pedido.value?.detalles) return 0
    return pedido.value.detalles.reduce((sum: number, detalle: any) => sum + (detalle.costo_doc_sin_iva || 0), 0)
  })

  const totalesSubtotal = computed(() => {
    const t = pedido.value?.totales
    if (t != null && typeof t.total_subtotal === 'number') return t.total_subtotal
    if (!pedido.value?.detalles) return 0
    return pedido.value.detalles.reduce((sum: number, detalle: any) => sum + (detalle.subtotal || 0), 0)
  })

  const totalesTotal = computed(() => {
    const t = pedido.value?.totales
    if (t != null && typeof t.total_total === 'number') return t.total_total
    if (!pedido.value?.detalles) return 0
    return pedido.value.detalles.reduce((sum: number, detalle: any) => sum + (detalle.total || 0), 0)
  })

  // El parámetro de ruta es numero_pedido
  const numeroPedido = computed(() => {
    const id = route.params.id as string
    return id ? decodeURIComponent(id) : ''
  })

  const columnasModificadasStorage = useColumnasModificadasStorage(numeroPedido, columnasModificadas, rolesModificacion)

  return {
    visibleColumns,
    columnOrder,
    orderedVisibleColumnKeys,
    savePreferences,
    resetTablePreferences,
    selectAllTableColumns,
    isSyncing,
    columnVisibility,
    draggedColumnKey,
    dragOverColumnKey,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    orderedVisibleColumns,
    availableColumnsWithVisibility,
    totalesCostoUnitario,
    totalesSubtotal,
    totalesTotal,
    numeroPedido,
    columnasModificadasStorage
  }
}
