import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TransitTransfersView from '@/modules/recepcion-mercaderia/views/TransitTransfersView.vue'
import recepcionApi from '@/modules/recepcion-mercaderia/services/recepcionApi'
import type { PagedResponse, TransitPendingTransfer } from '@/modules/recepcion-mercaderia/types'

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

function paged(items: TransitPendingTransfer[], overrides: Partial<PagedResponse<TransitPendingTransfer>> = {}): PagedResponse<TransitPendingTransfer> {
  return { items, totalCount: items.length, pageNumber: 1, pageSize: 20, ...overrides }
}

describe('TransitTransfersView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches and renders the transit-transfer list, with the default page params', async () => {
    vi.mocked(recepcionApi.getTransitTransfers).mockResolvedValue(
      paged([buildLine(), buildLine({ sapTransferRequestNumber: 'SAP-901', transitWarehouseCode: 'TRL-QSS2' })])
    )

    const wrapper = mount(TransitTransfersView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(recepcionApi.getTransitTransfers).toHaveBeenCalledTimes(1)
    expect(recepcionApi.getTransitTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20 })
    expect(wrapper.text()).toContain('SAP-900')
    expect(wrapper.text()).toContain('TRL-QSN')
    expect(wrapper.text()).toContain('SAP-901')
  })

  it('debounces the search input and fires a real server-side GET with the search term', async () => {
    vi.useFakeTimers()
    vi.mocked(recepcionApi.getTransitTransfers)
      .mockResolvedValueOnce(paged([buildLine(), buildLine({ sapTransferRequestNumber: 'SAP-901', transitWarehouseCode: 'TRL-QSS2' })]))
      .mockResolvedValueOnce(paged([buildLine({ sapTransferRequestNumber: 'SAP-901', transitWarehouseCode: 'TRL-QSS2' })]))

    const wrapper = mount(TransitTransfersView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="search-input"]').setValue('SAP-901')
    // Not yet fired — still inside the 300ms debounce window.
    expect(recepcionApi.getTransitTransfers).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(recepcionApi.getTransitTransfers).toHaveBeenCalledTimes(2)
    expect(recepcionApi.getTransitTransfers).toHaveBeenLastCalledWith({ pageNumber: 1, pageSize: 20, search: 'SAP-901' })
    expect(wrapper.text()).not.toContain('SAP-900')
    expect(wrapper.text()).toContain('SAP-901')

    vi.useRealTimers()
  })

  it('the Buscar button applies the search term immediately without waiting for the debounce', async () => {
    vi.mocked(recepcionApi.getTransitTransfers)
      .mockResolvedValueOnce(paged([buildLine()]))
      .mockResolvedValueOnce(paged([buildLine({ sapTransferRequestNumber: 'SAP-901' })]))

    const wrapper = mount(TransitTransfersView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="search-input"]').setValue('SAP-901')
    await wrapper.find('[data-testid="search-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.getTransitTransfers).toHaveBeenLastCalledWith({ pageNumber: 1, pageSize: 20, search: 'SAP-901' })
  })

  it('renders exactly the 4 requested columns: N.° transferencia, destino transitoria, cantidad, fecha', async () => {
    vi.mocked(recepcionApi.getTransitTransfers).mockResolvedValue(paged([buildLine()]))

    const wrapper = mount(TransitTransfersView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    const row = wrapper.find('[data-testid="transit-row"]')
    const cells = row.findAll('td')
    expect(cells).toHaveLength(4)
    expect(cells[0].text()).toBe('SAP-900')
    expect(cells[1].text()).toBe('TRL-QSN')
    expect(cells[2].text()).toBe('12')
    expect(cells[3].text()).toBe('2026-08-01')
  })

  it('shows an empty state when there are no transit transfers', async () => {
    vi.mocked(recepcionApi.getTransitTransfers).mockResolvedValue(paged([]))

    const wrapper = mount(TransitTransfersView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.text()).toContain('No hay transferencias en tránsito.')
  })

  it('shows an inline error and does not crash when the fetch fails', async () => {
    vi.mocked(recepcionApi.getTransitTransfers).mockRejectedValue(new Error('network error'))

    const wrapper = mount(TransitTransfersView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('No se pudo cargar el listado de transferencias en tránsito.')
  })

  it('changing the page fires a new fetch with the updated pageNumber', async () => {
    vi.mocked(recepcionApi.getTransitTransfers).mockResolvedValue(
      paged([buildLine()], { totalCount: 25, pageNumber: 1, pageSize: 20 })
    )

    const wrapper = mount(TransitTransfersView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="pagination-next"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.getTransitTransfers).toHaveBeenLastCalledWith({ pageNumber: 2, pageSize: 20 })
  })

  it('downloads the unpaginated xlsx report via the store', async () => {
    vi.mocked(recepcionApi.getTransitTransfers).mockResolvedValue(paged([buildLine()]))
    const blob = new Blob(['xlsx'])
    vi.mocked(recepcionApi.downloadTransitReport).mockResolvedValue(blob)

    const wrapper = mount(TransitTransfersView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="download-transit-report-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.downloadTransitReport).toHaveBeenCalledWith()
  })
})
