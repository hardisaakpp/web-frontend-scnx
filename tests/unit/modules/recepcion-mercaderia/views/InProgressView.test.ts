import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import InProgressView from '@/modules/recepcion-mercaderia/views/InProgressView.vue'
import { useInProgressStore } from '@/modules/recepcion-mercaderia/stores/inProgressStore'
import recepcionApi from '@/modules/recepcion-mercaderia/services/recepcionApi'
import type { PagedResponse, ReceptionTransfer } from '@/modules/recepcion-mercaderia/types'

vi.mock('@/modules/recepcion-mercaderia/services/recepcionApi', () => ({
  default: {
    getInProgressTransfers: vi.fn(),
  },
}))

function buildTransfer(overrides: Partial<ReceptionTransfer> = {}): ReceptionTransfer {
  return {
    transferId: 1,
    documentNumber: 'DOC-1',
    originWarehouseCode: 'CD01',
    destinationWarehouseCode: 'T01',
    status: 'in-progress',
    lines: [],
    materializedAtUtc: '2026-01-01',
    differencesCount: 0,
    ...overrides,
  }
}

function paged(items: ReceptionTransfer[], overrides: Partial<PagedResponse<ReceptionTransfer>> = {}): PagedResponse<ReceptionTransfer> {
  return { items, totalCount: items.length, pageNumber: 1, pageSize: 20, ...overrides }
}

describe('InProgressView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetches and renders the in-progress transfer list, with the default page params', async () => {
    vi.mocked(recepcionApi.getInProgressTransfers).mockResolvedValue(
      paged([buildTransfer(), buildTransfer({ transferId: 2, documentNumber: 'DOC-2' })], { totalCount: 2 })
    )

    const wrapper = mount(InProgressView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(recepcionApi.getInProgressTransfers).toHaveBeenCalledTimes(1)
    expect(recepcionApi.getInProgressTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20 })
    expect(wrapper.text()).toContain('DOC-1')
    expect(wrapper.text()).toContain('DOC-2')
  })

  it('filters rows client-side by search input, WITHIN the loaded page, without issuing a new GET request', async () => {
    vi.mocked(recepcionApi.getInProgressTransfers).mockResolvedValue(
      paged([buildTransfer(), buildTransfer({ transferId: 2, documentNumber: 'DOC-2' })], { totalCount: 2 })
    )

    const wrapper = mount(InProgressView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    const searchInput = wrapper.find('[data-testid="search-input"]')
    expect(searchInput.exists()).toBe(true)
    await searchInput.setValue('DOC-2')
    await flushPromises()

    expect(recepcionApi.getInProgressTransfers).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).not.toContain('DOC-1')
    expect(wrapper.text()).toContain('DOC-2')
  })

  describe('server-side pagination', () => {
    it('paginates via a real new GET request per page, not client-side slicing', async () => {
      const page1 = Array.from({ length: 20 }, (_, i) => buildTransfer({ transferId: i + 1, documentNumber: `DOC-${i + 1}` }))
      const page2 = Array.from({ length: 5 }, (_, i) => buildTransfer({ transferId: i + 21, documentNumber: `DOC-${i + 21}` }))
      vi.mocked(recepcionApi.getInProgressTransfers)
        .mockResolvedValueOnce(paged(page1, { totalCount: 25, pageNumber: 1 }))
        .mockResolvedValueOnce(paged(page2, { totalCount: 25, pageNumber: 2 }))

      const wrapper = mount(InProgressView, { global: { stubs: { RouterLink: true } } })
      await flushPromises()

      expect(wrapper.text()).toContain('DOC-1')
      expect(wrapper.text()).toContain('DOC-20')
      expect(wrapper.text()).not.toContain('DOC-21')

      await wrapper.find('[data-testid="pagination-next"]').trigger('click')
      await flushPromises()

      expect(wrapper.text()).not.toContain('DOC-1')
      expect(wrapper.text()).toContain('DOC-21')
      expect(recepcionApi.getInProgressTransfers).toHaveBeenCalledTimes(2)
      expect(recepcionApi.getInProgressTransfers).toHaveBeenLastCalledWith({ pageNumber: 2, pageSize: 20 })
    })

    it('resets to page 1 (server-side) when the page size changes', async () => {
      const page1of20 = Array.from({ length: 20 }, (_, i) => buildTransfer({ transferId: i + 1, documentNumber: `DOC-${i + 1}` }))
      const page2of20 = Array.from({ length: 5 }, (_, i) => buildTransfer({ transferId: i + 21, documentNumber: `DOC-${i + 21}` }))
      const page1of10 = Array.from({ length: 10 }, (_, i) => buildTransfer({ transferId: i + 1, documentNumber: `DOC-${i + 1}` }))
      vi.mocked(recepcionApi.getInProgressTransfers)
        .mockResolvedValueOnce(paged(page1of20, { totalCount: 25, pageNumber: 1, pageSize: 20 }))
        .mockResolvedValueOnce(paged(page2of20, { totalCount: 25, pageNumber: 2, pageSize: 20 }))
        .mockResolvedValueOnce(paged(page1of10, { totalCount: 25, pageNumber: 1, pageSize: 10 }))

      const wrapper = mount(InProgressView, { global: { stubs: { RouterLink: true } } })
      await flushPromises()

      await wrapper.find('[data-testid="pagination-next"]').trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('DOC-21')

      await wrapper.find('[data-testid="pagination-page-size"]').setValue('10')
      await flushPromises()

      expect(recepcionApi.getInProgressTransfers).toHaveBeenLastCalledWith({ pageNumber: 1, pageSize: 10 })
      expect(wrapper.text()).toContain('DOC-1')
      expect(wrapper.text()).not.toContain('DOC-11')
    })

    it('clears a stale page left over from a previous visit to this view on mount', async () => {
      vi.mocked(recepcionApi.getInProgressTransfers).mockResolvedValue(paged([buildTransfer()], { totalCount: 45 }))
      // The store is a Pinia singleton — simulate what a prior visit left behind (page 6)
      // before this view mounts again.
      const store = useInProgressStore()
      store.page = 6

      mount(InProgressView, { global: { stubs: { RouterLink: true } } })
      await flushPromises()

      expect(recepcionApi.getInProgressTransfers).toHaveBeenCalledWith({ pageNumber: 1, pageSize: 20 })
    })

    it('typing a page number and pressing Enter jumps directly to that page', async () => {
      vi.mocked(recepcionApi.getInProgressTransfers)
        .mockResolvedValueOnce(paged([buildTransfer({ documentNumber: 'DOC-1' })], { totalCount: 100, pageNumber: 1 }))
        .mockResolvedValueOnce(paged([buildTransfer({ documentNumber: 'DOC-5' })], { totalCount: 100, pageNumber: 5 }))

      const wrapper = mount(InProgressView, { global: { stubs: { RouterLink: true } } })
      await flushPromises()

      const pageInput = wrapper.find<HTMLInputElement>('[data-testid="pagination-page-input"]')
      await pageInput.setValue('5')
      await pageInput.trigger('keydown.enter')
      await flushPromises()

      expect(recepcionApi.getInProgressTransfers).toHaveBeenLastCalledWith({ pageNumber: 5, pageSize: 20 })
      expect(wrapper.text()).toContain('DOC-5')
    })

    it('clamps an out-of-range typed page number to the closest valid page', async () => {
      vi.mocked(recepcionApi.getInProgressTransfers)
        .mockResolvedValueOnce(paged([buildTransfer()], { totalCount: 25, pageNumber: 1 }))
        .mockResolvedValueOnce(paged([buildTransfer()], { totalCount: 25, pageNumber: 2 }))

      const wrapper = mount(InProgressView, { global: { stubs: { RouterLink: true } } })
      await flushPromises()

      // totalCount 25 / pageSize 20 → 2 pages max; typing 999 must clamp to 2, not request page 999.
      const pageInput = wrapper.find<HTMLInputElement>('[data-testid="pagination-page-input"]')
      await pageInput.setValue('999')
      await pageInput.trigger('keydown.enter')
      await flushPromises()

      expect(recepcionApi.getInProgressTransfers).toHaveBeenLastCalledWith({ pageNumber: 2, pageSize: 20 })
    })
  })
})
