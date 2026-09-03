import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HistoryView from '@/modules/recepcion-mercaderia/views/HistoryView.vue'
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
    materializedAtUtc: '2026-01-05T00:00:00Z',
    differencesCount: 3,
    glpiTicket: null,
    ...overrides,
  }
}

function paged(items: HistoryRow[], overrides: Partial<PagedResponse<HistoryRow>> = {}): PagedResponse<HistoryRow> {
  return { items, totalCount: items.length, pageNumber: 1, pageSize: 20, ...overrides }
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
    glpiTicket: 'GLPI-1',
    ...overrides,
  }
}

function mockAuth(overrides: { isAdmin?: boolean; canViewAll?: boolean } = {}) {
  vi.mocked(useAuthStore).mockReturnValue({
    isAdmin: overrides.isAdmin ?? false,
    userWarehouseAccesses: [{ codAlmacen: 'T01' }],
    hasPermission: (permission: string) => permission === 'recepcion.history.viewall' && (overrides.canViewAll ?? false),
  } as unknown as ReturnType<typeof useAuthStore>)
}

describe('HistoryView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    // HistoryDetailModal mounts a Teleport-to-body anchor only while open — clear document.body
    // before each test as a defensive guard, same convention as TransferDetailView.test.ts.
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the warehouse-scoped view for a user without recepcion.history.viewall, fetching via getHistory only', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([buildRow()]))

    const wrapper = mount(HistoryView)
    await flushPromises()

    expect(recepcionApi.getHistory).toHaveBeenCalledTimes(1)
    expect(recepcionApi.getAllHistory).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('DOC-1')
    expect(wrapper.find('h1').text()).toBe('Historial de Recepciones')
    // GET history/export requires no permission beyond being logged in — the backend scopes the
    // file to the caller's own warehouses, same as GET history — so this button is not admin-only.
    expect(wrapper.find('[data-testid="export-csv-btn"]').exists()).toBe(true)
  })

  it('shows the consolidated view directly (no toggle) for a user with recepcion.history.viewall, fetching via getAllHistory only', async () => {
    mockAuth({ canViewAll: true })
    vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged([buildRow({ warehouseCode: 'T02' })]))

    const wrapper = mount(HistoryView)
    await flushPromises()

    expect(recepcionApi.getAllHistory).toHaveBeenCalledTimes(1)
    expect(recepcionApi.getHistory).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('DOC-1')
    expect(wrapper.find('h1').text()).toBe('Historial de Recepciones')
    expect(wrapper.find('[data-testid="export-csv-btn"]').exists()).toBe(true)
  })

  it('never renders a mode-toggle control, for either role — the view is fixed per session', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([buildRow()]))
    const own = mount(HistoryView)
    await flushPromises()
    expect(own.find('[data-testid="mode-toggle-own"]').exists()).toBe(false)
    expect(own.find('[data-testid="mode-toggle-all"]').exists()).toBe(false)

    mockAuth({ canViewAll: true })
    vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged([buildRow()]))
    const all = mount(HistoryView)
    await flushPromises()
    expect(all.find('[data-testid="mode-toggle-own"]').exists()).toBe(false)
    expect(all.find('[data-testid="mode-toggle-all"]').exists()).toBe(false)
  })

  it('debounces the transfer-number input and fires a real server-side GET with the query, in the consolidated view', async () => {
    vi.useFakeTimers()
    mockAuth({ canViewAll: true })
    vi.mocked(recepcionApi.getAllHistory)
      .mockResolvedValueOnce(paged([buildRow(), buildRow({ transferId: 2, documentNumber: 'DOC-2' })]))
      .mockResolvedValueOnce(paged([buildRow({ transferId: 2, documentNumber: 'DOC-2' })]))

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="transfer-number-input"]').setValue('DOC-2')
    // Not yet fired — still inside the 300ms debounce window.
    expect(recepcionApi.getAllHistory).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(recepcionApi.getAllHistory).toHaveBeenCalledTimes(2)
    expect(recepcionApi.getAllHistory).toHaveBeenLastCalledWith({ transferNumber: 'DOC-2' }, { pageNumber: 1, pageSize: 20 })
    expect(wrapper.text()).not.toContain('DOC-1')
    expect(wrapper.text()).toContain('DOC-2')
  })

  it('applies the Desde/Hasta range as a real server-side GET, in the warehouse-scoped view', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory)
      .mockResolvedValueOnce(paged([buildRow()]))
      .mockResolvedValueOnce(paged([buildRow({ transferId: 2, documentNumber: 'DOC-2' })]))

    const wrapper = mount(HistoryView)
    await flushPromises()

    // N° transferencia stays consolidated-only — the own-scope endpoint has no such filter.
    expect(wrapper.find('[data-testid="transfer-number-input"]').exists()).toBe(false)

    await wrapper.find('[data-testid="date-from-input"]').setValue('2026-02-01')
    await flushPromises()

    expect(recepcionApi.getHistory).toHaveBeenCalledTimes(2)
    expect(recepcionApi.getHistory).toHaveBeenLastCalledWith(
      { fromUtc: expect.stringContaining('2026-02-01'), toUtc: expect.any(String) },
      { pageNumber: 1, pageSize: 20 }
    )
    expect(wrapper.text()).not.toContain('DOC-1')
    expect(wrapper.text()).toContain('DOC-2')
  })

  it('applies the Desde/Hasta range as a real server-side GET, in the consolidated view', async () => {
    vi.mocked(recepcionApi.getAllHistory)
      .mockResolvedValueOnce(paged([buildRow()]))
      .mockResolvedValueOnce(paged([buildRow({ transferId: 2, documentNumber: 'DOC-2' })]))
    mockAuth({ canViewAll: true })

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="date-from-input"]').setValue('2026-02-01')
    await flushPromises()

    expect(recepcionApi.getAllHistory).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).not.toContain('DOC-1')
    expect(wrapper.text()).toContain('DOC-2')
  })

  it('edits the GLPI ticket inline via the store without a full reload, in the warehouse-scoped view', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([buildRow()]))
    vi.mocked(recepcionApi.updateGlpiTicket).mockResolvedValue(buildUpdatedTransfer())

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="glpi-edit-btn-1"]').trigger('click')
    await wrapper.find('[data-testid="glpi-input-1"]').setValue('GLPI-1')
    await wrapper.find('[data-testid="glpi-save-btn-1"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.updateGlpiTicket).toHaveBeenCalledWith(1, { glpiTicket: 'GLPI-1' })
    expect(wrapper.text()).toContain('GLPI-1')
  })

  it('disables the GLPI save button while the update is in flight, to prevent a duplicate POST from a fast double-click', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([buildRow()]))
    let resolveUpdate!: (v: ReceptionTransfer) => void
    vi.mocked(recepcionApi.updateGlpiTicket).mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve
      })
    )

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="glpi-edit-btn-1"]').trigger('click')
    await wrapper.find('[data-testid="glpi-input-1"]').setValue('GLPI-1')
    await wrapper.find('[data-testid="glpi-save-btn-1"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="glpi-save-btn-1"]').attributes('disabled')).toBeDefined()

    resolveUpdate(buildUpdatedTransfer())
    await flushPromises()
  })

  it('exports history via an axios blob request, in the consolidated view', async () => {
    mockAuth({ canViewAll: true })
    vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged([buildRow()]))
    const blob = new Blob(['xlsx content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    vi.mocked(recepcionApi.exportAllHistoryCsv).mockResolvedValue(blob)

    const wrapper = mount(HistoryView)
    await flushPromises()

    const exportLink = wrapper.find('a[href^="/"]')
    expect(exportLink.exists()).toBe(false)

    await wrapper.find('[data-testid="export-csv-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.exportAllHistoryCsv).toHaveBeenCalledTimes(1)
    expect(recepcionApi.exportHistoryCsv).not.toHaveBeenCalled()
  })

  it('exports history via GET history/export (no recepcion.history.viewall required), in the warehouse-scoped view', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([buildRow()]))
    const blob = new Blob(['xlsx content'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    vi.mocked(recepcionApi.exportHistoryCsv).mockResolvedValue(blob)

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="export-csv-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.exportHistoryCsv).toHaveBeenCalledTimes(1)
    expect(recepcionApi.exportAllHistoryCsv).not.toHaveBeenCalled()
  })

  it('surfaces an own-scope export error in the UI instead of presenting a fake/empty download', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([buildRow()]))
    vi.mocked(recepcionApi.exportHistoryCsv).mockRejectedValue(new Error('down'))

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="export-csv-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo exportar el archivo Excel.')
  })

  it('shows Id, Nueva Transferencia (sapStockTransferDocNum), and Sobrantes (differencesCount) columns, matching the legacy view', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(
      paged([buildRow({ transferId: 61689, sapStockTransferDocNum: 290668, differencesCount: 2 })])
    )

    const wrapper = mount(HistoryView)
    await flushPromises()

    expect(wrapper.text()).toContain('61689')
    expect(wrapper.text()).toContain('290668')
  })

  it('shows a placeholder for Nueva Transferencia when sapStockTransferDocNum is not yet set (unconfirmed transfer)', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([buildRow({ sapStockTransferDocNum: null })]))

    const wrapper = mount(HistoryView)
    await flushPromises()

    expect(wrapper.text()).toContain('—')
  })

  it('shows the transit warehouse (bodega transitoria) as the Movimiento destination when the row has one', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(
      paged([
        buildRow({
          originWarehouseCode: 'CD01',
          destinationWarehouseCode: 'RL-QSN',
          transitWarehouseCode: 'TRL-QSN',
        }),
      ])
    )

    const wrapper = mount(HistoryView)
    await flushPromises()

    expect(wrapper.text()).toContain('CD01 → TRL-QSN')
    expect(wrapper.text()).not.toContain('CD01 → RL-QSN')
  })

  it('falls back to the real destination store for Movimiento when the row has no transit warehouse', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(
      paged([
        buildRow({
          originWarehouseCode: 'CD01',
          destinationWarehouseCode: 'RL-QSN',
          transitWarehouseCode: null,
        }),
      ])
    )

    const wrapper = mount(HistoryView)
    await flushPromises()

    expect(wrapper.text()).toContain('CD01 → RL-QSN')
  })

  it('the Acción column exports the per-row differences report and also opens a read-only detail modal via the eye icon', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([buildRow({ transferId: 1, documentNumber: 'DOC-1' })]))
    const blob = new Blob(['report'], { type: 'application/pdf' })
    vi.mocked(recepcionApi.downloadDifferencesReport).mockResolvedValue(blob)

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="view-detail-btn-1"]').trigger('click')
    await flushPromises()

    // HistoryDetailModal renders via Teleport-to-body, so it must be found in document.body, not
    // inside wrapper's own element tree — same convention as TransferDetailView.test.ts's
    // ErrorDialog/ConfirmDialog assertions.
    const body = new DOMWrapper(document.body)
    expect(body.find('[data-testid="history-detail-modal"]').exists()).toBe(true)
    expect(body.find('[data-testid="history-detail-modal"]').text()).toContain('DOC-1')

    await body.find('[data-testid="history-detail-modal-close-btn"]').trigger('click')
    await flushPromises()

    expect(body.find('[data-testid="history-detail-modal"]').exists()).toBe(false)

    await wrapper.find('[data-testid="export-differences-btn-1"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.downloadDifferencesReport).toHaveBeenCalledWith(1)

    wrapper.unmount()
  })

  it('does not render the detail modal before the eye icon is clicked', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(paged([buildRow({ transferId: 1 })]))

    const wrapper = mount(HistoryView)
    await flushPromises()

    expect(new DOMWrapper(document.body).find('[data-testid="history-detail-modal"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders each line item code in the detail modal product table once opened', async () => {
    mockAuth({ canViewAll: false })
    vi.mocked(recepcionApi.getHistory).mockResolvedValue(
      paged([
        buildRow({
          transferId: 1,
          lines: [
            { lineId: 1, itemCode: 'ITM-1', itemName: 'Producto 1', quantity: 5, scanned: 5, barcode: '1111' },
            { lineId: 2, itemCode: 'ITM-2', itemName: 'Producto 2', quantity: 3, scanned: 2, barcode: null },
          ],
        }),
      ])
    )

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="view-detail-btn-1"]').trigger('click')
    await flushPromises()

    const modalText = new DOMWrapper(document.body).find('[data-testid="history-detail-modal"]').text()
    expect(modalText).toContain('ITM-1')
    expect(modalText).toContain('ITM-2')

    wrapper.unmount()
  })

  it('exports the per-row differences report via the admin-scoped action in the consolidated view', async () => {
    mockAuth({ canViewAll: true })
    vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged([buildRow({ transferId: 2 })]))
    const blob = new Blob(['report'], { type: 'application/pdf' })
    vi.mocked(recepcionApi.downloadDifferencesReport).mockResolvedValue(blob)

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="export-differences-btn-2"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.downloadDifferencesReport).toHaveBeenCalledWith(2)
  })

  it('edits the GLPI ticket via the admin-scoped store action in the consolidated view', async () => {
    mockAuth({ canViewAll: true })
    vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged([buildRow({ transferId: 1, glpiTicket: null })]))
    vi.mocked(recepcionApi.updateGlpiTicket).mockResolvedValue(buildUpdatedTransfer({ glpiTicket: 'GLPI-9' }))

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="glpi-edit-btn-1"]').trigger('click')
    await wrapper.find('[data-testid="glpi-input-1"]').setValue('GLPI-9')
    await wrapper.find('[data-testid="glpi-save-btn-1"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.updateGlpiTicket).toHaveBeenCalledWith(1, { glpiTicket: 'GLPI-9' })
    expect(wrapper.text()).toContain('GLPI-9')
  })

  it('surfaces the admin-scope GLPI update failure in allError instead of showing nothing', async () => {
    mockAuth({ canViewAll: true })
    vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged([buildRow({ transferId: 1, glpiTicket: null })]))
    vi.mocked(recepcionApi.updateGlpiTicket).mockRejectedValue(new Error('down'))

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="glpi-edit-btn-1"]').trigger('click')
    await wrapper.find('[data-testid="glpi-input-1"]').setValue('GLPI-9')
    await wrapper.find('[data-testid="glpi-save-btn-1"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo guardar el ticket GLPI.')
  })

  describe('server-side pagination', () => {
    it('paginates the warehouse-scoped rows via a real new GET request per page', async () => {
      mockAuth({ canViewAll: false })
      const page1 = Array.from({ length: 20 }, (_, i) => buildRow({ transferId: i + 1, documentNumber: `DOC-${i + 1}` }))
      const page2 = Array.from({ length: 5 }, (_, i) => buildRow({ transferId: i + 21, documentNumber: `DOC-${i + 21}` }))
      vi.mocked(recepcionApi.getHistory)
        .mockResolvedValueOnce(paged(page1, { totalCount: 25, pageNumber: 1 }))
        .mockResolvedValueOnce(paged(page2, { totalCount: 25, pageNumber: 2 }))

      const wrapper = mount(HistoryView)
      await flushPromises()

      expect(wrapper.text()).toContain('DOC-1')
      expect(wrapper.text()).not.toContain('DOC-21')

      await wrapper.find('[data-testid="pagination-next"]').trigger('click')
      await flushPromises()

      expect(wrapper.text()).not.toContain('DOC-1')
      expect(wrapper.text()).toContain('DOC-21')
      expect(recepcionApi.getHistory).toHaveBeenCalledTimes(2)
      // The view now applies today's date as a real filter on mount (not just a pre-filled,
      // inert placeholder) — pagination preserves that same active date filter.
      expect(recepcionApi.getHistory).toHaveBeenLastCalledWith(
        { fromUtc: expect.any(String), toUtc: expect.any(String) },
        { pageNumber: 2, pageSize: 20 }
      )
    })

    it('resets to page 1 (server-side) when the transfer-number filter narrows the consolidated result set', async () => {
      vi.useFakeTimers()
      mockAuth({ canViewAll: true })
      const page1 = Array.from({ length: 20 }, (_, i) => buildRow({ transferId: i + 1, documentNumber: `DOC-${i + 1}` }))
      const page2 = Array.from({ length: 5 }, (_, i) => buildRow({ transferId: i + 21, documentNumber: `DOC-${i + 21}` }))
      vi.mocked(recepcionApi.getAllHistory)
        .mockResolvedValueOnce(paged(page1, { totalCount: 25, pageNumber: 1 }))
        .mockResolvedValueOnce(paged(page2, { totalCount: 25, pageNumber: 2 }))
        .mockResolvedValueOnce(paged([buildRow({ transferId: 1, documentNumber: 'DOC-1' })], { totalCount: 1, pageNumber: 1 }))

      const wrapper = mount(HistoryView)
      await flushPromises()

      await wrapper.find('[data-testid="pagination-next"]').trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('DOC-21')

      await wrapper.find('[data-testid="transfer-number-input"]').setValue('DOC-1')
      await vi.advanceTimersByTimeAsync(300)
      await flushPromises()

      expect(recepcionApi.getAllHistory).toHaveBeenLastCalledWith({ transferNumber: 'DOC-1' }, { pageNumber: 1, pageSize: 20 })
      expect(wrapper.text()).toContain('Mostrando 1 a')
    })

    it('typing a page number and pressing Enter jumps directly to that page', async () => {
      mockAuth({ canViewAll: false })
      vi.mocked(recepcionApi.getHistory)
        .mockResolvedValueOnce(paged([buildRow({ documentNumber: 'DOC-1' })], { totalCount: 100, pageNumber: 1 }))
        .mockResolvedValueOnce(paged([buildRow({ documentNumber: 'DOC-5' })], { totalCount: 100, pageNumber: 5 }))

      const wrapper = mount(HistoryView)
      await flushPromises()

      const pageInput = wrapper.find<HTMLInputElement>('[data-testid="pagination-page-input"]')
      await pageInput.setValue('5')
      await pageInput.trigger('keydown.enter')
      await flushPromises()

      expect(recepcionApi.getHistory).toHaveBeenLastCalledWith(expect.anything(), { pageNumber: 5, pageSize: 20 })
      expect(wrapper.text()).toContain('DOC-5')
    })

    it('clamps an out-of-range typed page number to the closest valid page', async () => {
      mockAuth({ canViewAll: false })
      vi.mocked(recepcionApi.getHistory)
        .mockResolvedValueOnce(paged([buildRow()], { totalCount: 25, pageNumber: 1 }))
        .mockResolvedValueOnce(paged([buildRow()], { totalCount: 25, pageNumber: 2 }))

      const wrapper = mount(HistoryView)
      await flushPromises()

      // totalCount 25 / pageSize 20 → 2 pages max; typing 999 must clamp to 2, not request page 999.
      const pageInput = wrapper.find<HTMLInputElement>('[data-testid="pagination-page-input"]')
      await pageInput.setValue('999')
      await pageInput.trigger('keydown.enter')
      await flushPromises()

      expect(recepcionApi.getHistory).toHaveBeenLastCalledWith(expect.anything(), { pageNumber: 2, pageSize: 20 })
    })
  })

  it('surfaces a history export error in the UI instead of presenting a fake/empty download', async () => {
    mockAuth({ canViewAll: true })
    vi.mocked(recepcionApi.getAllHistory).mockResolvedValue(paged([buildRow()]))
    vi.mocked(recepcionApi.exportAllHistoryCsv).mockRejectedValue(new Error('down'))

    const wrapper = mount(HistoryView)
    await flushPromises()

    await wrapper.find('[data-testid="export-csv-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo exportar el archivo Excel.')
  })
})
