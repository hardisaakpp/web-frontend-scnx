// ═══════════════════════════════════════════════════════════════
// Tipos del módulo Conciliación Bancaria
// Generados a partir del OpenAPI del backend (localhost:8002)
// ═══════════════════════════════════════════════════════════════

// ── Wrapper universal de respuesta del backend ──────────────
export interface AppResponse<T = unknown> {
  success: boolean
  message: string | null
  data: T | null
  error_code: string | null
  details: unknown | null
  meta: Record<string, unknown> | null
}

// ── Dashboard ───────────────────────────────────────────────
export interface DashboardMetricas {
  titulo: string
  sap_pendientes_conteo: number
  sap_pendientes_monto: number
  banca_pendientes_conteo: number
  banca_pendientes_monto: number
  total_conciliaciones: number
  monto_conciliado: number
  es_mensual: boolean
  mm: number | null
  yyyy: number | null
}

export interface DashboardParams {
  mm?: number | string
  yyyy?: number | string
}

// ── Catálogo de Bancos ──────────────────────────────────────
export interface Banco {
  id_banco: number
  nombre_banco: string
  codigo_cuenta_sap: string
  activo?: boolean
}

// ── Banca — Importación de Excel ────────────────────────────
export interface CargaArchivo {
  id_carga: number
  nombre_archivo: string
  fecha_carga: string
  estado_carga: string
  tipo_origen: string
  registros_procesados: number
  usuario_carga: string | null
}

export interface ImportResult {
  registros_insertados: number
  registros_duplicados: number
  registros_con_error: number
  errores: any[]
}

// ── SAP — Sincronización ────────────────────────────────────
export interface SAPSyncRequest {
  fecha_desde: string // date YYYY-MM-DD
  fecha_hasta: string // date YYYY-MM-DD
}


export interface SAPSyncResponse {
  mensaje: string
  registros_insertados: number
  registros_actualizados: number
  registros_incompletos?: number
  fecha_inicio_filtro: string  // date
  fecha_fin_filtro: string     // date
  fecha_baja: string           // datetime
}

// ── Conciliación — Automática ───────────────────────────────
export interface ConciliacionRequest {
  id_banco?: number | null
  fecha_desde: string  // date YYYY-MM-DD (requerido)
  fecha_hasta: string  // date YYYY-MM-DD (requerido)
}

export interface ConciliacionResponse {
  id_proceso: string | null
  procesados: number
  total_monto: number
  sap_pendientes: number
  banca_pendientes: number
  mensaje: string | null
}

// ── Conciliación — Manual ───────────────────────────────────
export interface ConciliacionManualRequest {
  ids_sap: number[]
  ids_banca: number[]
  comentario?: string | null
  usuario?: string | null  // default "SYSTEM"
}

// ── Conciliación — Novedades ────────────────────────────────
export interface MovimientoSimple {
  id: string
  fecha: string  // date
  referencia: string
  codigo_unico?: string  // Nuevo campo del backend
  monto: number
  tipo: string
}

export interface NovedadGrupo {
  tipo_novedad: string
  referencia_comun: string | null
  monto_comun: number | null
  movimientos_sap: MovimientoSimple[]
  movimientos_banca: MovimientoSimple[]
  diferencia: number
}

export interface NovedadesResponse {
  novedades: NovedadGrupo[]
  total_casos: number
}

export interface NovedadesParams {
  id_banco?: number | null
  fecha_desde?: string
  fecha_hasta?: string
}

// ── Conciliación — Historial ────────────────────────────────
export interface ProcesoConciliacion {
  id: string
  fecha_proceso: string
  banco: string
  cuenta: string
  estado: string
  total_sap: number
  total_banco: number
  diferencia: number
  usuario_creacion: string
  created_at: string
}

export interface DetalleProcesoResponse {
  id_lote: string
  banco: string
  estado: string
  total_sap: number
  total_banco: number
  grupos: GrupoConciliado[]
}

export interface GrupoConciliado {
  id_grupo: string
  tipo: string
  monto_total: number
  comentario: string | null
  sap: MovimientoSimple[]
  banca: MovimientoSimple[]
}

export interface HistorialParams {
  id_banco?: number | null
  fecha_desde?: string | null
  fecha_hasta?: string | null
  estado?: string | null
}

// ── Reportes — Partidas Abiertas ────────────────────────────
export interface PartidaAbierta {
  id: string
  fecha: string  // date
  referencia: string
  monto: number
  origen: string            // SAP | BANCA
  descripcion: string | null
  banco: string | null
}

export interface ReportePartidasAbiertas {
  fecha_corte: string  // date
  pendientes_sap: PartidaAbierta[]
  pendientes_banca: PartidaAbierta[]
  total_monto_sap_pendiente: number
  total_monto_banca_pendiente: number
}

export interface PartidasAbiertasParams {
  fecha_corte?: string
  id_banco?: number | null
}

export interface MovimientoReporte {
  banco: string
  fecha: string
  referencia: string | null
  referencia2: string | null
  descripcion: string | null
  valor: number
  codigo_unico: string | null
  estado: string
  origen: string
  observacion: string | null
}

export interface ReporteMaestroParams {
  fecha_desde?: string | null
  fecha_hasta?: string | null
  id_banco?: number | null
  estado?: string | null
  referencia?: string | null
  valor?: number | null
}

// ── Reportes — SAP Incompletos ──────────────────────────────
export interface SAPIncompleto {
  id: number
  fecha: string
  banco: string
  cuenta: string
  trans_id: number
  line_id: number
  origen: string
  numero_origen: string
  monto: number
  referencia1: string
  observaciones: string
  info_detallada: string
  codigo_unico: string
}

// ── Validación (FastAPI) ────────────────────────────────────
export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail: ValidationError[]
}
