import type { ErrorStockInsuficiente, StockFaltante } from '../types'

/**
 * Detecta si un 400 corresponde a stock insuficiente (RN-22).
 * Se decide por la PRESENCIA del array "faltantes", no por el texto del mensaje:
 * los demás 400 de esos endpoints solo traen { error }.
 */
export function esErrorStockInsuficiente(data: any): data is ErrorStockInsuficiente {
  return !!data && Array.isArray(data.faltantes) && data.faltantes.length > 0
}

/** Normaliza cualquier error de axios a { mensaje, faltantes? }. */
export function parsearErrorSolicitud(e: any): { mensaje: string; faltantes?: StockFaltante[] } {
  const data = e?.response?.data
  if (esErrorStockInsuficiente(data)) {
    return { mensaje: data.error, faltantes: data.faltantes }
  }
  const mensaje = data?.error ?? data?.mensaje ?? 'Ocurrió un error inesperado.'
  return { mensaje }
}
