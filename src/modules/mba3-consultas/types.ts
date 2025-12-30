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
  tiene_odc?: boolean  // Indica si el despacho tiene una ODC generada
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
  // Campos adicionales del backend MBA3
  CORP?: string
  PRODUCT_NAME?: string
  PRODUCT_ID?: string
  GrupoPrenda?: string
  Talla?: string
  PRESENTACION?: string
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

// ========== Remisiones ==========
// Remision es similar a Prefactura, pero puede tener campos adicionales
export interface Remision extends Prefactura {
  // Campos adicionales que pueden existir en remisiones
  factura_impresa?: string | boolean
  [key: string]: any // Permitir campos dinámicos adicionales
}

export interface RemisionResponse {
  status: string
  data: Remision[]
  total?: number
  page?: number
  pageSize?: number
  totalPages?: number
  metadata?: {
    count: number
    filters?: Record<string, any>
    save_status?: {
      status: string
      facturas_guardadas?: number
      facturas_actualizadas?: number
      total_detalles?: number
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

// Detalle individual de una ODC
export interface DetalleOC {
  oc_detalle_id: string
  oc_id: string
  sku_sap: string
  cantidad_sap: number
  unidad_sap: string
  precio_unitario: number
  total_linea: number
  cantidad_origen?: number
}

export interface DetallesOCResponse {
  status: 'success' | 'error'
  oc_id: string
  detalles: DetalleOC[]
  count: number
}

// Request y Response para actualizar SKU
export interface ActualizarSkuRequest {
  nuevo_sku: string
  validar_en_sap?: boolean
}

export interface ActualizarSkuResponse {
  status: 'success' | 'error'
  message: string
  oc_id: string
  oc_detalle_id: string
  sku_anterior: string
  sku_nuevo: string
  sku_validado_en_sap: boolean
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
  status: 'success' | 'error' | 'processing'  // Tipado explícito en lugar de string
  message?: string
  process_id?: string  // Para trazabilidad y debugging
  data?: {
    oc_ids?: string[]
    despachos_procesados?: string[]
    oc_creadas?: number
    oc_errores?: number
  }
  metadata?: {
    query?: string
    save_status?: {
      status: string
      prefacturas_guardadas: number
      prefacturas_actualizadas: number
      total_detalles: number
    }
    oc_status?: {
      status: 'completed' | 'partial' | 'error' | 'processing'  // Estados explícitos
      oc_creadas: number
      oc_errores: number
      total_procesadas: number
      despachos_actualizados?: boolean  // Confirma que tiene_odc está actualizado
      datos_sincronizados?: boolean  // Confirma que datos están listos para consulta
      detalles: Array<{
        despacho_id?: string
        oc_id?: string
        success?: boolean
        tiene_odc_actualizado?: boolean
        error?: string
        [key: string]: any
      }>
    }
    timestamp?: string  // Para verificar frescura de los datos
  }
}

// Tipo para resultado del procesamiento de ODC (útil para handleODCResponse)
export type ODCResult = {
  shouldChangeTab: boolean
  shouldShowWarning: boolean
}

// ========== Estado del Módulo ==========
export interface Mba3ConsultasState {
  prefacturas: Prefactura[]
  ordenesCompra: OrdenCompra[]
  loading: boolean
  error: string | null
}

// ========== Componentes ==========
export interface Tab {
  id: string
  label: string
  badge?: string | number
  color?: 'violet' | 'emerald' | 'rose' | 'default'
}

// ========== Homologaciones de SKU ==========
export interface SkuHomologacion {
  homologacion_id: string
  sku_mba3: string
  nombre_producto_mba3: string
  precio_unitario_mba3: number
  cantidad_docena_mba3: number
  total_linea_mba3: number
  sku_sap: string | null
  nombre_producto_sap: string | null
  precio_unitario_sap: number | null
  cantidad_pack_sap: number | null
  unidad_sap: string | null
  subtotal_sap: number | null
  estado: 'PENDIENTE' | 'HOMOLOGADO' | 'ERROR'
  tiene_diferencias: boolean
  tiene_datos_sap: boolean
  created_at?: string
  updated_at?: string
}

export interface SkuHomologacionUpdateRequest {
  sku_sap?: string | null
  nombre_producto_sap?: string | null
  precio_unitario_sap?: number | null
  cantidad_pack_sap?: number | null
  unidad_sap?: string | null
  subtotal_sap?: number | null
  estado?: 'PENDIENTE' | 'HOMOLOGADO' | 'ERROR'
}

export interface SkuHomologacionResponse {
  status: string
  data: SkuHomologacion[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  metadata?: {
    total_pendientes: number
    total_homologados: number
    total_errores: number
  }
}

// ========== Cruce de Productos ==========
export interface ProductoHomologadoExacto {
  codigo_mba3: string
  nombre_mba3: string
  corp?: string
  grupo_prenda?: string
  talla?: string
  presentacion?: string
  codigo_sap: string
  nombre_sap: string
  pack_sap?: string
  tipo_coincidencia: 'exacta'
}

export interface ProductoHomologable {
  codigo_mba3: string
  nombre_mba3: string
  corp?: string
  grupo_prenda?: string
  talla?: string
  presentacion?: string
  codigo_sap: string
  nombre_sap: string
  pack_sap?: string
  codigo_mba3_normalizado: string
  codigo_sap_normalizado: string
  tipo_coincidencia: 'homologable'
}

export interface ProductoSoloMBA3 {
  codigo_mba3: string
  nombre_mba3: string
  corp?: string
  grupo_prenda?: string
  talla?: string
  presentacion?: string
  tipo_coincidencia: 'solo_mba3'
}

export interface ProductoSoloSAP {
  codigo_sap: string
  nombre_sap: string
  pack_sap?: string
  group_code?: number
  active?: boolean
  tipo_coincidencia: 'solo_sap'
}

export interface EstadisticasCruce {
  total_productos_mba3: number
  total_productos_sap: number
  homologados_exactos: number
  homologables: number
  solo_en_mba3: number
  solo_en_sap: number
  porcentaje_homologacion: number
}

export interface CruceProductosData {
  homologados_exactos: ProductoHomologadoExacto[]
  homologables: ProductoHomologable[]
  solo_en_mba3: ProductoSoloMBA3[]
  solo_en_sap: ProductoSoloSAP[]
  estadisticas: EstadisticasCruce
}

export interface CruceProductosResponse {
  status: string
  message: string
  data: CruceProductosData
}

// ========== Sugerencias ==========

export interface MotivoSugerencia {
  tipo: string
  descripcion: string
  detalle?: string
}

export interface SugerenciaProducto {
  codigo_sap: string
  nombre_sap: string
  pack_sap?: string
  group_code?: string
  active?: boolean
  score: number // 0-1
  score_original: number
  motivos: MotivoSugerencia[]
}

// Nueva interfaz para sugerencias de SKU similares (endpoint específico)
export interface SugerenciaSkuSap {
  codigo: string
  nombre: string
  pack?: string
  group_code?: number
  group_name?: string
  estado: 'activo' | 'inactivo'
  valid_for?: string
  score: number // 0-1
  score_porcentaje: number // 0-100
  motivos: string[]
}

export interface SugerenciasSkuResponse {
  status: 'success' | 'not_found'
  sku_referencia: string
  message?: string
  sugerencias: SugerenciaSkuSap[]
  total_encontrados: number
}

// Tipo para respuesta de buscar SKU en MBA3 (con sugerencias opcionales)
export interface BuscarSkuMba3Response {
  status: 'success' | 'not_found'
  message: string
  sku: string
  data: {
    codigo: string
    nombre: string
    corp?: string
    grupo_prenda?: string
    talla?: string
    presentacion?: string
    group_code?: string
    tipo_origen?: string
    descontinuado?: boolean | string
    inactive?: boolean | string
  } | null
  
  // Nuevos campos opcionales (solo si incluir_sugerencias_sap=true)
  sugerencias_sap?: SugerenciaSkuSap[]
  total_sugerencias_sap?: number
  
  // Campos de error opcionales para sugerencias
  sugerencias_sap_timeout?: boolean
  sugerencias_sap_disabled?: boolean
  sugerencias_sap_error?: string
}

export interface ProductoConSugerencias {
  codigo_mba3: string
  nombre_mba3: string
  corp?: string
  grupo_prenda?: string
  talla?: string
  presentacion?: string
  sugerencias: SugerenciaProducto[]
}

export interface SugerenciasResponse {
  status: string
  message: string
  data: ProductoConSugerencias[]
  metadata?: {
    total_productos: number
    total_sugerencias: number
    tiempo_procesamiento?: number
  }
}

// ========== Sincronización ==========

export interface EstadoSincronizacion {
  mba3?: {
    ultima_sync: string | null
    estado: 'exitoso' | 'error' | 'en_proceso' | null
    mensaje?: string
  }
  sap?: {
    ultima_sync: string | null
    estado: 'exitoso' | 'error' | 'en_proceso' | null
    mensaje?: string
  }
}

export interface EstadoSincronizacionResponse {
  status: string
  data: EstadoSincronizacion
}

export interface SincronizarMaestrosResponse {
  status: string
  message: string
  data?: {
    mba3?: {
      productos_sincronizados: number
      tiempo_procesamiento: number
    }
    sap?: {
      productos_sincronizados: number
      tiempo_procesamiento: number
    }
  }
}

// ========== Cruce de Productos con Progreso (SSE) ==========

// Tipo específico para eventos SSE (lo que realmente envía el backend)
export interface ProcesoEstadoSSE {
  process_id: string
  status: 'processing' | 'completed' | 'error'
  step: string  // Paso actual del proceso
  progress: number  // 0-100
  message: string
  updated_at: string
  version: number
  resultado?: CruceProductosData  // El backend envía los datos aquí cuando status === 'completed'
  data?: CruceProductosData  // Mantener para compatibilidad
  error?: string  // Solo cuando status === 'error'
}

// Tipo completo para polling (incluye created_at)
export interface ProcesoEstado {
  process_id: string
  status: 'processing' | 'completed' | 'error'
  step: string
  progress: number
  message: string
  created_at: string
  updated_at: string
  version: number
  resultado?: CruceProductosData  // El backend envía los datos aquí cuando status === 'completed'
  data?: CruceProductosData  // Mantener para compatibilidad
  error?: string
}

export interface IniciarCruceResponse {
  status: string
  process_id: string
  message: string
}

export interface ProcesoEstadoResponse {
  status: string
  data: ProcesoEstado
}

// ========== Plantillas / Pedidos ==========
export interface ValidacionProductos {
  validos: string[]
  no_encontrados: string[]
  todos_validos: boolean
}

export interface ValidacionTiendas {
  validas: string[]
  no_encontradas: string[]
  inactivas: string[]
  todas_validas: boolean
}

export interface ValidacionCantidades {
  valid: boolean
  errors: number
  warnings: number
}

export interface ValidacionCompleta {
  productos: ValidacionProductos
  tiendas: ValidacionTiendas
  cantidades: ValidacionCantidades
}

export interface Consolidacion {
  total_productos: number
  cantidad_total: number
}

export interface UploadPlantillaResponse {
  status: 'success' | 'validation_error' | 'error'
  message: string
  pedido_id: string
  estado?: string  // "PENDIENTE_CONFIRMACION_PROVEEDOR"
  articulos_cargados: number
  distribuciones_cargadas: number
  validacion?: ValidacionCompleta
  consolidacion?: Consolidacion
  errores?: string[]
  file_info?: {
    filename: string
    size_mb: number
  }
  metadata?: {
    uploaded_by: string
    uploaded_at: string
  }
}

export interface PedidoCabecera {
  pedido_id: string
  numero_pedido: string | null
  fecha_pedido: string | null
  fecha_entrega: string | null
  forma_pago: string | null
  odc: string | null
  proveedor_nombre: string | null
  comprador_nombre: string | null
  comprador_codigo: string | null
  origen_traslado: string | null
  serie: string | null
  archivo_nombre: string
  creado_por: string | null
  creado_en: string | null
}

export interface TiendaDistribucion {
  tienda_id: string
  codigo: string
  nombre: string | null
  cantidad: number
}

export interface PedidoDetalle {
  pedido_detalle_id: string
  codigo_interno: string | null
  descripcion_sap: string | null
  marca: string | null
  codigo_barras: string | null
  pack: string | null
  costo_doc_sin_iva: number | null
  descuento_1: number | null
  pvp: number | null
  subtotal: number | null
  total: number | null
  tiendas: TiendaDistribucion[]
}

export interface PedidoCompleto {
  cabecera: PedidoCabecera
  detalles: PedidoDetalle[]
}


