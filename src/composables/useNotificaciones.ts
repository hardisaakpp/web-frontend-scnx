/**
 * Composable para notificaciones en tiempo real vía SSE (Server-Sent Events).
 *
 * Se conecta al endpoint SSE del backend y muestra toasts automáticamente
 * cuando llega una notificación dirigida a los permisos del usuario actual.
 *
 * Flujo:
 * 1. Al montar, se conecta a /api/notificaciones/stream con el JWT del usuario
 * 2. El backend envía eventos SSE cuando ocurre una acción relevante
 * 3. Este composable recibe el evento y muestra un toast usando useToast()
 *
 * Eventos SSE soportados:
 * - "connected": Confirmación de conexión exitosa
 * - "notification": Nueva notificación (se muestra como toast)
 * - "heartbeat": Mantiene la conexión viva (invisible para el usuario)
 *
 * @author SCNexus
 * @date 2026-02-09
 */

import { ref, type Ref } from '@vue/reactivity'
import { onUnmounted } from '@vue/runtime-core'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

/** Estructura de una notificación recibida del backend */
export interface SSENotification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  target_permission: string
  timestamp: number
  metadata: {
    pedido_id?: string
    numero_pedido?: string
    accion?: string
    [key: string]: unknown
  }
}

/** URL base de la API MBA3 */
const API_BASE_URL = import.meta.env.VITE_MBA3_API_BASE_URL || 'http://localhost:8000'

/**
 * Ref global (a nivel de módulo) con la última notificación recibida.
 * Compartido entre todas las instancias de useNotificaciones.
 * Las vistas pueden importar esto y hacer watch() para reaccionar
 * a notificaciones en tiempo real (ej: recargar pedido cuando otro usuario lo modifica).
 */
export const lastNotification: Ref<SSENotification | null> = ref(null)

/** Intervalo de reconexión en milisegundos (5 segundos) */
const RECONNECT_INTERVAL = 5000

/** Máximo número de intentos de reconexión consecutivos */
const MAX_RECONNECT_ATTEMPTS = 10

export function useNotificaciones() {
  const toast = useToast()
  const authStore = useAuthStore()

  /** Estado de la conexión SSE */
  const isConnected = ref(false)

  /** Número de reconexiones intentadas */
  const reconnectAttempts = ref(0)

  /** Reader del stream SSE (para poder cancelarlo) */
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

  /** AbortController para cancelar la conexión fetch */
  let abortController: AbortController | null = null

  /** Timer de reconexión */
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  /** Flag para indicar que se cerró intencionalmente */
  let intentionalClose = false

  /**
   * Inicia la conexión SSE con el backend.
   * Se reconecta automáticamente si la conexión se pierde.
   */
  async function connect() {
    const token = localStorage.getItem('token')
    if (!token) {
      if (import.meta.env.DEV) {
        console.warn('📢 [Notificaciones] No hay token, no se conecta al stream SSE')
      }
      return
    }

    // Limpiar conexión anterior si existe
    disconnect()
    intentionalClose = false

    try {
      abortController = new AbortController()

      const response = await fetch(`${API_BASE_URL}/notificaciones/stream`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('SSE response body is null')
      }

      reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // Resetear contador de reconexión en conexión exitosa
      reconnectAttempts.value = 0

      if (import.meta.env.DEV) {
        console.log('📢 [Notificaciones] Conexión SSE establecida')
      }

      // Procesar stream SSE
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          if (import.meta.env.DEV) {
            console.log('📢 [Notificaciones] Stream SSE finalizado')
          }
          isConnected.value = false
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Procesar líneas completas
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Mantener la última línea incompleta en el buffer

        let currentEventType = ''

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim()

            try {
              const data = JSON.parse(jsonStr)
              handleSSEEvent(currentEventType, data)
            } catch (parseError) {
              if (import.meta.env.DEV) {
                console.warn('📢 [Notificaciones] Error al parsear evento SSE:', parseError)
              }
            }

            // Resetear tipo de evento después de procesar
            currentEventType = ''
          }
        }
      }
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string }
      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        err?.name === 'AbortError' ||
        err?.message?.toLowerCase?.().includes('aborted')
      ) {
        if (import.meta.env.DEV) {
          console.log('📢 [Notificaciones] Conexión SSE abortada intencionalmente')
        }
        return
      }

      if (import.meta.env.DEV) {
        console.error('📢 [Notificaciones] Error en conexión SSE:', error)
      }
      isConnected.value = false
    }

    // Reconectar si no fue intencional
    if (!intentionalClose) {
      scheduleReconnect()
    }
  }

  /**
   * Procesa un evento SSE recibido.
   */
  function handleSSEEvent(eventType: string, data: Record<string, unknown>) {
    switch (eventType) {
      case 'connected':
        isConnected.value = true
        if (import.meta.env.DEV) {
          console.log('📢 [Notificaciones] Conectado al stream SSE:', data)
        }
        break

      case 'notification':
        handleNotification(data as unknown as SSENotification)
        break

      case 'heartbeat':
        // Silencioso - solo mantiene la conexión viva
        if (import.meta.env.DEV) {
          console.debug('📢 [Notificaciones] Heartbeat recibido')
        }
        break

      default:
        if (import.meta.env.DEV) {
          console.warn('📢 [Notificaciones] Evento desconocido:', eventType, data)
        }
    }
  }

  /**
   * Procesa una notificación recibida y muestra un toast.
   * Solo muestra si el usuario actual tiene el permiso indicado en target_permission,
   * para soportar envío por permiso (mismo permiso + permiso opuesto) desde el backend.
   */
  function handleNotification(notification: SSENotification) {
    if (import.meta.env.DEV) {
      console.log('📢 [Notificaciones] Notificación recibida:', notification)
    }

    const targetPermission = notification.target_permission
    if (targetPermission && !authStore.hasPermission(targetPermission)) {
      if (import.meta.env.DEV) {
        console.debug('📢 [Notificaciones] Omitida (usuario sin permiso)', targetPermission)
      }
      return
    }

    // Actualizar ref global para que las vistas puedan reaccionar
    lastNotification.value = notification

    // Mostrar toast según el tipo
    const duration = notification.type === 'error' ? 10000 : 7000

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, notification.message, duration)
        break
      case 'error':
        toast.error(notification.title, notification.message, duration)
        break
      case 'warning':
        toast.warning(notification.title, notification.message, duration)
        break
      case 'info':
      default:
        toast.info(notification.title, notification.message, duration)
        break
    }
  }

  /**
   * Programa una reconexión automática con backoff exponencial limitado.
   */
  function scheduleReconnect() {
    if (intentionalClose) return

    if (reconnectAttempts.value >= MAX_RECONNECT_ATTEMPTS) {
      if (import.meta.env.DEV) {
        console.warn(
          `📢 [Notificaciones] Máximo de ${MAX_RECONNECT_ATTEMPTS} intentos de reconexión alcanzado`
        )
      }
      return
    }

    reconnectAttempts.value++
    const delay = Math.min(RECONNECT_INTERVAL * reconnectAttempts.value, 30000) // Max 30s

    if (import.meta.env.DEV) {
      console.log(
        `📢 [Notificaciones] Reconectando en ${delay / 1000}s (intento ${reconnectAttempts.value}/${MAX_RECONNECT_ATTEMPTS})`
      )
    }

    reconnectTimer = setTimeout(() => {
      connect()
    }, delay)
  }

  /**
   * Desconecta del stream SSE.
   */
  function disconnect() {
    intentionalClose = true

    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (abortController) {
      abortController.abort()
      abortController = null
    }

    if (reader) {
      try {
        reader.cancel()
      } catch (e: unknown) {
        const err = e as { name?: string; message?: string }
        if (err?.name !== 'AbortError' && !err?.message?.toLowerCase?.().includes?.('aborted') && import.meta.env.DEV) {
          console.warn('📢 [Notificaciones] Error al cancelar reader:', e)
        }
      }
      reader = null
    }

    isConnected.value = false

    if (import.meta.env.DEV) {
      console.log('📢 [Notificaciones] Desconectado del stream SSE')
    }
  }

  // Cleanup al desmontar el componente
  onUnmounted(() => {
    disconnect()
  })

  return {
    /** Estado de conexión del stream SSE */
    isConnected,
    /** Número de intentos de reconexión realizados */
    reconnectAttempts,
    /** Inicia la conexión SSE */
    connect,
    /** Cierra la conexión SSE */
    disconnect,
  }
}
