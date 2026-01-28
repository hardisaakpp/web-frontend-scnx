/**
 * Plugin global de manejo de errores
 * 
 * Centraliza el registro y manejo de excepciones en toda la aplicación.
 * En desarrollo: muestra logs detallados en consola
 * En producción: envía errores a servicio de monitoreo (Sentry, LogRocket, etc.)
 */

import type { App, ComponentPublicInstance } from 'vue'

export interface ErrorContext {
  error: unknown
  component?: ComponentPublicInstance | null
  info: string
  timestamp: string
  environment: 'development' | 'production'
  url: string
}

/**
 * Registra un error de forma centralizada
 */
function logError(context: ErrorContext) {
  const isDev = context.environment === 'development'

  if (isDev) {
    console.group('🔴 Global Error Handler')
    console.error('Error:', context.error)
    console.info('Component:', context.component?.$options.name || 'Unknown')
    console.info('Info:', context.info)
    console.info('URL:', context.url)
    console.info('Timestamp:', context.timestamp)
    console.groupEnd()
  } else {
    // En producción, enviar a servicio de monitoreo
    // Ejemplo con Sentry (descomenta si lo necesitas):
    // if (window.Sentry) {
    //   window.Sentry.captureException(context.error, {
    //     contexts: {
    //       vue: {
    //         component: context.component?.$options.name,
    //         info: context.info,
    //       },
    //     },
    //   })
    // }
  }
}

/**
 * Configura el manejador global de errores
 */
export function setupErrorHandler(app: App) {
  const isDev = import.meta.env.DEV

  // Manejador de errores no capturados
  app.config.errorHandler = (err, instance, info) => {
    logError({
      error: err,
      component: instance,
      info,
      timestamp: new Date().toISOString(),
      environment: isDev ? 'development' : 'production',
      url: window.location.href,
    })
  }

  // Manejador de warnings de Vue
  app.config.warnHandler = (msg, instance, trace) => {
    if (isDev) {
      console.group('⚠️ Vue Warning')
      console.warn(msg)
      console.info('Component:', instance?.$options.name || 'Unknown')
      console.info('Trace:', trace)
      console.groupEnd()
    }
  }

  // Manejador de promesas rechazadas no capturadas
  window.addEventListener('unhandledrejection', (event) => {
    logError({
      error: event.reason,
      info: 'Unhandled Promise Rejection',
      timestamp: new Date().toISOString(),
      environment: isDev ? 'development' : 'production',
      url: window.location.href,
    })
  })

  // Manejador de errores de red no capturados
  window.addEventListener('error', (event) => {
    if (event.message === 'Script error.' && !event.filename) {
      // Ignorar errores de scripts de terceros sin detalles
      return
    }

    logError({
      error: event.error || event.message,
      info: `Script Error at ${event.filename}:${event.lineno}:${event.colno}`,
      timestamp: new Date().toISOString(),
      environment: isDev ? 'development' : 'production',
      url: window.location.href,
    })
  })
}

/**
 * Hook para usar en componentes si necesitan capturar errores específicos
 */
export function useErrorHandler() {
  const captureError = (error: unknown, context: string) => {
    logError({
      error,
      info: context,
      timestamp: new Date().toISOString(),
      environment: import.meta.env.DEV ? 'development' : 'production',
      url: window.location.href,
    })
  }

  return { captureError }
}
