/**
 * Utilidades de formateo para el módulo MBA3 Consultas
 */

/**
 * Formatea una fecha o maneja valores especiales como "INMEDIATO"
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  
  // Manejar valores especiales que no son fechas (ej: "INMEDIATO", "INMEDIATA", etc.)
  const trimmedValue = dateString.trim()
  const upperValue = trimmedValue.toUpperCase()
  const valoresEspeciales = ['INMEDIATO', 'INMEDIATA', 'IMMEDIATE', 'URGENTE', 'URGENT', 'ASAP']
  
  if (valoresEspeciales.includes(upperValue)) {
    // Retornar el valor original preservando mayúsculas/minúsculas del backend
    return trimmedValue
  }
  
  // Intentar parsear como fecha
  try {
    const date = new Date(dateString)
    
    // Verificar que sea una fecha válida
    if (isNaN(date.getTime())) {
      // No es una fecha válida, retornar el valor original
      return trimmedValue
    }
    
    // Es una fecha válida, formatearla
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    // Si falla el parseo, retornar el valor original
    return trimmedValue
  }
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(value: number | null | undefined): string {
  // Distinguir explícitamente entre 0 y null/undefined
  if (value === null || value === undefined) return 'N/A'
  // El valor 0 es válido y debe mostrarse como "0"
  return new Intl.NumberFormat('es-ES').format(value)
}

/**
 * Formatea un número como moneda USD
 */
export function formatCurrency(value: number | null | undefined): string {
  // Distinguir explícitamente entre 0 y null/undefined
  if (value === null || value === undefined) return 'N/A'
  // El valor 0 es válido y debe mostrarse como "$0.00"
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

/**
 * Formatea un valor como porcentaje.
 * 
 * Detecta automáticamente si el valor ya viene como porcentaje (>= 1) o como decimal (< 1).
 * 
 * Ejemplos:
 * - formatPorcentaje(114.29) → "114.29%" (ya viene como porcentaje)
 * - formatPorcentaje(0.1429) → "14.29%" (viene como decimal)
 * - formatPorcentaje(20) → "20.00%" (ya viene como porcentaje)
 * - formatPorcentaje(0.2) → "20.00%" (viene como decimal)
 */
export function formatPorcentaje(value: number): string {
  // Si el valor es >= 1, asumimos que ya viene como porcentaje (ej: 114.29, 20)
  // Si el valor es < 1, asumimos que viene como decimal (ej: 0.1429, 0.2)
  const percentageValue = value >= 1 ? value : value * 100
  return `${percentageValue.toFixed(2)}%`
}

/**
 * Formatea el estado del pedido a texto legible
 */
export function formatEstadoPedido(estado: string | undefined): string {
  if (!estado) return 'Sin estado'
  const estados: Record<string, string> = {
    'PENDIENTE_CONFIRMACION_PROVEEDOR': 'Pendiente Confirmación',
    'RESPUESTA_PROVEEDOR_CARGADA': 'Respuesta Cargada',
    'CONFIRMADO_PROVEEDOR': 'Confirmado por Proveedor',
    'PEDIDO_CONFIRMADO': 'Pedido Confirmado',
    'PROCESADO_SAP': 'Procesado SAP',
    'CONFIRMADO_ENVIADO': 'Confirmado y Enviado'
  }
  return estados[estado] || estado
}

/**
 * Formatea un error (string o objeto) a texto legible
 */
export function formatError(error: string | { tipo?: string; campo?: string; mensaje: string; producto?: string }): string {
  if (typeof error === 'string') {
    return error
  }
  
  let formatted = error.mensaje
  if (error.producto) {
    formatted = `[${error.producto}] ${formatted}`
  }
  if (error.campo) {
    formatted = `${error.campo}: ${formatted}`
  }
  if (error.tipo) {
    formatted = `${error.tipo === 'ERROR' ? '❌' : '⚠️'} ${formatted}`
  }
  return formatted
}

/**
 * Interfaz para configuración de columnas
 */
export interface ColumnConfig {
  key: string
  label: string
  visible: boolean
  align?: 'left' | 'right' | 'center'
  format?: 'text' | 'number' | 'currency'
  fixed?: boolean // Si es true, la columna no puede ser ocultada ni arrastrada
}

/**
 * Formatea el valor de una columna según su tipo
 */
export function formatColumnValue(detalle: any, column: ColumnConfig, index?: number): string {
  // La columna 'numero' se maneja especialmente con el índice
  if (column.key === 'numero' && index !== undefined) {
    return (index + 1).toString()
  }
  
  const value = detalle[column.key]
  
  // Manejar valores null/undefined (pero NO 0)
  // El valor 0 es válido y debe mostrarse formateado
  if (value === null || value === undefined) {
    // Para columnas numéricas, mostrar guión en lugar de N/A para mejor UX
    if (column.key === 'bodega') return '-'
    // Para columnas de costo y total, también mostrar 0 si están explícitamente en 0
    if (column.key === 'costo_doc_sin_iva' || column.key === 'total' || column.format === 'currency' || column.format === 'number') {
      return 'N/A'
    }
    return 'N/A'
  }
  
  // Formatear descuentos como porcentaje
  if (column.key === 'descuento_1' || column.key.includes('descuento')) {
    return formatPorcentaje(value)
  }
  
  // Formatear según el tipo
  // Nota: El valor 0 pasará por aquí y se formateará correctamente
  switch (column.format) {
    case 'currency':
      return formatCurrency(value)
    case 'number':
      return formatNumber(value)
    case 'text':
    default:
      return value.toString()
  }
}

/**
 * Calcula el total de cantidad de tiendas
 */
export function getTotalCantidad(tiendas: any[]): number {
  return tiendas.reduce((sum, t) => sum + (t.cantidad || 0), 0)
}
