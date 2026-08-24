/**
 * Utilidades para generar clases CSS según estados y condiciones
 */

const badgeDark = 'dark:bg-opacity-30'

/**
 * Retorna las clases CSS para el badge de estado de respuesta del proveedor (solo color; el contenedor puede añadir padding/rounded)
 */
export function getEstadoBadgeClass(estado: string): string {
  const classes: Record<string, string> = {
    'PENDIENTE_REVISION': `bg-amber-100 text-amber-800 ${badgeDark} dark:bg-amber-900/50 dark:text-amber-200`,
    'APROBADA': `bg-emerald-100 text-emerald-800 ${badgeDark} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'RECHAZADA': `bg-rose-100 text-rose-800 ${badgeDark} dark:bg-rose-900/50 dark:text-rose-200`
  }
  return classes[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}

/**
 * Retorna las clases CSS para el badge de estado del pedido (un color distintivo por estado).
 *
 * Paleta por rol (permiso que produce el estado, ver docs/requeriments/
 * PYTD002_ODC-MABEL-RAYO_SEGUIMIENTO.md): mabel.view = verde/esmeralda/teal/lima
 * (BORRADOR → ... → CONFIRMADO_ENVIADO); produccion-elrayo.view = ámbar (calza el
 * botón "Confirmar Producción", bg-amber-600); odcsap.view = púrpura (calza los
 * botones "Confirmar" y "Despachar y Facturar", bg-purple-600 — incluye
 * PRODUCCION_POSPUESTA, generado por la opción "Confirmar pedido, generar nuevo
 * pedido con la diferencia" del mismo botón "Confirmar", ver POST
 * /confirmar-con-diferencia); Cancelado/Rechazado = rojo/rosa, cruza roles;
 * estados ERROR_* = escala 'vermilion' (rojo/naranja, ver tailwind.config.js), para
 * alertar sin confundirse con Cancelado/Rechazado (rojo puro) ni con éxito/pendiente
 * (verde/lima/ámbar).
 * Debe mantenerse en sync con getEstadoBadgeClass en PedidosListView.vue,
 * CargarPlantillaListadoView.vue, RedistribucionListadoView.vue y
 * RevisarRedistribucionListadoView.vue (mismos estados, misma paleta).
 */
export function getEstadoPedidoBadgeClass(estado: string | undefined): string {
  if (!estado) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  const classes: Record<string, string> = {
    'BORRADOR': `bg-emerald-50 text-emerald-700 ${badgeDark} dark:bg-emerald-950/40 dark:text-emerald-300`,
    'NUEVO PEDIDO': `bg-green-100 text-green-800 ${badgeDark} dark:bg-green-900/50 dark:text-green-200`,
    'NUEVO_PEDIDO': `bg-green-100 text-green-800 ${badgeDark} dark:bg-green-900/50 dark:text-green-200`,
    'GESTIONAR PEDIDO': `bg-amber-100 text-amber-800 ${badgeDark} dark:bg-amber-900/50 dark:text-amber-200`,
    'GESTIONAR_PEDIDO': `bg-amber-100 text-amber-800 ${badgeDark} dark:bg-amber-900/50 dark:text-amber-200`,
    'REDISTRIBUCION': `bg-purple-100 text-purple-800 ${badgeDark} dark:bg-purple-900/50 dark:text-purple-200`,
    'PENDIENTE_CONFIRMACION_PROVEEDOR': `bg-yellow-100 text-yellow-800 ${badgeDark} dark:bg-yellow-900/50 dark:text-yellow-200`,
    'RESPUESTA_PROVEEDOR_CARGADA': `bg-blue-100 text-blue-800 ${badgeDark} dark:bg-blue-900/50 dark:text-blue-200`,
    'CONFIRMADO_PROVEEDOR': `bg-green-100 text-green-800 ${badgeDark} dark:bg-green-900/50 dark:text-green-200`,
    'CONFIRMADO': `bg-green-100 text-green-800 ${badgeDark} dark:bg-green-900/50 dark:text-green-200`,
    'CONFIRMADO REDISTRIBUCION': `bg-teal-100 text-teal-800 ${badgeDark} dark:bg-teal-900/50 dark:text-teal-200`,
    'REDISTRIBUIDO': `bg-teal-100 text-teal-800 ${badgeDark} dark:bg-teal-900/50 dark:text-teal-200`,
    'PEDIDO_CONFIRMADO': `bg-teal-200 text-teal-900 ${badgeDark} dark:bg-teal-900/60 dark:text-teal-100`,
    'PENDIENTE_LOGISTICA': `bg-lime-100 text-lime-800 ${badgeDark} dark:bg-lime-900/50 dark:text-lime-200`,
    'ERROR_DATOS_MAESTROS': `bg-vermilion-100 text-vermilion-800 ${badgeDark} dark:bg-vermilion-900/50 dark:text-vermilion-200`,
    'PROCESADO_SAP': `bg-indigo-100 text-indigo-800 ${badgeDark} dark:bg-indigo-900/50 dark:text-indigo-200`,
    'CONFIRMADO_ENVIADO': `bg-emerald-100 text-emerald-800 ${badgeDark} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'CONFIRMADO Y ENVIADO': `bg-emerald-100 text-emerald-800 ${badgeDark} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'CONFIRMADO_Y_ENVIADO': `bg-emerald-100 text-emerald-800 ${badgeDark} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'Confirmado y Enviado': `bg-emerald-100 text-emerald-800 ${badgeDark} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'ENVIADA': `bg-emerald-100 text-emerald-800 ${badgeDark} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'DESPACHAR Y FACTURAR': `bg-purple-200 text-purple-900 ${badgeDark} dark:bg-purple-900/60 dark:text-purple-100`,
    'DESPACHAR_Y_FACTURAR': `bg-purple-200 text-purple-900 ${badgeDark} dark:bg-purple-900/60 dark:text-purple-100`,
    'FINALIZADO': `bg-green-300 text-green-900 ${badgeDark} dark:bg-green-900/70 dark:text-green-100`,
    'ORDEN_COMPRA_CREADA': `bg-fuchsia-100 text-fuchsia-800 ${badgeDark} dark:bg-fuchsia-900/50 dark:text-fuchsia-200`,
    'ENVIADA_SAP': `bg-purple-100 text-purple-800 ${badgeDark} dark:bg-purple-900/50 dark:text-purple-200`,
    'CERRADO': `bg-stone-100 text-stone-700 ${badgeDark} dark:bg-stone-600 dark:text-stone-200`,
    'CANCELADO': `bg-rose-100 text-rose-800 ${badgeDark} dark:bg-rose-900/50 dark:text-rose-200`,
    'CANCELADO POR EL RAYO': `bg-red-200 text-red-900 ${badgeDark} dark:bg-red-900/70 dark:text-red-100`,
    'CANCELADO_POR_EL_RAYO': `bg-red-200 text-red-900 ${badgeDark} dark:bg-red-900/70 dark:text-red-100`,
    'CONFIRMADO POR EL RAYO': `bg-purple-100 text-purple-800 ${badgeDark} dark:bg-purple-900/50 dark:text-purple-200`,
    'CONFIRMADO_POR_EL_RAYO': `bg-purple-100 text-purple-800 ${badgeDark} dark:bg-purple-900/50 dark:text-purple-200`,
    'CONFIRMADO POR PRODUCCION': `bg-amber-300 text-amber-900 ${badgeDark} dark:bg-amber-900/70 dark:text-amber-100`,
    'CONFIRMADO_POR_PRODUCCION': `bg-amber-300 text-amber-900 ${badgeDark} dark:bg-amber-900/70 dark:text-amber-100`,
    'ERROR ENVIO SAP REINTENTO': `bg-vermilion-100 text-vermilion-800 ${badgeDark} dark:bg-vermilion-900/50 dark:text-vermilion-200`,
    'ERROR_ENVIO_SAP_REINTENTO': `bg-vermilion-100 text-vermilion-800 ${badgeDark} dark:bg-vermilion-900/50 dark:text-vermilion-200`,
    'PRODUCCION POSPUESTA': `bg-purple-200 text-purple-900 ${badgeDark} dark:bg-purple-900/60 dark:text-purple-100`,
    'PRODUCCION_POSPUESTA': `bg-purple-200 text-purple-900 ${badgeDark} dark:bg-purple-900/60 dark:text-purple-100`,
    'RECHAZADO': `bg-red-100 text-red-800 ${badgeDark} dark:bg-red-900/50 dark:text-red-200`,
    // Excepción deliberada: no es un estado producido por odcsap.view, pero en el
    // listado de pedidos para redistribución conviven con 'CONFIRMADO_POR_EL_RAYO'
    // (también púrpura). Compartir la familia de color deja ambos a simple vista
    // como los pedidos listos para avanzar, para que el usuario sepa con confianza
    // cuáles puede seleccionar y enviar a SAP.
    'LISTO PARA REDISTRIBUCION': `bg-purple-200 text-purple-900 ${badgeDark} dark:bg-purple-900/60 dark:text-purple-100`,
    'LISTO_PARA_REDISTRIBUCION': `bg-purple-200 text-purple-900 ${badgeDark} dark:bg-purple-900/60 dark:text-purple-100`
  }
  return classes[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
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
 * Retorna las clases CSS para diferencia de redistribución.
 * Rojo cuando diferencia !== 0 (ya sea positivo o negativo); verde cuando es 0 (completo).
 */
export function getDiferenciaClass(diferencia: number): string {
  if (diferencia !== 0) return 'text-red-600 dark:text-red-400 font-medium' // Falta (negativo) o excede (positivo)
  return 'text-green-600 dark:text-green-400' // Completo (diferencia === 0)
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

/**
 * Determina si un nombre de proveedor corresponde a El Rayo
 */
export function esProveedorElRayo(proveedorNombre: string | null | undefined): boolean {
  if (!proveedorNombre) return false
  const nombreUpper = proveedorNombre.toUpperCase()
  return nombreUpper.includes('EL RAYO') || nombreUpper.includes('RAYO')
}
