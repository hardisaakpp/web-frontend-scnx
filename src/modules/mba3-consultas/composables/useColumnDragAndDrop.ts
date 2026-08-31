/**
 * Composable genérico para el patrón "arrastrar el <th> de una columna para reordenarla"
 * duplicado (casi carácter por carácter en la mayoría de casos) en varios listados del módulo:
 * estado draggedColumn/dragOverColumn y los 5 handlers (dragstart/dragover/dragleave/drop/dragend)
 * que hoy viven inline en cada componente/vista.
 *
 * Verificado en 3 archivos, y NO es un único patrón sino dos variantes con comportamiento
 * observable distinto — este composable cubre ambas vía opciones, no las promedia:
 *
 * - Variante "simple" (OrdenCompraTable.vue, DespachosTable.vue — idénticas entre sí): sin
 *   columnas fijas, `columnOrder` es directamente el orden a reordenar (no distingue
 *   visible/oculto), dragover siempre marca la columna sobrevolada, dragleave la limpia de
 *   inmediato, y el índice de inserción tras el drop NO se ajusta después de remover la columna
 *   arrastrada (el resultado puede diferir de "insertar en la posición exacta del target" cuando
 *   se arrastra hacia adelante — es el comportamiento real hoy, no un bug a corregir aquí). Estos
 *   dos archivos tampoco pasan función de persistencia explícita: `columnOrder` viene de
 *   `useTablePreferences`, que ya persiste solo vía su propio `watch(columnOrder, ...)`.
 * - Variante "con columnas fijas" (PedidoDetalleView.vue): columnas `fixed` no se pueden arrastrar
 *   ni recibir el drop (`isColumnFixed`); `columnOrder` incluye columnas ocultas, por lo que el
 *   drop valida existencia contra el subconjunto visible ordenado (`visibleOrder`) antes de tocar
 *   el array completo; el índice de inserción SÍ se ajusta tras remover la columna arrastrada
 *   (`adjustTargetIndexAfterRemoval`), dando una semántica de "insertar en la posición del target"
 *   distinta de la variante simple; hay un ajuste post-reordenamiento para forzar que 'numero'
 *   quede siempre primero (`postReorder`); dragover solo marca `dragOverColumn` si hay un drag
 *   activo distinto del target y lo limpia en caso contrario, y dragleave es un no-op — para evitar
 *   parpadeo visual (`avoidHoverFlicker`, cubre ambos comportamientos a la vez tal como en el
 *   original); y sí llama a `persist` explícitamente tras el drop (además del watcher interno de
 *   useTablePreferences — duplicado ya presente hoy, se preserva tal cual).
 *
 * RemisionesTable.vue, HistorialOrdenesTable.vue y CargarPlantillaView.vue también tienen este
 * patrón (mismo hallazgo de duplicación) pero no fueron leídos en este diseño — antes de
 * consumirlos ahí, confirmar a cuál de las dos variantes (o si a una tercera) corresponde su
 * `handleDrop` actual.
 */
import { ref, type Ref, type ComputedRef } from '@vue/reactivity'

export interface UseColumnDragAndDropOptions {
  /**
   * Ref reactivo con el orden de columnas a reordenar. En la variante simple es el único orden
   * que existe (lo que se ve es lo que hay); en la variante con columnas fijas es el orden
   * COMPLETO (visibles + ocultas) — ver `visibleOrder`.
   */
  columnOrder: Ref<string[]>
  /**
   * Función para persistir el nuevo orden tras un drop exitoso (p. ej. `savePreferences` de
   * useTablePreferences). Opcional: si `columnOrder` ya se persiste solo vía su propio watcher
   * (como hace useTablePreferences internamente), puede omitirse — igual que en
   * useColumnVisibilityToggle. Si se pasa, se llama ADEMÁS de cualquier watcher externo sobre
   * `columnOrder` (no lo reemplaza).
   */
  persist?: () => void
  /**
   * Determina si una columna es "fija": no se puede iniciar un drag desde ella ni soltar sobre
   * ella (PedidoDetalleView.vue). Por defecto ninguna columna es fija (OrdenCompraTable.vue /
   * DespachosTable.vue no tienen ese concepto).
   */
  isColumnFixed?: (columnKey: string) => boolean
  /**
   * Orden VISIBLE (subconjunto ordenado de `columnOrder`), cuando difiere de `columnOrder`
   * porque este último también contiene columnas ocultas (PedidoDetalleView.vue: prop
   * `orderedVisibleColumns` de useTablePreferences). Si se pasa, el drop valida que la columna
   * arrastrada y el target existan en `visibleOrder` antes de reordenar `columnOrder`; si se
   * omite (caso simple), esa validación no aplica porque `columnOrder` ya es el orden visible.
   */
  visibleOrder?: Ref<string[]> | ComputedRef<string[]>
  /**
   * Si es true, el índice donde se inserta la columna arrastrada se ajusta restando 1 cuando el
   * target estaba después de ella en el array original (porque ya se removió un elemento antes de
   * insertar) — da semántica de "insertar en la posición exacta del target" (PedidoDetalleView.vue).
   * Por defecto false: se inserta en el índice del target SIN ajustar tras la remoción
   * (OrdenCompraTable.vue / DespachosTable.vue) — NO cambiar este default salvo que el consumidor
   * migrado sea exactamente PedidoDetalleView.vue, ya que altera dónde termina la columna arrastrada.
   */
  adjustTargetIndexAfterRemoval?: boolean
  /**
   * Se ejecuta sobre el array recién reordenado, antes de asignarlo a `columnOrder.value`, para
   * aplicar ajustes finales (p. ej. PedidoDetalleView.vue fuerza que 'numero' quede siempre
   * primero). Recibe y debe devolver el array (puede mutarlo y devolverlo, o devolver uno nuevo).
   */
  postReorder?: (order: string[]) => string[]
  /**
   * Si es true: dragover solo marca `dragOverColumn` cuando hay un drag activo con columna
   * distinta del target (lo limpia en caso contrario), y dragleave NO limpia `dragOverColumn`
   * (queda a cargo de drop/dragend) — evita el parpadeo visual al pasar sobre celdas internas de
   * un <th> (PedidoDetalleView.vue). Por defecto false: dragover siempre marca el target
   * sobrevolado y dragleave lo limpia de inmediato (OrdenCompraTable.vue / DespachosTable.vue).
   */
  avoidHoverFlicker?: boolean
}

/**
 * Reordenamiento por arrastre de columnas de tabla: refs de estado visual del drag y los 5
 * handlers listos para conectar a los eventos nativos `drag*` del `<th>`. Ver comentario de
 * archivo para las dos variantes de comportamiento y cómo seleccionarlas vía opciones.
 */
export function useColumnDragAndDrop(options: UseColumnDragAndDropOptions) {
  const draggedColumn = ref<string | null>(null)
  const dragOverColumn = ref<string | null>(null)

  function resetDragState() {
    draggedColumn.value = null
    dragOverColumn.value = null
  }

  function handleDragStart(event: DragEvent, columnKey: string) {
    if (options.isColumnFixed?.(columnKey)) return

    draggedColumn.value = columnKey
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', columnKey)
    }
  }

  function handleDragOver(event: DragEvent, columnKey: string) {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }

    if (!options.avoidHoverFlicker) {
      dragOverColumn.value = columnKey
      return
    }

    dragOverColumn.value = draggedColumn.value !== null && draggedColumn.value !== columnKey
      ? columnKey
      : null
  }

  function handleDragLeave() {
    // Variante simple: limpiar de inmediato. Variante avoidHoverFlicker: no limpiar aquí (evita
    // parpadeo); se limpia en handleDrop o handleDragEnd.
    if (options.avoidHoverFlicker) return
    dragOverColumn.value = null
  }

  function handleDrop(event: DragEvent, targetColumnKey: string) {
    event.preventDefault()

    if (!draggedColumn.value || draggedColumn.value === targetColumnKey) {
      resetDragState()
      return
    }

    if (options.isColumnFixed?.(draggedColumn.value) || options.isColumnFixed?.(targetColumnKey)) {
      resetDragState()
      return
    }

    if (options.visibleOrder) {
      const visible = options.visibleOrder.value
      if (visible.indexOf(draggedColumn.value) === -1 || visible.indexOf(targetColumnKey) === -1) {
        resetDragState()
        return
      }
    }

    const order = [...options.columnOrder.value]
    const draggedIndex = order.indexOf(draggedColumn.value)
    const targetIndex = order.indexOf(targetColumnKey)

    if (draggedIndex === -1 || targetIndex === -1) {
      resetDragState()
      return
    }

    order.splice(draggedIndex, 1)
    const insertAt = options.adjustTargetIndexAfterRemoval && targetIndex > draggedIndex
      ? targetIndex - 1
      : targetIndex
    order.splice(insertAt, 0, draggedColumn.value)

    options.columnOrder.value = options.postReorder ? options.postReorder(order) : order
    options.persist?.()

    resetDragState()
  }

  function handleDragEnd() {
    resetDragState()
  }

  return {
    draggedColumn,
    dragOverColumn,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  }
}
