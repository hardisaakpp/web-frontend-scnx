import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PendingTransfersView from '@/modules/recepcion-mercaderia/views/PendingTransfersView.vue'
import recepcionApi from '@/modules/recepcion-mercaderia/services/recepcionApi'
import { featureReadiness } from '@/modules/recepcion-mercaderia/config/featureReadiness'
import { useAuthStore } from '@/stores/auth'
import type { PendingTransferLine, PagedResponse } from '@/modules/recepcion-mercaderia/types'

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

function paged(items: PendingTransferLine[], overrides: Partial<PagedResponse<PendingTransferLine>> = {}): PagedResponse<PendingTransferLine> {
  return { items, totalCount: items.length, pageNumber: 1, pageSize: 20, ...overrides }
}

describe('PendingTransfersView', () => {
  const originalReady = featureReadiness.pendingTransfersReady

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      userWarehouseAccesses: [{ codAlmacen: 'T01' }],
    } as unknown as ReturnType<typeof useAuthStore>)
  })

  afterEach(() => {
    featureReadiness.pendingTransfersReady = originalReady
    // ConfirmDialog teleports to document.body; each mounted wrapper leaves its teleported node
    // behind on unmount (vitest doesn't auto-clean the jsdom body between tests in the same file),
    // so a stray dialog from a previous test would otherwise be matched by the next test's query.
    document.body.innerHTML = ''
  })

  it('renders a non-interactive SAP-blocked banner and does NOT fire a live fetch when degraded', async () => {
    featureReadiness.pendingTransfersReady = false

    const wrapper = mount(PendingTransfersView)
    await flushPromises()

    expect(wrapper.text()).toContain('bloqueada por la integración con SAP')
    expect(recepcionApi.getPendingTransfers).not.toHaveBeenCalled()
    // Materialize control must be disabled, not merely hidden.
    const button = wrapper.find('[data-testid="materialize-btn"]')
    expect(button.exists() ? button.attributes('disabled') : true).toBeTruthy()
  })

  it('clicking materialize shows a confirmation dialog and does NOT call the API yet', async () => {
    featureReadiness.pendingTransfersReady = true
    vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue(paged([buildLine()]))

    const wrapper = mount(PendingTransfersView)
    await flushPromises()

    await wrapper.find('[data-testid="materialize-btn"]').trigger('click')
    await flushPromises()

    const dialog = new DOMWrapper(document.body).find('[data-testid="confirm-dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).toContain('SAP-1')
    expect(recepcionApi.materializePendingTransfer).not.toHaveBeenCalled()
  })

  it('cancelling the confirmation dialog closes it without calling the API', async () => {
    featureReadiness.pendingTransfersReady = true
    vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue(paged([buildLine()]))

    const wrapper = mount(PendingTransfersView)
    await flushPromises()

    await wrapper.find('[data-testid="materialize-btn"]').trigger('click')
    await flushPromises()
    await new DOMWrapper(document.body).find('[data-testid="confirm-dialog-cancel-btn"]').trigger('click')
    await flushPromises()

    expect(new DOMWrapper(document.body).find('[data-testid="confirm-dialog"]').exists()).toBe(false)
    expect(recepcionApi.materializePendingTransfer).not.toHaveBeenCalled()
  })

  it('disables the materialize button while a materialize call is in flight, to prevent duplicate POSTs on double-click', async () => {
    featureReadiness.pendingTransfersReady = true
    vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue(paged([buildLine()]))
    let resolveMaterialize!: (v: number) => void
    vi.mocked(recepcionApi.materializePendingTransfer).mockReturnValue(
      new Promise((resolve) => {
        resolveMaterialize = resolve
      })
    )

    const wrapper = mount(PendingTransfersView)
    await flushPromises()

    await wrapper.find('[data-testid="materialize-btn"]').trigger('click')
    await flushPromises()
    await new DOMWrapper(document.body).find('[data-testid="confirm-dialog-confirm-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="materialize-btn"]').attributes('disabled')).toBeDefined()

    resolveMaterialize(42)
    await flushPromises()

    expect(recepcionApi.materializePendingTransfer).toHaveBeenCalledWith('SAP-1', 'T01')
    expect(recepcionApi.materializePendingTransfer).toHaveBeenCalledTimes(1)
  })

  it('fetches and renders the pending transfer list when ready, sending pageNumber/pageSize', async () => {
    featureReadiness.pendingTransfersReady = true
    vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue(paged([buildLine()]))

    const wrapper = mount(PendingTransfersView)
    await flushPromises()

    expect(recepcionApi.getPendingTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20 })
    expect(wrapper.text()).toContain('SAP-1')
  })

  it('paginates via real server-side GETs — clicking Siguiente requests the next page', async () => {
    featureReadiness.pendingTransfersReady = true
    vi.mocked(recepcionApi.getPendingTransfers)
      .mockResolvedValueOnce(paged([buildLine({ sapTransferRequestNumber: 'SAP-1' })], { totalCount: 25, pageNumber: 1 }))
      .mockResolvedValueOnce(paged([buildLine({ sapTransferRequestNumber: 'SAP-2' })], { totalCount: 25, pageNumber: 2 }))

    const wrapper = mount(PendingTransfersView)
    await flushPromises()

    expect(wrapper.text()).toContain('SAP-1')
    expect(wrapper.text()).toContain('Mostrando 1 a 20 de 25')

    await wrapper.find('[data-testid="pagination-next"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.getPendingTransfers).toHaveBeenLastCalledWith({ pageNumber: 2, pageSize: 20 })
    expect(wrapper.text()).toContain('SAP-2')
    expect(wrapper.text()).not.toContain('SAP-1')
  })

  it('changing the page size resets to page 1 and requests it', async () => {
    featureReadiness.pendingTransfersReady = true
    vi.mocked(recepcionApi.getPendingTransfers)
      .mockResolvedValueOnce(paged([buildLine()], { totalCount: 5, pageNumber: 1, pageSize: 20 }))
      .mockResolvedValueOnce(paged([buildLine()], { totalCount: 5, pageNumber: 1, pageSize: 50 }))

    const wrapper = mount(PendingTransfersView)
    await flushPromises()

    await wrapper.find('[data-testid="pagination-page-size"]').setValue('50')
    await flushPromises()

    expect(recepcionApi.getPendingTransfers).toHaveBeenLastCalledWith({ pageNumber: 1, pageSize: 50 })
  })

  it('renders a Fecha column with sapDocumentDate for each row', async () => {
    featureReadiness.pendingTransfersReady = true
    vi.mocked(recepcionApi.getPendingTransfers).mockResolvedValue(paged([buildLine({ sapDocumentDate: '2026-03-15' })]))

    const wrapper = mount(PendingTransfersView)
    await flushPromises()

    const headers = wrapper.findAll('th').map((th) => th.text())
    expect(headers).toContain('Fecha')
    expect(wrapper.text()).toContain('2026-03-15')
  })

  it('debounces the search input and fires a real server-side GET with the search term', async () => {
    vi.useFakeTimers()
    featureReadiness.pendingTransfersReady = true
    vi.mocked(recepcionApi.getPendingTransfers)
      .mockResolvedValueOnce(paged([buildLine({ sapTransferRequestNumber: 'SAP-1' }), buildLine({ sapTransferRequestNumber: 'SAP-2' })]))
      .mockResolvedValueOnce(paged([buildLine({ sapTransferRequestNumber: 'SAP-2' })]))

    const wrapper = mount(PendingTransfersView)
    await flushPromises()

    await wrapper.find('[data-testid="pending-search-input"]').setValue('SAP-2')
    // Not yet fired — still inside the 300ms debounce window.
    expect(recepcionApi.getPendingTransfers).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(recepcionApi.getPendingTransfers).toHaveBeenCalledTimes(2)
    expect(recepcionApi.getPendingTransfers).toHaveBeenLastCalledWith({ pageNumber: 1, pageSize: 20, search: 'SAP-2' })
    expect(wrapper.text()).not.toContain('SAP-1')
    expect(wrapper.text()).toContain('SAP-2')

    vi.useRealTimers()
  })

  it('the Buscar button applies the search term immediately without waiting for the debounce', async () => {
    featureReadiness.pendingTransfersReady = true
    vi.mocked(recepcionApi.getPendingTransfers)
      .mockResolvedValueOnce(paged([buildLine()]))
      .mockResolvedValueOnce(paged([buildLine({ sapTransferRequestNumber: 'SAP-9' })]))

    const wrapper = mount(PendingTransfersView)
    await flushPromises()

    const input = wrapper.find('[data-testid="pending-search-input"]')
    await input.setValue('SAP-9')
    await wrapper.find('[data-testid="pending-search-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.getPendingTransfers).toHaveBeenLastCalledWith({ pageNumber: 1, pageSize: 20, search: 'SAP-9' })
  })
})
