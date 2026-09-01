import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePickingStore } from '@/modules/recepcion-mercaderia/stores/pickingStore'
import recepcionApi from '@/modules/recepcion-mercaderia/services/recepcionApi'
import type { ReceptionTransfer, Difference, ConfirmTransferResponse } from '@/modules/recepcion-mercaderia/types'

vi.mock('@/modules/recepcion-mercaderia/services/recepcionApi', () => ({
  default: {
    getTransfer: vi.fn(),
    scan: vi.fn(),
    confirm: vi.fn(),
    updateGlpiTicket: vi.fn(),
    recordDifference: vi.fn(),
    deleteDifference: vi.fn(),
    downloadDifferencesReport: vi.fn(),
    downloadPickingReport: vi.fn(),
  },
}))

function buildTransfer(overrides: Partial<ReceptionTransfer> = {}): ReceptionTransfer {
  return {
    transferId: 7,
    documentNumber: 'DOC-7',
    originWarehouseCode: 'CD01',
    destinationWarehouseCode: 'T01',
    status: 'in-progress',
    lines: [
      { lineId: 1, itemCode: 'A1', itemName: 'Item A1', quantity: 10, scanned: 4, barcode: null },
      { lineId: 2, itemCode: 'A2', itemName: 'Item A2', quantity: 5, scanned: 5, barcode: null },
    ],
    materializedAtUtc: '2026-01-01',
    differencesCount: 0,
    ...overrides,
  }
}

function buildDifference(overrides: Partial<Difference> = {}): Difference {
  return {
    differenceId: 1,
    transferId: 7,
    barcode: '7791234',
    productDescription: null,
    isRecognized: false,
    scannedAtUtc: '2026-01-02T00:00:00Z',
    scannedByUserId: 'user-1',
    ...overrides,
  }
}

// GET /transfers/{id} really returns { transfer, differences } (recepcionApi.getTransfer's real
// return shape) — this wraps a bare ReceptionTransfer fixture the same way for every mock call
// site below, defaulting to no persisted differences unless a test needs otherwise.
function mockGetTransfer(transfer: ReceptionTransfer, differences: Difference[] = []) {
  return { transfer, differences }
}

function buildConfirmResponse(overrides: Partial<ConfirmTransferResponse> = {}): ConfirmTransferResponse {
  return { success: true, sapDocEntry: 123, sapDocNum: 456, message: 'ok', ...overrides }
}

describe('usePickingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchTransfer (detail)', () => {
    it('fetches and sets currentTransfer', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()

      await store.fetchTransfer(7)

      expect(recepcionApi.getTransfer).toHaveBeenCalledWith(7)
      expect(store.currentTransfer).toEqual(transfer)
      expect(store.status).toBe('ready')
    })

    it('loads differences already persisted on the server when fetching a transfer', async () => {
      const transfer = buildTransfer()
      const serverDifference = buildDifference({ productDescription: 'DNFK1017.4 FALDA DENIM', isRecognized: true })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer, [serverDifference]))
      const store = usePickingStore()

      await store.fetchTransfer(7)

      expect(store.differences).toEqual([serverDifference])
    })

    it('sets status "error" and leaves currentTransfer null when the fetch fails', async () => {
      vi.mocked(recepcionApi.getTransfer).mockRejectedValue(new Error('not found'))
      const store = usePickingStore()

      await store.fetchTransfer(7)

      expect(store.status).toBe('error')
      expect(store.currentTransfer).toBeNull()
    })

    it('surfaces the backend\'s own error message when the API responds with one', async () => {
      vi.mocked(recepcionApi.getTransfer).mockRejectedValue({
        response: { status: 404, data: { error: "ReceptionTransfer '7' was not found." } },
      })
      const store = usePickingStore()

      await store.fetchTransfer(7)

      expect(store.fetchError).toBe("ReceptionTransfer '7' was not found.")
    })

    it('falls back to the generic message on a 500 with no actionable backend detail', async () => {
      vi.mocked(recepcionApi.getTransfer).mockRejectedValue({
        response: { status: 500, data: { error: 'An unexpected error occurred.' } },
      })
      const store = usePickingStore()

      await store.fetchTransfer(7)

      expect(store.fetchError).toBe('No se pudo cargar el detalle de la transferencia.')
    })

    it('clears stale differences and sapErrorMessage from a previous transfer before loading a new one', async () => {
      const transferA = buildTransfer({ transferId: 7 })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transferA))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      // Simulate transfer A leaving behind stale differences + a SAP-error banner.
      store.differences = [buildDifference({ differenceId: 1, transferId: 7 })]
      vi.mocked(recepcionApi.confirm).mockRejectedValue({ response: { status: 500 } })
      await store.confirm()
      expect(store.sapErrorMessage).not.toBeNull()
      expect(store.differences).toHaveLength(1)

      // Now navigate to transfer B (component reused, same store instance).
      const transferB = buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })
      let resolveTransferB!: (v: { transfer: ReceptionTransfer; differences: Difference[] }) => void
      vi.mocked(recepcionApi.getTransfer).mockReturnValue(
        new Promise((resolve) => {
          resolveTransferB = resolve
        })
      )

      const fetchPromise = store.fetchTransfer(8)

      // Must be reset synchronously at the start of fetchTransfer, before transfer B's data arrives.
      expect(store.differences).toEqual([])
      expect(store.sapErrorMessage).toBeNull()
      expect(store.currentTransfer).toBeNull()

      resolveTransferB(mockGetTransfer(transferB))
      await fetchPromise

      expect(store.currentTransfer).toEqual(transferB)
      expect(store.differences).toEqual([])
      expect(store.sapErrorMessage).toBeNull()
    })
  })

  describe('out-of-order response guarding (active transfer identity)', () => {
    it('discards a stale fetchTransfer(A) response that resolves after fetchTransfer(B) has already started', async () => {
      const transferA = buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })
      const transferB = buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })
      const store = usePickingStore()

      let resolveA!: (v: { transfer: ReceptionTransfer; differences: Difference[] }) => void
      vi.mocked(recepcionApi.getTransfer).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveA = resolve
          })
      )

      const fetchAPromise = store.fetchTransfer(7)

      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferB))
      const fetchBPromise = store.fetchTransfer(8)

      await fetchBPromise
      resolveA(mockGetTransfer(transferA))
      await fetchAPromise

      expect(store.currentTransfer).toEqual(transferB)
    })

    it('discards a stale confirm() result for transfer A that resolves after the user has navigated to transfer B', async () => {
      const transferA = buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })
      const transferB = buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferA))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      let resolveConfirm!: (v: ConfirmTransferResponse) => void
      vi.mocked(recepcionApi.confirm).mockReturnValue(
        new Promise((resolve) => {
          resolveConfirm = resolve
        })
      )

      const confirmPromise = store.confirm()

      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferB))
      await store.fetchTransfer(8)

      resolveConfirm(buildConfirmResponse())
      await confirmPromise

      expect(store.currentTransfer).toEqual(transferB)
    })

    it('discards a stale scan() re-fetch for transfer A that resolves after the user has navigated to transfer B', async () => {
      const transferA = buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })
      const transferB = buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })

      // Argument-aware mock instead of sequential mockResolvedValueOnce/mockImplementationOnce:
      // the exact interleaving of scan()'s post-scan re-fetch call vs fetchTransfer(8)'s own call
      // to the SAME mocked function is a real microtask-ordering race (fetchTransfer's synchronous
      // prefix can call getTransfer(8) before scan's suspended continuation gets a turn), so a
      // plain FIFO queue of "once" mocks doesn't reliably line up with which call is which. Route
      // by id, and by call count for id 7 (first call is the initial fetchTransfer(7), second is
      // scan's re-fetch) to remove that ambiguity entirely.
      let resolveRefetchA!: (v: { transfer: ReceptionTransfer; differences: Difference[] }) => void
      const refetchAPromise = new Promise<{ transfer: ReceptionTransfer; differences: Difference[] }>((resolve) => {
        resolveRefetchA = resolve
      })
      let getTransfer7Calls = 0
      vi.mocked(recepcionApi.getTransfer).mockImplementation((id: number) => {
        if (id === 8) return Promise.resolve(mockGetTransfer(transferB))
        getTransfer7Calls += 1
        return getTransfer7Calls === 1 ? Promise.resolve(mockGetTransfer(transferA)) : refetchAPromise
      })

      const store = usePickingStore()
      await store.fetchTransfer(7)

      // POST /scan resolves quickly (204); the store's own re-fetch of the transfer (also
      // getTransfer(7)) is the one left in flight — that's what must be discarded once B loads.
      vi.mocked(recepcionApi.scan).mockResolvedValueOnce(undefined)

      const scanPromise = store.scan({ scans: [{ lineId: 1, scannedQuantity: 6 }] })

      await store.fetchTransfer(8)

      resolveRefetchA(mockGetTransfer({ ...transferA, lines: [{ ...transferA.lines[0], scanned: 6 }, transferA.lines[1]] }))
      await scanPromise

      // B's state must NOT be overwritten by A's stale post-scan re-fetch.
      expect(store.currentTransfer).toEqual(transferB)
    })

    it('discards a stale recordDifference() re-fetch for transfer A that resolves after the user has navigated to transfer B', async () => {
      const transferA = buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })
      const transferB = buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })

      // Same argument-aware routing as the scan() race above — recordDifference now follows the
      // identical POST-then-refetch-with-guard shape, so the same race is possible.
      let resolveRefetchA!: (v: { transfer: ReceptionTransfer; differences: Difference[] }) => void
      const refetchAPromise = new Promise<{ transfer: ReceptionTransfer; differences: Difference[] }>((resolve) => {
        resolveRefetchA = resolve
      })
      let getTransfer7Calls = 0
      vi.mocked(recepcionApi.getTransfer).mockImplementation((id: number) => {
        if (id === 8) return Promise.resolve(mockGetTransfer(transferB))
        getTransfer7Calls += 1
        return getTransfer7Calls === 1 ? Promise.resolve(mockGetTransfer(transferA)) : refetchAPromise
      })

      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.recordDifference).mockResolvedValueOnce(undefined)

      const recordPromise = store.recordDifference({ barcode: '7791234' })

      await store.fetchTransfer(8)

      resolveRefetchA(mockGetTransfer(transferA, [buildDifference({ transferId: 7 })]))
      await recordPromise

      // B's (empty) differences list must NOT be polluted by A's stale re-fetch.
      expect(store.differences).toEqual([])
    })

    it('discards a stale updateGlpiTicket() result for transfer A that resolves after the user has navigated to transfer B', async () => {
      const transferA = buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })
      const transferB = buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferA))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      let resolveUpdate!: (v: ReceptionTransfer) => void
      vi.mocked(recepcionApi.updateGlpiTicket).mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve
        })
      )

      const updatePromise = store.updateGlpiTicket('GLPI-A')

      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferB))
      await store.fetchTransfer(8)

      resolveUpdate({ ...transferA, glpiTicket: 'GLPI-A' })
      await updatePromise

      expect(store.currentTransfer).toEqual(transferB)
    })

    it('discards a stale deleteDifference() removal for transfer A that resolves after the user has navigated to transfer B', async () => {
      const transferA = buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })
      const transferB = buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferA))
      const store = usePickingStore()
      await store.fetchTransfer(7)
      store.differences = [buildDifference({ differenceId: 1, transferId: 7 })]

      let resolveDelete!: (v: null) => void
      vi.mocked(recepcionApi.deleteDifference).mockReturnValue(
        new Promise((resolve) => {
          resolveDelete = resolve
        })
      )

      const deletePromise = store.deleteDifference(1)

      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferB))
      await store.fetchTransfer(8)
      store.differences = [buildDifference({ differenceId: 2, transferId: 8, barcode: '999' })]

      resolveDelete(null)
      await deletePromise

      expect(store.differences.map((d) => d.differenceId)).toEqual([2])
    })

    it('discards a stale downloadDifferencesReport() failure for transfer A that resolves after the user has navigated to transfer B', async () => {
      const transferA = buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })
      const transferB = buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferA))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      let rejectDownload!: (err: unknown) => void
      vi.mocked(recepcionApi.downloadDifferencesReport).mockReturnValue(
        new Promise((_resolve, reject) => {
          rejectDownload = reject
        })
      )

      const downloadPromise = store.downloadDifferencesReport()

      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferB))
      await store.fetchTransfer(8)

      rejectDownload(new Error('down'))
      const result = await downloadPromise

      expect(result).toBeNull()
      expect(store.actionError).toBeNull()
    })

    it('discards a stale downloadPickingReport() failure for transfer A that resolves after the user has navigated to transfer B', async () => {
      const transferA = buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })
      const transferB = buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferA))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      let rejectDownload!: (err: unknown) => void
      vi.mocked(recepcionApi.downloadPickingReport).mockReturnValue(
        new Promise((_resolve, reject) => {
          rejectDownload = reject
        })
      )

      const downloadPromise = store.downloadPickingReport()

      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferB))
      await store.fetchTransfer(8)

      rejectDownload(new Error('down'))
      const result = await downloadPromise

      expect(result).toBeNull()
      expect(store.actionError).toBeNull()
    })

    it('does not clear isSubmitting for transfer B when a stale in-flight mutation for transfer A resolves after navigation', async () => {
      const transferA = buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })
      const transferB = buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferA))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      let resolveScanAPost!: (v: undefined) => void
      vi.mocked(recepcionApi.scan).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveScanAPost = resolve
        })
      )
      const scanAPromise = store.scan({ scans: [{ lineId: 1, scannedQuantity: 5 }] })
      expect(store.isSubmitting).toBe(true)

      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferB))
      await store.fetchTransfer(8)

      let resolveScanBPost!: (v: undefined) => void
      vi.mocked(recepcionApi.scan).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveScanBPost = resolve
        })
      )
      const scanBPromise = store.scan({ scans: [{ lineId: 1, scannedQuantity: 5 }] })
      expect(store.isSubmitting).toBe(true)

      // A's stale scan POST resolves late — its guard check must discard before even re-fetching,
      // and its finally must NOT clear B's in-flight isSubmitting.
      resolveScanAPost(undefined)
      await scanAPromise

      expect(store.isSubmitting).toBe(true)

      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferB))
      resolveScanBPost(undefined)
      await scanBPromise

      expect(store.isSubmitting).toBe(false)
    })

    it('resets isSubmitting when navigating to transfer B while a mutation for transfer A is still in flight, even without starting a new action on B', async () => {
      const transferA = buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })
      const transferB = buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferA))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      let resolveScanA!: (v: undefined) => void
      vi.mocked(recepcionApi.scan).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveScanA = resolve
        })
      )
      const scanAPromise = store.scan({ scans: [{ lineId: 1, scannedQuantity: 5 }] })
      expect(store.isSubmitting).toBe(true)

      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transferB))
      await store.fetchTransfer(8)

      expect(store.isSubmitting).toBe(false)

      resolveScanA(undefined)
      await scanAPromise

      expect(store.isSubmitting).toBe(false)
    })
  })

  describe('computed aggregates', () => {
    it('computes Diferencia = Cantidad - Escaneados client-side per line', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      expect(store.lineDiferencia(store.currentTransfer!.lines[0])).toBe(6)
      expect(store.lineDiferencia(store.currentTransfer!.lines[1])).toBe(0)
    })
  })

  describe('scan', () => {
    it('POSTs a batch of {lineId, scannedQuantity} and re-fetches the transfer to pick up the new totals', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)
      const refetched = buildTransfer({ lines: [{ ...transfer.lines[0], scanned: 6 }, transfer.lines[1]] })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(refetched))

      await store.scan({ scans: [{ lineId: 1, scannedQuantity: 6 }], responsibleName: null, courierWaybillNumber: null })

      expect(recepcionApi.scan).toHaveBeenCalledWith(7, { scans: [{ lineId: 1, scannedQuantity: 6 }], responsibleName: null, courierWaybillNumber: null })
      expect(recepcionApi.getTransfer).toHaveBeenCalledTimes(2)
      const updatedLine = store.currentTransfer!.lines.find((l) => l.lineId === 1)!
      expect(updatedLine.scanned).toBe(6)
      expect(store.lineDiferencia(updatedLine)).toBe(4)
    })

    it('sets isSubmitting true while the scan+re-fetch is in flight and false after it resolves', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      let resolveScan!: (v: undefined) => void
      vi.mocked(recepcionApi.scan).mockReturnValue(
        new Promise((resolve) => {
          resolveScan = resolve
        })
      )
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))

      const scanPromise = store.scan({ scans: [{ lineId: 1, scannedQuantity: 6 }] })
      expect(store.isSubmitting).toBe(true)

      resolveScan(undefined)
      await scanPromise

      expect(store.isSubmitting).toBe(false)
    })

    it('sets isSubmitting back to false when the scan POST fails', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.scan).mockRejectedValue(new Error('scan failed'))

      await store.scan({ scans: [{ lineId: 1, scannedQuantity: 6 }] })

      expect(store.isSubmitting).toBe(false)
    })

    it('does NOT optimistically update the line and surfaces an error on scan failure', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.scan).mockRejectedValue(new Error('scan failed'))

      await store.scan({ scans: [{ lineId: 1, scannedQuantity: 6 }] })

      const line = store.currentTransfer!.lines.find((l) => l.lineId === 1)!
      expect(line.scanned).toBe(4)
      expect(store.actionError).toBe('No se pudo registrar el escaneo.')
    })

    it('surfaces the backend\'s own error message when the API responds with one', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.scan).mockRejectedValue({
        response: { status: 400, data: { error: 'Courier waybill number is required for this destination.' } },
      })

      await store.scan({ scans: [{ lineId: 1, scannedQuantity: 6 }] })

      expect(store.actionError).toBe('Courier waybill number is required for this destination.')
    })
  })

  describe('confirm', () => {
    it('calls POST confirm with allowPartial:false by default (full confirm), then re-fetches for the canonical state', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.confirm).mockResolvedValue(buildConfirmResponse())
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer({ ...transfer, status: 'confirmed' }))

      await store.confirm()

      expect(recepcionApi.confirm).toHaveBeenCalledWith(7, {})
      expect(store.currentTransfer?.status).toBe('confirmed')
      expect(store.status).toBe('ready')
    })

    it('calls POST confirm with allowPartial:true for a partial confirm', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.confirm).mockResolvedValue(buildConfirmResponse())
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer({ ...transfer, status: 'confirmed' }))

      await store.confirm({ allowPartial: true })

      expect(recepcionApi.confirm).toHaveBeenCalledWith(7, { allowPartial: true })
    })

    it('shows no error and picks up pendingSapJobQueuedAtUtc from the refetch when confirm responds success:false with reason "Queued" (SAP job queued, not a failure)', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.confirm).mockResolvedValue(
        buildConfirmResponse({ success: false, sapDocEntry: null, sapDocNum: null, message: 'La confirmación quedó en proceso.', reason: 'Queued' })
      )
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(
        mockGetTransfer({ ...transfer, pendingSapJobQueuedAtUtc: '2026-08-31T12:00:00Z' })
      )

      await store.confirm()

      expect(store.actionError).toBeNull()
      expect(store.sapErrorMessage).toBeNull()
      expect(store.status).toBe('ready')
      expect(store.currentTransfer?.pendingSapJobQueuedAtUtc).toBe('2026-08-31T12:00:00Z')
    })

    it('sets status "error" + sapErrorMessage on a SAP 500 failure, keeping the transfer retryable', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.confirm).mockRejectedValue({ response: { status: 500 } })

      await store.confirm()

      expect(store.status).toBe('error')
      expect(store.sapErrorMessage).toBe(
        'No se pudo integrar la transferencia a SAP. Los escaneos se guardaron; vuelva a intentarlo cuando el servicio esté disponible.'
      )
      expect(store.currentTransfer?.status).toBe('in-progress')
    })

    it('sets a generic error (no sapErrorMessage) on a non-500 confirm failure', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.confirm).mockRejectedValue({ response: { status: 400 } })

      await store.confirm()

      expect(store.status).toBe('error')
      expect(store.sapErrorMessage).toBeNull()
      expect(store.actionError).toBe('No se pudo confirmar la transferencia.')
      expect(store.currentTransfer?.status).toBe('in-progress')
    })

    it('surfaces the backend\'s own error message on a non-500 confirm failure when the API provides one', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.confirm).mockRejectedValue({
        response: { status: 400, data: { error: 'Cannot confirm: 2 lines are still incomplete.' } },
      })

      await store.confirm()

      expect(store.actionError).toBe('Cannot confirm: 2 lines are still incomplete.')
    })

    it('surfaces ConfirmReceptionTransferResult\'s own "message" field (422, e.g. a real SAP rejection detail) — not just "error"', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.confirm).mockRejectedValue({
        response: {
          status: 422,
          data: { success: false, sapDocEntry: null, sapDocNum: null, message: 'Target item number does not match base item number.  [StockTransferLines.ItemCode][line: 0]' },
        },
      })

      await store.confirm()

      expect(store.sapErrorMessage).toBeNull()
      expect(store.actionError).toBe('Target item number does not match base item number.  [StockTransferLines.ItemCode][line: 0]')
    })

    it('recovers without showing an error when confirm 400s with "already confirmed" (duplicate click/tab racing automatic reconciliation) and a refetch confirms it', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer)
        .mockResolvedValueOnce(mockGetTransfer(transfer))
        .mockResolvedValueOnce(mockGetTransfer({ ...transfer, status: 'confirmed' }))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.confirm).mockRejectedValue({
        response: { status: 400, data: { error: "Reception transfer 7 is already confirmed." } },
      })

      await store.confirm()

      expect(store.actionError).toBeNull()
      expect(store.sapErrorMessage).toBeNull()
      expect(store.currentTransfer?.status).toBe('confirmed')
      expect(store.status).toBe('ready')
    })

    it('recovers without showing an error when confirm fails client-side (no response, e.g. a timeout) but a refetch shows it already confirmed', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer)
        .mockResolvedValueOnce(mockGetTransfer(transfer))
        .mockResolvedValueOnce(mockGetTransfer({ ...transfer, status: 'confirmed' }))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.confirm).mockRejectedValue(new Error('timeout of 30000ms exceeded'))

      await store.confirm()

      expect(store.actionError).toBeNull()
      expect(store.currentTransfer?.status).toBe('confirmed')
    })

    it('sets isSubmitting true while confirm is in flight and false after it resolves', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      let resolveConfirm!: (v: ConfirmTransferResponse) => void
      vi.mocked(recepcionApi.confirm).mockReturnValue(
        new Promise((resolve) => {
          resolveConfirm = resolve
        })
      )

      const confirmPromise = store.confirm()
      expect(store.isSubmitting).toBe(true)

      resolveConfirm(buildConfirmResponse())
      await confirmPromise

      expect(store.isSubmitting).toBe(false)
    })

    it('sets isSubmitting back to false when confirm fails', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.confirm).mockRejectedValue({ response: { status: 500 } })

      await store.confirm()

      expect(store.isSubmitting).toBe(false)
    })
  })

  describe('differences', () => {
    it('recordDifference POSTs the barcode and re-fetches the transfer to pick up the real persisted difference', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)
      const created = buildDifference({ productDescription: 'DNFK1017.4 FALDA DENIM', isRecognized: true })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer, [created]))

      await store.recordDifference({ barcode: '7791234' })

      expect(recepcionApi.recordDifference).toHaveBeenCalledWith(7, { barcode: '7791234' })
      expect(recepcionApi.getTransfer).toHaveBeenCalledTimes(2)
      // The real product description comes from the server re-fetch, never fabricated client-side.
      expect(store.differences).toEqual([created])
    })

    it('deleteDifference DELETEs and removes the difference from the store list', async () => {
      const store = usePickingStore()
      store.differences = [buildDifference({ differenceId: 1 }), buildDifference({ differenceId: 2, barcode: '999' })]
      vi.mocked(recepcionApi.deleteDifference).mockResolvedValue(null)

      await store.deleteDifference(1)

      expect(recepcionApi.deleteDifference).toHaveBeenCalledWith(1)
      expect(store.differences.map((d) => d.differenceId)).toEqual([2])
    })

    it('sets isSubmitting true while recordDifference (POST + re-fetch) is in flight and false after it resolves', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      let resolveRecord!: (v: undefined) => void
      vi.mocked(recepcionApi.recordDifference).mockReturnValue(
        new Promise((resolve) => {
          resolveRecord = resolve
        })
      )
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))

      const recordPromise = store.recordDifference({ barcode: '7791234' })
      expect(store.isSubmitting).toBe(true)

      resolveRecord(undefined)
      await recordPromise

      expect(store.isSubmitting).toBe(false)
    })

    it('sets isSubmitting back to false when recordDifference fails', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.recordDifference).mockRejectedValue(new Error('down'))

      await store.recordDifference({ barcode: '7791234' })

      expect(store.isSubmitting).toBe(false)
    })

    it('surfaces the backend\'s own error message when the API responds with one', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.recordDifference).mockRejectedValue({
        response: { status: 403, data: { error: "User 'u1' does not have access to warehouse 'T01'." } },
      })

      await store.recordDifference({ barcode: '7791234' })

      expect(store.actionError).toBe("User 'u1' does not have access to warehouse 'T01'.")
    })

    it('falls back to the generic message on a 500 with no actionable backend detail (e.g. an unreachable upstream product lookup)', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.recordDifference).mockRejectedValue({
        response: { status: 500, data: { error: 'An unexpected error occurred.' } },
      })

      await store.recordDifference({ barcode: '7791234' })

      expect(store.actionError).toBe('No se pudo registrar la diferencia.')
    })

    it('sets isSubmitting true while deleteDifference is in flight and false after it resolves', async () => {
      const store = usePickingStore()
      store.differences = [buildDifference({ differenceId: 1 })]

      let resolveDelete!: (v: null) => void
      vi.mocked(recepcionApi.deleteDifference).mockReturnValue(
        new Promise((resolve) => {
          resolveDelete = resolve
        })
      )

      const deletePromise = store.deleteDifference(1)
      expect(store.isSubmitting).toBe(true)

      resolveDelete(null)
      await deletePromise

      expect(store.isSubmitting).toBe(false)
    })

    it('sets isSubmitting back to false when deleteDifference fails', async () => {
      const store = usePickingStore()
      store.differences = [buildDifference({ differenceId: 1 })]
      vi.mocked(recepcionApi.deleteDifference).mockRejectedValue(new Error('down'))

      await store.deleteDifference(1)

      expect(store.isSubmitting).toBe(false)
    })

    it('surfaces the backend\'s own error message when the API responds with one', async () => {
      const store = usePickingStore()
      store.differences = [buildDifference({ differenceId: 1 })]
      vi.mocked(recepcionApi.deleteDifference).mockRejectedValue({
        response: { status: 404, data: { error: "ReceptionDifference '1' was not found." } },
      })

      await store.deleteDifference(1)

      expect(store.actionError).toBe("ReceptionDifference '1' was not found.")
    })
  })

  describe('updateGlpiTicket', () => {
    it('PUTs the GLPI ticket and updates currentTransfer.glpiTicket without a full reload', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.updateGlpiTicket).mockResolvedValue({ ...transfer, glpiTicket: 'GLPI-123' })

      await store.updateGlpiTicket('GLPI-123')

      expect(recepcionApi.updateGlpiTicket).toHaveBeenCalledWith(7, { glpiTicket: 'GLPI-123' })
      expect(store.currentTransfer?.glpiTicket).toBe('GLPI-123')
    })

    it('sets isSubmitting true while updateGlpiTicket is in flight and false after it resolves', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      let resolveUpdate!: (v: ReceptionTransfer) => void
      vi.mocked(recepcionApi.updateGlpiTicket).mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve
        })
      )

      const updatePromise = store.updateGlpiTicket('GLPI-123')
      expect(store.isSubmitting).toBe(true)

      resolveUpdate({ ...transfer, glpiTicket: 'GLPI-123' })
      await updatePromise

      expect(store.isSubmitting).toBe(false)
    })

    it('sets isSubmitting back to false when updateGlpiTicket fails', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.updateGlpiTicket).mockRejectedValue(new Error('down'))

      await store.updateGlpiTicket('GLPI-123')

      expect(store.isSubmitting).toBe(false)
    })

    it('surfaces the backend\'s own error message when the API responds with one', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.updateGlpiTicket).mockRejectedValue({
        response: { status: 400, data: { error: 'GLPI ticket format is invalid.' } },
      })

      await store.updateGlpiTicket('bad-ticket')

      expect(store.actionError).toBe('GLPI ticket format is invalid.')
    })
  })

  describe('downloadDifferencesReport', () => {
    it('returns the report Blob from the API for the current transfer', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      const blob = new Blob(['report'])
      vi.mocked(recepcionApi.downloadDifferencesReport).mockResolvedValue(blob)

      const result = await store.downloadDifferencesReport()

      expect(recepcionApi.downloadDifferencesReport).toHaveBeenCalledWith(7)
      expect(result).toBe(blob)
    })

    it('returns null and sets an error when the report download fails', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.downloadDifferencesReport).mockRejectedValue(new Error('down'))

      const result = await store.downloadDifferencesReport()

      expect(result).toBeNull()
      expect(store.actionError).toBe('No se pudo descargar el reporte de diferencias.')
    })

    it('surfaces the backend\'s own error message when the API responds with one', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.downloadDifferencesReport).mockRejectedValue({
        response: { status: 404, data: { error: "ReceptionTransfer '7' was not found." } },
      })

      const result = await store.downloadDifferencesReport()

      expect(result).toBeNull()
      expect(store.actionError).toBe("ReceptionTransfer '7' was not found.")
    })
  })

  describe('downloadPickingReport', () => {
    it('returns the report Blob from the API for the current transfer', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      const blob = new Blob(['report'])
      vi.mocked(recepcionApi.downloadPickingReport).mockResolvedValue(blob)

      const result = await store.downloadPickingReport()

      expect(recepcionApi.downloadPickingReport).toHaveBeenCalledWith(7)
      expect(result).toBe(blob)
    })

    it('returns null and sets an error when the report download fails', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.downloadPickingReport).mockRejectedValue(new Error('down'))

      const result = await store.downloadPickingReport()

      expect(result).toBeNull()
      expect(store.actionError).toBe('No se pudo descargar el reporte de picking.')
    })

    it('surfaces the backend\'s own error message when the API responds with one', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.downloadPickingReport).mockRejectedValue({
        response: { status: 404, data: { error: "ReceptionTransfer '7' was not found." } },
      })

      const result = await store.downloadPickingReport()

      expect(result).toBeNull()
      expect(store.actionError).toBe("ReceptionTransfer '7' was not found.")
    })
  })

  // Matches legacy recP.php's procesarCodigo() mechanics (sc22, lines ~766-822): no match ->
  // unrecognized code, logged as a difference; match with room -> fill capped at the line's
  // remaining quantity; match already complete -> the whole entered quantity is excess. Every
  // excess unit is redirected to its own recordDifference call (deliberate deviation from legacy,
  // which silently drops the leftover) — see handleBarcodeScan's original comment, now on scanBarcode.
  describe('scanBarcode', () => {
    it('scans the full entered quantity into the matched line when it exactly fits (no excess)', async () => {
      const transfer = buildTransfer({
        lines: [{ lineId: 1, itemCode: 'A1', itemName: 'Item A1', quantity: 10, scanned: 4, barcode: '7791234' }],
      })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)
      const refetched = buildTransfer({ lines: [{ ...transfer.lines[0], scanned: 10 }] })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(refetched))

      const result = await store.scanBarcode('7791234', 6)

      expect(recepcionApi.scan).toHaveBeenCalledWith(7, {
        scans: [{ lineId: 1, scannedQuantity: 10 }],
        responsibleName: null,
        courierWaybillNumber: null,
      })
      expect(recepcionApi.recordDifference).not.toHaveBeenCalled()
      expect(result).toEqual({ matchedLine: transfer.lines[0], fillAmount: 6, excess: 0 })
    })

    it("caps the fill at the line's remaining room and records the leftover as differences (partial fit)", async () => {
      const transfer = buildTransfer({
        lines: [{ lineId: 1, itemCode: 'A1', itemName: 'Item A1', quantity: 10, scanned: 8, barcode: '7791234' }],
      })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)
      vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(
        mockGetTransfer(buildTransfer({ lines: [{ ...transfer.lines[0], scanned: 10 }] }))
      )

      // available room = 10 - 8 = 2, entered = 5 -> fillAmount = 2, excess = 3
      const result = await store.scanBarcode('7791234', 5)

      expect(recepcionApi.scan).toHaveBeenCalledWith(7, {
        scans: [{ lineId: 1, scannedQuantity: 10 }],
        responsibleName: null,
        courierWaybillNumber: null,
      })
      expect(recepcionApi.recordDifference).toHaveBeenCalledTimes(3)
      expect(recepcionApi.recordDifference).toHaveBeenCalledWith(7, { barcode: '7791234' })
      expect(result).toEqual({ matchedLine: transfer.lines[0], fillAmount: 2, excess: 3 })
    })

    it('records the entire entered quantity as differences when the barcode matches no line', async () => {
      const transfer = buildTransfer()
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))

      const result = await store.scanBarcode('unknown-barcode', 3)

      expect(recepcionApi.scan).not.toHaveBeenCalled()
      expect(recepcionApi.recordDifference).toHaveBeenCalledTimes(3)
      expect(recepcionApi.recordDifference).toHaveBeenCalledWith(7, { barcode: 'unknown-barcode' })
      expect(result).toEqual({ matchedLine: null, fillAmount: 0, excess: 3 })
    })

    it('returns null and performs no action when there is no current transfer loaded', async () => {
      const store = usePickingStore()

      const result = await store.scanBarcode('7791234', 1)

      expect(result).toBeNull()
      expect(recepcionApi.scan).not.toHaveBeenCalled()
      expect(recepcionApi.recordDifference).not.toHaveBeenCalled()
    })

    it('does not call scan when the entered quantity is entirely excess (line already complete)', async () => {
      const transfer = buildTransfer({
        lines: [{ lineId: 1, itemCode: 'A1', itemName: 'Item A1', quantity: 10, scanned: 10, barcode: '7791234' }],
      })
      vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer))
      const store = usePickingStore()
      await store.fetchTransfer(7)

      vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)
      vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer))

      const result = await store.scanBarcode('7791234', 2)

      expect(recepcionApi.scan).not.toHaveBeenCalled()
      expect(recepcionApi.recordDifference).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ matchedLine: transfer.lines[0], fillAmount: 0, excess: 2 })
    })
  })
})
