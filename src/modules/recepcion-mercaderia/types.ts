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
  /**
   * Real backend field (ReceptionTransferResponse.TransitWarehouseCode, nullable) — the "bodega
   * transitoria" for this transfer, when one exists. The detail subtitle shows transitoria -> real
   * destination when set, falling back to origen -> real destination otherwise (same fallback
   * direction as HistoryRow's own transitWarehouseCode, used by the Historial "Movimiento" column).
   */
  transitWarehouseCode?: string | null
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
  /**
   * Real backend field — set when SAP queued the confirm instead of resolving it inline; a
   * background job retries every 5 min. Source of truth for a "procesando" UI state that survives
   * a page reload, independent of any single confirm() response (per backend team: don't rely on
   * the one-off confirm response for this — re-fetching the transfer is what stays correct).
   * Null/absent means there is nothing pending.
   */
  pendingSapJobQueuedAtUtc?: string | null
}

/**
 * Real backend shape: ReceptionDifferenceResponse (Id, ReceptionTransferId, Barcode?, LineId?,
 * ProductDescription?, IsRecognized, ScannedAtUtc, ScannedByUserId). Barcode is now nullable and
 * LineId was added: a difference is identified by exactly one of the two — Barcode for the
 * barcode-scan flow, LineId for the manual-entry flow on lines with no barcode.
 */
export interface Difference {
  differenceId: number
  transferId: number
  barcode: string | null
  lineId: number | null
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
 * Real backend: ConfirmReceptionTransferResult(Success, SapDocEntry, SapDocNum, Message, Reason?).
 * `reason` is only present when success is false:
 * - 'Queued' / 'StillPending' — SAP confirmation was queued, not an error. No user action needed;
 *   a background job retries every 5 min (plus reconciliation on a repeat confirm click).
 * - 'Rejected' — a real SAP validation/business-rule rejection that needs the user's attention.
 * Per backend team: use `reason`, not `message` text, to tell these apart — `message` is Spanish
 * text meant for direct display, not parsing.
 */
export interface ConfirmTransferResponse {
  success: boolean
  sapDocEntry: number | null
  sapDocNum: number | null
  message: string
  reason?: 'Queued' | 'StillPending' | 'Rejected'
}

/**
 * Real backend: UpdateGlpiTicketRequest(TicketNumber: string) — wire key is ticketNumber, not
 * glpiTicket. Frontend-facing name kept as glpiTicket; mapped at the recepcionApi.ts boundary.
 */
export interface GlpiTicketRequest {
  glpiTicket: string
}

/**
 * Real backend: RecordDifferenceRequest(Barcode?: string, LineId?: long) — exactly one of the two
 * must be non-null (the backend 400s otherwise). `barcode` is the scan flow (matches a line by
 * Barcode == barcode); `lineId` is the manual-entry flow for lines with no barcode (matches a line
 * by Id == lineId).
 */
export interface RecordDifferenceRequest {
  barcode?: string | null
  lineId?: number | null
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
