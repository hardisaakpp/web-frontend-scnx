import { onUnmounted, ref, watch, type Ref } from 'vue'

/**
 * Se pone en `true` recien despues de `delayMs` de que `source()` este en `true` de forma
 * continua, y vuelve a `false` de inmediato en cuanto `source()` deja de estarlo. Pensado
 * para escalar un mensaje de carga ("esto esta tardando mas de lo usual") sin mostrarlo en
 * el caso comun donde la operacion resuelve rapido.
 */
export function useDelayedFlag(source: () => boolean, delayMs: number): Ref<boolean> {
  const activo = ref(false)
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function limpiarTimeout() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  watch(
    source,
    (esActivo) => {
      limpiarTimeout()
      if (esActivo) {
        timeoutId = setTimeout(() => {
          activo.value = true
        }, delayMs)
      } else {
        activo.value = false
      }
    },
    { immediate: true }
  )

  onUnmounted(limpiarTimeout)

  return activo
}
