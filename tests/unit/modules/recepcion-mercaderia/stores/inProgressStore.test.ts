import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useInProgressStore } from '@/modules/recepcion-mercaderia/stores/inProgressStore'
import recepcionApi from '@/modules/recepcion-mercaderia/services/recepcionApi'
import type { ReceptionTransfer, PagedResponse } from '@/modules/recepcion-mercaderia/types'

vi.mock('@/modules/recepcion-mercaderia/services/recepcionApi', () => ({
  default: {
    getInProgressTransfers: vi.fn(),
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

function pagedTransfers(items: ReceptionTransfer[], overrides: Partial<PagedResponse<ReceptionTransfer>> = {}): PagedResponse<ReceptionTransfer> {
  return { items, totalCount: items.length, pageNumber: 1, pageSize: 20, ...overrides }
}

describe('useInProgressStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchInProgress', () => {
    it('fetches a page and populates transfers + totalCount', async () => {
      const mockTransfers = [buildTransfer(), buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })]
      vi.mocked(recepcionApi.getInProgressTransfers).mockResolvedValue(pagedTransfers(mockTransfers, { totalCount: 45 }))
      const store = useInProgressStore()

      await store.fetchInProgress()

      expect(recepcionApi.getInProgressTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20 })
      expect(store.transfers).toEqual(mockTransfers)
      expect(store.totalCount).toBe(45)
      expect(store.status).toBe('ready')
    })

    it('sets status "error" when the API call fails', async () => {
      vi.mocked(recepcionApi.getInProgressTransfers).mockRejectedValue(new Error('down'))
      const store = useInProgressStore()

      await store.fetchInProgress()

      expect(store.status).toBe('error')
      expect(store.transfers).toEqual([])
    })

    it('surfaces the backend\'s own error message when the API responds with one', async () => {
      vi.mocked(recepcionApi.getInProgressTransfers).mockRejectedValue({
        response: { status: 403, data: { error: "User 'u1' does not have access to warehouse 'T01'." } },
      })
      const store = useInProgressStore()

      await store.fetchInProgress()

      expect(store.fetchError).toBe("User 'u1' does not have access to warehouse 'T01'.")
    })

    it('setPage re-fetches with the new page number', async () => {
      vi.mocked(recepcionApi.getInProgressTransfers).mockResolvedValue(pagedTransfers([buildTransfer()], { totalCount: 45, pageNumber: 2 }))
      const store = useInProgressStore()

      store.setPage(2)
      await vi.waitFor(() => expect(recepcionApi.getInProgressTransfers).toHaveBeenCalledWith({ pageNumber: 2, pageSize: 20 }))

      expect(store.page).toBe(2)
    })

    it('setPageSize resets to page 1 and re-fetches with the new size', async () => {
      vi.mocked(recepcionApi.getInProgressTransfers).mockResolvedValue(pagedTransfers([buildTransfer()], { totalCount: 45 }))
      const store = useInProgressStore()
      store.setPage(3)
      vi.clearAllMocks()
      vi.mocked(recepcionApi.getInProgressTransfers).mockResolvedValue(pagedTransfers([buildTransfer()]))

      store.setPageSize(50)
      await vi.waitFor(() => expect(recepcionApi.getInProgressTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 50 }))

      expect(store.page).toBe(1)
      expect(store.pageSize).toBe(50)
    })

    it('resetInProgressAndFetch clears a leftover page from a previous visit before refetching', async () => {
      vi.mocked(recepcionApi.getInProgressTransfers).mockResolvedValue(pagedTransfers([buildTransfer()], { totalCount: 45 }))
      const store = useInProgressStore()
      // Simulate state left behind by a prior visit to InProgressView: page 6.
      store.page = 6

      store.resetInProgressAndFetch()
      await vi.waitFor(() => expect(recepcionApi.getInProgressTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20 }))

      expect(store.page).toBe(1)
    })
  })
})
