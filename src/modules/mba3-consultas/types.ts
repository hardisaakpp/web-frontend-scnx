// Tipos consolidados para el módulo MBA3 Consultas

// ========== Facturas ==========
export interface Factura {
  CODIGO_FACTURA: string
  ANULADA: string
  NUMERO_PEDIDO_SISTEMA: string
  NUMERO_ORDEN: string
  NUMERO_FACTURA: string
  CODIGO_DESPACHO: string
  EMPRESA: string
  CODIGO_CLIENTE: string
  FECHA_FACTURA: string
  TIPO_DOCUMENTO: string
  ObjDatosFactura: string | null
  ORDEN_COMPRA: string | null
  ORDEN_COMPRA_CLIENTE: string | null
  Remision_Facturada: string
  NumIDFacturaRelacionada: string | null
  CONFIRMADO: string
  CODIGO_BODEGA: string
}

export interface FacturaFilters {
  anulada?: boolean | null
  confirmado?: boolean | null
  remision_facturada?: boolean | null
  include_obj_datos?: boolean
  save_to_db?: boolean
}

export interface FacturaResponse {
  status: string
  data: Factura[]
  metadata: {
    count: number
    filters: FacturaFilters
    save_status?: {
      status: string
      facturas_guardadas: number
      facturas_actualizadas: number
      total_detalles: number
    }
  }
}

// ========== Órdenes de Compra ==========
export interface OrdenCompra {
  oc_id: string
  despacho_id: string
  proveedor: string
  fecha_generacion: string
  estado: 'PENDIENTE' | 'ENVIADA' | 'ERROR'
  numero_oc_sap: string | null
  referencia_despacho: string
  created_at: string
}

export interface OrdenCompraResponse {
  status: string
  data: OrdenCompra[]
  metadata: {
    count: number
    estado_filter?: string
  }
}

export interface OrdenCompraDetalle {
  oc_id: string
  proveedor: string
  detalles: any[]
}

// ========== API General ==========
export interface ApiResponse<T> {
  status: string
  data?: T
  message?: string
  metadata?: Record<string, any>
}

export interface HealthResponse {
  status: string
  time: string
}

export interface ProcesoResponse {
  status: string
  data?: any
  metadata?: {
    query?: string
    save_status?: {
      status: string
      facturas_guardadas: number
      facturas_actualizadas: number
      total_detalles: number
    }
    oc_status?: {
      status: string
      oc_creadas: number
      oc_errores: number
      total_procesadas: number
      detalles: any[]
    }
  }
}

// ========== Estado del Módulo ==========
export interface Mba3ConsultasState {
  facturas: Factura[]
  ordenesCompra: OrdenCompra[]
  loading: boolean
  error: string | null
}

