/** Flujo de caja: consulta por cédula y registro de entrega. */
export const PROMOCION_SOBRES_OPERATE_PERMISSION = 'promocion.sobres.operate' as const

/** Botón "Monitorear resultados" y pantalla /promocion-sobres/monitoreo (asignar en Core). */
export const PROMOCION_SOBRES_MONITOREO_VIEW_PERMISSION = 'boton-monitorear.view' as const

export const PROMOCION_SOBRES_OPERATE_PERMISSIONS = [PROMOCION_SOBRES_OPERATE_PERMISSION] as const

export const PROMOCION_SOBRES_MONITOREO_PERMISSIONS = [
  PROMOCION_SOBRES_MONITOREO_VIEW_PERMISSION
] as const

export function normalizePermission(value: string): string {
  return value.trim().toLowerCase()
}

export function hasPromocionSobresOperatePermission(permissions: readonly string[]): boolean {
  return permissions.some(
    (p) => normalizePermission(p) === PROMOCION_SOBRES_OPERATE_PERMISSION
  )
}

export function hasPromocionSobresMonitoreoViewPermission(permissions: readonly string[]): boolean {
  return permissions.some(
    (p) => normalizePermission(p) === PROMOCION_SOBRES_MONITOREO_VIEW_PERMISSION
  )
}

/** Sidebar y visibilidad general del módulo. */
export function hasPromocionSobresUiPermission(permissions: readonly string[]): boolean {
  return permissions.some((p) => {
    const n = normalizePermission(p)
    return (
      n === PROMOCION_SOBRES_OPERATE_PERMISSION ||
      n === PROMOCION_SOBRES_MONITOREO_VIEW_PERMISSION ||
      n.startsWith('promocion.sobres.')
    )
  })
}

/** Primera ruta del módulo según permisos del usuario. */
export function promocionSobresDefaultPath(permissions: readonly string[]): string {
  if (hasPromocionSobresOperatePermission(permissions)) {
    return '/promocion-sobres/entrega'
  }
  if (hasPromocionSobresMonitoreoViewPermission(permissions)) {
    return '/promocion-sobres/monitoreo'
  }
  return '/promocion-sobres/entrega'
}
