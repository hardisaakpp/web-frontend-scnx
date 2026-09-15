import { onMounted, onUnmounted } from 'vue'
import type { Ref } from 'vue'

const DEFAULT_THRESHOLD_PX = 50
const DEFAULT_RESTRAINT_PX = 100
const DEFAULT_ALLOWED_TIME_MS = 500
const DEFAULT_EDGE_MAX_DISTANCE_PX = 24

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'
export type SwipeEdgeSide = 'left' | 'right' | 'top' | 'bottom'

export interface UseSwipeGestureEdgeOptions {
  /** Borde de la pantalla desde el que debe iniciar el toque. */
  side: SwipeEdgeSide
  /** Distancia máxima (px) al borde para que el toque cuente como "iniciado en el borde".
   * Por defecto 24px. */
  maxDistancePx?: number
}

export interface UseSwipeGestureOptions {
  /** Se invoca con la dirección detectada al soltar el dedo. */
  onSwipe: (direction: SwipeDirection) => void
  /** Distancia mínima (px) en el eje principal del gesto para considerarlo swipe. */
  threshold?: number
  /** Desplazamiento máximo permitido (px) en el eje perpendicular; por encima de esto se
   * asume que fue un scroll/gesto diagonal, no un swipe intencional. */
  restraint?: number
  /** Tiempo máximo (ms) entre touchstart y touchend para que cuente como swipe. */
  allowedTime?: number
  /** Si devuelve false, el gesto se ignora por completo (ej. sidebar ya cerrado, o en
   * viewport de escritorio donde el swipe no aplica). Por defecto siempre habilitado. */
  enabled?: () => boolean
  /** Si se define, solo se dispara cuando el toque INICIA cerca del borde indicado (gesto
   * tipo "edge swipe", ej. abrir un panel arrastrando desde el borde de la pantalla). */
  edge?: UseSwipeGestureEdgeOptions
}

/**
 * Detecta un gesto de swipe horizontal o vertical sobre un elemento vía touchstart/touchend.
 * Genérico: no asume qué hacer con el gesto (cerrar un panel, cambiar de tab, etc.), solo
 * reporta la dirección detectada a través de `onSwipe`.
 */
export function useSwipeGesture(target: Ref<HTMLElement | null | undefined>, options: UseSwipeGestureOptions) {
  const {
    onSwipe,
    threshold = DEFAULT_THRESHOLD_PX,
    restraint = DEFAULT_RESTRAINT_PX,
    allowedTime = DEFAULT_ALLOWED_TIME_MS,
    enabled = () => true,
    edge
  } = options

  let startX = 0
  let startY = 0
  let startTime = 0
  let startedOnEdge = true

  function isTouchStartOnEdge(x: number, y: number): boolean {
    if (!edge) return true
    const maxDistancePx = edge.maxDistancePx ?? DEFAULT_EDGE_MAX_DISTANCE_PX
    switch (edge.side) {
      case 'left':
        return x <= maxDistancePx
      case 'right':
        return x >= window.innerWidth - maxDistancePx
      case 'top':
        return y <= maxDistancePx
      case 'bottom':
        return y >= window.innerHeight - maxDistancePx
    }
  }

  function handleTouchStart(event: TouchEvent) {
    if (!enabled()) return
    const touch = event.changedTouches[0]
    startX = touch.pageX
    startY = touch.pageY
    startTime = Date.now()
    startedOnEdge = isTouchStartOnEdge(startX, startY)
  }

  function handleTouchEnd(event: TouchEvent) {
    if (!enabled() || !startedOnEdge) return
    const touch = event.changedTouches[0]
    const deltaX = touch.pageX - startX
    const deltaY = touch.pageY - startY
    const elapsed = Date.now() - startTime
    if (elapsed > allowedTime) return

    if (Math.abs(deltaX) >= threshold && Math.abs(deltaY) <= restraint) {
      onSwipe(deltaX < 0 ? 'left' : 'right')
      return
    }
    if (Math.abs(deltaY) >= threshold && Math.abs(deltaX) <= restraint) {
      onSwipe(deltaY < 0 ? 'up' : 'down')
    }
  }

  onMounted(() => {
    target.value?.addEventListener('touchstart', handleTouchStart, { passive: true })
    target.value?.addEventListener('touchend', handleTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    target.value?.removeEventListener('touchstart', handleTouchStart)
    target.value?.removeEventListener('touchend', handleTouchEnd)
  })
}
