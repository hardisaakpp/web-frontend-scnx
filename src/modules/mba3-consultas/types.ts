// Tipos consolidados para el módulo MBA3 Consultas

// ========== Prefacturas/Despachos ==========
export interface Prefactura {
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

// ========== Despacho (desde BD) ==========
export interface Despacho {
  despacho_id: string
  empresa: string
  codigo_cliente: string
  fecha_despacho: string
  codigo_factura: string
  numero_factura: number
  numero_pedido_sistema: number | null
  orden_compra: string | null
  confirmado: boolean
  anulada: boolean
  tipo_documento: string
  remision_facturada: boolean
  fecha_factura: string
  codigo_despacho: number
  codigo_bodega: string | null
  numero_orden: string | null
  orden_compra_cliente: string | null
  num_id_factura_relacionada: number | null
  orden_compra_info: string | null
  despacho_created_at: string
  despacho_updated_at: string
  despacho_detalles?: DespachoDetalle[] // Detalles incluidos en la respuesta
}

// ========== Despacho Detalle (desde BD) ==========
export interface DespachoDetalle {
  detalle_id: string
  despacho_id: string
  sku: string
  cantidad_docena_mba3: number
  subtotal_sap: number
  cantidad_pack_sap: number | null
  unidad_sap: string | null
  precio_unitario_mba3: number
  descuento: number
  total_linea_mba3: number
  impuesto: number | null
  nombre_producto: string
  tipo_linea: string
  precio_unitario_sap: number | null
}

export interface PrefacturaFilters {
  anulada?: boolean | null
  confirmado?: boolean | null
  remision_facturada?: boolean | null
  include_obj_datos?: boolean
  save_to_db?: boolean
}

export interface PrefacturaResponse {
  status: string
  data: Prefactura[]
  metadata: {
    count: number
    filters: PrefacturaFilters
    save_status?: {
      status: string
      prefacturas_guardadas: number
      prefacturas_actualizadas: number
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
  metadata?: {
    count: number
    estado_filter?: string
  }
  // Información de paginación
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
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
      prefacturas_guardadas: number
      prefacturas_actualizadas: number
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
  prefacturas: Prefactura[]
  ordenesCompra: OrdenCompra[]
  loading: boolean
  error: string | null
}

