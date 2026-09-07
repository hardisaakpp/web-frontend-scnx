/**
 * Permisos del módulo Integraciones (soporte de integraciones SAP / HITELL).
 *
 * Deben existir con la misma clave en SCNexus Core (catálogo `Permissions`) y estar asignados
 * a los roles de soporte; ver docs/MODULO_INTEGRACIONES.md.
 */
export const INTEGRACIONES_PERMISSIONS = {
  /** Ver las tres pestañas: HITELL, Cola SAP y Bitácora. */
  view: 'integraciones.view',
  /** Disparar la reintegración de un documento rechazado por HITELL. */
  hitellRetry: 'integraciones.hitell.retry',
} as const

export const INTEGRACIONES_VIEW_PERMISSIONS: string[] = [INTEGRACIONES_PERMISSIONS.view]
