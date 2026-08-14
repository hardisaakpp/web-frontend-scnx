import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePendingStore } from '@/modules/recepcion-mercaderia/stores/pendingStore'
import recepcionApi from '@/modules/recepcion-mercaderia/services/recepcionApi'
import { featureReadiness } from '@/modules/recepcion-mercaderia/config/featureReadiness'
import { useAuthStore } from '@/stores/auth'
import type { PendingTransferLine } from '@/modules/recepcion-mercaderia/types'

vi.mock('@/modules/recepcion-mercaderia/services/recepcionApi', () => ({
  default: {
    getPendingTransfers: vi.fn(),
    materializePendingTransfer: vi.fn(),
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

function buildLine(overrides: Partial<PendingTransferLine> = {}): PendingTransferLine {
  return {
    sapTransferRequestNumber: 'SAP-1',
    itemCode: 'ITEM-1',
    barcode: '7791234',
    description: 'Producto de prueba',
    openQuantity: 10,
    originWarehouseCode: 'CD01',
    destinationWarehouseCode: 'T01',
    sapBaseDocEntry: 100,
    sapBaseLineNum: 0,
    sapDocumentDate: '2026-01-01',
    ...overrides,
  }
}

describe('usePendingStore', () => {
  const originalPendingTransfersReady = featureReadiness.pendingTransfersReady

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      userWarehouseAccesses: [{ codAlmacen: 'T01' }],
    } as unknown as ReturnType<typeof useAuthStore>)
  })

  afterEach(() => {
    featureReadiness.pendingTransfersReady = originalPendingTransfersReady
  })

  it('starts with status "degraded" when featureReadiness.pendingTransfersReady is false', () => {
    featureReadiness.pendingTransfersReady = false

    const store = usePendingStore()

    expect(store.status).toBe('degraded')
  })

  it('starts with status "ready" when featureReadiness.pendingTransfersReady is true', () => {
    featureReadiness.pendingTransfersReady = true

    const store = usePendingStore()

    expect(store.status).toBe('ready')
  })

  describe('fetchPending', () => {
    it('does NOT call the API when status is degraded', async () => {
      featureReadiness.pendingTransfersReady = false
      const store = usePendingStore()

      await store.fetchPending()

      expect(recepcionApi.getPendingTransfers).not.toHaveBeenCalled()
      expect(store.transfers).toEqual([])
      expect(store.status).toBe('degraded')
    })

    it('fetches and populates transfers when status is ready, sending the current page/pageSize and storing totalCount', async () => {
      featureReadiness.pendingTransfersReady = true
      const mockTransfers = [buildLine()]
      vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue({
        items: mockTransfers,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 20,
      })
      const store = usePendingStore()

      await store.fetchPending()

      expect(recepcionApi.getPendingTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20 })
      expect(store.transfers).toEqual(mockTransfers)
      expect(store.totalCount).toBe(1)
      expect(store.status).toBe('ready')
    })

    it('setPage updates the page and refetches', async () => {
      featureReadiness.pendingTransfersReady = true
      vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue({ items: [], totalCount: 0, pageNumber: 2, pageSize: 20 })
      const store = usePendingStore()

      store.setPage(2)
      await Promise.resolve()

      expect(store.page).toBe(2)
      expect(recepcionApi.getPendingTransfers).toHaveBeenCalledWith({ pageNumber: 2, pageSize: 20 })
    })

    it('setPageSize resets to page 1 and refetches', async () => {
      featureReadiness.pendingTransfersReady = true
      vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue({ items: [], totalCount: 0, pageNumber: 1, pageSize: 50 })
      const store = usePendingStore()
      store.page = 3

      store.setPageSize(50)
      await Promise.resolve()

      expect(store.page).toBe(1)
      expect(store.pageSize).toBe(50)
      expect(recepcionApi.getPendingTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 50 })
    })

    it('sets status "error" when the API call fails', async () => {
      featureReadiness.pendingTransfersReady = true
      vi.mocked(recepcionApi.getPendingTransfers).mockRejectedValue(new Error('network down'))
      const store = usePendingStore()

      await store.fetchPending()

      expect(store.status).toBe('error')
      expect(store.error).toBe('No se pudo cargar la lista de transferencias pendientes.')
    })

    it('setSearchQuery resets to page 1 and refetches with the search term', async () => {
      featureReadiness.pendingTransfersReady = true
      vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue({ items: [], totalCount: 0, pageNumber: 1, pageSize: 20 })
      const store = usePendingStore()
      store.page = 3

      store.setSearchQuery('DOC-1')
      await Promise.resolve()

      expect(store.page).toBe(1)
      expect(store.searchQuery).toBe('DOC-1')
      expect(recepcionApi.getPendingTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20, search: 'DOC-1' })
    })

    it('fetchPending omits search from the API call when searchQuery is empty', async () => {
      featureReadiness.pendingTransfersReady = true
      vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue({ items: [], totalCount: 0, pageNumber: 1, pageSize: 20 })
      const store = usePendingStore()

      await store.fetchPending()

      expect(recepcionApi.getPendingTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20, search: undefined })
    })

    it('resetAndFetch clears a leftover page/search from a previous visit before refetching', async () => {
      featureReadiness.pendingTransfersReady = true
      vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue({ items: [], totalCount: 0, pageNumber: 1, pageSize: 20 })
      const store = usePendingStore()
      // Simulate state left behind by a prior visit: page 6, a search for a nonexistent code.
      store.page = 6
      store.searchQuery = 'NONEXISTENT'

      store.resetAndFetch()
      await Promise.resolve()

      expect(store.page).toBe(1)
      expect(store.searchQuery).toBe('')
      expect(recepcionApi.getPendingTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20, search: undefined })
    })
  })

  describe('materialize', () => {
    it('does NOT call the API when status is degraded', async () => {
      featureReadiness.pendingTransfersReady = false
      const store = usePendingStore()

      await store.materialize('SAP-1', 'T01')

      expect(recepcionApi.materializePendingTransfer).not.toHaveBeenCalled()
    })

    it('calls the API with (sapTransferRequestNumber, warehouseCode) and re-fetches the current page from the server when ready', async () => {
      featureReadiness.pendingTransfersReady = true
      const store = usePendingStore()
      store.page = 2
      store.transfers = [buildLine({ sapTransferRequestNumber: 'SAP-1' }), buildLine({ sapTransferRequestNumber: 'SAP-2' })]
      vi.mocked(recepcionApi.materializePendingTransfer).mockResolvedValue(42)
      vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue({
        items: [buildLine({ sapTransferRequestNumber: 'SAP-2' })],
        totalCount: 21,
        pageNumber: 2,
        pageSize: 20,
      })

      await store.materialize('SAP-1', 'T01')

      expect(recepcionApi.materializePendingTransfer).toHaveBeenCalledWith('SAP-1', 'T01')
      // Re-fetches the CURRENT page (2), not just splicing the local array — a transfer can
      // have several item rows, so a client-side filter alone would leave totalCount stale and,
      // if this transfer's rows filled the whole page, render it empty instead of replenished.
      expect(recepcionApi.getPendingTransfers).toHaveBeenCalledWith({ pageNumber: 2, pageSize: 20, search: undefined })
      expect(store.transfers.map((t) => t.sapTransferRequestNumber)).toEqual(['SAP-2'])
      expect(store.totalCount).toBe(21)
    })

    it('steps back one page when materializing empties the current (non-first) page', async () => {
      featureReadiness.pendingTransfersReady = true
      const store = usePendingStore()
      store.page = 2
      vi.mocked(recepcionApi.materializePendingTransfer).mockResolvedValue(42)
      vi.mocked(recepcionApi.getPendingTransfers)
        // Every row on page 2 belonged to the materialized transfer — the refetch comes back empty.
        .mockResolvedValueOnce({ items: [], totalCount: 20, pageNumber: 2, pageSize: 20 })
        .mockResolvedValueOnce({ items: [buildLine({ sapTransferRequestNumber: 'SAP-9' })], totalCount: 20, pageNumber: 1, pageSize: 20 })

      await store.materialize('SAP-1', 'T01')

      expect(store.page).toBe(1)
      expect(store.transfers.map((t) => t.sapTransferRequestNumber)).toEqual(['SAP-9'])
      expect(recepcionApi.getPendingTransfers).toHaveBeenCalledTimes(2)
    })

    it('sets status "error" when materialize fails', async () => {
      featureReadiness.pendingTransfersReady = true
      const store = usePendingStore()
      vi.mocked(recepcionApi.materializePendingTransfer).mockRejectedValue(new Error('sap down'))

      await store.materialize('SAP-1', 'T01')

      expect(store.status).toBe('error')
      expect(store.error).toBe('No se pudo materializar la transferencia.')
    })

    it('sets isSubmitting true while materialize is in flight and false after it resolves', async () => {
      featureReadiness.pendingTransfersReady = true
      const store = usePendingStore()
      store.transfers = [buildLine()]
      vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue({ items: [buildLine()], totalCount: 1, pageNumber: 1, pageSize: 20 })

      let resolveMaterialize!: (v: number) => void
      vi.mocked(recepcionApi.materializePendingTransfer).mockReturnValue(
        new Promise((resolve) => {
          resolveMaterialize = resolve
        })
      )

      const materializePromise = store.materialize('SAP-1', 'T01')
      expect(store.isSubmitting).toBe(true)

      resolveMaterialize(42)
      await materializePromise

      expect(store.isSubmitting).toBe(false)
    })

    it('sets isSubmitting back to false when materialize fails', async () => {
      featureReadiness.pendingTransfersReady = true
      const store = usePendingStore()
      vi.mocked(recepcionApi.materializePendingTransfer).mockRejectedValue(new Error('sap down'))

      await store.materialize('SAP-1', 'T01')

      expect(store.isSubmitting).toBe(false)
    })
  })
})
