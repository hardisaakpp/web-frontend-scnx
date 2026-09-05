/**
 * Traducción PURA de estado_id/nombre de estado de pedido a texto legible y a clase CSS de badge,
 * más la marca "requiere acción" (proveedor) usada para resaltar filas/mostrar el contador.
 *
 * Duplicado hoy en los 4 listados de pedidos del módulo (PedidosListView.vue,
 * CargarPlantillaListadoView.vue, RedistribucionListadoView.vue, RevisarRedistribucionListadoView.vue):
 * cada uno tiene su propia copia local de getEstadoLabel/getEstadoBadgeClass/requiereAccion, idénticas
 * entre sí. Este archivo es la única fuente de verdad para las 3 -- los 4 listados deberían dejar de
 * tener su copia local y usar estas funciones.
 *
 * IMPORTANTE (no negociable): este módulo solo TRADUCE lo que se le pasa. Nunca decide ni filtra qué
 * estados debe ver cada listado -- esa lógica (qué pedidos/estados corresponden a cada rol) sigue
 * siendo responsabilidad exclusiva de cada vista + su propio endpoint/parámetro de backend
 * (solo_produccion_elrayo, solo_redistribucion, etc.). No importar/usar nada de aquí para decidir
 * qué mostrar u ocultar en una consulta al backend.
 */
import { getEstadoPedidoBadgeClass } from './styleHelpers'

/**
 * Texto legible por estado. Mismo mapa (mismas 40 claves, mismos valores) que el `labels` local de
 * los 4 listados -- copiado literal, no reinventado.
 */
const ESTADO_LABELS: Record<string, string> = {
  'BORRADOR': 'Borrador',
  'NUEVO PEDIDO': 'Nuevo Pedido',
  'NUEVO_PEDIDO': 'Nuevo Pedido',
  'GESTIONAR PEDIDO': 'Gestionar Pedido',
  'GESTIONAR_PEDIDO': 'Gestionar Pedido',
  'REDISTRIBUCION': 'Redistribución',
  'PENDIENTE_CONFIRMACION_PROVEEDOR': 'Pendiente Confirmación',
  'RESPUESTA_PROVEEDOR_CARGADA': 'Respuesta Cargada',
  'CONFIRMADO_PROVEEDOR': 'Confirmado Proveedor',
  'CONFIRMADO': 'Confirmado',
  'CONFIRMADO REDISTRIBUCION': 'Confirmado redistribución',
  'REDISTRIBUIDO': 'Redistribuido',
  'PEDIDO_CONFIRMADO': 'Pedido Confirmado',
  'PENDIENTE_LOGISTICA': 'Pendiente Logística',
  'ERROR_DATOS_MAESTROS': 'Error Datos Maestros',
  'PROCESADO_SAP': 'Procesado SAP',
  'ORDEN_COMPRA_CREADA': 'OC Creada',
  'ENVIADA_SAP': 'Enviada SAP',
  'CONFIRMADO_ENVIADO': 'Confirmado y Enviado',
  'CONFIRMADO Y ENVIADO': 'Confirmado y Enviado',
  'CONFIRMADO_Y_ENVIADO': 'Confirmado y Enviado',
  'ENVIADA': 'Confirmado y Enviado',
  'DESPACHAR Y FACTURAR': 'Despachar y Facturar',
  'DESPACHAR_Y_FACTURAR': 'Despachar y Facturar',
  'FINALIZADO': 'Finalizado',
  'CERRADO': 'Cerrado',
  'CANCELADO': 'Cancelado',
  'CANCELADO POR EL RAYO': 'Cancelado por El Rayo',
  'CANCELADO_POR_EL_RAYO': 'Cancelado por El Rayo',
  'CONFIRMADO POR EL RAYO': 'Confirmado por El Rayo',
  'CONFIRMADO_POR_EL_RAYO': 'Confirmado por El Rayo',
  'CONFIRMADO POR PRODUCCION': 'Confirmado por Producción',
  'CONFIRMADO_POR_PRODUCCION': 'Confirmado por Producción',
  'ERROR ENVIO SAP REINTENTO': 'Error envío SAP (reintentar)',
  'ERROR_ENVIO_SAP_REINTENTO': 'Error envío SAP (reintentar)',
  'PRODUCCION POSPUESTA': 'Producción Pospuesta',
  'PRODUCCION_POSPUESTA': 'Producción Pospuesta',
  'RECHAZADO': 'Rechazado',
  'LISTO PARA REDISTRIBUCION': 'Listo para Redistribución',
  'LISTO_PARA_REDISTRIBUCION': 'Listo para Redistribución'
}

/** Devuelve el texto legible de un estado, o el propio valor de `estado` si no está mapeado
 * (mismo fallback que los 4 listados: `labels[estado] || estado`). */
export function getEstadoPedidoLabel(estado: string): string {
  return ESTADO_LABELS[estado] || estado
}

const BADGE_BASE_CLASSES = 'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300'
const BADGE_DARK_OPACITY = 'dark:bg-opacity-30'
/** Clase de color que devuelven los 4 listados (NO styleHelpers, ver nota abajo) cuando el estado
 * no está en el mapa de colores. */
const BADGE_FALLBACK_COLOR = `bg-gray-100 text-gray-800 ${BADGE_DARK_OPACITY} dark:bg-gray-700 dark:text-gray-200`
/** Literal que devuelve getEstadoPedidoBadgeClass (styleHelpers.ts) para un estado sin mapear --
 * se usa solo para detectar ese caso, ver comentario en getEstadoPedidoBadgeClassFull. */
const STYLEHELPERS_FALLBACK_COLOR = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'

/**
 * Clase CSS COMPLETA (base + color) para el badge de estado, lista para bindear directo a
 * `:class` -- reemplazo 1:1 del `getEstadoBadgeClass` local de los 4 listados (mismo string de
 * salida para cualquier estado ya usado en producción).
 *
 * Reutiliza `getEstadoPedidoBadgeClass` de ./styleHelpers.ts para el COLOR en vez de duplicar el
 * mapa de 39 estados una tercera vez: ese archivo ya es la fuente de colores documentada como
 * "debe mantenerse en sync" con las copias locales, y ya la consumen PedidoCabecera.vue,
 * PedidoDetalleView.vue y CargarPlantillaView.vue con el contrato "solo color, el contenedor pone
 * el padding/rounded" -- por eso esta función le añade BADGE_BASE_CLASSES encima, en vez de
 * cambiar ese contrato existente.
 *
 * Único matiz: el fallback de estilo de `getEstadoPedidoBadgeClass` para un estado NO mapeado
 * (`bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200`) no incluye `dark:bg-opacity-30`,
 * mientras que el fallback de los 4 listados sí lo incluye. Para no introducir ese cambio de clase
 * (por mínimo que sea) se detecta ese caso por igualdad de string y se sustituye por el fallback
 * original de los listados -- ver BADGE_FALLBACK_COLOR / STYLEHELPERS_FALLBACK_COLOR arriba.
 */
export function getEstadoPedidoBadgeClassFull(estado: string): string {
  const color = getEstadoPedidoBadgeClass(estado)
  const colorFinal = color === STYLEHELPERS_FALLBACK_COLOR ? BADGE_FALLBACK_COLOR : color
  return `${BADGE_BASE_CLASSES} ${colorFinal}`
}

/** Estados que requieren acción del proveedor -- mismo array literal en los 4 listados. */
export const ESTADOS_QUE_REQUIEREN_ACCION = [
  'PENDIENTE_CONFIRMACION_PROVEEDOR',
  'RESPUESTA_PROVEEDOR_CARGADA',
  'CONFIRMADO_PROVEEDOR'
] as const

/**
 * true si el estado es uno de los que requiere acción del proveedor. Función PURA sobre el string
 * de estado -- no consulta pedidos.value ni ningún otro estado externo. El contador visible en
 * pantalla (`contadorPedidosPendientes`) es simplemente
 * `pedidos.value.filter(p => requiereAccionPedido(p.estado)).length` envuelto en un `computed()`
 * en la vista consumidora -- no amerita su propio composable.
 *
 * Opcional: RevisarRedistribucionListadoView.vue (solo lectura) hoy NO usa requiereAccion ni
 * contadorPedidosPendientes -- no hay nada que forzar aquí, la vista simplemente no la importa.
 */
export function requiereAccionPedido(estado: string): boolean {
  return (ESTADOS_QUE_REQUIEREN_ACCION as readonly string[]).includes(estado)
}

/**
 * Estados que requieren acción específicamente en Cargar Plantilla (Mabel Trading): el pedido ya fue
 * "transaccionado" por otro actor (Producción confirma/pospone, Administración El Rayo envía la ODC
 * a SAP) y vuelve a la cancha de Mabel Trading para una decisión o acción final -- botón
 * Aceptar/Rechazar en Producción Pospuesta, botón Finalizado en Despachar y Facturar (ambos solo en
 * CargarPlantillaView.vue). Distinto de ESTADOS_QUE_REQUIEREN_ACCION (estados de respuesta del
 * proveedor): ese flujo de aprobación quedó sin conectar a ningún endpoint
 * (PedidoAjusteService.procesar_confirmacion_proveedor huérfano en el backend), así que
 * CONFIRMADO_PROVEEDOR nunca se alcanza en la práctica y no se incluye aquí.
 */
export const ESTADOS_QUE_REQUIEREN_ACCION_CARGAR_PLANTILLA = [
  'PRODUCCION_POSPUESTA',
  'PRODUCCION POSPUESTA',
  'DESPACHAR_Y_FACTURAR',
  'DESPACHAR Y FACTURAR'
] as const

/** true si el estado es uno de los que requiere acción de Mabel Trading en Cargar Plantilla. */
export function requiereAccionPedidoCargarPlantilla(estado: string): boolean {
  return (ESTADOS_QUE_REQUIEREN_ACCION_CARGAR_PLANTILLA as readonly string[]).includes(estado)
}

/**
 * Estados que requieren acción del usuario odcsap.view en el listado de Pedidos (EL RAYO,
 * PedidosListView.vue): el pedido ya fue confirmado por Producción o enviado a SAP y vuelve a la
 * cancha de Administración El Rayo para revisar/continuar el flujo. Distinto de
 * ESTADOS_QUE_REQUIEREN_ACCION (estados de respuesta del proveedor): esos tres quedaron huérfanos y
 * ya fueron desactivados en el backend (ids 5, 6 y el legado sin id propio de
 * PENDIENTE_CONFIRMACION_PROVEEDOR -- ver migraciones 654/655/656 en mba3-consultas), así que ningún
 * pedido real cae nunca en ellos; no se reutiliza ese array aquí a propósito, para no arrastrar esa
 * condición muerta a este listado ni afectar a RedistribucionListadoView.vue (que sí sigue usando
 * ESTADOS_QUE_REQUIEREN_ACCION para su propio resaltado).
 */
export const ESTADOS_QUE_REQUIEREN_ACCION_PEDIDOS = [
  'CONFIRMADO POR PRODUCCION',
  'CONFIRMADO_POR_PRODUCCION',
  'CONFIRMADO_ENVIADO'
] as const

/** true si el estado es uno de los que requiere acción del usuario odcsap.view en el listado de Pedidos. */
export function requiereAccionPedidoListado(estado: string): boolean {
  return (ESTADOS_QUE_REQUIEREN_ACCION_PEDIDOS as readonly string[]).includes(estado)
}
