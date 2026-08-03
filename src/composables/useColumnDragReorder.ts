import { ref, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import { useTablePreferences } from './useTablePreferences'

export interface DragReorderColumn {
  key: string
  fixed: boolean
}

export interface UseColumnDragReorderOptions<T extends DragReorderColumn> {
  tableId: string
  availableColumns: T[]
  defaultVisibleColumns: string[]
  /**
   * Si true, las columnas fijas siempre se incluyen en `orderedVisibleColumns` aunque no
   * estén presentes en el orden guardado. Si false, solo se incluyen las fijas que sí
   * aparecen en el orden guardado. Cada vista existente ya tenía uno u otro comportamiento
   * antes de esta extracción; se parametriza para no cambiarlo al migrar.
   */
  alwaysIncludeAllFixedColumns?: boolean
}

/**
 * Selector de columnas visibles + reordenamiento por drag & drop, con persistencia vía
 * useTablePreferences. Extraído de la lógica duplicada entre las vistas de Aprobaciones
 * (contabilidad/pendientes/historial).
 */
export function useColumnDragReorder<T extends DragReorderColumn>(options: UseColumnDragReorderOptions<T>) {
  const { tableId, availableColumns, defaultVisibleColumns, alwaysIncludeAllFixedColumns = false } = options
  const defaultColumnOrder = availableColumns.map(col => col.key)

  const {
    visibleColumns,
    columnOrder,
    orderedVisibleColumns: orderedVisibleColumnKeys,
    savePreferences
  } = useTablePreferences({
    tableId,
    defaultVisibleColumns,
    defaultColumnOrder,
    enableFilters: false,
    enablePageSize: false
  })

  const orderedVisibleColumns = computed(() => {
    const ordered = orderedVisibleColumnKeys.value
      .map(key => availableColumns.find(col => col.key === key))
      .filter((col): col is T => col !== undefined)
    const nonFixedColumns = ordered.filter(col => !col.fixed)
    const fixedColumns = alwaysIncludeAllFixedColumns
      ? availableColumns.filter(col => col.fixed)
      : ordered.filter(col => col.fixed)
    return [...nonFixedColumns, ...fixedColumns]
  })

  const availableColumnsWithVisibility = computed(() =>
    availableColumns.map(col => ({
      ...col,
      visible: col.fixed ? true : visibleColumns.value.includes(col.key)
    }))
  )

  function toggleColumnVisibility(columnKey: string) {
    const column = availableColumns.find(col => col.key === columnKey)
    if (column?.fixed) return
    const current = visibleColumns.value
    const index = current.indexOf(columnKey)
    const visibleNonFixed = current.filter(key => !availableColumns.find(c => c.key === key)?.fixed)
    if (index > -1 && visibleNonFixed.length <= 1) return
    if (index > -1) {
      visibleColumns.value = current.filter(k => k !== columnKey)
    } else {
      visibleColumns.value = [...current, columnKey]
    }
    savePreferences()
  }

  const showColumnSelector = ref(false)
  const columnSelectorWrapRef = ref<HTMLElement | null>(null)

  function closeColumnSelectorOnClickOutside(e: MouseEvent) {
    if (columnSelectorWrapRef.value && !columnSelectorWrapRef.value.contains(e.target as Node)) {
      showColumnSelector.value = false
      document.removeEventListener('click', closeColumnSelectorOnClickOutside)
    }
  }

  watch(showColumnSelector, (isOpen) => {
    if (isOpen) {
      nextTick(() => document.addEventListener('click', closeColumnSelectorOnClickOutside))
    } else {
      document.removeEventListener('click', closeColumnSelectorOnClickOutside)
    }
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', closeColumnSelectorOnClickOutside)
  })

  const draggedColumnKey = ref<string | null>(null)
  const dragOverColumnKey = ref<string | null>(null)

  function handleDragStart(event: DragEvent, columnKey: string) {
    const column = availableColumns.find(col => col.key === columnKey)
    if (column?.fixed) return
    draggedColumnKey.value = columnKey
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', columnKey)
    }
  }

  function handleDragOver(event: DragEvent, columnKey: string) {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    if (draggedColumnKey.value !== null && draggedColumnKey.value !== columnKey) {
      const target = availableColumns.find(col => col.key === columnKey)
      if (!target?.fixed) dragOverColumnKey.value = columnKey
    } else {
      dragOverColumnKey.value = null
    }
  }

  function handleDragLeave() {}

  function handleDrop(event: DragEvent, targetColumnKey: string) {
    event.preventDefault()
    if (!draggedColumnKey.value || draggedColumnKey.value === targetColumnKey) {
      draggedColumnKey.value = null
      dragOverColumnKey.value = null
      return
    }
    const draggedColumn = availableColumns.find(col => col.key === draggedColumnKey.value)
    const targetColumn = availableColumns.find(col => col.key === targetColumnKey)
    if (draggedColumn?.fixed || targetColumn?.fixed) {
      draggedColumnKey.value = null
      dragOverColumnKey.value = null
      return
    }
    const fullOrder = [...columnOrder.value]
    const draggedIndexInFull = fullOrder.indexOf(draggedColumnKey.value)
    const targetIndexInFull = fullOrder.indexOf(targetColumnKey)
    if (draggedIndexInFull === -1 || targetIndexInFull === -1) {
      draggedColumnKey.value = null
      dragOverColumnKey.value = null
      return
    }
    fullOrder.splice(draggedIndexInFull, 1)
    const adjustedTarget = targetIndexInFull > draggedIndexInFull ? targetIndexInFull - 1 : targetIndexInFull
    fullOrder.splice(adjustedTarget, 0, draggedColumnKey.value)
    columnOrder.value = fullOrder
    savePreferences()
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
  }

  function handleDragEnd() {
    draggedColumnKey.value = null
    dragOverColumnKey.value = null
  }

  return {
    visibleColumns,
    columnOrder,
    orderedVisibleColumns,
    availableColumnsWithVisibility,
    toggleColumnVisibility,
    showColumnSelector,
    columnSelectorWrapRef,
    draggedColumnKey,
    dragOverColumnKey,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    savePreferences
  }
}
