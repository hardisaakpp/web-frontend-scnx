/**
 * Tipos del módulo Integraciones. Reflejan los contratos de api-middleware-sap
 * (docs/api.md de ese repo): /webpos/sync-status, los endpoints retry de webpos, /jobs y /api-logs.
 */

// ─── HITELL (WEBPOS) ─────────────────────────────────────────────────────────

/** ST = transferencia de stock (OWTR), GR = entrada de mercadería (OPDN). */
export type HitellDocType = 'ST' | 'GR'

/** Estado persistido en pos_sync_status. */
export type HitellStatus = 'SYNCED' | 'REJECTED' | 'SKIPPED_NOT_POS'

/** Lectura de negocio que el middleware ya interpreta para la UI. */
export type HitellResult = 'INTEGRADO' | 'NO_CORRESPONDE' | 'RECHAZADO'

export type HitellRejectionType = 'PRODUCTO_NO_EXISTE' | 'OTRO'

export interface HitellRejectedItem {
  itemCode: string | null
  codBusiness: string | null
  message: string
  type: string
}

export interface HitellRejection {
  type: HitellRejectionType
  description: string
  items: HitellRejectedItem[]
  retryEndpoint: string
}

export interface HitellSyncStatus {
  docType: HitellDocType
  docEntry: number
  /** Número visible del documento en SAP. La API omite el campo (undefined) o manda null en filas anteriores a la columna doc_num. */
  docNum?: number | null
  status: HitellStatus
  result: HitellResult
  reason: string | null
  attempts: number
  createdAt: string
  updatedAt: string | null
  rejection?: HitellRejection | null
}

export interface HitellSyncFilters {
  status: HitellStatus | ''
  docType: HitellDocType | ''
  rejectionType: HitellRejectionType | ''
  /** Búsqueda puntual por número de documento SAP. */
  docNum: number | null
  /** Fecha (YYYY-MM-DD) del input; se envía como inicio del día. */
  desde: string
  /** Fecha (YYYY-MM-DD) del input; se envía como fin del día. */
  hasta: string
  page: number
  pageSize: number
}

export interface HitellSyncPage extends Omit<PagedResponse<HitellSyncStatus>, 'items'> {
  entries: HitellSyncStatus[]
}

/** Resultado del reintento manual (WebPosSyncInfo del middleware). */
export type HitellRetryStatus = 'Synced' | 'SkippedNotPos' | 'Rejected' | 'Queued' | 'Error'

export interface HitellRetryResponse {
  status: HitellRetryStatus
  reason?: string | null
  jobId?: string | null
}

// ─── Cola SAP (job_queue) ────────────────────────────────────────────────────

export type SapJobStatus = 'ENCOLADO' | 'PROCESANDO' | 'COMPLETADO' | 'ERROR'

export interface SapJob {
  jobId: string
  endpoint: string
  requestType?: string | null
  status: SapJobStatus
  httpStatusCode: number | null
  /** Solo en el detalle (GET /jobs/{id}). */
  request?: unknown
  /** Solo en el detalle (GET /jobs/{id}). */
  result?: unknown
  error?: string | null
  attempts: number
  createdAt: string
  updatedAt: string | null
}

export interface SapJobFilters {
  status: SapJobStatus | ''
  endpoint: string
  /** Fecha (YYYY-MM-DD) del input; se envía como inicio del día. */
  desde: string
  /** Fecha (YYYY-MM-DD) del input; se envía como fin del día. */
  hasta: string
  page: number
  pageSize: number
}

// ─── Bitácora (api_log) ──────────────────────────────────────────────────────

export interface BitacoraEntry {
  id: number
  endpoint: string
  /** Hora local de Ecuador (UTC-5), tal como la guarda el middleware. */
  fecha: string
  usuario: string
  statusCode: number
  duracionMs: number
  /** Solo en el detalle (GET /api-logs/{id}). */
  request?: string | null
  /** Solo en el detalle (GET /api-logs/{id}). */
  response?: string | null
}

export interface BitacoraFilters {
  endpoint: string
  usuario: string
  statusCode: number | null
  onlyErrors: boolean
  desde: string
  hasta: string
  page: number
  pageSize: number
}

// ─── Común ───────────────────────────────────────────────────────────────────

export interface PagedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
