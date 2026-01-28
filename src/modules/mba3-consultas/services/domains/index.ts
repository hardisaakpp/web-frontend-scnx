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

// TODO: Agregar cuando se creen:
// export { homologacionesService } from './homologaciones'
// export { cruceProductosService } from './cruceProductos'
// export { busquedaSkuService } from './busquedaSku'
// export { pedidosService } from './pedidos'
// export { respuestaProveedorService } from './respuestaProveedor'
// export { reportesService } from './reportes'
