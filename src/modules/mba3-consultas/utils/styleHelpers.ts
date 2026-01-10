/**
 * Utilidades para generar clases CSS según estados y condiciones
 */

/**
 * Retorna las clases CSS para el badge de estado de respuesta del proveedor
 */
export function getEstadoBadgeClass(estado: string): string {
  const classes: Record<string, string> = {
    'PENDIENTE_REVISION': 'bg-yellow-100 text-yellow-800',
    'APROBADA': 'bg-green-100 text-green-800',
    'RECHAZADA': 'bg-red-100 text-red-800'
  }
  return classes[estado] || 'bg-gray-100 text-gray-800'
}

/**
 * Retorna las clases CSS para el badge de estado del pedido
 */
export function getEstadoPedidoBadgeClass(estado: string): string {
  const classes: Record<string, string> = {
    'PENDIENTE_CONFIRMACION_PROVEEDOR': 'bg-yellow-100 text-yellow-800',
    'RESPUESTA_PROVEEDOR_CARGADA': 'bg-blue-100 text-blue-800',
    'CONFIRMADO_PROVEEDOR': 'bg-green-100 text-green-800',
    'CONFIRMADO_ENVIADO': 'bg-emerald-100 text-emerald-800'
  }
  return classes[estado] || 'bg-gray-100 text-gray-800'
}

/**
 * Retorna las clases CSS para cantidad según porcentaje de confirmación
 */
export function getCantidadClass(solicitada: number, confirmada: number): string {
  const porcentaje = solicitada > 0 ? (confirmada / solicitada) * 100 : 0
  if (porcentaje < 80) return 'text-red-600 font-medium'
  if (porcentaje < 100) return 'text-yellow-600'
  return 'text-green-600'
}

/**
 * Retorna las clases CSS para precio según variación
 */
export function getPrecioClass(original: number | null, ajustado: number | null): string {
  if (!original || !ajustado) return 'text-gray-900'
  const aumento = ((ajustado - original) / original) * 100
  if (aumento > 10) return 'text-red-600 font-medium'
  if (aumento > 0) return 'text-yellow-600'
  if (aumento < 0) return 'text-green-600'
  return 'text-gray-900'
}

/**
 * Retorna las clases CSS para diferencia de redistribución
 */
export function getDiferenciaClass(diferencia: number): string {
  if (diferencia < 0) return 'text-yellow-600 dark:text-yellow-400 font-medium' // Falta distribuir
  if (diferencia > 0) return 'text-red-600 dark:text-red-400 font-medium' // Excede
  return 'text-green-600 dark:text-green-400' // Completo
}

/**
 * Retorna las clases CSS para porcentaje
 */
export function getPorcentajeClass(porcentaje: number): string {
  if (porcentaje < 80) return 'text-red-600 font-medium'
  if (porcentaje < 100) return 'text-yellow-600'
  return 'text-green-600'
}

/**
 * Retorna las clases CSS para diferencia de porcentaje
 */
export function getPorcentajeDiferenciaClass(porcentaje: number): string {
  if (porcentaje < -10) return 'text-red-600 font-medium'
  if (porcentaje < 0) return 'text-orange-600'
  if (porcentaje > 0) return 'text-green-600'
  return 'text-gray-900'
}
