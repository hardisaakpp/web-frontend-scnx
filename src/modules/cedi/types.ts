// Tipos del módulo CEDI. Se van completando a medida que avanzan los prompts
// (P-003 en adelante trae las entidades de negocio: Odc, Grupo, TransferenciaSolicitud, etc.)

/** Espejo de Common/Responses/HealthResponse.cs en SCNexus.Cedi.API */
export interface CediHealth {
  status: 'healthy' | 'degraded'
  timestamp: string
  version: string
  database: 'connected' | 'disconnected' | 'unknown'
}

/** Espejo de Common/Responses/ApiErrorResponse.cs — shape de error de toda la API CEDI */
export interface CediApiError {
  error: string
  message: string
  statusCode: number
  correlationId: string
  timestamp: string
}

/** Espejo de Common/Responses/PagedResult.cs */
export interface PagedResult<T> {
  data: T[]
  totalCount: number
  page: number
  pageSize: number
}

// ── ODC (P-004) ───────────────────────────────────────────────────────────────

export type OdcEstado = 'Abierta' | 'Cerrada' | 'Cancelada'

/** Espejo de Services/Odc/Dtos/OdcDtos.cs → OdcFilterDto */
export interface OdcFilterDto {
  numDoc?: string
  estado?: OdcEstado
  almacen?: string
  fechaDesde?: string
  fechaHasta?: string
}

export interface OdcDto {
  id: string
  numDoc: string
  proveedor: string
  estado: OdcEstado
  almacen: string
  fechaCreacion: string
  cantidadLineas: number
}

export interface OdcLineaDto {
  id: string
  itemCode: string
  codigoBarras: string | null
  descripcion: string
  cantidadPedida: number
  cantidadRecibida: number
  umd: string
}

export interface OdcDetailDto extends OdcDto {
  lineas: OdcLineaDto[]
}

export interface SyncOdcResult {
  paginasConsultadas: number
  odcsVistas: number
  odcsNuevas: number
  odcsActualizadas: number
  filasDescartadas: number
}

// ── ODC Picking (P-005) ───────────────────────────────────────────────────────

export type SesionEstado = 'Abierta' | 'Cerrada'
export type LineaPickingEstado = 'Pendiente' | 'Escaneado' | 'Completado'

export interface OdcPickingLineDto {
  id: string
  itemCode: string
  descripcion: string
  codigoBarras: string | null
  cantidad: number
  cantidadEscaneada: number
  estado: LineaPickingEstado
}

export interface OdcPickingSessionDto {
  id: string
  odcId: string
  numDoc: string
  estado: SesionEstado
  fechaInicio: string
  fechaCierre: string | null
  bloqueadaEnSap: boolean
  cantidadEscaneada: number
  lineas: OdcPickingLineDto[]
}

/** Un escaneo pendiente de sincronizar (vive en localStorage hasta que se confirma). */
export interface ScanBatchItemDto {
  itemCode: string
  cantidad: number
}

export interface ScanItemOutcome {
  itemCode: string
  cantidad: number
  motivo: string | null
}

export interface ScanBatchResultDto {
  aceptados: ScanItemOutcome[]
  rechazados: ScanItemOutcome[]
  sesion: OdcPickingSessionDto
}

/** Reset / marcar-completo por ítem — requieren permiso cedi.odc.picking.supervisor. */
export interface LineActionRequest {
  itemCode: string
  motivo?: string | null
}

export interface CompleteAllRequest {
  motivo?: string | null
}
