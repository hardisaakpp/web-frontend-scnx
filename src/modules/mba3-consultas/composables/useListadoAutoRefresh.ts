/**
 * Combina los 3 watchers/composables de "refrescar el listado solo" que hoy se repiten al final de
 * los 4 archivos de listado de pedidos del módulo (PedidosListView.vue, CargarPlantillaListadoView.vue,
 * RedistribucionListadoView.vue, RevisarRedistribucionListadoView.vue):
 *
 * 1. `watch(lastNotification, ...)` -- recarga cuando llega una notificación SSE relevante.
 * 2. `watch(reconnectedAfterGap, ...)` -- recarga si el SSE reconectó tras una desconexión (pudo
 *    perderse una notificación mientras la pestaña estaba en segundo plano).
 * 3. `useRefetchOnFocus(...)` -- recarga al recuperar foco/visibilidad de la pestaña.
 *
 * Las 3 ya usan `deferirRefrescoSinPerderClic` (o, en el caso de useRefetchOnFocus, lo hace
 * internamente) para no perder el clic con el que el usuario reingresa a un pedido si el refresco
 * coincide con el mismo gesto -- ver el comentario de deferirRefrescoSinPerderClic en
 * @/composables/useRefetchOnFocus.ts. Este composable no cambia esa mecánica, solo evita repetir el
 * cableado en cada vista.
 *
 * ASIMETRÍA REAL entre los 4 archivos (ver `requireAccion` abajo): 3 de los 4 listados
 * (PedidosListView, CargarPlantillaListadoView, RedistribucionListadoView) solo recargan si la
 * notificación trae `metadata.accion` (ignoran notificaciones sin esa metadata). El 4to
 * (RevisarRedistribucionListadoView) recarga ante CUALQUIER notificación no nula, sin exigir
 * `metadata.accion`. Este composable preserva ambos comportamientos vía la opción `requireAccion`
 * -- no promedia ni fuerza uno sobre el otro.
 */
import { watch } from '@vue/reactivity'
import { lastNotification, reconnectedAfterGap, type SSENotification } from '@/composables/useNotificaciones'
import { useRefetchOnFocus, deferirRefrescoSinPerderClic } from '@/composables/useRefetchOnFocus'

export interface UseListadoAutoRefreshOptions {
  /**
   * Si es true (default, matching PedidosListView/CargarPlantillaListadoView/
   * RedistribucionListadoView), una notificación SSE solo dispara el refresco cuando trae
   * `metadata.accion`. Pasar `false` para replicar RevisarRedistribucionListadoView.vue, que
   * refresca ante cualquier notificación no nula sin exigir esa metadata.
   */
  requireAccion?: boolean
  /**
   * Etiqueta para el `console.log` de depuración (solo en DEV, `import.meta.env.DEV`) que hoy
   * escriben ALGUNOS de los 4 listados (no todos, y no siempre en ambos watchers -- ver el reporte
   * de diseño para el detalle exacto por archivo). Si se omite, no se loguea nada (comportamiento
   * de CargarPlantillaListadoView.vue/RedistribucionListadoView.vue). Ej: 'PedidosListView'.
   */
  debugLabel?: string
  /** Cooldown en ms entre refrescos por foco/visibilidad, passthrough a useRefetchOnFocus (default
   * 15s, igual que hoy en los 4 listados -- ninguno pasa un valor propio). */
  focusCooldownMs?: number
}

/**
 * @param refetch Función que vuelve a pedir los datos al backend (p. ej. `cargarPedidos`). Se
 *   invoca (diferida, ver deferirRefrescoSinPerderClic) ante cualquiera de las 3 señales.
 */
export function useListadoAutoRefresh(refetch: () => void, options: UseListadoAutoRefreshOptions = {}) {
  const requireAccion = options.requireAccion ?? true

  watch(lastNotification, (notification: SSENotification | null) => {
    if (!notification) return
    if (requireAccion && !notification.metadata?.accion) return

    if (options.debugLabel && import.meta.env.DEV) {
      console.log(`🔄 [${options.debugLabel}] Notificación SSE recibida, recargando lista...`, notification.metadata?.accion)
    }
    deferirRefrescoSinPerderClic(refetch)
  })

  watch(reconnectedAfterGap, () => {
    if (options.debugLabel && import.meta.env.DEV) {
      console.log(`🔄 [${options.debugLabel}] SSE reconectado tras desconexión, recargando lista...`)
    }
    deferirRefrescoSinPerderClic(refetch)
  })

  useRefetchOnFocus(refetch, { cooldownMs: options.focusCooldownMs })
}
