/**
 * Utilidades para la funcionalidad de redistribución de tiendas
 */

/**
 * Interfaz para producto de redistribución
 */
export interface ProductoRedistribucion {
  codigo_producto: string
  descripcion: string
  cantidad_solicitada: number
  cantidad_confirmada: number
  cantidad_distribuida: number
  diferencia: number
  costo_unitario: number | null
  distribucion_tiendas: DistribucionTiendaEditada[]
  expandido: boolean
  error?: string
}

/**
 * Interfaz para distribución de tienda editada
 */
export interface DistribucionTiendaEditada {
  tienda_codigo: string
  tienda_nombre: string
  cantidad_original: number
  cantidad_asignada: number
  diferencia: number
}

/**
 * Calcula el porcentaje de progreso de redistribución (0-100)
 */
export function getProgresoPorcentaje(producto: ProductoRedistribucion): number {
  if (producto.cantidad_confirmada === 0) return 0
  const porcentaje = (producto.cantidad_distribuida / producto.cantidad_confirmada) * 100
  // Limitar entre 0 y 100 para la barra visual (si excede, mostrar 100 pero con color rojo)
  return Math.min(Math.max(porcentaje, 0), 100)
}

/**
 * Retorna las clases CSS para la barra de progreso según el estado de redistribución
 */
export function getProgresoBarClass(producto: ProductoRedistribucion): string {
  if (producto.diferencia === 0) {
    return 'bg-green-500 dark:bg-green-600' // Completo
  } else if (producto.diferencia < 0) {
    return 'bg-yellow-500 dark:bg-yellow-600' // Falta distribuir
  } else {
    return 'bg-red-500 dark:bg-red-600' // Excede
  }
}

/**
 * Retorna las clases CSS para el texto de progreso según el estado de redistribución
 */
export function getProgresoTextClass(producto: ProductoRedistribucion): string {
  if (producto.diferencia === 0) {
    return 'text-green-600 dark:text-green-400'
  } else if (producto.diferencia < 0) {
    return 'text-yellow-600 dark:text-yellow-400'
  } else {
    return 'text-red-600 dark:text-red-400'
  }
}

/**
 * Genera un mensaje de validación para la redistribución basado en el estado de los productos
 */
export function getMensajeValidacionRedistribucion(productos: ProductoRedistribucion[]): string {
  const productosIncompletos = productos.filter(p => p.diferencia !== 0)
  const productosConError = productos.filter(p => p.error)
  
  if (productosConError.length > 0) {
    return `${productosConError.length} producto(s) con errores. Revise las cantidades.`
  }
  
  if (productosIncompletos.length > 0) {
    const falta = productosIncompletos.filter(p => p.diferencia < 0).length
    const excede = productosIncompletos.filter(p => p.diferencia > 0).length
    
    if (falta > 0 && excede > 0) {
      return `${falta} producto(s) faltan distribuir, ${excede} producto(s) exceden el total.`
    } else if (falta > 0) {
      return `${falta} producto(s) faltan distribuir completamente.`
    } else {
      return `${excede} producto(s) exceden el total confirmado.`
    }
  }
  
  return 'Complete la redistribución correctamente para habilitar la confirmación'
}
