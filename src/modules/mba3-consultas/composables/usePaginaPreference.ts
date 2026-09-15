import { ref } from 'vue'

/**
 * Persiste en localStorage el offset (página actual) que el usuario tenía en un listado, bajo una
 * clave propia por listado (`storageKey`), para que se mantenga al volver de ver el detalle de un
 * pedido o al recargar la página. Mismo criterio que usePageSizePreference.
 */
export function usePaginaPreference(storageKey: string) {
  const STORAGE_KEY = `${storageKey}-offset`

  function leerGuardado(): number {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY)
      if (guardado) {
        const parsed = parseInt(guardado, 10)
        if (!isNaN(parsed) && parsed >= 0) {
          return parsed
        }
      }
    } catch (error) {
      console.error(`Error leyendo página guardada (${storageKey}):`, error)
    }
    return 0
  }

  const offset = ref(leerGuardado())

  function guardar(nuevoOffset: number) {
    offset.value = nuevoOffset
    try {
      localStorage.setItem(STORAGE_KEY, nuevoOffset.toString())
    } catch (error) {
      console.error(`Error guardando página (${storageKey}):`, error)
    }
  }

  return { offset, guardar }
}
