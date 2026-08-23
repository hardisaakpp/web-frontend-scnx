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
  /** P-007: true una vez que se creó el GoodsReceipt en SAP para esta sesión. */
  integradaSap: boolean
  goodsReceiptDocEntry: number | null
  goodsReceiptDocNum: number | null
  /** Último error al intentar integrar a SAP (se limpia en el próximo intento exitoso). */
  ultimoErrorIntegracion: string | null
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

// ── Distribución / Crossdocking (P-008 a P-011) ──────────────────────────────────────────

export type TransferenciaEstado = 'Abierta' | 'Parcial' | 'Cerrada'
export type TipoGrupo = 'Reposicion' | 'Crossdocking'
export type GrupoEstado = 'Nuevo' | 'Recolectando' | 'Empaquetando' | 'Despachado'
export type GrupoPrioridad = 'Normal' | 'Urgente'

/** Espejo de Services/Distribucion/Dtos/DistribucionDtos.cs → SolicitudTransferenciaFilterDto */
export interface SolicitudTransferenciaFilterDto {
  numDoc?: string
  estado?: TransferenciaEstado
  almacenOrigen?: string
  tiendaDestino?: string
  /** true = solo las que todavía no entraron a ningún grupo y siguen abiertas. */
  soloDisponibles?: boolean
}

export interface SolicitudTransferenciaDto {
  id: string
  numDoc: string
  comentarios: string | null
  almacenOrigen: string
  tiendaDestino: string
  fechaCreacion: string
  estado: TransferenciaEstado
  cantidadSolicitada: number
  cantidadTransferida: number
  cantidadLineas: number
  disponible: boolean
  grupoId: string | null
}

export interface SolicitudTransferenciaLineaDto {
  id: string
  itemCode: string
  codigoBarras: string | null
  descripcion: string
  cantidadPedida: number
  cantidadPendiente: number
  umd: string
}

export interface SolicitudTransferenciaDetailDto extends SolicitudTransferenciaDto {
  lineas: SolicitudTransferenciaLineaDto[]
}

export interface SyncSotResult {
  paginasConsultadas: number
  solicitudesVistas: number
  solicitudesNuevas: number
  solicitudesActualizadas: number
  filasDescartadas: number
}

// ── Grupo (P-008 — "Crear Grupo") ────────────────────────────────────────────────────────

export interface CrearGrupoRequest {
  nombre: string
  almacen: string
  tipo: TipoGrupo
  prioridad: GrupoPrioridad
  solicitudIds: string[]
}

export interface GrupoDto {
  id: string
  nombre: string
  almacen: string
  tipo: TipoGrupo
  estado: GrupoEstado
  prioridad: GrupoPrioridad
  operadorAsignado: string | null
  fechaCreacion: string
  cantidadArticulos: number
  cantidadSolicitudes: number
}

export interface GrupoSolicitudDto {
  transferenciaSolicitudId: string
  numDoc: string
  tiendaDestino: string
  cantidad: number
}

export interface GrupoDetailDto extends GrupoDto {
  solicitudes: GrupoSolicitudDto[]
}

export interface CrearGrupoResultDto {
  grupo: GrupoDetailDto
  solicitudesNoBloqueadasEnSap: string[]
}

// ── Picking por Artículos / por Documento (P-009 / P-010) ───────────────────────────────

export interface ArticuloTransversalDto {
  itemCode: string
  descripcion: string
  codigoBarras: string | null
  umd: string
  cantidadTotal: number
  cantidadEscaneada: number
  cantidadTiendas: number
  estado: LineaPickingEstado
}

export interface PickingSessionDto {
  id: string
  grupoId: string
  grupoNombre: string
  estado: SesionEstado
  fechaInicio: string
  fechaCierre: string | null
  cantidadEscaneadaTotal: number
  articulos: ArticuloTransversalDto[]
}

export interface DistribucionScanBatchItemDto {
  itemCode: string
  cantidad: number
}

export interface DistribucionScanItemOutcome {
  itemCode: string
  cantidad: number
  motivo: string | null
}

export interface DistribucionScanBatchResultDto {
  aceptados: DistribucionScanItemOutcome[]
  rechazados: DistribucionScanItemOutcome[]
  sesion: PickingSessionDto
}

export interface PickingLineDetailDto {
  id: string
  itemCode: string
  descripcion: string
  codigoBarras: string | null
  umd: string
  cantidadSolicitada: number
  cantidadEscaneada: number
  estado: LineaPickingEstado
}

export interface SolicitudPickingDetailDto {
  transferenciaSolicitudId: string
  numDoc: string
  tiendaDestino: string
  cantidadTotal: number
  cantidadEscaneada: number
  lineas: PickingLineDetailDto[]
}

export interface CompletarSolicitudRequest {
  motivo?: string | null
}

// ── Integración a SAP (P-011 — StockTransfer) ────────────────────────────────────────────

export interface SolicitudIntegracionDto {
  transferenciaSolicitudId: string
  numDoc: string
  tiendaDestino: string
  integradaSap: boolean
  stockTransferDocEntry: number | null
  stockTransferDocNum: number | null
  ultimoErrorIntegracion: string | null
}

export interface IntegrarStockTransferResultDto {
  grupoId: string
  grupoEstado: GrupoEstado
  solicitudes: SolicitudIntegracionDto[]
}

// ── Reubicación — Consulta Stock (P-012) ─────────────────────────────────────────────────

export interface ItemBusquedaDto {
  itemCode: string
  descripcion: string
  codigoBarras: string | null
  umd: string | null
}

export interface StockAlmacenDto {
  almacen: string
  enStock: number
  comprometido: number
  bloqueado: boolean
}

export interface ConsultaStockDto {
  itemCode: string
  umd: string | null
  almacenes: StockAlmacenDto[]
}

export interface CompleteAllRequest {
  motivo?: string | null
}
