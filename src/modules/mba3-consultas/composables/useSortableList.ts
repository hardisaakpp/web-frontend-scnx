/**
 * Ordenamiento de columnas de tabla por clic en el <th>, duplicado idéntico (mismo ciclo
 * asc -> desc -> sin orden, mismo comparador) en los 4 listados de pedidos del módulo
 * (PedidosListView.vue, CargarPlantillaListadoView.vue, RedistribucionListadoView.vue,
 * RevisarRedistribucionListadoView.vue).
 *
 * Genérico sobre CUALQUIER array de objetos: no asume la forma de "pedido", solo que el valor de
 * cada columna es accesible por índice (`item[column]`) y es comparable como fecha o como texto.
 * Los 4 listados actuales lo usan con PedidoResumido y con las mismas 3 columnas de fecha
 * ('fecha_pedido', 'creado_en', 'modificado_fecha'), pero nada aquí depende de esos nombres.
 *
 * `storageKey` (opcional) persiste el ordenamiento elegido en localStorage bajo `${storageKey}-sort`,
 * mismo criterio que usePageSizePreference.ts, para que se mantenga al recargar o volver de ver el
 * detalle de un pedido.
 */
import { ref, computed, type Ref, type ComputedRef } from '@vue/reactivity'

export type SortDirection = 'asc' | 'desc' | null

/**
 * Definición de una columna ordenable, usada por ../components/SortableTableHead.vue (el <thead>
 * genérico que dispara `toggleSort`). Vive aquí (no en el .vue) para que tanto el composable como
 * el componente de presentación importen el mismo tipo desde un único lugar.
 */
export interface SortableColumnDef {
  /** Key de la columna: debe coincidir con la key que se le pasa a `toggleSort` y con el campo
   * que se compara en cada item (item[key]). */
  key: string
  /** Texto visible del encabezado. */
  label: string
  /** Alineación del contenido del <th> (y de las flechas de orden). Por defecto 'left'. */
  align?: 'left' | 'center'
  /** Tooltip (atributo title nativo) que se muestra al pasar el mouse sobre el encabezado, para
   * aclarar a qué corresponde la columna cuando el label por sí solo puede ser ambiguo (ej. las 3
   * columnas de fecha del pedido). */
  description?: string
}

/**
 * Descripciones de las 3 columnas de fecha compartidas por los 4 listados de pedidos del módulo,
 * para el tooltip del encabezado (ver `description` en SortableColumnDef). Semántica tomada de los
 * campos del backend: fecha_pedido (Pydantic: "Fecha del pedido"), creado_en/modificado_fecha
 * (mba3-consultas/src/utils/audit_context.py: metadatos de auditoría con DEFAULT de la BD).
 */
export const DESCRIPCION_COLUMNA_FECHA_PEDIDO =
  'Fecha del pedido (la del documento/Excel original), no la fecha en que se cargó al sistema'
export const DESCRIPCION_COLUMNA_FECHA_CREACION =
  'Fecha en que se creó el registro de este pedido en el sistema'
export const DESCRIPCION_COLUMNA_FECHA_MODIFICACION =
  'Fecha de la última modificación realizada a este pedido'

export interface UseSortableListOptions<T> {
  /** Array a ordenar (fuente de datos ya cargada/filtrada por la vista). */
  items: Ref<T[]> | ComputedRef<T[]>
  /**
   * Keys de columnas que deben compararse como fecha (`new Date(valor).getTime()`) en vez de como
   * texto. Por defecto ninguna (todas las columnas se comparan como texto case-insensitive).
   */
  dateColumns?: string[]
  /**
   * Si se pasa, persiste en localStorage la columna/dirección de ordenamiento elegida (mismo
   * criterio que usePageSizePreference: una clave por listado) y la restaura al montar.
   */
  storageKey?: string
}

interface OrdenGuardado {
  column: string
  direction: 'asc' | 'desc'
}

function leerOrdenGuardado(storageKey: string | undefined): OrdenGuardado | null {
  if (!storageKey) return null
  try {
    const guardado = localStorage.getItem(`${storageKey}-sort`)
    if (guardado) {
      const parsed = JSON.parse(guardado)
      if (typeof parsed.column === 'string' && (parsed.direction === 'asc' || parsed.direction === 'desc')) {
        return { column: parsed.column, direction: parsed.direction }
      }
    }
  } catch (error) {
    console.error(`Error leyendo orden guardado (${storageKey}):`, error)
  }
  return null
}

/**
 * Compara dos valores tratando null/undefined como "siempre al final", sin importar la dirección.
 * Devuelve null cuando ninguno de los dos es null/undefined (no aplica esta regla).
 */
function compareNullable(valA: any, valB: any, dir: SortDirection): number | null {
  if (valA == null && valB == null) return 0
  if (valA == null) return dir === 'asc' ? 1 : -1
  if (valB == null) return dir === 'asc' ? -1 : 1
  return null
}

function compareAsDates(valA: any, valB: any, dir: SortDirection): number {
  const dateA = new Date(valA).getTime()
  const dateB = new Date(valB).getTime()
  return dir === 'asc' ? dateA - dateB : dateB - dateA
}

function compareAsText(valA: any, valB: any, dir: SortDirection): number {
  const strA = String(valA).toLowerCase()
  const strB = String(valB).toLowerCase()
  if (strA < strB) return dir === 'asc' ? -1 : 1
  if (strA > strB) return dir === 'asc' ? 1 : -1
  return 0
}

/**
 * Devuelve el estado de ordenamiento (sortColumn/sortDirection), la función para alternarlo al
 * hacer clic en un <th> (toggleSort) y el array ya ordenado (sortedItems), listo para el `v-for`
 * de la tabla en lugar del array original.
 */
export function useSortableList<T>(options: UseSortableListOptions<T>) {
  const guardado = leerOrdenGuardado(options.storageKey)
  const sortColumn = ref<string | null>(guardado?.column ?? null)
  const sortDirection = ref<SortDirection>(guardado?.direction ?? null)
  const dateColumns = options.dateColumns ?? []

  function guardarOrden() {
    if (!options.storageKey) return
    try {
      if (sortColumn.value && sortDirection.value) {
        const valor: OrdenGuardado = { column: sortColumn.value, direction: sortDirection.value }
        localStorage.setItem(`${options.storageKey}-sort`, JSON.stringify(valor))
      } else {
        localStorage.removeItem(`${options.storageKey}-sort`)
      }
    } catch (error) {
      console.error(`Error guardando orden (${options.storageKey}):`, error)
    }
  }

  /** Alterna el ordenamiento de una columna: sin orden -> asc -> desc -> sin orden. */
  function toggleSort(column: string) {
    if (sortColumn.value === column) {
      if (sortDirection.value === 'asc') {
        sortDirection.value = 'desc'
      } else if (sortDirection.value === 'desc') {
        sortColumn.value = null
        sortDirection.value = null
      }
    } else {
      sortColumn.value = column
      sortDirection.value = 'asc'
    }
    guardarOrden()
  }

  const sortedItems = computed((): T[] => {
    const lista = options.items.value

    if (!sortColumn.value || !sortDirection.value) {
      return lista
    }

    const col = sortColumn.value
    const dir = sortDirection.value
    const isDate = dateColumns.includes(col)

    return [...lista].sort((a: any, b: any) => {
      const valA = a[col]
      const valB = b[col]

      // Manejar valores nulos/undefined: siempre al final, sin importar la dirección
      const nullComparison = compareNullable(valA, valB, dir)
      if (nullComparison !== null) return nullComparison

      return isDate ? compareAsDates(valA, valB, dir) : compareAsText(valA, valB, dir)
    })
  })

  return { sortColumn, sortDirection, toggleSort, sortedItems }
}
