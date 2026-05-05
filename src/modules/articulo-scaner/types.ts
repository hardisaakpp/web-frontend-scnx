export interface WarehouseDto {
  code: string
  name: string
}

/** POST /api/v1/scan/resolve — alineado a contrato v1 */
export interface ScanResolveRequest {
  warehouseCode: string
  code: string
  /** Origen de la lectura; opcional si el backend lo tolera */
  source?: 'manual' | 'scanner'
}

export interface ArticleDetailDto {
  code: string
  barcode?: string | null
  description: string
  brand?: string | null
  category?: string | null
  stock?: number | null
  lastSaleDate?: string | null
  unitPrice?: number | null
  currency?: string | null
  pricing?: {
    avgPrice?: number | null
    price?: number | null
    margin?: number | null
  } | null
  /** Si el backend envía ventas / precios detallados (contrato extendido v1) */
  sales?: unknown
  prices?: unknown
  metadata?: Record<string, unknown>
}

export interface ScanResolveResponse {
  article: ArticleDetailDto | null
}

export interface UiError {
  code: string
  message: string
  /** Devuelto por el backend o cabecera X-Correlation-Id para soporte */
  correlationId?: string
}

export type ScanStatus = 'idle' | 'loading-warehouses' | 'ready' | 'scanning' | 'detected' | 'not-found' | 'error'
