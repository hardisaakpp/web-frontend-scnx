/**
 * Refresca datos cuando la pestaña/ventana recupera foco o visibilidad (ej. otra
 * ventana maximizada encima que se minimiza, o el usuario vuelve tras cambiar de
 * pestaña). Complementa a las notificaciones SSE: cubre el caso en que la pestaña
 * simplemente estuvo fuera de vista un rato, sin depender de haber recibido (o
 * perdido) un evento puntual.
 *
 * Pensado para vistas de listado. No usar en vistas de detalle/edición: un refresco
 * a ciegas ahí podría pisar cambios no guardados del usuario.
 */

import { onMounted, onUnmounted } from '@vue/runtime-core'

/** Tiempo mínimo (ms) entre refrescos consecutivos, para no disparar una petición en
 * cada alt-tab si el usuario cambia de ventana seguido. */
const DEFAULT_COOLDOWN_MS = 15000

export interface UseRefetchOnFocusOptions {
  /** Cooldown en ms entre refrescos. Por defecto 15s. */
  cooldownMs?: number
}

export function useRefetchOnFocus(callback: () => void, options: UseRefetchOnFocusOptions = {}) {
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS

  // Arranca en "ahora": si la pestaña recupera foco casi inmediatamente después de
  // montar la vista, los datos ya están frescos y no hace falta repetir la carga.
  let lastRun = Date.now()
  let pendingTimeoutId: ReturnType<typeof setTimeout> | null = null

  function trigger() {
    const now = Date.now()
    if (now - lastRun < cooldownMs) return
    lastRun = now
    // Diferir al siguiente macrotask (no llamar callback() directo desde el handler):
    // si la ventana recupera el foco por el mismo clic con el que el usuario ya está
    // seleccionando algo (ej. una fila del listado), el evento "focus" se dispara DENTRO
    // de esa misma secuencia (mousedown → focus → mouseup → click). Si el refetch pone
    // loading=true de inmediato, el v-if/v-else de la vista desmonta la tabla a mitad
    // del gesto y el clic se pierde. setTimeout(…, 0) garantiza que el clic completo ya
    // se despachó antes de tocar loading; si el usuario efectivamente navega, el
    // composable se desmonta y el timeout se cancela abajo, sin recarga de sobra.
    pendingTimeoutId = setTimeout(() => {
      pendingTimeoutId = null
      callback()
    }, 0)
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      trigger()
    }
  }

  function handleFocus() {
    trigger()
  }

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', handleFocus)
    if (pendingTimeoutId !== null) {
      clearTimeout(pendingTimeoutId)
    }
  })
}
