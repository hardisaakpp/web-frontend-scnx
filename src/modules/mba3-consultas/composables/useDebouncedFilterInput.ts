import { ref } from 'vue'

const DEFAULT_DEBOUNCE_MS = 300
const DEFAULT_MIN_CHARS = 2

export interface UseDebouncedFilterInputOptions {
  debounceMs?: number
  minChars?: number
}

/**
 * Filtra en vivo mientras el usuario escribe: espera `debounceMs` sin
 * pulsaciones antes de aplicar, y no dispara nada por debajo de `minChars`.
 * Replica el patrón ya usado por "Número de Pedido" en CargarPlantillaListadoView.
 */
export function useDebouncedFilterInput(
  aplicar: (valor: string) => void,
  options: UseDebouncedFilterInputOptions = {}
) {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const minChars = options.minChars ?? DEFAULT_MIN_CHARS

  const texto = ref('')
  let timeout: ReturnType<typeof setTimeout> | null = null

  function limpiarTimeout() {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  function commit() {
    limpiarTimeout()
    aplicar(texto.value.trim())
  }

  function handleInput() {
    limpiarTimeout()
    if (texto.value.length < minChars) {
      aplicar('')
      return
    }
    timeout = setTimeout(commit, debounceMs)
  }

  function clear() {
    texto.value = ''
    aplicar('')
  }

  function dispose() {
    limpiarTimeout()
  }

  return { texto, handleInput, commit, clear, dispose }
}
