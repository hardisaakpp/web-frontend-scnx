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
    
    // Es una fecha válida, formatearla (timeZone: 'UTC' evita desfase de -1 día
    // porque new Date("2026-02-09") se parsea como medianoche UTC y sin esto
    // toLocaleDateString lo convierte a hora local restando horas)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'UTC'
    })
  } catch {
    // Si falla el parseo, retornar el valor original
    return trimmedValue
  }
}

/**
 * Formatea una fecha+hora (DATETIME) para mostrar fecha y hora.
 * Ideal para campos como creado_en que son timestamps del sistema.
 */
export function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'N/A'

  try {
    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
      return dateString.trim()
    }

    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString.trim()
  }
}

/**
 * Formatea un número con separadores de miles.
 * Usa hasta 4 decimales cuando el valor tiene parte decimal (p. ej. 0.5 → "0,5"), para redistribución y totales.
 */
export function formatNumber(value: number | null | undefined): string {
  // Distinguir explícitamente entre 0 y null/undefined
  if (value === null || value === undefined) return 'N/A'
  // El valor 0 es válido y debe mostrarse como "0"
  const hasDecimals = value % 1 !== 0
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: hasDecimals ? 1 : 0,
    maximumFractionDigits: 4
  }).format(value)
}

/**
 * Formatea un número con un número fijo de decimales (0 a 4).
 * Útil para la vista de redistribución cuando el usuario quiere aumentar o disminuir decimales visibles.
 */
export function formatNumberWithDecimals(value: number | null | undefined, decimals: number): string {
  if (value === null || value === undefined) return 'N/A'
  const d = Math.max(0, Math.min(4, Math.round(decimals)))
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: d,
    maximumFractionDigits: d
  }).format(value)
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
    'BORRADOR': 'Borrador',
    'NUEVO PEDIDO': 'Nuevo Pedido',
    'NUEVO_PEDIDO': 'Nuevo Pedido',
    'GESTIONAR PEDIDO': 'Gestionar Pedido',
    'GESTIONAR_PEDIDO': 'Gestionar Pedido',
    'REDISTRIBUCION': 'Redistribución',
    'PENDIENTE_CONFIRMACION_PROVEEDOR': 'Pendiente Confirmación',
    'RESPUESTA_PROVEEDOR_CARGADA': 'Respuesta Cargada',
    'CONFIRMADO_PROVEEDOR': 'Confirmado por Proveedor',
    'CONFIRMADO': 'Confirmado',
    'CONFIRMADO REDISTRIBUCION': 'Confirmado redistribución',
    'PEDIDO_CONFIRMADO': 'Pedido Confirmado',
    'PROCESADO_SAP': 'Procesado SAP',
    'CONFIRMADO_ENVIADO': 'Confirmado y Enviado',
    'CONFIRMADO Y ENVIADO': 'Confirmado y Enviado',
    'CONFIRMADO_Y_ENVIADO': 'Confirmado y Enviado',
    'ENVIADA': 'Confirmado y Enviado',
    'DESPACHAR Y FACTURAR': 'Despachar y Facturar',
    'DESPACHAR_Y_FACTURAR': 'Despachar y Facturar',
    'FINALIZADO': 'Finalizado',
    'ORDEN_COMPRA_CREADA': 'OC Creada',
    'ENVIADA_SAP': 'Enviada SAP',
    'CERRADO': 'Cerrado',
    'CANCELADO': 'Cancelado',
    'CANCELADO POR EL RAYO': 'Cancelado por El Rayo',
    'CANCELADO_POR_EL_RAYO': 'Cancelado por El Rayo',
    'CONFIRMADO POR EL RAYO': 'Confirmado por El Rayo',
    'CONFIRMADO_POR_EL_RAYO': 'Confirmado por El Rayo'
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
