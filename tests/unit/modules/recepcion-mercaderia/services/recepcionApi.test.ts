import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '@/services/api'
import recepcionApi from '@/modules/recepcion-mercaderia/services/recepcionApi'

vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// Wire fixture matching the REAL backend's ReceptionTransferResponse (verified against
// api-recepcion-mercaderia's Reception.Api/Contracts/ReceptionTransferResponses.cs) — camelCase
// JSON, keyed by `id` (not `transferId`), `sapTransferRequestNumber` (not `documentNumber`),
// `glpiTicketNumber` (not `glpiTicket`), `isConfirmed` (not a status string).
function wireTransfer(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    sapTransferRequestNumber: 'DOC-7',
    originWarehouseCode: 'CD01',
    destinationWarehouseCode: 'T01',
    responsibleName: null,
    courierWaybillNumber: null,
    glpiTicketNumber: null,
    isConfirmed: false,
    materializedAtUtc: '2026-01-01T00:00:00Z',
    confirmedAtUtc: null,
    sapStockTransferDocEntry: null,
    sapStockTransferDocNum: null,
    integrationMessage: null,
    createdByUserId: 'u1',
    createdByUserName: 'user',
    lines: [{ id: 1, sapItemCode: 'A1', description: 'Item A', barcode: null, requestedQuantity: 10, scannedQuantity: 3 }],
    differencesCount: 0,
    ...overrides,
  }
}

describe('recepcionApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getPendingTransfers sends pageNumber/pageSize and unwraps the PagedResponse envelope (no id to map, unlike transfers)', async () => {
    const line = {
      sapTransferRequestNumber: 'DOC-1',
      itemCode: 'A1',
      barcode: null,
      description: 'Item A',
      openQuantity: 5,
      originWarehouseCode: 'CD01',
      destinationWarehouseCode: 'T01',
      sapBaseDocEntry: 1,
      sapBaseLineNum: 0,
      sapDocumentDate: '2026-01-01',
    }
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [line], totalCount: 1, pageNumber: 1, pageSize: 20 },
    })

    const result = await recepcionApi.getPendingTransfers({ pageNumber: 1, pageSize: 20 })

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/pending-transfers', {
      params: { pageNumber: 1, pageSize: 20 },
    })
    expect(result).toEqual({ items: [line], totalCount: 1, pageNumber: 1, pageSize: 20 })
  })

  it('getPendingTransfers defaults to pageNumber=1/pageSize=20 when called with no params', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 } })

    await recepcionApi.getPendingTransfers()

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/pending-transfers', {
      params: { pageNumber: 1, pageSize: 20 },
    })
  })

  it('getPendingTransfers forwards a truthy search term as a query param', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 } })

    await recepcionApi.getPendingTransfers({ pageNumber: 1, pageSize: 20, search: 'DOC-1' })

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/pending-transfers', {
      params: { pageNumber: 1, pageSize: 20, search: 'DOC-1' },
    })
  })

  it('getPendingTransfers omits the search param when not provided (no empty ?search= on the wire)', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 } })

    await recepcionApi.getPendingTransfers({ pageNumber: 1, pageSize: 20 })

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/pending-transfers', {
      params: { pageNumber: 1, pageSize: 20, search: undefined },
    })
  })

  it('getTransitTransfers sends pageNumber/pageSize/search and unwraps the PagedResponse envelope (separate endpoint from getPendingTransfers)', async () => {
    const line = {
      sapTransferRequestNumber: 'SAP-900',
      transitWarehouseCode: 'TRL-QSN',
      quantity: 12,
      sapDocumentDate: '2026-08-01',
    }
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [line], totalCount: 1, pageNumber: 1, pageSize: 20 },
    })

    const result = await recepcionApi.getTransitTransfers({ pageNumber: 1, pageSize: 20, search: 'SAP-900' })

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/pending-transfers/transit', {
      params: { pageNumber: 1, pageSize: 20, search: 'SAP-900' },
    })
    expect(result).toEqual({ items: [line], totalCount: 1, pageNumber: 1, pageSize: 20 })
  })

  it('getTransitTransfers omits the search param when not provided (no empty ?search= on the wire)', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 } })

    await recepcionApi.getTransitTransfers({ pageNumber: 1, pageSize: 20 })

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/pending-transfers/transit', {
      params: { pageNumber: 1, pageSize: 20, search: undefined },
    })
  })

  it('getTransitTransfers defaults to pageNumber=1/pageSize=20 when called with no params', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 } })

    await recepcionApi.getTransitTransfers()

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/pending-transfers/transit', {
      params: { pageNumber: 1, pageSize: 20 },
    })
  })

  it('downloadTransitReport requests a blob response for GET .../pending-transfers/transit/report (unpaginated)', async () => {
    const blob = new Blob(['xlsx'])
    vi.mocked(api.get).mockResolvedValue({ data: blob })

    const result = await recepcionApi.downloadTransitReport()

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/pending-transfers/transit/report', {
      responseType: 'blob',
    })
    expect(result).toBe(blob)
  })

  it('materializePendingTransfer POSTs { sapTransferRequestNumber, warehouseCode } (no transferId exists pre-materialization)', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 42 } })

    const result = await recepcionApi.materializePendingTransfer('DOC-1', 'T01')

    expect(api.post).toHaveBeenCalledWith('recepcion-api/reception/pending-transfers/materialize', {
      sapTransferRequestNumber: 'DOC-1',
      warehouseCode: 'T01',
    })
    expect(result).toBe(42)
  })

  it('getInProgressTransfers sends pageNumber/pageSize, unwraps items, and maps id->transferId etc.', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [wireTransfer()], totalCount: 1, pageNumber: 1, pageSize: 20 },
    })

    const result = await recepcionApi.getInProgressTransfers({ pageNumber: 1, pageSize: 20 })

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/in-progress', {
      params: { pageNumber: 1, pageSize: 20 },
    })
    expect(result.totalCount).toBe(1)
    expect(result.items[0]).toMatchObject({
      transferId: 7,
      documentNumber: 'DOC-7',
      status: 'in-progress',
    })
  })

  it('getInProgressTransfers maps isConfirmed=true to status "confirmed"', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [wireTransfer({ isConfirmed: true })], totalCount: 1, pageNumber: 1, pageSize: 20 },
    })

    const result = await recepcionApi.getInProgressTransfers()

    expect(result.items[0].status).toBe('confirmed')
  })

  it('getTransfer calls GET .../transfers/{id} and unwraps the { transfer, differences } envelope', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { transfer: wireTransfer(), differences: [] } })

    const result = await recepcionApi.getTransfer(7)

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/transfers/7')
    expect(result.transfer.transferId).toBe(7)
    expect(result.transfer.lines[0]).toMatchObject({ lineId: 1, itemCode: 'A1', quantity: 10, scanned: 3 })
    expect(result.differences).toEqual([])
  })

  it('getTransfer maps the real differences array (id/receptionTransferId -> differenceId/transferId), not just the transfer', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        transfer: wireTransfer(),
        differences: [
          {
            id: 9,
            receptionTransferId: 7,
            barcode: '7861230028713',
            productDescription: 'DNFK1017.4 FALDA DENIM',
            isRecognized: true,
            scannedAtUtc: '2026-07-24T19:31:53Z',
            scannedByUserId: 'user-1',
          },
        ],
      },
    })

    const result = await recepcionApi.getTransfer(7)

    expect(result.differences).toEqual([
      {
        differenceId: 9,
        transferId: 7,
        barcode: '7861230028713',
        productDescription: 'DNFK1017.4 FALDA DENIM',
        isRecognized: true,
        scannedAtUtc: '2026-07-24T19:31:53Z',
        scannedByUserId: 'user-1',
      },
    ])
  })

  it('scan POSTs the real SaveScanProgressRequest batch shape (lineId + absolute scannedQuantity, no client-side itemCode resolution)', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: null })

    const result = await recepcionApi.scan(7, {
      scans: [{ lineId: 1, scannedQuantity: 3 }],
      responsibleName: null,
      courierWaybillNumber: null,
    })

    expect(api.post).toHaveBeenCalledWith('recepcion-api/reception/transfers/7/scan', {
      scans: [{ lineId: 1, scannedQuantity: 3 }],
      responsibleName: null,
      courierWaybillNumber: null,
    })
    expect(result).toBeUndefined()
  })

  it('scan defaults responsibleName/courierWaybillNumber to null when omitted', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: null })

    await recepcionApi.scan(7, { scans: [{ lineId: 1, scannedQuantity: 3 }] })

    expect(api.post).toHaveBeenCalledWith('recepcion-api/reception/transfers/7/scan', {
      scans: [{ lineId: 1, scannedQuantity: 3 }],
      responsibleName: null,
      courierWaybillNumber: null,
    })
  })

  it('confirm sends { allowPartial: false } by default and does not attempt to map the response (real shape on success is ConfirmReceptionTransferResult { success, sapDocEntry, sapDocNum, message }, not a transfer — verified with backend)', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, sapDocEntry: 123, sapDocNum: 456, message: null } })

    await expect(recepcionApi.confirm(7)).resolves.toBeUndefined()

    expect(api.post).toHaveBeenCalledWith('recepcion-api/reception/transfers/7/confirm', { allowPartial: false })
  })

  it('confirm forwards allowPartial:true for ConfirmPartial (real field name, not "partial")', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, sapDocEntry: 123, sapDocNum: 456, message: null } })

    await recepcionApi.confirm(7, { allowPartial: true })

    expect(api.post).toHaveBeenCalledWith('recepcion-api/reception/transfers/7/confirm', { allowPartial: true })
  })

  it('updateGlpiTicket PUTs { ticketNumber } (real wire key, not glpiTicket) and re-fetches the transfer', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: null })
    vi.mocked(api.get).mockResolvedValue({ data: { transfer: wireTransfer({ glpiTicketNumber: 'GLPI-1' }), differences: [] } })

    const result = await recepcionApi.updateGlpiTicket(7, { glpiTicket: 'GLPI-1' })

    expect(api.put).toHaveBeenCalledWith('recepcion-api/reception/transfers/7/glpi-ticket', { ticketNumber: 'GLPI-1' })
    expect(result.glpiTicket).toBe('GLPI-1')
  })

  it('recordDifference POSTs only { barcode } (real shape has no lineId/reason/quantity) and does not fabricate a response', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 9 } })

    const result = await recepcionApi.recordDifference(7, { barcode: '7791234567890' })

    expect(api.post).toHaveBeenCalledWith('recepcion-api/reception/transfers/7/differences', {
      barcode: '7791234567890',
    })
    // Real endpoint only returns { id } — no product description/recognition/timestamp to
    // fabricate here; the caller (pickingStore) re-fetches the transfer for the real record.
    expect(result).toBeUndefined()
  })

  it('deleteDifference calls DELETE .../differences/{differenceId}', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: null })

    await recepcionApi.deleteDifference(9)

    expect(api.delete).toHaveBeenCalledWith('recepcion-api/reception/differences/9')
  })

  it('downloadDifferencesReport requests a blob response for GET .../differences/report', async () => {
    const blob = new Blob(['csv'])
    vi.mocked(api.get).mockResolvedValue({ data: blob })

    const result = await recepcionApi.downloadDifferencesReport(7)

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/transfers/7/differences/report', {
      responseType: 'blob',
    })
    expect(result).toBe(blob)
  })

  it('downloadPickingReport requests a blob response for GET .../picking/report', async () => {
    const blob = new Blob(['xlsx'])
    vi.mocked(api.get).mockResolvedValue({ data: blob })

    const result = await recepcionApi.downloadPickingReport(7)

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/transfers/7/picking/report', {
      responseType: 'blob',
    })
    expect(result).toBe(blob)
  })

  it('getHistory sends dateFrom/dateTo/transferNumber + pageNumber/pageSize and unwraps+maps items', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [wireTransfer({ sapStockTransferDocNum: 290668 })], totalCount: 1, pageNumber: 1, pageSize: 20 },
    })

    const result = await recepcionApi.getHistory(
      { fromUtc: '2026-01-01T00:00:00.000Z', toUtc: '2026-01-31T23:59:59.999Z' },
      { pageNumber: 1, pageSize: 20 }
    )

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/history', {
      params: {
        dateFrom: '2026-01-01T00:00:00.000Z',
        dateTo: '2026-01-31T23:59:59.999Z',
        transferNumber: undefined,
        pageNumber: 1,
        pageSize: 20,
      },
    })
    expect(result.items[0].transferId).toBe(7)
    // "Nueva Transferencia" in legacy — confirmed real, must survive the history mapper too,
    // not just the single-transfer mapper.
    expect(result.items[0].sapStockTransferDocNum).toBe(290668)
  })

  it('getHistory maps the transit warehouse code through to HistoryRow (bodega transitoria for the Movimiento column)', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        items: [wireTransfer({ destinationWarehouseCode: 'RL-QSN', transitWarehouseCode: 'TRL-QSN' })],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 20,
      },
    })

    const result = await recepcionApi.getHistory()

    expect(result.items[0].transitWarehouseCode).toBe('TRL-QSN')
  })

  it('getHistory maps a null transit warehouse code through to HistoryRow (no bodega transitoria for that line)', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [wireTransfer({ transitWarehouseCode: null })], totalCount: 1, pageNumber: 1, pageSize: 20 },
    })

    const result = await recepcionApi.getHistory()

    expect(result.items[0].transitWarehouseCode).toBeNull()
  })

  it('getAllHistory sends the same filter/page params against /history/all', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { items: [wireTransfer({ id: 2 })], totalCount: 1, pageNumber: 1, pageSize: 20 },
    })

    const result = await recepcionApi.getAllHistory({ transferNumber: 'DOC-2' }, { pageNumber: 1, pageSize: 20 })

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/history/all', {
      params: { dateFrom: undefined, dateTo: undefined, transferNumber: 'DOC-2', pageNumber: 1, pageSize: 20 },
    })
    expect(result.items[0].transferId).toBe(2)
  })

  it('exportAllHistoryCsv requests a blob response for GET .../history/all/export with filter params (no pagination — unpaginated export)', async () => {
    const blob = new Blob(['csv'])
    vi.mocked(api.get).mockResolvedValue({ data: blob })

    const result = await recepcionApi.exportAllHistoryCsv({ fromUtc: '2026-01-01', toUtc: '2026-01-31' })

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/history/all/export', {
      params: { dateFrom: '2026-01-01', dateTo: '2026-01-31', transferNumber: undefined },
      responseType: 'blob',
    })
    expect(result).toBe(blob)
  })

  it('exportHistoryCsv requests a blob response for GET .../history/export (own-scope, separate endpoint — no viewall required)', async () => {
    const blob = new Blob(['csv'])
    vi.mocked(api.get).mockResolvedValue({ data: blob })

    const result = await recepcionApi.exportHistoryCsv({ transferNumber: '100' })

    expect(api.get).toHaveBeenCalledWith('recepcion-api/reception/history/export', {
      params: { dateFrom: undefined, dateTo: undefined, transferNumber: '100' },
      responseType: 'blob',
    })
    expect(result).toBe(blob)
  })
})
