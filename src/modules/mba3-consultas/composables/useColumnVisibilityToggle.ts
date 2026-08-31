/**
 * Composable genérico para el patrón "selector de columnas" (botón "Columnas" /
 * "Seleccionar Columnas" que abre un dropdown/panel con checkboxes para mostrar/ocultar
 * columnas de una tabla) duplicado en varios listados del módulo, en 2 variantes visuales:
 *
 * - Variante "dropdown" (ExcelLikeGridView.vue, PedidoDetalleView.vue, RedistribucionTiendas.vue,
 *   CargarPlantillaView.vue, ProcesamientoSAPView.vue): panel flotante, columnas "fijas"
 *   marcadas con badge "(fija)" y no ocultables, spinner "Guardando..." mientras isSyncing.
 * - Variante "panel" (OrdenCompraTable.vue, HistorialOrdenesTable.vue, DespachosTable.vue,
 *   RemisionesTable.vue): panel embebido con botones "Mostrar todas" / "Restaurar predeterminadas",
 *   sin concepto de columna fija.
 *
 * Este composable cubre lo común a ambas: estado abierto/cerrado del dropdown/panel, cierre al
 * hacer click fuera (con su propio listener, sin que cada consumidor tenga que registrarlo) y el
 * toggle de visibilidad de una columna con la validación "debe quedar al menos una columna
 * visible" (excluyendo las fijas). NO reimplementa "seleccionar todas" / "restaurar
 * predeterminadas": eso ya lo resuelve @/composables/useTablePreferences
 * (selectAllColumns/resetPreferences) — los componentes de presentación (ColumnSelectorDropdown.vue
 * / ColumnSelectorPanel.vue) solo emiten esos eventos para que el consumidor los conecte a lo que
 * ya tiene.
 *
 * El cierre al hacer click fuera NO requiere que el consumidor exponga ningún template ref: se
 * identifica "adentro" por el atributo `data-column-selector-id` que ColumnSelectorDropdown.vue /
 * ColumnSelectorPanel.vue ya estampan en su(s) elemento(s) raíz usando el `selectorId` que este
 * composable devuelve — pásalo tal cual a la prop `selector-id` del componente de presentación.
 *
 * Cada consumidor ya tiene su propia función para persistir preferencias (con nombres distintos:
 * `savePreferences`, etc.) — este composable la recibe como parámetro, no asume un nombre.
 */
import { ref, type Ref, type ComputedRef } from '@vue/reactivity'
import { onMounted, onUnmounted } from '@vue/runtime-core'

/** Definición mínima de columna que necesita el toggle: su key y si es fija (no ocultable). */
export interface ColumnVisibilityDef {
  key: string
  fixed?: boolean
}

/**
 * Columna ya combinada con su estado de visibilidad actual, lista para renderizar en el
 * dropdown/panel (mismo shape que `availableColumnsWithVisibility` en ExcelLikeGridView.vue /
 * PedidoDetalleView.vue). `ColumnConfig` (utils/formatters.ts) ya cumple esta forma.
 */
export interface ColumnVisibilityOption {
  key: string
  label: string
  visible: boolean
  fixed?: boolean
}

export interface UseColumnVisibilityToggleOptions {
  /** Columnas disponibles (solo se usa `key`/`fixed`). Puede ser un array fijo o reactivo. */
  columns: ColumnVisibilityDef[] | Ref<ColumnVisibilityDef[]> | ComputedRef<ColumnVisibilityDef[]>
  /** Keys de las columnas actualmente visibles (p. ej. `visibleColumns` de useTablePreferences). */
  visibleColumns: Ref<string[]>
  /**
   * Función para persistir el cambio (p. ej. `savePreferences` de useTablePreferences).
   * Opcional: si el consumidor ya persiste visibleColumns vía su propio watcher, puede omitirse.
   * Se invoca sin esperar su resultado (fire-and-forget) -- por eso admite `Promise<void>`
   * además de `void`, para no forzar un `void` incorrecto sobre funciones async como
   * `savePreferences` (que ya maneja sus propios errores internamente).
   */
  persist?: () => void | Promise<void>
  /**
   * Si es false, desactiva la validación "al menos una columna visible" (por defecto true).
   * La variante "panel" (OrdenCompraTable y hermanas) no la aplica hoy — pásalo en false ahí
   * si quieres preservar el comportamiento actual tal cual.
   */
  enforceMinVisible?: boolean
}

let nextInstanceId = 0

export function useColumnVisibilityToggle(options: UseColumnVisibilityToggleOptions) {
  const isOpen = ref(false)
  /**
   * Id único de esta instancia del composable. ColumnSelectorDropdown.vue / ColumnSelectorPanel.vue
   * lo estampan como `data-column-selector-id` en su(s) elemento(s) raíz para que el listener de
   * click-outside sepa qué es "dentro" sin que el consumidor tenga que exponer ningún template ref
   * (funciona igual si el botón y el panel son un único contenedor o elementos hermanos).
   */
  const selectorId = `col-vis-${++nextInstanceId}`

  function resolveColumns(): ColumnVisibilityDef[] {
    const columns = options.columns
    return Array.isArray(columns) ? columns : columns.value
  }

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  function toggleOpen() {
    isOpen.value = !isOpen.value
  }

  /**
   * Alterna la visibilidad de una columna. No hace nada si la columna es fija, o si es la
   * última columna no-fija visible y `enforceMinVisible` está activo (por defecto).
   */
  function toggleColumnVisibility(columnKey: string) {
    const columns = resolveColumns()
    const column = columns.find(col => col.key === columnKey)
    if (column?.fixed) return

    const current = [...options.visibleColumns.value]
    const index = current.indexOf(columnKey)

    if (options.enforceMinVisible !== false) {
      const visibleNonFixed = current.filter(key => {
        const col = columns.find(c => c.key === key)
        return !col?.fixed
      })
      if (index > -1 && visibleNonFixed.length === 1) {
        console.warn('⚠️ Debe haber al menos una columna visible. Operación cancelada.')
        return
      }
    }

    if (index > -1) {
      current.splice(index, 1)
    } else {
      current.push(columnKey)
    }

    options.visibleColumns.value = current
    options.persist?.()
  }

  function handleClickOutside(event: MouseEvent) {
    if (!isOpen.value) return
    const target = event.target
    if (target instanceof Element && target.closest(`[data-column-selector-id="${selectorId}"]`)) return
    isOpen.value = false
  }

  onMounted(() => document.addEventListener('click', handleClickOutside))
  onUnmounted(() => document.removeEventListener('click', handleClickOutside))

  return {
    isOpen,
    selectorId,
    open,
    close,
    toggleOpen,
    toggleColumnVisibility
  }
}
