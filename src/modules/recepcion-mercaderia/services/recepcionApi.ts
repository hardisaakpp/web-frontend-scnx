import api from '@/services/api'
import type {
  PendingTransferLine,
  TransitPendingTransfer,
  ReceptionTransfer,
  ReceptionLine,
  HistoryRow,
  Difference,
  SaveScanProgressRequest,
  ConfirmTransferRequest,
  ConfirmTransferResponse,
  GlpiTicketRequest,
  RecordDifferenceRequest,
  HistoryFilters,
  PagedResponse,
  PageParams,
} from '../types'

// Proxy prefix rewritten by Vite/Nginx: /api/recepcion-api -> /api on api-recepcion-mercaderia.
// Backend routes live under /api/reception/*.
const BASE = 'recepcion-api/reception'

// --- Wire-shape mapping (backend camelCase JSON -> this module's internal field names) -----
// Verified against Reception.Api/Contracts/ReceptionTransferResponses.cs. The backend keys a
// transfer by `id` (not `transferId`), the request number by `sapTransferRequestNumber` (not
// `documentNumber`), and the GLPI value by `glpiTicketNumber` (not `glpiTicket`). Mapping once,
// here, keeps every store/view/test using the module's own established naming.

interface WireReceptionTransferLine {
  id: number
  sapItemCode: string
  description: string
  barcode: string | null
  requestedQuantity: number
  scannedQuantity: number
}

interface WireReceptionTransfer {
  id: number
  sapTransferRequestNumber: string
  originWarehouseCode: string
  destinationWarehouseCode: string
  // Real backend field (ReceptionTransferResponse.TransitWarehouseCode, nullable) — the "bodega
  // transitoria" for this transfer, when one exists. Only consumed by the Historial "Movimiento"
  // column (see mapHistoryRow) — HistoryRow, not ReceptionTransfer, is the primary need here.
  transitWarehouseCode: string | null
  responsibleName: string | null
  courierWaybillNumber: string | null
  glpiTicketNumber: string | null
  isConfirmed: boolean
  materializedAtUtc: string
  confirmedAtUtc: string | null
  sapStockTransferDocEntry: number | null
  sapStockTransferDocNum: number | null
  integrationMessage: string | null
  createdByUserId: string
  createdByUserName: string
  lines: WireReceptionTransferLine[]
  differencesCount: number
  // Set when a confirm's SAP call was queued instead of resolved inline; null when nothing is
  // pending. See ReceptionTransfer.pendingSapJobQueuedAtUtc.
  pendingSapJobQueuedAtUtc: string | null
}

interface WireDifference {
  id: number
  receptionTransferId: number
  barcode: string
  productDescription: string | null
  isRecognized: boolean
  scannedAtUtc: string
  scannedByUserId: string
}

function mapDifference(d: WireDifference): Difference {
  return {
    differenceId: d.id,
    transferId: d.receptionTransferId,
    barcode: d.barcode,
    productDescription: d.productDescription,
    isRecognized: d.isRecognized,
    scannedAtUtc: d.scannedAtUtc,
    scannedByUserId: d.scannedByUserId,
  }
}

function mapLine(line: WireReceptionTransferLine): ReceptionLine {
  return {
    lineId: line.id,
    itemCode: line.sapItemCode,
    itemName: line.description,
    quantity: line.requestedQuantity,
    scanned: line.scannedQuantity,
    barcode: line.barcode,
  }
}

function mapTransfer(t: WireReceptionTransfer): ReceptionTransfer {
  return {
    transferId: t.id,
    documentNumber: t.sapTransferRequestNumber,
    originWarehouseCode: t.originWarehouseCode,
    destinationWarehouseCode: t.destinationWarehouseCode,
    transitWarehouseCode: t.transitWarehouseCode,
    // No explicit status field on the wire — derived. 'error' is only ever set locally by the
    // store (e.g. SAP-confirm failure), never returned by a successful response.
    status: t.isConfirmed ? 'confirmed' : 'in-progress',
    glpiTicket: t.glpiTicketNumber,
    responsibleName: t.responsibleName,
    courierWaybillNumber: t.courierWaybillNumber,
    lines: t.lines.map(mapLine),
    materializedAtUtc: t.materializedAtUtc,
    confirmedAtUtc: t.confirmedAtUtc,
    sapStockTransferDocEntry: t.sapStockTransferDocEntry,
    sapStockTransferDocNum: t.sapStockTransferDocNum,
    differencesCount: t.differencesCount,
    pendingSapJobQueuedAtUtc: t.pendingSapJobQueuedAtUtc,
  }
}

function mapHistoryRow(t: WireReceptionTransfer): HistoryRow {
  return {
    transferId: t.id,
    documentNumber: t.sapTransferRequestNumber,
    warehouseCode: t.destinationWarehouseCode,
    materializedAtUtc: t.materializedAtUtc,
    differencesCount: t.differencesCount,
    glpiTicket: t.glpiTicketNumber,
    originWarehouseCode: t.originWarehouseCode,
    destinationWarehouseCode: t.destinationWarehouseCode,
    transitWarehouseCode: t.transitWarehouseCode,
    responsibleName: t.responsibleName,
    courierWaybillNumber: t.courierWaybillNumber,
    lines: t.lines.map(mapLine),
    sapStockTransferDocNum: t.sapStockTransferDocNum,
  }
}

const recepcionApi = {
  // Pending transfers — real server-side pagination (verified ListPendingTransferRequestsQuery:
  // pageNumber/pageSize, same PagedResponse envelope as in-progress/history). Lines are
  // identified by (sapTransferRequestNumber, itemCode), no id — nothing to map here.
  getPendingTransfers: async (params: PageParams = {}): Promise<PagedResponse<PendingTransferLine>> => {
    const response = await api.get<PagedResponse<PendingTransferLine>>(`${BASE}/pending-transfers`, {
      params: {
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search ?? undefined,
      },
    })
    return response.data
  },

  // Transit-warehouse report — separate endpoint from getPendingTransfers above (branch
  // fix/pending-transfers-transit-warehouse-filter): one row per SAP transfer request routed
  // through a transit warehouse, quantity already summed server-side. Same PagedResponse
  // envelope/pagination as the other list endpoints. `search` (added later on the same branch)
  // filters by sapTransferRequestNumber or transitWarehouseCode, same behavior as
  // getPendingTransfers' own search param.
  getTransitTransfers: async (params: PageParams = {}): Promise<PagedResponse<TransitPendingTransfer>> => {
    const response = await api.get<PagedResponse<TransitPendingTransfer>>(`${BASE}/pending-transfers/transit`, {
      params: {
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 20,
        search: params.search ?? undefined,
      },
    })
    return response.data
  },

  // Unpaginated xlsx export (2 sheets: "Documentos" summary + "Detalle" per-item) of the full
  // transit-warehouse list — same permission and blob-download pattern as the other 3 reports.
  downloadTransitReport: async (): Promise<Blob> => {
    const response = await api.get<Blob>(`${BASE}/pending-transfers/transit/report`, {
      responseType: 'blob',
    })
    return response.data
  },

  // Real body: { sapTransferRequestNumber, warehouseCode } — there is no transferId to send,
  // the pending line has none. Response is `{ id }` (the newly received transfer's id).
  materializePendingTransfer: async (sapTransferRequestNumber: string, warehouseCode: string): Promise<number> => {
    const response = await api.post<{ id: number }>(`${BASE}/pending-transfers/materialize`, {
      sapTransferRequestNumber,
      warehouseCode,
    })
    return response.data.id
  },

  // In-progress — real server-side pagination (verified InProgressTransfersController: only
  // pageNumber/pageSize query params, NO filter params). Returns the full envelope so the
  // caller/store has totalCount for a real pager; items are mapped to this module's shape.
  getInProgressTransfers: async (params: PageParams = {}): Promise<PagedResponse<ReceptionTransfer>> => {
    const response = await api.get<PagedResponse<WireReceptionTransfer>>(`${BASE}/in-progress`, {
      params: { pageNumber: params.pageNumber ?? 1, pageSize: params.pageSize ?? 20 },
    })
    return { ...response.data, items: response.data.items.map(mapTransfer) }
  },

  // GET /transfers/{id} returns { transfer, differences } (ReceptionTransferForScanningResponse)
  // — the differences array is the only source of truth for previously-persisted differences
  // (there is no separate GET-differences endpoint), so callers must use both parts, not just
  // `.transfer`, or a page reload silently loses the display of already-recorded differences.
  getTransfer: async (transferId: number): Promise<{ transfer: ReceptionTransfer; differences: Difference[] }> => {
    const response = await api.get<{ transfer: WireReceptionTransfer; differences: WireDifference[] }>(
      `${BASE}/transfers/${transferId}`
    )
    return {
      transfer: mapTransfer(response.data.transfer),
      differences: response.data.differences.map(mapDifference),
    }
  },

  // Real body: SaveScanProgressRequest(ResponsibleName?, CourierWaybillNumber?, Scans: [{LineId,
  // ScannedQuantity}]) — ScannedQuantity is absolute (sets the line's total, not an increment).
  // Endpoint returns 204 No Content; the store re-fetches the transfer afterward to pick up the
  // new scanned totals rather than trying to synthesize them client-side.
  scan: async (transferId: number, body: SaveScanProgressRequest): Promise<void> => {
    await api.post(`${BASE}/transfers/${transferId}/scan`, {
      responsibleName: body.responsibleName ?? null,
      courierWaybillNumber: body.courierWaybillNumber ?? null,
      scans: body.scans,
    })
  },

  // Response is ConfirmReceptionTransferResult's own shape { success, sapDocEntry, sapDocNum,
  // message, reason? } — not a WireReceptionTransfer, so no mapping needed beyond passing it
  // through. The caller still re-fetches the transfer afterward for the canonical post-confirm
  // state (same 204-then-refetch pattern as scan() above) — pendingSapJobQueuedAtUtc on that
  // refetched transfer, not this response, is the durable signal for a queued SAP job.
  confirm: async (transferId: number, body: ConfirmTransferRequest = {}): Promise<ConfirmTransferResponse> => {
    const response = await api.post<ConfirmTransferResponse>(`${BASE}/transfers/${transferId}/confirm`, {
      allowPartial: body.allowPartial ?? false,
    })
    return response.data
  },

  updateGlpiTicket: async (transferId: number, body: GlpiTicketRequest): Promise<ReceptionTransfer> => {
    // Real body key is ticketNumber, not glpiTicket — PUT returns 204 No Content per
    // ScanningController.UpdateGlpiTicket, so re-fetch to get the transfer back in sync
    // (the store's callers expect the updated transfer/glpiTicket value back).
    await api.put(`${BASE}/transfers/${transferId}/glpi-ticket`, { ticketNumber: body.glpiTicket })
    return (await recepcionApi.getTransfer(transferId)).transfer
  },

  // Real RecordDifferenceRequest only accepts a barcode (no lineId/reason/quantity) — that part
  // was already correct. The response, however, is just { id } (DifferencesController.RecordDifference
  // returns Ok(new { id }), not the full ReceptionDifferenceResponse) — the real productDescription/
  // isRecognized/scannedAtUtc/scannedByUserId only exist in GET /transfers/{id}'s differences array,
  // so the caller (pickingStore) re-fetches the transfer afterward to pick up the real record,
  // exactly like scan()'s 204-then-refetch pattern above.
  recordDifference: async (transferId: number, body: RecordDifferenceRequest): Promise<void> => {
    await api.post<{ id: number }>(`${BASE}/transfers/${transferId}/differences`, {
      barcode: body.barcode,
    })
  },

  deleteDifference: async (differenceId: number) => {
    const response = await api.delete(`${BASE}/differences/${differenceId}`)
    return response.data
  },

  downloadDifferencesReport: async (transferId: number) => {
    const response = await api.get<Blob>(`${BASE}/transfers/${transferId}/differences/report`, {
      responseType: 'blob',
    })
    return response.data
  },

  downloadPickingReport: async (transferId: number) => {
    const response = await api.get<Blob>(`${BASE}/transfers/${transferId}/picking/report`, {
      responseType: 'blob',
    })
    return response.data
  },

  // History — real server-side pagination AND filtering (verified HistoryController: dateFrom/
  // dateTo/transferNumber + pageNumber/pageSize all accepted together on the same endpoint).
  getHistory: async (filters: HistoryFilters = {}, params: PageParams = {}): Promise<PagedResponse<HistoryRow>> => {
    const response = await api.get<PagedResponse<WireReceptionTransfer>>(`${BASE}/history`, {
      params: {
        dateFrom: filters.fromUtc ?? undefined,
        dateTo: filters.toUtc ?? undefined,
        transferNumber: filters.transferNumber ?? undefined,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 20,
      },
    })
    return { ...response.data, items: response.data.items.map(mapHistoryRow) }
  },

  getAllHistory: async (filters: HistoryFilters = {}, params: PageParams = {}): Promise<PagedResponse<HistoryRow>> => {
    const response = await api.get<PagedResponse<WireReceptionTransfer>>(`${BASE}/history/all`, {
      params: {
        dateFrom: filters.fromUtc ?? undefined,
        dateTo: filters.toUtc ?? undefined,
        transferNumber: filters.transferNumber ?? undefined,
        pageNumber: params.pageNumber ?? 1,
        pageSize: params.pageSize ?? 20,
      },
    })
    return { ...response.data, items: response.data.items.map(mapHistoryRow) }
  },

  exportAllHistoryCsv: async (filters: HistoryFilters = {}) => {
    const response = await api.get<Blob>(`${BASE}/history/all/export`, {
      params: {
        dateFrom: filters.fromUtc ?? undefined,
        dateTo: filters.toUtc ?? undefined,
        transferNumber: filters.transferNumber ?? undefined,
      },
      responseType: 'blob',
    })
    return response.data
  },

  // Own-warehouse export — separate endpoint from exportAllHistoryCsv above, gated by nothing
  // beyond being logged in (no recepcion.history.viewall needed): the backend scopes the file to
  // whatever warehouses/warehouse-group the caller already has in Core, same as getHistory.
  exportHistoryCsv: async (filters: HistoryFilters = {}) => {
    const response = await api.get<Blob>(`${BASE}/history/export`, {
      params: {
        dateFrom: filters.fromUtc ?? undefined,
        dateTo: filters.toUtc ?? undefined,
        transferNumber: filters.transferNumber ?? undefined,
      },
      responseType: 'blob',
    })
    return response.data
  },
}

export default recepcionApi
