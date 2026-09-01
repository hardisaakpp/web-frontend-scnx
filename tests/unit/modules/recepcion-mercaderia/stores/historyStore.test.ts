import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useHistoryStore } from '@/modules/recepcion-mercaderia/stores/historyStore'
import recepcionApi from '@/modules/recepcion-mercaderia/services/recepcionApi'
import { useAuthStore } from '@/stores/auth'
import type { HistoryRow, PagedResponse, ReceptionTransfer } from '@/modules/recepcion-mercaderia/types'

vi.mock('@/modules/recepcion-mercaderia/services/recepcionApi', () => ({
  default: {
    getHistory: vi.fn(),
    getAllHistory: vi.fn(),
    exportAllHistoryCsv: vi.fn(),
    exportHistoryCsv: vi.fn(),
    updateGlpiTicket: vi.fn(),
    downloadDifferencesReport: vi.fn(),
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

function buildRow(overrides: Partial<HistoryRow> = {}): HistoryRow {
  return {
    transferId: 1,
    documentNumber: 'DOC-1',
    warehouseCode: 'T01',
    materializedAtUtc: '2026-01-10T00:00:00Z',
    differencesCount: 0,
    ...overrides,
  }
}

function buildUpdatedTransfer(overrides: Partial<ReceptionTransfer> = {}): ReceptionTransfer {
  return {
    transferId: 1,
    documentNumber: 'DOC-1',
    originWarehouseCode: 'CD01',
    destinationWarehouseCode: 'T01',
    status: 'confirmed',
    lines: [],
    materializedAtUtc: '2026-01-01',
    differencesCount: 0,
    glpiTicket: 'GLPI-9',
    ...overrides,
  }
}

function paged(items: HistoryRow[], overrides: Partial<PagedResponse<HistoryRow>> = {}): PagedResponse<HistoryRow> {
  return { items, totalCount: items.length, pageNumber: 1, pageSize: 20, ...overrides }
}

describe('useHistoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      userWarehouseAccesses: [{ codAlmacen: 'T01' }],
    } as unknown as ReturnType<typeof useAuthStore>)
  })

  describe('fetchHistory (store-scoped)', () => {
    it('fetches GET history with no filters and default pagination, populating rows/totalCount', async () => {
      const rows = [buildRow(), buildRow({ transferId: 2, documentNumber: 'DOC-2' })]
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged(rows, { totalCount: 33 }))
      const store = useHistoryStore()

      await store.fetchHistory()

      expect(recepcionApi.getHistory).toHaveBeenCalledWith({ fromUtc: undefined, toUtc: undefined }, { pageNumber: 1, pageSize: 20 })
      expect(store.rows).toEqual(rows)
      expect(store.totalCount).toBe(33)
      expect(store.status).toBe('ready')
    })

    it('sets status "error" when the fetch fails', async () => {
      vi.mocked(recepcionApi.getHistory).mockRejectedValue(new Error('down'))
      const store = useHistoryStore()

      await store.fetchHistory()

      expect(store.status).toBe('error')
      expect(store.rows).toEqual([])
    })
  })

  describe('setDateRange (server-side filter, real request per change)', () => {
    it('sends fromUtc/toUtc as local-day-start/local-day-end ISO instants, pinned to UTC', async () => {
      vi.stubEnv('TZ', 'UTC')
      try {
        vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([]))
        const store = useHistoryStore()
        await store.fetchHistory()
        vi.mocked(recepcionApi.getHistory).mockClear()

        store.setDateRange('2026-01-10', '2026-01-20')

        expect(recepcionApi.getHistory).toHaveBeenCalledWith(
          { fromUtc: '2026-01-10T00:00:00.000Z', toUtc: '2026-01-20T23:59:59.999Z' },
          { pageNumber: 1, pageSize: 20 }
        )
      } finally {
        vi.unstubAllEnvs()
      }
    })

    it('resolves the "to" bound against the LOCAL calendar day, not UTC midnight (Ecuador, UTC-5)', async () => {
      vi.stubEnv('TZ', 'America/Guayaquil')
      try {
        vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([]))
        const store = useHistoryStore()
        await store.fetchHistory()
        vi.mocked(recepcionApi.getHistory).mockClear()

        store.setDateRange(null, '2026-01-20')

        // Local 2026-01-20 23:59:59.999 -05:00 == 2026-01-21T04:59:59.999Z.
        expect(recepcionApi.getHistory).toHaveBeenCalledWith(
          { fromUtc: undefined, toUtc: '2026-01-21T04:59:59.999Z' },
          { pageNumber: 1, pageSize: 20 }
        )
      } finally {
        vi.unstubAllEnvs()
      }
    })

    it('resets to page 1 when the date range changes', async () => {
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([], { totalCount: 50 }))
      const store = useHistoryStore()
      store.setPage(3)
      await vi.waitFor(() => expect(store.page).toBe(3))

      store.setDateRange('2026-01-01', '2026-01-31')

      expect(store.page).toBe(1)
    })

    it('clears a leftover transferNumberQuery so it stops silently overriding the new date search', async () => {
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([]))
      const store = useHistoryStore()
      store.setTransferNumberQuery('200')
      await vi.waitFor(() => expect(recepcionApi.getHistory).toHaveBeenCalled())
      vi.mocked(recepcionApi.getHistory).mockClear()

      store.setDateRange('2026-01-01', '2026-01-31')

      expect(store.transferNumberQuery).toBe('')
      expect(recepcionApi.getHistory).toHaveBeenCalledWith(
        { fromUtc: expect.any(String), toUtc: expect.any(String) },
        { pageNumber: 1, pageSize: 20 }
      )
    })
  })

  describe('setTransferNumberQuery (overrides the date range, matches legacy behavior)', () => {
    it('sends only transferNumber, omitting fromUtc/toUtc even when a date range is set', async () => {
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([]))
      const store = useHistoryStore()
      store.setDateRange('2026-01-01', '2026-01-31')
      await vi.waitFor(() => expect(recepcionApi.getHistory).toHaveBeenCalled())
      vi.mocked(recepcionApi.getHistory).mockClear()

      store.setTransferNumberQuery('200')

      expect(recepcionApi.getHistory).toHaveBeenCalledWith({ transferNumber: '200' }, { pageNumber: 1, pageSize: 20 })
    })
  })

  describe('pagination', () => {
    it('setPage re-fetches with the new page number, preserving the current filters', async () => {
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([], { totalCount: 50 }))
      const store = useHistoryStore()
      store.setTransferNumberQuery('200')
      await vi.waitFor(() => expect(recepcionApi.getHistory).toHaveBeenCalled())
      vi.mocked(recepcionApi.getHistory).mockClear()

      store.setPage(2)

      expect(recepcionApi.getHistory).toHaveBeenCalledWith({ transferNumber: '200' }, { pageNumber: 2, pageSize: 20 })
    })

    it('setPageSize resets to page 1', async () => {
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([], { totalCount: 50 }))
      const store = useHistoryStore()
      store.setPage(3)
      await vi.waitFor(() => expect(store.page).toBe(3))

      store.setPageSize(50)

      expect(store.page).toBe(1)
      expect(store.pageSize).toBe(50)
    })
  })

  describe('differencesCount', () => {
    it('exposes differencesCount straight from the GET history response', async () => {
      const rows = [buildRow({ transferId: 1, differencesCount: 3 })]
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged(rows))
      const store = useHistoryStore()

      await store.fetchHistory()

      expect(store.rows[0].differencesCount).toBe(3)
    })
  })

  describe('updateGlpiTicket', () => {
    it('PUTs the GLPI ticket and updates the matching row without a full reload', async () => {
      const rows = [buildRow({ transferId: 1, glpiTicket: null })]
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged(rows))
      const store = useHistoryStore()
      await store.fetchHistory()

      vi.mocked(recepcionApi.updateGlpiTicket).mockResolvedValue(buildUpdatedTransfer())

      await store.updateGlpiTicket(1, 'GLPI-9')

      expect(recepcionApi.updateGlpiTicket).toHaveBeenCalledWith(1, { glpiTicket: 'GLPI-9' })
      expect(store.rows[0].glpiTicket).toBe('GLPI-9')
    })

    it('sets isSubmitting true while updateGlpiTicket is in flight and false after it resolves', async () => {
      const rows = [buildRow({ transferId: 1, glpiTicket: null })]
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged(rows))
      const store = useHistoryStore()
      await store.fetchHistory()

      let resolveUpdate!: (v: ReceptionTransfer) => void
      vi.mocked(recepcionApi.updateGlpiTicket).mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve
        })
      )

      const updatePromise = store.updateGlpiTicket(1, 'GLPI-9')
      expect(store.isSubmitting).toBe(true)

      resolveUpdate(buildUpdatedTransfer())
      await updatePromise

      expect(store.isSubmitting).toBe(false)
    })

    it('sets isSubmitting back to false when updateGlpiTicket fails', async () => {
      const rows = [buildRow({ transferId: 1, glpiTicket: null })]
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged(rows))
      const store = useHistoryStore()
      await store.fetchHistory()

      vi.mocked(recepcionApi.updateGlpiTicket).mockRejectedValue(new Error('down'))

      await store.updateGlpiTicket(1, 'GLPI-9')

      expect(store.isSubmitting).toBe(false)
    })
  })

  describe('updateGlpiTicketAdmin', () => {
    it('PUTs the GLPI ticket and updates the matching row in allRows (admin scope), not rows', async () => {
      const rows = [buildRow({ transferId: 1, warehouseCode: 'T01', glpiTicket: null })]
      vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged(rows))
      const store = useHistoryStore()
      await store.fetchAllHistory()

      vi.mocked(recepcionApi.updateGlpiTicket).mockResolvedValue(buildUpdatedTransfer())

      await store.updateGlpiTicketAdmin(1, 'GLPI-9')

      expect(recepcionApi.updateGlpiTicket).toHaveBeenCalledWith(1, { glpiTicket: 'GLPI-9' })
      expect(store.allRows[0].glpiTicket).toBe('GLPI-9')
      expect(store.rows).toEqual([])
    })

    it('sets allError (not error) when the admin-scope GLPI update fails', async () => {
      const rows = [buildRow({ transferId: 1, warehouseCode: 'T01', glpiTicket: null })]
      vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged(rows))
      const store = useHistoryStore()
      await store.fetchAllHistory()

      vi.mocked(recepcionApi.updateGlpiTicket).mockRejectedValue(new Error('down'))

      await store.updateGlpiTicketAdmin(1, 'GLPI-9')

      expect(store.allError).toBe('No se pudo guardar el ticket GLPI.')
      expect(store.error).toBeNull()
    })

    it('sets isSubmittingAdmin true while updateGlpiTicketAdmin is in flight and false after it resolves', async () => {
      const rows = [buildRow({ transferId: 1, warehouseCode: 'T01', glpiTicket: null })]
      vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged(rows))
      const store = useHistoryStore()
      await store.fetchAllHistory()

      let resolveUpdate!: (v: ReceptionTransfer) => void
      vi.mocked(recepcionApi.updateGlpiTicket).mockReturnValue(
        new Promise((resolve) => {
          resolveUpdate = resolve
        })
      )

      const updatePromise = store.updateGlpiTicketAdmin(1, 'GLPI-9')
      expect(store.isSubmittingAdmin).toBe(true)

      resolveUpdate(buildUpdatedTransfer())
      await updatePromise

      expect(store.isSubmittingAdmin).toBe(false)
    })

    it('sets isSubmittingAdmin back to false when updateGlpiTicketAdmin fails', async () => {
      const rows = [buildRow({ transferId: 1, warehouseCode: 'T01', glpiTicket: null })]
      vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged(rows))
      const store = useHistoryStore()
      await store.fetchAllHistory()

      vi.mocked(recepcionApi.updateGlpiTicket).mockRejectedValue(new Error('down'))

      await store.updateGlpiTicketAdmin(1, 'GLPI-9')

      expect(store.isSubmittingAdmin).toBe(false)
    })
  })

  describe('isSubmitting / isSubmittingAdmin independence', () => {
    it('does NOT set isSubmittingAdmin while a store-scoped updateGlpiTicket save is in flight', async () => {
      const rows = [buildRow({ transferId: 1, glpiTicket: null })]
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged(rows))
      const store = useHistoryStore()
      await store.fetchHistory()

      vi.mocked(recepcionApi.updateGlpiTicket).mockReturnValue(new Promise(() => {}))

      const updatePromise = store.updateGlpiTicket(1, 'GLPI-9')

      expect(store.isSubmitting).toBe(true)
      expect(store.isSubmittingAdmin).toBe(false)

      void updatePromise
    })

    it('does NOT set isSubmitting while an admin-scoped updateGlpiTicketAdmin save is in flight', async () => {
      const rows = [buildRow({ transferId: 1, warehouseCode: 'T01', glpiTicket: null })]
      vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged(rows))
      const store = useHistoryStore()
      await store.fetchAllHistory()

      vi.mocked(recepcionApi.updateGlpiTicket).mockReturnValue(new Promise(() => {}))

      const updatePromise = store.updateGlpiTicketAdmin(1, 'GLPI-9')

      expect(store.isSubmittingAdmin).toBe(true)
      expect(store.isSubmitting).toBe(false)

      void updatePromise
    })

    it('an in-flight store-scoped save does not get its button re-enabled by an unrelated admin-scoped save finishing', async () => {
      const rows = [buildRow({ transferId: 1, glpiTicket: null })]
      vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged(rows))
      const allRows = [buildRow({ transferId: 2, warehouseCode: 'T01', glpiTicket: null })]
      vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged(allRows))
      const store = useHistoryStore()
      await store.fetchHistory()
      await store.fetchAllHistory()

      vi.mocked(recepcionApi.updateGlpiTicket).mockReturnValueOnce(new Promise(() => {}))
      const storeSavePromise = store.updateGlpiTicket(1, 'GLPI-STORE')
      expect(store.isSubmitting).toBe(true)

      vi.mocked(recepcionApi.updateGlpiTicket).mockResolvedValueOnce(buildUpdatedTransfer({ transferId: 2, glpiTicket: 'GLPI-ADMIN' }))
      await store.updateGlpiTicketAdmin(2, 'GLPI-ADMIN')

      expect(store.isSubmitting).toBe(true)

      void storeSavePromise
    })
  })

  describe('fetchAllHistory (admin-scoped)', () => {
    it('fetches GET history/all with no filters and default pagination, populating allRows/allTotalCount', async () => {
      const rows = [buildRow({ transferId: 1, warehouseCode: 'T01' }), buildRow({ transferId: 2, warehouseCode: 'T02' })]
      vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged(rows, { totalCount: 12 }))
      const store = useHistoryStore()

      await store.fetchAllHistory()

      expect(recepcionApi.getAllHistory).toHaveBeenCalledWith({ fromUtc: undefined, toUtc: undefined }, { pageNumber: 1, pageSize: 20 })
      expect(store.allRows).toEqual(rows)
      expect(store.allTotalCount).toBe(12)
      expect(store.allStatus).toBe('ready')
    })

    it('sets allStatus "error" when the fetch fails', async () => {
      vi.mocked(recepcionApi.getAllHistory).mockRejectedValue(new Error('down'))
      const store = useHistoryStore()

      await store.fetchAllHistory()

      expect(store.allStatus).toBe('error')
      expect(store.allRows).toEqual([])
    })
  })

  describe('setAllDateRange / setAllTransferNumberQuery (server-side, same filter-override rule as store-scoped)', () => {
    it('sends fromUtc/toUtc for the admin scope, same local-day-boundary logic as store-scoped', async () => {
      vi.stubEnv('TZ', 'UTC')
      try {
        vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged([]))
        const store = useHistoryStore()
        await store.fetchAllHistory()
        vi.mocked(recepcionApi.getAllHistory).mockClear()

        store.setAllDateRange('2026-01-10', '2026-01-20')

        expect(recepcionApi.getAllHistory).toHaveBeenCalledWith(
          { fromUtc: '2026-01-10T00:00:00.000Z', toUtc: '2026-01-20T23:59:59.999Z' },
          { pageNumber: 1, pageSize: 20 }
        )
      } finally {
        vi.unstubAllEnvs()
      }
    })

    it('sends only transferNumber for the admin scope, omitting the date range', async () => {
      vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged([]))
      const store = useHistoryStore()
      store.setAllDateRange('2026-01-01', '2026-01-31')
      await vi.waitFor(() => expect(recepcionApi.getAllHistory).toHaveBeenCalled())
      vi.mocked(recepcionApi.getAllHistory).mockClear()

      store.setAllTransferNumberQuery('200')

      expect(recepcionApi.getAllHistory).toHaveBeenCalledWith({ transferNumber: '200' }, { pageNumber: 1, pageSize: 20 })
    })
  })

  describe('admin pagination', () => {
    it('setAllPage re-fetches with the new page number', async () => {
      vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged([], { totalCount: 50 }))
      const store = useHistoryStore()
      await store.fetchAllHistory()
      vi.mocked(recepcionApi.getAllHistory).mockClear()

      store.setAllPage(2)
      await vi.waitFor(() => expect(recepcionApi.getAllHistory).toHaveBeenCalledWith({ fromUtc: undefined, toUtc: undefined }, { pageNumber: 2, pageSize: 20 }))

      expect(store.allPage).toBe(2)
    })

    it('setAllPageSize resets to page 1', async () => {
      vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged([], { totalCount: 50 }))
      const store = useHistoryStore()
      store.setAllPage(3)
      await vi.waitFor(() => expect(store.allPage).toBe(3))

      store.setAllPageSize(50)

      expect(store.allPage).toBe(1)
      expect(store.allPageSize).toBe(50)
    })
  })

  describe('exportAllHistoryCsv', () => {
    it('returns the CSV Blob on success, sent with the current admin-scope filters', async () => {
      const blob = new Blob(['csv'])
      vi.mocked(recepcionApi.exportAllHistoryCsv).mockResolvedValue(blob)
      const store = useHistoryStore()
      store.setAllTransferNumberQuery('200')

      const result = await store.exportAllHistoryCsv()

      expect(recepcionApi.exportAllHistoryCsv).toHaveBeenCalledWith({ transferNumber: '200' })
      expect(result).toBe(blob)
    })

    it('returns null and surfaces an error on export failure, without a fake/empty download', async () => {
      vi.mocked(recepcionApi.exportAllHistoryCsv).mockRejectedValue(new Error('export failed'))
      const store = useHistoryStore()

      const result = await store.exportAllHistoryCsv()

      expect(result).toBeNull()
      expect(store.allError).toBe('No se pudo exportar el archivo Excel.')
    })
  })

  describe('exportHistoryCsv (own scope — no recepcion.history.viewall required)', () => {
    it('returns the CSV Blob on success, sent with the current own-scope filters', async () => {
      const blob = new Blob(['csv'])
      vi.mocked(recepcionApi.exportHistoryCsv).mockResolvedValue(blob)
      const store = useHistoryStore()
      store.setTransferNumberQuery('100')

      const result = await store.exportHistoryCsv()

      expect(recepcionApi.exportHistoryCsv).toHaveBeenCalledWith({ transferNumber: '100' })
      expect(recepcionApi.exportAllHistoryCsv).not.toHaveBeenCalled()
      expect(result).toBe(blob)
    })

    it('returns null and surfaces an error on the own-scope status, without touching allError', async () => {
      vi.mocked(recepcionApi.exportHistoryCsv).mockRejectedValue(new Error('export failed'))
      const store = useHistoryStore()

      const result = await store.exportHistoryCsv()

      expect(result).toBeNull()
      expect(store.error).toBe('No se pudo exportar el archivo Excel.')
      expect(store.allError).toBeNull()
    })
  })

  // Per-row "Exportar Diferencias" action (legacy sc22's Acción column) — one-shot, not tied to
  // any "active transfer" state (unlike pickingStore's TransferDetailView equivalent), so no
  // activeTransferId guard: the caller passes the specific row's transferId directly.
  describe('downloadDifferencesReport (store-scoped row action)', () => {
    it('returns the report Blob on success', async () => {
      const blob = new Blob(['report'])
      vi.mocked(recepcionApi.downloadDifferencesReport).mockResolvedValue(blob)
      const store = useHistoryStore()

      const result = await store.downloadDifferencesReport(1)

      expect(recepcionApi.downloadDifferencesReport).toHaveBeenCalledWith(1)
      expect(result).toBe(blob)
    })

    it('returns null and surfaces an error on failure, without a fake/empty download', async () => {
      vi.mocked(recepcionApi.downloadDifferencesReport).mockRejectedValue(new Error('down'))
      const store = useHistoryStore()

      const result = await store.downloadDifferencesReport(1)

      expect(result).toBeNull()
      expect(store.error).toBe('No se pudo descargar el reporte de diferencias.')
    })
  })

  describe('downloadDifferencesReportAdmin (admin-scoped row action)', () => {
    it('returns the report Blob on success', async () => {
      const blob = new Blob(['report'])
      vi.mocked(recepcionApi.downloadDifferencesReport).mockResolvedValue(blob)
      const store = useHistoryStore()

      const result = await store.downloadDifferencesReportAdmin(1)

      expect(recepcionApi.downloadDifferencesReport).toHaveBeenCalledWith(1)
      expect(result).toBe(blob)
    })

    it('returns null and surfaces the error in allError (not error) on failure', async () => {
      vi.mocked(recepcionApi.downloadDifferencesReport).mockRejectedValue(new Error('down'))
      const store = useHistoryStore()

      const result = await store.downloadDifferencesReportAdmin(1)

      expect(result).toBeNull()
      expect(store.allError).toBe('No se pudo descargar el reporte de diferencias.')
      expect(store.error).toBeNull()
    })
  })
})
