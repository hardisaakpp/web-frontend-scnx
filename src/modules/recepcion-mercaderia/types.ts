// DTOs for the Recepción de Mercadería module.
// Mirrors api-recepcion-mercaderia's Reception.Api response/request shapes (verified against
// Reception.Api/Contracts/*.cs and Reception.Application/Ports/IPendingTransferRequestPort.cs).
// Internal frontend field names (transferId, documentNumber, glpiTicket) are a deliberate
// abstraction over the wire shape (id, sapTransferRequestNumber, glpiTicketNumber) — the mapping
// happens once, at the recepcionApi.ts boundary, so stores/views never see raw backend casing.

/**
 * GET /pending-transfers item — a SAP transfer request line not yet materialized into a
 * {@link ReceptionTransfer}. Has NO numeric id: it's identified by
 * (sapTransferRequestNumber, itemCode).
 */
export interface PendingTransferLine {
  sapTransferRequestNumber: string
  itemCode: string
  barcode: string | null
  description: string
  openQuantity: number
  originWarehouseCode: string
  destinationWarehouseCode: string
  sapBaseDocEntry: number
  sapBaseLineNum: number
  sapDocumentDate: string
}

/**
 * GET /pending-transfers/transit item — one row per SAP transfer request routed through a
 * transit warehouse (bodega transitoria), quantity already summed across its lines server-side.
 * No wire-name mapping needed: the backend contract already uses these exact field names.
 */
export interface TransitPendingTransfer {
  sapTransferRequestNumber: string
  transitWarehouseCode: string
  quantity: number
  sapDocumentDate: string
}

export interface ReceptionLine {
  lineId: number
  itemCode: string
  itemName: string
  quantity: number
  scanned: number
  barcode: string | null
}

export type ReceptionTransferStatus = 'pending' | 'in-progress' | 'confirmed' | 'error'

export interface ReceptionTransfer {
  transferId: number
  documentNumber: string
  originWarehouseCode: string
  destinationWarehouseCode: string
  status: ReceptionTransferStatus
  glpiTicket?: string | null
  responsibleName?: string | null
  courierWaybillNumber?: string | null
  lines: ReceptionLine[]
  materializedAtUtc: string
  confirmedAtUtc?: string | null
  sapStockTransferDocEntry?: number | null
  sapStockTransferDocNum?: number | null
  differencesCount: number
}

/**
 * Real backend shape: ReceptionDifferenceResponse (Id, ReceptionTransferId, Barcode,
 * ProductDescription?, IsRecognized, ScannedAtUtc, ScannedByUserId). This does NOT carry a
 * lineId/reason/quantity the way this module's current differences form assumes — see
 * {@link RecordDifferenceRequest} for the flagged mismatch this type intentionally now reflects
 * (real, not the module's prior invented shape).
 */
export interface Difference {
  differenceId: number
  transferId: number
  barcode: string
  productDescription: string | null
  isRecognized: boolean
  scannedAtUtc: string
  scannedByUserId: string
}

// Request bodies

/**
 * Real backend: ScanLineRequest(LineId, ScannedQuantity) batched under SaveScanProgressRequest.
 * ScannedQuantity is an ABSOLUTE value (ReceptionTransferLine.ApplyScan sets it, does not add to
 * it) — the UI must submit the new total for a line, not an increment.
 */
export interface ScanLineRequest {
  lineId: number
  scannedQuantity: number
}

export interface SaveScanProgressRequest {
  responsibleName?: string | null
  courierWaybillNumber?: string | null
  scans: ScanLineRequest[]
}

export interface ConfirmTransferRequest {
  allowPartial?: boolean
}

/**
 * Real backend: UpdateGlpiTicketRequest(TicketNumber: string) — wire key is ticketNumber, not
 * glpiTicket. Frontend-facing name kept as glpiTicket; mapped at the recepcionApi.ts boundary.
 */
export interface GlpiTicketRequest {
  glpiTicket: string
}

/**
 * Real backend: RecordDifferenceRequest(Barcode: string) only — no lineId/reason/quantity. This
 * module's differences form UI still collects lineId+reason+quantity; recepcionApi.ts's
 * recordDifference is left UNCHANGED (not adapted) pending a product decision on whether the extra
 * fields get a real backend home or get dropped from the UI. This type documents the REAL shape
 * for whenever that redesign happens.
 */
export interface RecordDifferenceRequest {
  barcode: string
}

export interface HistoryFilters {
  fromUtc?: string | null
  toUtc?: string | null
  transferNumber?: string | null
}

export interface HistoryRow {
  transferId: number
  documentNumber: string
  warehouseCode: string
  materializedAtUtc: string
  differencesCount: number
  glpiTicket?: string | null
  originWarehouseCode?: string
  destinationWarehouseCode?: string
  responsibleName?: string | null
  courierWaybillNumber?: string | null
  lines?: ReceptionLine[]
  /**
   * Real backend field (ReceptionTransferResponse.SapStockTransferDocNum) — the SAP stock-
   * transfer document number issued on confirm. Null until the transfer is confirmed. Matches
   * legacy sc22's "Nueva Transferencia" column (confirmed real by user-supplied production
   * screenshot, see sdd/recepcion-mercaderia-module/history-columns-followup).
   */
  sapStockTransferDocNum?: number | null
  /**
   * Real backend field (ReceptionTransferResponse.TransitWarehouseCode, nullable) — the "bodega
   * transitoria" for this transfer line (e.g. real store RL-QSN's transit warehouse TRL-QSN). Per
   * legacy sc22's verified behavior, the Historial "Movimiento" column must show origin -> transit
   * when one exists, falling back to the real destination store otherwise.
   */
  transitWarehouseCode?: string | null
}

// Store status contract (design.md "Interfaces"). Drives degraded/error UI states.
export type FlowStatus = 'ready' | 'degraded' | 'error' | 'loading'

/**
 * Verified against api-recepcion-mercaderia's Contracts/PagedResponse.cs — wraps the response of
 * GET /in-progress, GET /history, and GET /history/all. Request-side: pageNumber (1-based, default
 * 1) and pageSize (default 20, server-clamped to max 100) as query params.
 */
export interface PagedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface PageParams {
  pageNumber?: number
  pageSize?: number
  /**
   * Server-side search filter for GET /pending-transfers (case-insensitive match on document
   * number / item code / description, per ListPendingTransferRequestsQuery). Other callers
   * (getInProgressTransfers/getHistory) simply never populate it.
   */
  search?: string | null
}
