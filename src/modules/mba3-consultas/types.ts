// Tipos consolidados para el módulo MBA3 Consultas

// ========== Despachos ==========
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
  tiene_odc?: boolean // Indica si el despacho tiene una orden de compra asociada (desde backend)
  oc_id?: string | null // ID de la orden de compra asociada (desde backend)
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
  fecha_procesado?: string | null
  respuesta_sap?: string | null
  error_source?: string | null
  error_code?: string | null
  error_message?: string | null
  metadata?: {
    detalles?: Array<{
      oc_id?: string
      proveedor?: string
      success?: boolean
      doc_entry?: number
      doc_num?: number
      error_source?: string
      error_code?: string
      error_message?: string
      sap_response?: Record<string, any>
      [key: string]: any
    }>
    [key: string]: any
  }
}

export interface OrdenCompraResponse {
  status: string
  data: OrdenCompra[]
  metadata?: {
    count: number
    estado_filter?: string
    detalles?: Array<{
      sap_response?: Record<string, any>
      [key: string]: any
    }>
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

// ========== Logs de Órdenes de Compra ==========
export interface OrdenCompraLog {
  // Campos comunes de logs
  log_id?: string
  timestamp?: string
  fecha?: string
  created_at?: string
  updated_at?: string
  
  // Información de la orden de compra
  oc_id?: string
  referencia_despacho?: string
  proveedor?: string
  despacho_id?: string
  
  // Estado y acción
  estado?: string
  accion?: string
  tipo?: string
  
  // Información de SAP
  numero_oc_sap?: string | null
  doc_entry?: number | null
  doc_num?: number | null
  
  // Mensajes y errores
  mensaje?: string | null
  error_message?: string | null
  error_code?: string | null
  error_source?: string | null
  respuesta_sap?: string | null
  
  // Fechas
  fecha_generacion?: string
  fecha_procesado?: string | null
  
  // Campos adicionales dinámicos
  [key: string]: any
}

export interface OrdenCompraLogResponse {
  status: string
  data: OrdenCompraLog[]
  metadata?: {
    count: number
    filters?: Record<string, any>
  }
  // Información de paginación
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
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

// ========== Remisiones ==========
export interface Remision {
  codigo_factura?: string
  CODIGO_FACTURA?: string
  anulada?: boolean
  ANULADA?: boolean
  numero_pedido_sistema?: number | null
  NUMERO_PEDIDO_SISTEMA?: number | null
  numero_orden?: number | null
  NUMERO_ORDEN?: number | null
  factura_impresa?: boolean
  FACTURA_IMPRESA?: boolean
  numero_factura?: number | null
  NUMERO_FACTURA?: number
  empresa?: string
  EMPRESA?: string
  codigo_cliente?: string
  CODIGO_CLIENTE?: string
  fecha_factura?: string | null
  FECHA_FACTURA?: string | null
  tipo_documento?: string
  TIPO_DOCUMENTO?: string
  obj_datos_factura?: any | null
  ObjDatosFactura?: null
  orden_compra?: string | null
  ORDEN_COMPRA?: string | null
  orden_compra_cliente?: string | null
  ORDEN_COMPRA_CLIENTE?: string | null
  remision_facturada?: boolean
  Remision_Facturada?: boolean
  confirmado?: boolean
  CONFIRMADO?: boolean
  // Helper getters para acceder a los valores sin importar el formato
  [key: string]: any
}

export interface RemisionResponse {
  status: string
  data: Remision[]
  metadata?: {
    count: number
    filters?: Record<string, any>
  }
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
}

// ========== Componentes ==========
export interface Tab {
  id: string
  label: string
  badge?: string | number
  color?: 'violet' | 'emerald' | 'rose' | 'default'
}

