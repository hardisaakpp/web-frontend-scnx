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
import { useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { MBA3_API_BASE_URL } from '@/config/apiBaseUrls'

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

function toSSENotification(payload: unknown): SSENotification | null {
  if (!payload || typeof payload !== 'object') return null
  const raw = payload as Record<string, unknown>

  if (
    typeof raw.type !== 'string' ||
    typeof raw.title !== 'string' ||
    typeof raw.message !== 'string' ||
    typeof raw.target_permission !== 'string'
  ) {
    return null
  }

  const metadata =
    raw.metadata && typeof raw.metadata === 'object'
      ? (raw.metadata as Record<string, unknown>)
      : {}

  return {
    id: typeof raw.id === 'string' ? raw.id : '',
    type: raw.type as SSENotification['type'],
    title: raw.title,
    message: raw.message,
    target_permission: raw.target_permission,
    timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
    metadata
  }
}

function extractNotificationFromSSEData(data: Record<string, unknown>): SSENotification | null {
  // Formato directo (top-level)
  const direct = toSSENotification(data)
  if (direct) return direct

  // Formato { notification: {...} }
  const nestedNotification = toSSENotification(data.notification)
  if (nestedNotification) return nestedNotification

  // Formato { data: {...} } o { data: { notification: {...} } }
  if (data.data && typeof data.data === 'object') {
    const innerData = data.data as Record<string, unknown>
    const dataAsNotification = toSSENotification(innerData)
    if (dataAsNotification) return dataAsNotification

    const innerNestedNotification = toSSENotification(innerData.notification)
    if (innerNestedNotification) return innerNestedNotification
  }

  return null
}

/** URL base de la API MBA3 (ruta relativa; el proxy de Vite/Nginx resuelve el host). */
const API_BASE_URL = MBA3_API_BASE_URL

function getSSEStreamCandidates(baseUrl: string): string[] {
  const normalizedBase = baseUrl.replace(/\/+$/, '')
  return [
    `${normalizedBase}/notificaciones/stream`,
    `${normalizedBase}/api/notificaciones/stream`
  ]
}

/**
 * Ref global (a nivel de módulo) con la última notificación recibida.
 * Compartido entre todas las instancias de useNotificaciones.
 * Las vistas pueden importar esto y hacer watch() para reaccionar
 * a notificaciones en tiempo real (ej: recargar pedido cuando otro usuario lo modifica).
 */
export const lastNotification: Ref<SSENotification | null> = ref(null)

/**
 * Contador global (a nivel de módulo) que se incrementa cada vez que el stream SSE
 * reconecta después de haber estado desconectado. SSE no reenvía a un cliente que
 * reconecta tarde los eventos emitidos mientras estaba desconectado (ej. una
 * pestaña en segundo plano cuyo timer de reconexión fue pausado por el navegador);
 * las vistas de listado pueden hacer watch() sobre esto para refrescar sus datos
 * igual, sin depender de haber recibido ese evento puntual.
 */
export const reconnectedAfterGap: Ref<number> = ref(0)

/** Intervalo de reconexión en milisegundos (5 segundos) */
const RECONNECT_INTERVAL = 5000

/** Prefijo de ruta del módulo MBA3 Consultas. Las notificaciones SSE se entregan por
 * permiso (odcsap.view/mabel.view/produccion-elrayo.view), no por módulo activo -- un
 * usuario con esos permisos puede estar navegando en cualquier otro módulo (Pyg,
 * Inventario, Caja Chica, etc.) cuando llega el evento, ya que la conexión SSE es
 * única para toda la sesión (se abre una vez en MainLayout.vue, no se reabre/cierra
 * al cambiar de módulo). El toast solo debe verse dentro de este módulo. */
const MBA3_CONSULTAS_ROUTE_PREFIX = '/mba3-consultas'

function estaEnModuloMba3Consultas(routePath: string): boolean {
  return routePath === MBA3_CONSULTAS_ROUTE_PREFIX || routePath.startsWith(`${MBA3_CONSULTAS_ROUTE_PREFIX}/`)
}

/** Techo del backoff: nunca esperar más de 30s entre reintentos. No hay límite de
 * intentos -- un backend caído (ej. reinicio del contenedor en desarrollo) no debe
 * dejar al cliente sin reconectar nunca más; antes de este cambio, tras 10 intentos
 * (~4.5 min acumulados) el composable se rendía para siempre y solo un F5 manual
 * volvía a conectar. */
const RECONNECT_MAX_DELAY_MS = 30000

export function useNotificaciones() {
  const toast = useToast()
  const authStore = useAuthStore()
  const route = useRoute()

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

  /** true mientras se está reintentando tras una desconexión no intencional -- evita
   * repetir el toast de aviso en cada intento y dispara el de "reconectado" una sola vez */
  let disconnectWarningShown = false

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

      let response: Response | null = null
      let lastError: Error | null = null
      const streamCandidates = getSSEStreamCandidates(API_BASE_URL)

      for (const streamUrl of streamCandidates) {
        try {
          const candidateResponse = await fetch(streamUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'text/event-stream',
            },
            signal: abortController.signal,
          })

          if (candidateResponse.ok) {
            response = candidateResponse
            if (import.meta.env.DEV) {
              console.log('📢 [Notificaciones] Conectando SSE con URL:', streamUrl)
            }
            break
          }

          lastError = new Error(`SSE connection failed: ${candidateResponse.status} ${candidateResponse.statusText}`)
        } catch (candidateError: unknown) {
          const err = candidateError as Error
          lastError = err
        }
      }

      if (!response) {
        throw lastError || new Error('SSE connection failed for all configured paths')
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

  /** Cuerpo del caso 'connected' de handleSSEEvent, extraído para reducir su complejidad cognitiva. */
  function handleSSEConnected(data: Record<string, unknown>) {
    isConnected.value = true
    if (disconnectWarningShown) {
      disconnectWarningShown = false
      if (estaEnModuloMba3Consultas(route.path)) {
        toast.success('Notificaciones reconectadas', 'La conexión en tiempo real se restableció.')
      }
      reconnectedAfterGap.value++
    }
    if (import.meta.env.DEV) {
      console.log('📢 [Notificaciones] Conectado al stream SSE:', data)
    }
  }

  /**
   * Procesa un evento SSE recibido.
   */
  function handleSSEEvent(eventType: string, data: Record<string, unknown>) {
    switch (eventType) {
      case 'connected':
        handleSSEConnected(data)
        break

      case 'notification':
        {
          const normalizedNotification = extractNotificationFromSSEData(data)
          if (!normalizedNotification) {
            if (import.meta.env.DEV) {
              console.warn('📢 [Notificaciones] No se pudo normalizar payload de notificación SSE:', data)
            }
            break
          }
          handleNotification(normalizedNotification)
        }
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

    if (!estaEnModuloMba3Consultas(route.path)) {
      if (import.meta.env.DEV) {
        console.debug('📢 [Notificaciones] Toast omitido (usuario fuera de mba3-consultas):', route.path)
      }
      return
    }

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
   * Programa una reconexión automática con backoff exponencial hasta un techo, sin
   * límite de intentos: mientras no se haya cerrado intencionalmente (logout), sigue
   * reintentando para siempre cada RECONNECT_MAX_DELAY_MS como máximo.
   */
  function scheduleReconnect() {
    if (intentionalClose) return

    if (!disconnectWarningShown) {
      disconnectWarningShown = true
      if (estaEnModuloMba3Consultas(route.path)) {
        toast.warning(
          'Notificaciones desconectadas',
          'Se perdió la conexión en tiempo real. Reintentando automáticamente...'
        )
      }
    }

    reconnectAttempts.value++
    const delay = Math.min(RECONNECT_INTERVAL * reconnectAttempts.value, RECONNECT_MAX_DELAY_MS)

    if (import.meta.env.DEV) {
      console.log(
        `📢 [Notificaciones] Reconectando en ${delay / 1000}s (intento ${reconnectAttempts.value})`
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
      void reader.cancel().catch((e: unknown) => {
        const err = e as { name?: string; message?: string }
        const isAbort =
          err?.name === 'AbortError' || err?.message?.toLowerCase?.().includes?.('aborted')

        if (!isAbort && import.meta.env.DEV) {
          console.warn('📢 [Notificaciones] Error al cancelar reader:', e)
        }
      })
      reader = null
    }

    isConnected.value = false

    if (import.meta.env.DEV) {
      console.log('📢 [Notificaciones] Desconectado del stream SSE')
    }
  }

  /**
   * Fuerza una reconexión inmediata (saltándose el timer de backoff) si no estamos
   * conectados. Los navegadores throttlean los setTimeout de pestañas en segundo plano
   * (a veces varios minutos) -- sin esto, una laptop que se durmió o una pestaña
   * minimizada puede tardar mucho más que el backoff normal en reconectar, aun con
   * reintentos infinitos.
   */
  function reconnectAhoraSiNecesario() {
    if (intentionalClose || isConnected.value) return

    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    void connect()
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      reconnectAhoraSiNecesario()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('focus', reconnectAhoraSiNecesario)

  // Cleanup al desmontar el componente
  onUnmounted(() => {
    disconnect()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    window.removeEventListener('focus', reconnectAhoraSiNecesario)
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
