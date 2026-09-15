import { ref } from 'vue'

/**
 * Persiste en localStorage si el panel "Filtros de Búsqueda" está colapsado, bajo una clave propia
 * por listado (`storageKey`) -- mismo mecanismo que usePageSizePreference (tamaño de página).
 */
export function useFiltrosColapsadosPreference(storageKey: string, defaultColapsado = false) {
  const STORAGE_KEY = `${storageKey}-filtros-colapsados`

  function leerGuardado(): boolean {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY)
      if (guardado !== null) {
        return guardado === 'true'
      }
    } catch (error) {
      console.error(`Error leyendo preferencia de filtros colapsados (${storageKey}):`, error)
    }
    return defaultColapsado
  }

  const colapsado = ref(leerGuardado())

  function guardar(nuevoValor: boolean) {
    colapsado.value = nuevoValor
    try {
      localStorage.setItem(STORAGE_KEY, String(nuevoValor))
    } catch (error) {
      console.error(`Error guardando preferencia de filtros colapsados (${storageKey}):`, error)
    }
  }

  return { colapsado, guardar }
}
