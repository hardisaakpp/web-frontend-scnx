import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransitStore } from '@/modules/recepcion-mercaderia/stores/transitStore'
import recepcionApi from '@/modules/recepcion-mercaderia/services/recepcionApi'
import type { TransitPendingTransfer } from '@/modules/recepcion-mercaderia/types'

vi.mock('@/modules/recepcion-mercaderia/services/recepcionApi', () => ({
  default: {
    getTransitTransfers: vi.fn(),
    downloadTransitReport: vi.fn(),
  },
}))

function buildLine(overrides: Partial<TransitPendingTransfer> = {}): TransitPendingTransfer {
  return {
    sapTransferRequestNumber: 'SAP-900',
    transitWarehouseCode: 'TRL-QSN',
    quantity: 12,
    sapDocumentDate: '2026-08-01',
    ...overrides,
  }
}

describe('useTransitStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with status "ready" and an empty list', () => {
    const store = useTransitStore()

    expect(store.status).toBe('ready')
    expect(store.transfers).toEqual([])
  })

  describe('fetchTransit', () => {
    it('populates transfers/totalCount from the paginated response and sets status "ready"', async () => {
      vi.mocked(recepcionApi.getTransitTransfers).mockResolvedValue({
        items: [buildLine(), buildLine({ sapTransferRequestNumber: 'SAP-901' })],
        totalCount: 2,
        pageNumber: 1,
        pageSize: 20,
      })

      const store = useTransitStore()
      await store.fetchTransit()

      expect(recepcionApi.getTransitTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20 })
      expect(store.status).toBe('ready')
      expect(store.transfers).toHaveLength(2)
      expect(store.totalCount).toBe(2)
    })

    it('sets status "error" and a user-facing message when the request fails', async () => {
      vi.mocked(recepcionApi.getTransitTransfers).mockRejectedValue(new Error('network error'))

      const store = useTransitStore()
      await store.fetchTransit()

      expect(store.status).toBe('error')
      expect(store.error).toBe('No se pudo cargar el listado de transferencias en tránsito.')
      expect(store.transfers).toEqual([])
    })
  })

  describe('pagination', () => {
    it('setPage updates the page and re-fetches with it', async () => {
      vi.mocked(recepcionApi.getTransitTransfers).mockResolvedValue({ items: [], totalCount: 0, pageNumber: 2, pageSize: 20 })
      const store = useTransitStore()

      store.setPage(2)
      await Promise.resolve()

      expect(store.page).toBe(2)
      expect(recepcionApi.getTransitTransfers).toHaveBeenCalledWith({ pageNumber: 2, pageSize: 20 })
    })

    it('setPageSize resets the page to 1 and re-fetches', async () => {
      vi.mocked(recepcionApi.getTransitTransfers).mockResolvedValue({ items: [], totalCount: 0, pageNumber: 1, pageSize: 50 })
      const store = useTransitStore()
      store.page = 3

      store.setPageSize(50)
      await Promise.resolve()

      expect(store.page).toBe(1)
      expect(store.pageSize).toBe(50)
      expect(recepcionApi.getTransitTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 50 })
    })
  })

  describe('search', () => {
    it('setSearchQuery resets to page 1 and refetches with the search term', async () => {
      vi.mocked(recepcionApi.getTransitTransfers).mockResolvedValue({ items: [], totalCount: 0, pageNumber: 1, pageSize: 20 })
      const store = useTransitStore()
      store.page = 3

      store.setSearchQuery('SAP-900')
      await Promise.resolve()

      expect(store.page).toBe(1)
      expect(store.searchQuery).toBe('SAP-900')
      expect(recepcionApi.getTransitTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20, search: 'SAP-900' })
    })

    it('fetchTransit omits search from the API call when searchQuery is empty', async () => {
      vi.mocked(recepcionApi.getTransitTransfers).mockResolvedValue({ items: [], totalCount: 0, pageNumber: 1, pageSize: 20 })
      const store = useTransitStore()

      await store.fetchTransit()

      expect(recepcionApi.getTransitTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20, search: undefined })
    })
  })

  describe('resetAndFetch', () => {
    it('resets a leftover page/search from a previous visit before fetching', async () => {
      vi.mocked(recepcionApi.getTransitTransfers).mockResolvedValue({ items: [], totalCount: 0, pageNumber: 1, pageSize: 20 })
      const store = useTransitStore()
      store.page = 4
      store.searchQuery = 'STALE'

      await store.resetAndFetch()

      expect(store.page).toBe(1)
      expect(store.searchQuery).toBe('')
      expect(recepcionApi.getTransitTransfers).toHaveBeenLastCalledWith({ pageNumber: 1, pageSize: 20, search: undefined })
    })
  })

  describe('downloadTransitReport', () => {
    it('returns the blob from recepcionApi on success', async () => {
      const blob = new Blob(['xlsx'])
      vi.mocked(recepcionApi.downloadTransitReport).mockResolvedValue(blob)
      const store = useTransitStore()

      const result = await store.downloadTransitReport()

      expect(result).toBe(blob)
      expect(store.error).toBeNull()
    })

    it('returns null and sets a user-facing error when the download fails, never a fake/empty file', async () => {
      vi.mocked(recepcionApi.downloadTransitReport).mockRejectedValue(new Error('network error'))
      const store = useTransitStore()

      const result = await store.downloadTransitReport()

      expect(result).toBeNull()
      expect(store.error).toBe('No se pudo descargar el reporte de transferencias en tránsito.')
    })
  })
})
