/** Acceso al módulo y sidebar: el usuario debe tener exactamente uno de estos en su rol. */
export const ARTICULO_SCANER_ACCESS_PERMISSIONS = ['articuloscaner.view', 'articuloscaner.hide-cost'] as const

/** Solo con este permiso (o rol Admin) se muestra el campo Costo en el modal de detalle. */
export const ARTICULO_SCANER_VIEW_COST_PERMISSION = 'articuloscaner.view'
