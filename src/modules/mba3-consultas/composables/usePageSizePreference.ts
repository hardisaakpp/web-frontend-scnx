import { ref } from 'vue'

/**
 * Persiste en localStorage el tamaño de página que el usuario eligió para un listado,
 * bajo una clave propia por listado (`storageKey`), para que se mantenga entre sesiones.
 */
export function usePageSizePreference(storageKey: string, defaultPageSize: number) {
  const STORAGE_KEY = `${storageKey}-page-size`

  function leerGuardado(): number {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY)
      if (guardado) {
        const parsed = parseInt(guardado, 10)
        if (!isNaN(parsed) && parsed > 0) {
          return parsed
        }
      }
    } catch (error) {
      console.error(`Error leyendo preferencia de tamaño de página (${storageKey}):`, error)
    }
    return defaultPageSize
  }

  const pageSize = ref(leerGuardado())

  function guardar(nuevoTamano: number) {
    pageSize.value = nuevoTamano
    try {
      localStorage.setItem(STORAGE_KEY, nuevoTamano.toString())
    } catch (error) {
      console.error(`Error guardando preferencia de tamaño de página (${storageKey}):`, error)
    }
  }

  return { pageSize, guardar }
}
