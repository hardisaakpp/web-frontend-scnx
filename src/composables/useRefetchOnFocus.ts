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

/**
 * Difiere `callback` al siguiente macrotask en vez de llamarlo directo desde el handler
 * del evento (foco, visibilitychange, reconexión SSE, etc). Si ese evento ocurre DENTRO
 * del mismo gesto de clic con el que el usuario ya está seleccionando algo (ej. una fila
 * de un listado) -- caso típico: mousedown → focus → mouseup → click -- llamar callback()
 * de inmediato pondría loading=true y el v-if/v-else de la vista desmontaría la fila a
 * mitad del gesto, perdiendo el clic (hay que hacer doble clic para que "pegue"). Con
 * setTimeout(…, 0) el clic completo ya se despachó antes de tocar el estado.
 */
export function deferirRefrescoSinPerderClic(callback: () => void): ReturnType<typeof setTimeout> {
  return setTimeout(callback, 0)
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
    pendingTimeoutId = deferirRefrescoSinPerderClic(() => {
      pendingTimeoutId = null
      callback()
    })
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
