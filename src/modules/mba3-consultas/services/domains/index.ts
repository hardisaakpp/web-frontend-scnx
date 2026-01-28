/**
 * Exportaciones de todos los servicios de dominio
 * 
 * Este archivo agrupa todos los servicios organizados por dominio
 * para facilitar su uso desde el archivo principal.
 */

// Servicios básicos
export { healthService } from './health'
export { migracionService } from './migracion'

// Servicios de datos
export { despachosService } from './despachos'
export { ordenesCompraService } from './ordenesCompra'
export { remisionesService } from './remisiones'

// Servicios de procesamiento
export { procesamientoService } from './procesamiento'

// Servicios de homologaciones y cruce
export { homologacionesService } from './homologaciones'
export { cruceProductosService } from './cruceProductos'
export { busquedaSkuService } from './busquedaSku'

// Servicios de pedidos y respuestas
export { respuestaProveedorService } from './respuestaProveedor'

// Servicios de reportes
export { reportesService } from './reportes'

// Servicios de pedidos (dominio completo)
export { pedidosService } from './pedidos'
