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
  itemCode: string
  itemName: string
  codeBars: string | null
  warehouseCode: string
  warehouseName: string | null
  brand?: string | null
  category?: string | null
  hierarchy: string[]
  sales: {
    avg30: number
    total30: number
    total90: number
    lastSaleDate: string | null
    lastIngressDate: string | null
  }
  stock: {
    store: number
    warehouse: number
    transit: number
    totalGeneral?: number | null
  }
  pricing?: {
    avgPrice: number | null
    price: number | null
    margin: number | null
  } | null
  /** Campos legacy tolerados para compatibilidad visual temporal */
  code?: string
  description?: string
  barcode?: string | null
  lastSaleDate?: string | null
  unitPrice?: number | null
  currency?: string | null
}

export interface ScanResolveResponse {
  success: boolean
  article: ArticleDetailDto | null
  error: {
    code: string
    message: string
    details: unknown
  } | null
  correlationId: string
}

export interface UiError {
  code: string
  message: string
  details?: unknown
  /** Devuelto por el backend o cabecera X-Correlation-Id para soporte */
  correlationId?: string
}

export type ScanStatus = 'idle' | 'loading-warehouses' | 'ready' | 'scanning' | 'detected' | 'not-found' | 'error'
