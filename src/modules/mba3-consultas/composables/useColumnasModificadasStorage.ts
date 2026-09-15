import type { Ref } from 'vue'

/**
 * Fallback en sessionStorage para el set de columnas modificadas (y sus roles) de un pedido.
 * El backend es la fuente principal de verdad; esto solo cubre el hueco antes de que la carga
 * inicial desde el backend complete.
 */
export function useColumnasModificadasStorage(
  numeroPedido: Ref<string | undefined>,
  columnasModificadas: Ref<Set<string>>,
  rolesModificacion: Ref<Map<string, string | null>>
) {
  function getStorageKey(): string {
    return `pedido_columnas_modificadas_${numeroPedido.value}`
  }

  function guardar(): void {
    if (!numeroPedido.value) return
    try {
      const storageKey = getStorageKey()
      const columnasArray = Array.from(columnasModificadas.value)
      sessionStorage.setItem(storageKey, JSON.stringify(columnasArray))
    } catch (e) {
      console.warn('Error al guardar columnas modificadas en sessionStorage (fallback):', e)
    }
  }

  function limpiar(): void {
    if (!numeroPedido.value) return
    try {
      const storageKey = getStorageKey()
      sessionStorage.removeItem(storageKey)
      columnasModificadas.value.clear()
      rolesModificacion.value.clear()
    } catch (e) {
      console.warn('Error al limpiar columnas modificadas en sessionStorage:', e)
    }
  }

  function cargar(): void {
    if (!numeroPedido.value) return
    try {
      const storageKey = getStorageKey()
      const stored = sessionStorage.getItem(storageKey)
      if (stored) {
        const columnasArray = JSON.parse(stored) as string[]
        columnasModificadas.value = new Set(columnasArray)
      }
    } catch (e) {
      console.warn('Error al cargar columnas modificadas desde sessionStorage:', e)
    }
  }

  return { guardar, limpiar, cargar }
}
