/**
 * Utilidades de logging para desarrollo
 * 
 * Proporciona funciones de logging que se eliminan automáticamente en producción
 * mediante esbuild (ver vite.config.ts)
 */

/**
 * Log de debug (solo visible en desarrollo)
 */
export function debugLog(label: string, data?: any) {
  if (import.meta.env.DEV) {
    if (data !== undefined) {
      console.debug(`[${label}]`, data)
    } else {
      console.debug(label)
    }
  }
}

/**
 * Log de info (solo visible en desarrollo)
 */
export function infoLog(label: string, data?: any) {
  if (import.meta.env.DEV) {
    if (data !== undefined) {
      console.info(`[${label}]`, data)
    } else {
      console.info(label)
    }
  }
}

/**
 * Log de warning (solo visible en desarrollo)
 */
export function warnLog(label: string, data?: any) {
  if (import.meta.env.DEV) {
    if (data !== undefined) {
      console.warn(`[${label}]`, data)
    } else {
      console.warn(label)
    }
  }
}

/**
 * Log de error (SIEMPRE visible, incluso en producción)
 * Usé solo para errores que deben reportarse
 */
export function errorLog(label: string, error: any) {
  console.error(`[${label}]`, error)
}
