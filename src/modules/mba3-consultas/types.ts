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
  despacho_id: string | null  // ⚠️ Ahora puede ser null (OC de pedido)
  pedido_id: string | null    // ⭐ NUEVO - ID del pedido relacionado
  proveedor: string
  fecha_generacion: string
  estado: 'PENDIENTE' | 'ENVIANDO' | 'ENVIADA' | 'ERROR'
  numero_oc_sap: string | null
  doc_entry: number | null    // ⭐ DocEntry de SAP (importante para trazabilidad)
  doc_num?: number | null     // ⭐ DocNum de SAP (número de documento en SAP)
  referencia_despacho: string
  created_at: string
  fecha_procesado?: string | null
  respuesta_sap?: string | null
  error_source?: string | null
  error_code?: string | null
  error_message?: string | null
  /** Flags de UI para columna ACCIONES (backend autoritativo). */
  mostrar_reintentar?: boolean
  mostrar_descargar_pdf?: boolean
  /** True si la OC está ENVIADA pero quedan tiendas con ITR/ST en error pendientes de reintento. */
  mostrar_reintentar_st?: boolean
  /** Cantidad de tiendas con ITR pendiente de reintento (último batch + sin ITR ya creado). */
  st_pendientes_reintento?: number
  /** Total de tiendas que debían tener ITR para esta OC. */
  st_total_tiendas?: number
  /** Tiendas con ITR creado correctamente en SAP (acumulado en batches). */
  st_transferencias_creadas?: number
  /** Tiendas que fallaron en el último batch ST. */
  st_transferencias_errores?: number
  metadata?: {
    detalles?: IntegracionSAPDetalle[]  // Usar interfaz específica
    [key: string]: any
  }
}

/** Parámetros opcionales de listado GET /ordenes-compra (paginación en servidor). */
export interface OrdenesCompraListFilters {
  search?: string
  referencia_despacho?: string
  numero_oc_sap?: string
}

export interface OrdenCompraResponse {
  status: string
  data: OrdenCompra[]
  metadata?: {
    count: number
    total?: number
    page?: number
    pageSize?: number
    totalPages?: number
    hasMore?: boolean
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

// ⭐ NUEVO - Interfaz para detalles de integración SAP
export interface IntegracionSAPDetalle {
  oc_id: string
  proveedor?: string
  success: boolean
  doc_entry: number | null        // DocEntry de SAP
  doc_num: number | null          // DocNum de SAP (número de documento en SAP)
  numero_oc_sap?: string | null   // Num ODC (desde orden_compra_cabecera.numero_oc_sap)
  message?: string | null          // Mensaje de éxito
  error: string | null             // Mensaje de error (puede contener múltiples errores separados por ';')
  error_message: string | null     // Alias de error (para compatibilidad)
  error_code: string | null         // ⭐ NUEVO - Código numérico de SAP
  error_source: string | null       // ⭐ NUEVO - "SAP" | "BACKEND" | "SAP_CONNECTION"
  /** True si el fallo fue probablemente transitorio (conexión/SL); el usuario puede reintentar envío. */
  retry_recommended?: boolean | null
  /** True si el middleware encoló la creación de la ODC (HTTP 202, SAP saturado): no es
   * un error, SAP la sigue procesando en segundo plano y se confirmará sola. */
  queued?: boolean | null
  solicitudes_transferencia?: SolicitudesTransferencia | null  // ⭐ NUEVO - Solicitudes de Transferencia creadas automáticamente
  sap_response?: Record<string, any> | null  // Respuesta completa de SAP
  sap_error_details?: Record<string, any> | null  // Detalles completos del error
  [key: string]: any
}

// Interfaz para información de pedidos cerrados (opcional - Fase 6)
export interface PedidoCerrado {
  pedido_id: string
  estado_anterior: string
  estado_nuevo: 'CONFIRMADO_ENVIADO'
  total_odc: number
  odc_enviadas: number
}

// Interfaz para respuesta de integración SAP
export interface IntegracionSAPResponse {
  status?: string
  success?: boolean
  message?: string
  oc_id?: string
  doc_entry?: number
  doc_num?: number
  solicitudes_transferencia?: SolicitudesTransferencia  // ⭐ NUEVO - Solicitudes de Transferencia creadas automáticamente
  metadata?: {
    detalles?: IntegracionSAPDetalle[]
    pedidos_cerrados?: PedidoCerrado[]  // ⭐ Opcional (Fase 6) - Pedidos que se cerraron después de enviar ODC
    solicitudes_transferencia?: SolicitudesTransferencia  // Algunos backends envían ITR a nivel metadata
    [key: string]: any
  }
  [key: string]: any
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

export interface SkuHomologacionCreateRequest {
  sku_mba3: string
  sku_sap: string
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

// Información de SAP (pack/pvp/etc.) para uno o más códigos — GET /api/plantillas/sap-info-productos
export interface SapInfoProducto {
  encontrado: boolean
  motivo: 'no_existe' | 'inactivo' | 'mismatch' | null
  pack_sap?: string | null
  pvp_sap?: number | null
  codigo_barras?: string | null
  item_name?: string | null
}

export interface SapInfoProductosResponse {
  productos: Record<string, SapInfoProducto>
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

/** POST /cruce-productos/iniciar — 200 con process_id (async) o fallback sync sin process_id */
export interface IniciarCruceResponse {
  status: string
  process_id?: string | null
  message?: string
  fallback?: string
  async?: boolean
  data?: CruceProductosData
}

/** GET /cruce-productos/resultado/{id} mientras corre (estado anidado) */
export interface CrucePollProcessingResponse {
  status: 'processing'
  estado: {
    step?: string
    progress?: number
    message?: string
  }
}

/** GET /cruce-productos/resultado/{id} terminal OK */
export interface CrucePollSuccessResponse {
  status: 'success'
  message?: string
  data: CruceProductosData
}

export interface ProcesoEstadoResponse {
  status: string
  data: ProcesoEstado
}

export type CruceResultadoPollResponse =
  | CrucePollProcessingResponse
  | CrucePollSuccessResponse
  | ProcesoEstadoResponse

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
  productos_sap?: {
    validos: string[]
    no_encontrados: string[]
    errores: string[]
    todos_validos: boolean
  }
  tiendas_sap?: {
    validas: string[]
    no_encontradas: string[]
    errores: string[]
    todas_validas: boolean
  }
  bodegas_sap?: {
    validas: string[]
    no_encontradas: string[]
    errores: string[]
    todas_validas: boolean
  }
}

// Validación SAP (nuevo campo opcional en respuesta)
export interface ValidacionSAP {
  total_codigos: number
  validos: number
  no_encontrados: string[]  // ⭐ MEJORADO: Array de códigos, no solo conteo
  errores: string[]  // ⭐ MEJORADO: Array de errores, no solo conteo
  warnings: string[]  // ⭐ MEJORADO: Array de warnings, no solo conteo
  todos_validos: boolean
  // ⭐ Campos opcionales para compatibilidad (conteos)
  total_no_encontrados?: number
  total_errores?: number
  total_warnings?: number
  detalle_validacion?: {
    [codigo: string]: {
      existe?: boolean
      severity?: string
      error?: string
      mensaje?: string
      // ⭐ NUEVO: Información de MBA3 y sugerencias SAP
      mba3?: {
        codigo?: string
        nombre?: string
        corp?: string
        grupo_prenda?: string
        talla?: string
        presentacion?: string
        descontinuado?: boolean
        inactive?: boolean
      }
      sugerencias_sap?: Array<{
        codigo: string
        nombre: string
        pack?: string
        group_code?: number
        group_name?: string
        estado: string
        score: number
        score_porcentaje: number
        motivos: string[]
      }>
    }
  }
}

export interface Consolidacion {
  total_productos: number
  cantidad_total: number
}

export interface UploadPlantillaResponse {
  status: 'success' | 'validation_error' | 'error'
  message: string
  pedido_id: string
  numero_pedido?: string  // Número de pedido (ej: "P-12.48 - 12 - 2025")
  estado?: string  // Estados: "PENDIENTE_CONFIRMACION_PROVEEDOR", "RESPUESTA_PROVEEDOR_CARGADA", "CONFIRMADO_PROVEEDOR", "CONFIRMADO REDISTRIBUCION", "PEDIDO_CONFIRMADO", "PROCESADO_SAP", "CONFIRMADO_ENVIADO"
  articulos_cargados: number
  distribuciones_cargadas: number
  validacion?: ValidacionCompleta
  validacion_sap?: ValidacionSAP  // ⭐ NUEVO - Validación SAP (opcional)
  consolidacion?: Consolidacion
  errores?: Array<string | {  // ⭐ ACTUALIZADO - Ahora puede ser string o objeto con detalles
    tipo: 'ERROR' | 'WARNING'
    campo?: string
    mensaje: string
    producto?: string
  }>
  file_info?: {
    filename: string
    size_mb: number
  }
  metadata?: {
    uploaded_by: string
    uploaded_at: string
  }
  /** Códigos de producto corregidos al aplicar sugerencias (para resaltar celdas en la tabla) */
  correcciones_aplicadas?: Array<{ codigo_original: string; codigo_corregido: string }>
}

/**
 * Respuesta de POST /api/plantillas/upload-async.
 * - 202: status 'accepted', process_id presente → hay que hacer polling a GET /api/plantillas/resultado/{process_id}.
 * - 200 (fallback sync): process_id null, async false, cuerpo = resultado completo → no hacer polling.
 */
export interface UploadPlantillaAsyncAcceptedResponse {
  status: 'accepted'
  process_id: string | null
  message?: string
  resultado_url?: string
  stream_url?: string
  /** Si false, el cuerpo de la respuesta 200 es el resultado final (no hacer polling). */
  async?: boolean
}

/** Estado al consultar GET /api/plantillas/resultado/{process_id} (polling) */
export interface PlantillaProcesoEstado {
  status: 'processing' | 'completed' | 'error'
  step?: string
  progress?: number
  message?: string
  process_id?: string
  /** Cuando status === 'completed', mismo formato que UploadPlantillaResponse */
  resultado?: UploadPlantillaResponse
  error?: string
}

// ========== Crear Pedido Manual (HU-01) ==========

/**
 * Distribución por tienda para creación manual de pedidos
 */
export interface DistribucionTiendaRequest {
  tienda_codigo: string
  cantidad: number
}

/**
 * Artículo del pedido para creación manual
 */
export interface ArticuloRequest {
  codigo_producto: string
  costo_unitario: number
  cantidad_total: number
  distribuciones: DistribucionTiendaRequest[]
  comentario?: string | null
}

/**
 * Request para crear un pedido manualmente
 */
export interface CrearPedidoRequest {
  cabecera: {
    numero_pedido: string
    fecha_pedido?: string | null
    fecha_entrega?: string | null
    proveedor_nombre?: string | null
    comprador_nombre?: string | null
    comprador_codigo?: string | null
    forma_pago?: string | null
    origen_traslado?: string | null
    serie?: string | null
    estado?: string | null
  }
  articulos: ArticuloRequest[]
}

/**
 * Response del endpoint de creación manual de pedidos
 */
export interface CrearPedidoResponse {
  status: 'success' | 'validation_error'
  message: string
  pedido_id: string
  numero_pedido: string
  estado: string
  articulos_cargados: number
  distribuciones_cargadas: number
  validacion?: ValidacionCompleta
  validacion_sap?: ValidacionSAP
  consolidacion?: Consolidacion
  errores?: Array<string | {
    tipo: 'ERROR' | 'WARNING'
    campo?: string
    mensaje: string
    producto?: string
  }>
}

export interface PedidoCabecera {
  pedido_id: string
  numero_pedido: string | null
  fecha_pedido: string | null
  fecha_entrega: string | null
  forma_pago: string | null
  mensaje: string | null
  proveedor_nombre: string | null
  comprador_nombre: string | null
  comprador_codigo: string | null
  origen_traslado: string | null
  serie: string | null
  archivo_nombre: string
  creado_por: string | null
  creado_en: string | null
  modificado_fecha?: string | null
  modificado_por?: string | null
  estado?: string  // Estado del pedido: "PENDIENTE_CONFIRMACION_PROVEEDOR", "RESPUESTA_PROVEEDOR_CARGADA", "CONFIRMADO_PROVEEDOR", "CONFIRMADO REDISTRIBUCION", "PEDIDO_CONFIRMADO", "PROCESADO_SAP", "CONFIRMADO_ENVIADO", "DESPACHAR Y FACTURAR"
  estado_id?: number  // ID del estado en BD (ej. 12 = CONFIRMADO_ENVIADO, 17 = DESPACHAR Y FACTURAR, 21 = ERROR ENVIO SAP REINTENTO)
  // ⭐ Campos de SAP (disponibles cuando estado_id = 12 CONFIRMADO_ENVIADO)
  numero_oc_sap?: string | null  // Número de OC en SAP (DocNum)
  doc_entry?: number | null      // DocEntry de SAP para trazabilidad
  /** Fecha Facturación (req. 1.8): en blanco por defecto, exclusiva de Producción El Rayo,
   * editable solo mientras el pedido está en Gestionar Pedido (estado_id = 3). */
  fecha_facturacion?: string | null
  /** Req. 1.2: UUID del pedido "padre" si este es un pedido "hijo" generado con la
   * diferencia no producida (null/undefined en un pedido padre normal). */
  pedido_padre_id?: string | null
  /** Bodega(s)/CD detectadas a partir de las tiendas del pedido (ROLAND→RL-CD,
   * REGIONS→RG-CD, DESCUENTON→OUT-CD). Calculado, no persistido; distinto del
   * campo `origen_traslado` (valor único escrito a mano en el Excel). Puede traer
   * más de un código cuando el pedido mezcla tiendas de ambas marcas. */
  origen_traslado_detectado?: string[]
  /** ODC(s) del pedido (disponible cuando estado_id = 12 CONFIRMADO_ENVIADO). Trae más
   * de un elemento cuando el pedido mezcla tiendas de más de una bodega/CD (ver
   * origen_traslado_detectado) -- el frontend usa esto para mostrar un botón
   * "Generar TXT MBA3" por ODC en vez de uno solo. */
  ordenes_compra?: Array<{
    codigo_bodega: string | null
    numero_oc_sap: string | null
    estado: string | null
  }>
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
  comentario?: string | null  // ⭐ Campo editable para comentarios
  /** Columna "Costo" de la plantilla Excel (req. 1.4): informativa para el Margen de
   * Rentabilidad; distinta de costo_doc_sin_iva (que sí alimenta la OC). */
  costo_margen?: number | null
  /** Margen de Rentabilidad (req. 1.5): calculado en el backend a partir de costo_margen
   * y pvp (ver calcular_margen_rentabilidad en pedido_utils.py). Fracción decimal (0.35 = 35%). */
  margen?: number | null
  /** Cantidad que Mabel Trading cargó originalmente en la plantilla Excel (req. 1.2), fijada
   * una sola vez en el INSERT. null en pedidos anteriores a la migración 641. */
  cantidad_solicitada_original?: number | null
  tiendas: TiendaDistribucion[]
}

/** Totales calculados en el backend para la tabla de detalles (suma de costo_doc_sin_iva, subtotal, total). */
export interface TotalesDetalles {
  total_costo_unitario: number
  total_subtotal: number
  total_total: number
}

export interface PedidoCompleto {
  cabecera: PedidoCabecera
  detalles: PedidoDetalle[]
  /** Totales de la tabla de detalles; viene del GET y de las respuestas PATCH costo/total. */
  totales?: TotalesDetalles
  respuesta_proveedor?: RespuestaProveedor  // Incluido si incluir_respuesta=true
  /** true si el pedido está en BORRADOR o NUEVO PEDIDO; false en el resto (p. ej. GESTIONAR PEDIDO). Backend: GET plantillas/ultimo, GET plantillas/{id}, POST .../gestionar */
  puede_descartar?: boolean
  /** true si se puede cancelar (Redistribución), o "Rechazar" si estado_id === 22 = PRODUCCION POSPUESTA; false desde estado Confirmado redistribución (estado_id ≥ 10). Backend: GET /api/pedidos/{id} */
  puede_cancelar_pedido?: boolean
  /** true si se puede "Aceptar" la diferencia pospuesta (solo estado_id === 22 = PRODUCCION POSPUESTA), pasando a LISTO PARA REDISTRIBUCION (25). Backend: GET /api/pedidos/{id} */
  puede_aceptar_produccion_pospuesta?: boolean
  /** true si se puede confirmar redistribución (estados 4-REDISTRIBUCION, 5-RESPUESTA_PROVEEDOR_CARGADA, 6-CONFIRMADO_PROVEEDOR, 8-EN_AJUSTE_MABEL, 9-REDISTRIBUIDO); false para CANCELADO y otros estados */
  puede_confirmar_redistribucion?: boolean
  /** true si se puede finalizar el pedido (solo cuando estado_id === 17 = DESPACHAR Y FACTURAR). Backend: GET /api/pedidos/{id} y GET /api/plantillas/{numero_pedido} */
  puede_finalizar?: boolean
  /** true si se puede generar el TXT MBA3 (estado_id === 12 = CONFIRMADO Y ENVIADO; el DocNum de SAP que exige la columna 12 del TXT recién existe ahí). Backend: GET /api/pedidos/{id} */
  puede_generar_txt_mba3?: boolean
  /**
   * true si el usuario puede reintentar el proceso completo (envío ODC a SAP), p. ej. estado 21 o 10 con ODC reintentable.
   * Backend: enrich tras GET plantillas/pedido y respuestas que devuelven pedido completo.
   */
  puede_reintentar_envio_odc_sap?: boolean
}

// ========== Respuesta del Proveedor (Fase 3) ==========

export interface ValidacionError {
  tipo: 'ERROR' | 'WARNING'
  campo: string
  mensaje: string
  producto?: string
}

export interface ValidacionRespuestaProveedor {
  valido: boolean
  errores: ValidacionError[]
  warnings: ValidacionError[]
}

export interface CargarRespuestaProveedorResponse {
  status: 'success' | 'validation_error'
  message: string
  respuesta_id: string
  validacion: ValidacionRespuestaProveedor
  cantidades_guardadas: number
  precios_guardados: number
  pedido_id: string
}

export interface RespuestaProveedorDetalle {
  codigo_producto: string
  descripcion: string
  cantidad_solicitada_total: number
  cantidad_confirmada_total: number
  costo_doc_sin_iva_original: number | null
  costo_doc_sin_iva_ajustado: number | null
  descuento_1_original: number | null
  descuento_1_ajustado: number | null
  observaciones: string | null
  // ⭐ Campos para identificar modificaciones de EL RAYO
  pedido_detalle_id?: string
  costo_modificado_manual?: boolean
  total_modificado_manual?: boolean
}

export interface RespuestaProveedorCabecera {
  respuesta_id: string
  version: number
  estado: 'PENDIENTE_REVISION' | 'APROBADA' | 'RECHAZADA'
  fecha_respuesta: string
  creado_por: string
  observaciones_generales: string | null
}

export interface RespuestaProveedor {
  cabecera: RespuestaProveedorCabecera
  detalles: RespuestaProveedorDetalle[]
}

export interface RespuestaProveedorResponse {
  cabecera: RespuestaProveedorCabecera
  detalles: RespuestaProveedorDetalle[]
}

// ========== Fase 4: Ajuste y Redistribución ==========

export interface DistribucionTienda {
  tienda_codigo: string
  tienda_nombre: string
  cantidad: number
}

export interface AjusteDetalle {
  codigo_producto: string
  descripcion: string
  cantidad_solicitada: number
  cantidad_confirmada: number
  cantidad_ajustada: number
  distribucion_tiendas: DistribucionTienda[]
  costo_original: number | null
  costo_ajustado: number | null
  cambio_precio: boolean
}

export interface ResumenConfirmacion {
  total_productos: number
  total_solicitado: number
  total_confirmado: number
  total_diferencia: number
  porcentaje_confirmacion: number
}

/**
 * Respuesta de GET /api/pedidos/{pedido_id}/distribucion.
 * Expone la distribución confirmada (cantidad por tienda) por producto.
 */
export interface DistribucionTiendaItemResponse {
  tienda_id: string
  tienda_codigo: string
  tienda_nombre: string
  cantidad_asignada: number
  cantidad_solicitada?: number
  cantidad_confirmada?: number
}

export interface ProductoDistribucionResponse {
  pedido_detalle_id: string
  codigo_interno: string
  descripcion_sap: string
  cantidad_solicitada_total: number
  cantidad_confirmada_total: number
  cantidad_asignada_total: number
  distribuciones: DistribucionTiendaItemResponse[]
}

/** Item del catálogo maestro de tiendas (GET /api/pedidos/tiendas/buscar). */
export interface TiendaCatalogoItem {
  tienda_id: string
  codigo: string
  nombre: string | null
}

export interface DistribucionPedidoResponse {
  pedido_id: string
  numero_pedido: string
  version_actual?: number
  estado_pedido?: string
  productos: ProductoDistribucionResponse[]
}

export interface DiferenciaReporte {
  codigo_producto: string
  descripcion: string
  cantidad_solicitada: number
  cantidad_confirmada: number
  diferencia: number
  porcentaje_diferencia: number
  costo_original: number | null
  costo_ajustado: number | null
  cambio_precio: boolean
  distribucion_tiendas: DistribucionTienda[]
  observaciones: string | null
}

export interface ReporteDiferenciasResponse {
  pedido_id: string
  numero_pedido: string | null
  resumen: ResumenConfirmacion
  detalle: DiferenciaReporte[]
}

export interface ProcesarConfirmacionResponse {
  status: 'success'
  message: string
  pedido_id: string
  respuesta_id: string
  ajustes_realizados: number
  resumen: ResumenConfirmacion
  reporte_diferencias: DiferenciaReporte[]
  ajustes_detalle: AjusteDetalle[]
}

// ========== Req. 1.2: Gestión de pedidos parciales (diferencia de producción) ==========

/** Línea de detalle cuyo Total actual quedó por debajo de la cantidad solicitada original. */
export interface DetalleDiferenciaProduccion {
  pedido_detalle_id: string
  codigo_interno: string | null
  descripcion_sap: string | null
  cantidad_solicitada_original: number
  total_actual: number
  diferencia: number
}

export interface DiferenciaProduccionResponse {
  tiene_diferencia: boolean
  detalles: DetalleDiferenciaProduccion[]
}

export interface PedidoHijoDiferencia {
  pedido_id: string
  numero_pedido: string
  pedido_padre_id: string
  detalles_insertados: number
}

/** Cantidad de una línea de la diferencia asignada a un pedido hijo específico. */
export interface DetalleAsignadoHijo {
  pedido_detalle_id: string
  cantidad: number
}

/** Un pedido hijo a generar: su fecha de entrega y la porción de cada línea asignada. */
export interface HijoDiferenciaPayload {
  fecha_entrega: string
  detalles: DetalleAsignadoHijo[]
}

export interface ConfirmarConDiferenciaResponse {
  status: 'success'
  confirmacion: CargarRespuestaProveedorResponse
  pedidos_hijos: PedidoHijoDiferencia[]
}

// ========== Proceso Completo SAP (Redistribución + ODC + Envío SAP) ==========

/**
 * Detalle del resultado del envío a SAP
 */
export interface ProcesoCompletoSAPDetalleODC {
  oc_id: string
  success: boolean
  doc_num: number | null
  doc_entry: number | null
  numero_oc_sap?: string | null  // Num ODC (orden_compra_cabecera.numero_oc_sap)
  error: string | null
  error_code?: string | null
  message?: string | null
  solicitudes_transferencia?: SolicitudesTransferencia | null
  /** True si el fallo fue probablemente transitorio (conexión/SL); el cliente puede ofrecer reintento manual. */
  retry_recommended?: boolean | null
  /** True si el middleware encoló la creación de la ODC (HTTP 202, SAP saturado): no es
   * un error, SAP la sigue procesando en segundo plano y se confirmará sola. */
  queued?: boolean | null
}

/**
 * Respuesta del endpoint GET /ordenes-compra/{oc_id}/integracion-sap
 * Usado para rellenar el modal de integración SAP al hacer clic en "Num ODC" (cuando no hay datos en memoria).
 */
export interface IntegracionSAPPorOCResponse {
  envio_sap: ProcesoCompletoSAPDetalleODC
  solicitudes_transferencia?: SolicitudesTransferencia
}

/**
 * Respuesta del endpoint POST /api/pedidos/{numero_pedido}/proceso-completo-sap
 * Ejecuta los 3 pasos: Confirmar Redistribución → Generar ODC → Enviar a SAP
 */
export interface ProcesoCompletoSAPResponse {
  status: 'success' | 'partial' | 'error'
  message: string
  pedido_id: string
  numero_pedido: string
  /** Información de la redistribución confirmada (Paso 1) */
  redistribucion?: {
    version_confirmada: number
    productos_redistribuidos: number
  }
  /** Información de la ODC generada (Paso 2) */
  odc_generada?: {
    oc_id: string
    detalles_insertados: number
  }
  /** Resultado del envío a SAP de la primera ODC (Paso 3) */
  envio_sap?: ProcesoCompletoSAPDetalleODC
  /**
   * Resultado del envío a SAP de TODAS las ODC del pedido. La mayoría de los pedidos
   * generan 1 sola (mismo contenido que envio_sap); un pedido que mezcla tiendas de
   * más de una marca (ROLAND + REGIONS en el mismo Excel) genera 2.
   */
  envios_sap?: ProcesoCompletoSAPDetalleODC[]
  /** Solicitudes de Transferencia (ITR) creadas; puede venir en raíz o en envio_sap */
  solicitudes_transferencia?: SolicitudesTransferencia
  /** Resumen de cantidades */
  resumen?: ResumenConfirmacion
  /** Si hubo error parcial, indica en qué paso falló */
  paso_fallido?: 'redistribucion' | 'generar_odc' | 'enviar_sap'
  /** Mensaje de error si falló algún paso. Nombre real del campo en el backend
   * (ProcesoCompletoSAPResponse.error_detalle) -- OJO: no confundir con
   * envio_sap.error (error de una ODC puntual). */
  error_detalle?: string
}

/**
 * Respuesta 202 del endpoint POST .../proceso-completo-sap-async
 */
export interface ProcesoCompletoSAPAsyncResponse {
  status: 'accepted'
  process_id: string
  message: string
  resultado_url: string
  stream_url: string
}

/**
 * Respuesta de GET .../proceso-sap/resultado/{process_id} (polling).
 * Mientras corre: status === 'processing'. Al terminar el backend puede enviar:
 * - process_status: "completed" y progress: 100, o
 * - status: "success" | "partial" (cuerpo como ProcesoCompletoSAPResponse).
 */
export type ProcesoCompletoSAPResultadoPolling = (
  | { status: 'processing'; step?: string; progress?: number; message?: string; process_id?: string; numero_pedido?: string; process_status?: string }
  | (ProcesoCompletoSAPResponse & { status?: 'completed' | 'success' | 'partial'; process_status?: string; progress?: number })
  | { status: 'error'; message: string; error_detalle?: string; paso_fallido?: string; process_id?: string; numero_pedido?: string }
)

export interface CrearOCDesdePedidoResponse {
  status: 'success' | 'error'
  message: string
  oc_id?: string
  pedido_id: string
  solicitudes_transferencia?: SolicitudesTransferencia  // ⭐ NUEVO - Solicitudes de Transferencia creadas automáticamente
  metadata?: {
    oc_creada: boolean
    detalles?: any[]
  }
}

export interface ActualizarCostoPedidoResponse {
  status: 'success' | 'error'
  message: string
  pedido_detalle_id: string
  costo_anterior?: number | null
  costo_nuevo?: number
  total_actualizado?: number
  // ⭐ Campos adicionales para actualización de total
  total_anterior?: number | null
  total_nuevo?: number
  subtotal_actualizado?: number
  costo_actualizado?: number
  // ⭐ Campo para actualización de comentario
  comentario_nuevo?: string | null
  /** Totales recalculados por el backend tras PATCH costo/total; el front los usa para la fila de totales. */
  totales?: TotalesDetalles
}

// ⭐ HU-06: Tipos para actualizar cabecera del pedido
export interface ModificarPedidoCabeceraRequest {
  fecha_pedido?: string | null
  fecha_entrega?: string | null
  estado?: string | null
  forma_pago?: string | null
  proveedor_nombre?: string | null
  comprador_nombre?: string | null
  comprador_codigo?: string | null
  origen_traslado?: string | null
  serie?: string | null
  /** Fecha Facturación (req. 1.8): exclusiva de Producción El Rayo, solo en Gestionar Pedido. */
  fecha_facturacion?: string | null
}

export interface ModificarPedidoCabeceraResponse {
  status: 'success'
  message: string
  pedido_id: string
  campos_modificados: string[]
}

// ⭐ FASE 3: Persistencia de modificaciones de columnas
export interface ColumnaModificada {
  pedido_detalle_id: string
  columna_key: string
  modificado_por?: string
  fecha_modificacion?: string
  /** Rol responsable de la última modificación (derivado por el backend del estado del
   *  pedido al guardar, no del permiso del usuario): 'PRODUCCION_ELRAYO' u 'ODCSAP'. */
  rol_modificador?: 'PRODUCCION_ELRAYO' | 'ODCSAP' | null
}

export interface GuardarModificacionesColumnasRequest {
  numero_pedido: string
  modificaciones: ColumnaModificada[]
}

export interface GuardarModificacionesColumnasResponse {
  status: 'success' | 'error'
  message: string
  numero_pedido: string
  modificaciones_guardadas: number
}

export interface ObtenerModificacionesColumnasResponse {
  status: 'success'
  numero_pedido: string
  modificaciones: ColumnaModificada[]
}

// ========== Procesamiento SAP (Post-Confirmación) ==========

/**
 * Conversión por tienda/bodega dentro de un producto del procesamiento SAP
 */
export interface ConversionPorTiendaItem {
  tienda_codigo: string
  tienda_nombre: string
  es_bodega: boolean
  cantidad_asignada: number
  cantidad_sap: number
}

/**
 * Item individual de producto procesado con SAP
 */
export interface ProductoSAPProcesamientoItem {
  pedido_detalle_id: string
  codigo_interno: string | null
  codigo_sap: string | null
  descripcion_producto: string | null
  descripcion_sap: string | null
  descripcion_original: string | null
  cantidad_original: number
  cantidad_sap: number
  unidad_original: string | null
  unidad_sap: string | null
  precio_unitario_original: number | null
  precio_original: number | null
  // Campos del backend (nombres directos de BD)
  total_linea_original: number | null
  total_linea_sap: number | null
  // Campos mapeados (por compatibilidad, si el backend los mapea)
  subtotal_original?: number | null
  subtotal_sap?: number | null
  precio_unitario_sap: number | null
  precio_sap: number | null
  cantidad_pack_sap: number | null
  factor_conversion: number | null
  esta_homologado: boolean
  tiene_error: boolean
  error_mensaje: string | null
  fecha_procesamiento: string
  /** Distribución por tienda/bodega con cantidades asignadas y convertidas a SAP */
  distribucion_conversion?: ConversionPorTiendaItem[] | null
}

/**
 * Estadísticas del procesamiento SAP
 */
export interface EstadisticasProcesamientoSAP {
  total_productos: number
  productos_homologados: number
  productos_no_homologados: number
  productos_con_error: number
  total_cantidad_original: number
  total_cantidad_sap: number
  total_precio_original: number
  total_precio_sap: number
}

/**
 * Respuesta completa del endpoint de procesamiento SAP
 */
export interface ProcesamientoSAPResponse {
  status: 'success'
  pedido_id: string
  numero_pedido: string
  productos: ProductoSAPProcesamientoItem[]
  estadisticas: EstadisticasProcesamientoSAP
  fecha_procesamiento: string
}

// ========== Solicitudes de Transferencia (HU-04) ==========

/**
 * Resultado individual de una Solicitud de Transferencia creada
 */
export interface SolicitudTransferenciaResultado {
  tienda_id: string
  tienda_codigo: string
  tienda_nombre: string | null  // ⭐ NUEVO - Nombre completo de la tienda
  success: boolean
  doc_entry: number | null
  doc_num: number | null
  error: string | null
}

/** Una entrada por ITR para la tabla del modal (DocNum + código tienda) */
export interface ItrPorTienda {
  doc_num: number
  tienda_codigo: string
}

/**
 * Información de Solicitudes de Transferencia creadas automáticamente
 */
export interface SolicitudesTransferencia {
  success: boolean
  pedido_id: string
  total_tiendas: number
  transferencias_creadas: number
  transferencias_errores: number
  /** Tiendas cuyo ITR quedó "pendiente_confirmacion" (SAP devolvió 202/job encolado, o se
   * agotaron los reintentos sin un rechazo definitivo) -- no son error ni éxito confirmado
   * todavía. Sin este campo, creadas + errores puede sumar menos que total_tiendas sin que
   * el modal explique por qué (ver bug detectado 2026-08-31: "4 exitosas, 0 con errores"
   * con una 5ta tienda invisible que el badge "Reintentar ST" de la tabla sí mostraba). */
  transferencias_pendientes_confirmacion?: number
  resultados: SolicitudTransferenciaResultado[]
  /** Lista para el modal: una entrada por ITR con DocNum y tienda (rellenado por backend) */
  itrs_por_tienda?: ItrPorTienda[]
}

// ========== Listado de Pedidos con Filtros (HU-02, HU-07) ==========

/**
 * Pedido resumido para listado (sin detalles completos)
 */
export interface PedidoResumido {
  pedido_id: string
  numero_pedido: string
  fecha_pedido: string | null
  fecha_entrega: string | null
  forma_pago: string | null
  mensaje: string | null
  proveedor_nombre: string | null
  comprador_nombre: string | null
  comprador_codigo: string | null
  origen_traslado: string | null
  serie: string | null
  archivo_nombre: string
  creado_por: string | null
  estado: string
  creado_en: string
  modificado_fecha: string | null
  modificado_por: string | null
}

/**
 * Metadata de paginación para listado de pedidos
 */
export interface PedidosListadoMetadata {
  total: number
  limit: number
  offset: number
  has_more: boolean
}

/**
 * Respuesta del endpoint GET /api/pedidos
 */
export interface PedidosListadoResponse {
  status: 'success'
  data: PedidoResumido[]
  metadata: PedidosListadoMetadata
}

/**
 * Filtros disponibles para el listado de pedidos
 */
// ========== Verificación de existencia de pedidos ==========
export interface TienePedidosResponse {
  status: string
  tiene_pedidos: boolean
  message: string
}

/** Columna de fecha sobre la que aplica fecha_desde/fecha_hasta (default: 'pedido') */
export type TipoFechaFiltro = 'pedido' | 'entrega' | 'facturacion'

export interface PedidosListadoFiltros {
  estado?: string
  fecha_desde?: string
  fecha_hasta?: string
  tipo_fecha?: TipoFechaFiltro
  proveedor_nombre?: string
  numero_pedido?: string
  creado_por?: string
  limit?: number
  offset?: number
  /** Si true, excluye BORRADOR, NUEVO PEDIDO, GESTIONAR PEDIDO y CANCELADO (solo muestra estado_id >= 4 y != 19) */
  solo_redistribucion?: boolean
  /** Si true, solo pedidos que requieren acción del proveedor (paginado en servidor) */
  solo_pendientes_accion?: boolean
  /** Si true, restringe a NUEVO_PEDIDO/GESTIONAR_PEDIDO (pantalla Producción El Rayo, req. 1.8) */
  solo_produccion_elrayo?: boolean
}

// ========== Estados de Pedido (dropdown dinámico) ==========

/** Representa un estado de pedido devuelto por GET /api/pedidos/estados */
export interface EstadoPedidoOption {
  id: number
  nombre: string
  orden: number
}

/** Respuesta del endpoint GET /api/pedidos/estados */
export interface EstadosPedidoResponse {
  status: string
  data: EstadoPedidoOption[]
}

// ========== HU-08: Exportación de Pedidos a Formato MBA ==========

/**
 * Parámetros de configuración para exportar pedido a formato plano MBA
 * Estos parámetros corresponden a las columnas del formato de importación de PEDIDOS DE CLIENTES de MBA
 */
export interface ExportarMBAParams {
  /** Código del cliente en MBA (ej: CLI0495) - Columna 3 */
  codigo_cliente: string
  /** Código de subcliente en MBA (ej: GO05) - Columna 4, dejar vacío si no aplica */
  codigo_subcliente?: string
  /** Código de moneda (ej: US, PEN) - Columna 7, default: US */
  moneda?: string
  /** Código de bodega en MBA (ej: BPT) - Columna 8 */
  bodega: string
  /** Código del vendedor en MBA (ej: JPC) - Columna 9 */
  vendedor: string
  /** Número de pedido para agrupar líneas en MBA - Columna 2, default: 1 */
  numero_pedido_mba?: number
  /** Si true, consolida las cantidades por producto (ignora tiendas) */
  consolidado?: boolean
  /** Si true, incluye las 19 líneas de encabezado del formato MBA */
  incluir_encabezado?: boolean
  /** Formato de salida: 'csv' o 'txt' (por defecto 'txt') */
  formato?: 'csv' | 'txt'
}

/**
 * Valores por defecto para los parámetros de exportación MBA
 */
export const EXPORTAR_MBA_DEFAULTS: Partial<ExportarMBAParams> = {
  codigo_subcliente: '',
  moneda: 'US',
  numero_pedido_mba: 1,
  consolidado: false,
  incluir_encabezado: true,
}

// ========== Info Archivo Plantilla (Storage MinIO/S3) ==========

/**
 * Información del archivo de plantilla almacenado en MinIO/S3
 * Respuesta de GET /api/plantillas/{pedido_id}/info-archivo
 */
export interface InfoArchivoPlantilla {
  archivo_id: string
  pedido_id: string
  nombre_original: string
  nombre_storage: string
  content_type: string
  tamanio_bytes: number
  hash_md5?: string | null
  fecha_subida: string
  subido_por: string
  descargas_count: number
  ultima_descarga?: string | null
}

/**
 * Respuesta del endpoint GET /api/plantillas/{pedido_id}/info-archivo
 */
export interface InfoArchivoPlantillaResponse {
  existe: boolean
  archivo?: InfoArchivoPlantilla
  url_descarga?: string
  message?: string
}

// ========== Búsqueda de Plantillas (Cargar Plantilla) ==========

/**
 * Resultado de búsqueda de plantillas por número de pedido
 * Usado en el input de búsqueda de "Cargar Plantilla"
 */
export interface BuscarPlantillaResultado {
  pedido_id: string
  numero_pedido: string
  estado: string
  fecha_pedido: string | null
  proveedor_nombre: string | null
  creado_en: string | null
}

/**
 * Respuesta del endpoint GET /api/plantillas/buscar?numero_pedido={query}
 */
export interface BuscarPlantillasResponse {
  status: 'success'
  data: BuscarPlantillaResultado[]
  total: number
  query: string
}

/**
 * Respuesta del endpoint GET /api/plantillas/pedidos
 * Este endpoint incluye pedidos en estado BORRADOR (a diferencia de GET /api/pedidos)
 */
export interface PlantillasPedidosResponse {
  status: 'success'
  data: PedidoResumido[]
  metadata: PedidosListadoMetadata
}

// ========== Listado de Archivos Originales (MinIO/S3) ==========

/**
 * Archivo Excel original almacenado en MinIO/S3
 * Respuesta de GET /api/plantillas/archivos
 */
export interface ArchivoOriginalItem {
  archivo_id: string
  pedido_id: string
  numero_pedido: string
  nombre_original: string
  nombre_storage: string
  content_type: string
  tamanio_bytes: number
  hash_md5?: string | null
  fecha_subida: string
  subido_por: string
  descargas_count: number
  ultima_descarga?: string | null
  activo: boolean
}

/**
 * Respuesta del endpoint GET /api/plantillas/archivos
 */
export interface ListadoArchivosOriginalesResponse {
  status: 'success'
  data: ArchivoOriginalItem[]
  total: number
  message?: string
}

/**
 * Respuesta del endpoint DELETE /api/plantillas/archivos/{archivo_id}
 */
export interface EliminarArchivoOriginalResponse {
  status: 'success'
  message: string
  archivo_id: string
  eliminado_fisicamente: boolean
}