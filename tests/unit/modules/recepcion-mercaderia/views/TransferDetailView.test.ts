import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TransferDetailView from '@/modules/recepcion-mercaderia/views/TransferDetailView.vue'
import recepcionApi from '@/modules/recepcion-mercaderia/services/recepcionApi'
import { useAuthStore } from '@/stores/auth'
import type { ConfirmTransferResponse, Difference, ReceptionLine, ReceptionTransfer } from '@/modules/recepcion-mercaderia/types'

vi.mock('@/modules/recepcion-mercaderia/services/recepcionApi', () => ({
  default: {
    getInProgressTransfers: vi.fn(),
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

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}))

// Holder object so the reactive proxy created inside the (hoisted, lazily-invoked) mock factory can
// be mutated from tests to simulate Vue Router reusing the component instance across navigations
// that only change `:id` on the same matched route record.
const routeParamsHolder = vi.hoisted(() => ({ current: { id: '7' } as { id: string } }))
const routerPushMock = vi.hoisted(() => vi.fn())

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  const { reactive } = await import('vue')
  routeParamsHolder.current = reactive(routeParamsHolder.current)
  return {
    ...actual,
    useRoute: () => ({ params: routeParamsHolder.current }),
    useRouter: () => ({ push: routerPushMock }),
  }
})

function buildLine(overrides: Partial<ReceptionLine> = {}): ReceptionLine {
  return { lineId: 1, itemCode: 'A1', itemName: 'Item A1', quantity: 10, scanned: 4, barcode: null, ...overrides }
}

function buildTransfer(overrides: Partial<ReceptionTransfer> = {}): ReceptionTransfer {
  return {
    transferId: 7,
    documentNumber: 'DOC-7',
    originWarehouseCode: 'CD01',
    destinationWarehouseCode: 'T01',
    status: 'in-progress',
    lines: [buildLine()],
    materializedAtUtc: '2026-01-01',
    differencesCount: 0,
    ...overrides,
  }
}

function buildDifference(overrides: Partial<Difference> = {}): Difference {
  return {
    differenceId: 1,
    transferId: 7,
    barcode: '999888777',
    lineId: null,
    productDescription: null,
    isRecognized: false,
    scannedAtUtc: '2026-01-02T00:00:00Z',
    scannedByUserId: 'user-1',
    ...overrides,
  }
}

// GET /transfers/{id} really returns { transfer, differences } (recepcionApi.getTransfer's real
// return shape) — wraps a bare ReceptionTransfer fixture the same way for every mock call site.
function mockGetTransfer(transfer: ReceptionTransfer, differences: Difference[] = []) {
  return { transfer, differences }
}

function mockAuth(permissions: string[]) {
  vi.mocked(useAuthStore).mockReturnValue({
    hasPermission: (p: string) => permissions.includes(p),
  } as unknown as ReturnType<typeof useAuthStore>)
}

describe('TransferDetailView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    routeParamsHolder.current.id = '7'
    // ErrorDialog mounts a Teleport-to-body anchor only while a transfer is loaded and an error is
    // open. Most tests here don't unmount their wrapper, so clear document.body before each test as
    // a defensive guard against any such anchor leaking into a later test.
    document.body.innerHTML = ''
  })

  it('fetches the transfer by route id and renders computed Diferencia client-side', async () => {
    mockAuth(['recepcion.picking.scan', 'recepcion.reception.confirm', 'recepcion.diferencias.gestionar'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(recepcionApi.getTransfer).toHaveBeenCalledWith(7)
    expect(wrapper.text()).toContain('DOC-7')
    // Diferencia = Cantidad(10) - Escaneados(4) = 6, computed client-side, never from API.
    expect(wrapper.text()).toContain('6')
  })

  it('shows a "Procesando en SAP" badge when the transfer has a queued SAP confirm job pending', async () => {
    mockAuth(['recepcion.reception.view'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(
      mockGetTransfer(buildTransfer({ pendingSapJobQueuedAtUtc: '2026-08-31T12:00:00Z' }))
    )

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.find('[data-testid="pending-sap-job-badge"]').exists()).toBe(true)
  })

  it('does not show the "Procesando en SAP" badge when there is no pending SAP job', async () => {
    mockAuth(['recepcion.reception.view'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(
      mockGetTransfer(buildTransfer({ pendingSapJobQueuedAtUtc: null }))
    )

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.find('[data-testid="pending-sap-job-badge"]').exists()).toBe(false)
  })

  it('shows transitoria -> destino real in the subtitle when the transfer has a transit warehouse', async () => {
    mockAuth(['recepcion.picking.scan'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(
      mockGetTransfer(buildTransfer({ transitWarehouseCode: 'TRL-QSS2', destinationWarehouseCode: 'RL-QSS2' }))
    )

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.text()).toContain('TRL-QSS2 a RL-QSS2')
    expect(wrapper.text()).not.toContain('CD01 a RL-QSS2')
  })

  it('falls back to origen -> destino real in the subtitle when the transfer has no transit warehouse', async () => {
    mockAuth(['recepcion.picking.scan'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(
      mockGetTransfer(buildTransfer({ transitWarehouseCode: null, originWarehouseCode: 'CD01', destinationWarehouseCode: 'T01' }))
    )

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.text()).toContain('CD01 a T01')
  })

  it('shows each line\'s barcode next to the item, with a placeholder when the backend has not populated it', async () => {
    mockAuth(['recepcion.picking.scan'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(
      mockGetTransfer(
        buildTransfer({
          lines: [
            buildLine({ lineId: 1, itemCode: 'A1', barcode: '7861226206064' }),
            buildLine({ lineId: 2, itemCode: 'A2', barcode: null }),
          ],
        })
      )
    )

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    const cells = wrapper.findAll('[data-testid="barcode-cell"]')
    expect(cells[0].text()).toBe('7861226206064')
    expect(cells[1].text()).toBe('Sin código de barras')
  })

  it('shows the manual scanned-quantity input for a barcode-less line whether the backend sends null or an empty string', async () => {
    mockAuth(['recepcion.picking.scan'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(
      mockGetTransfer(
        buildTransfer({
          lines: [
            buildLine({ lineId: 1, itemCode: 'A1', barcode: null }),
            buildLine({ lineId: 2, itemCode: 'A2', barcode: '' }),
            buildLine({ lineId: 3, itemCode: 'A3', barcode: '7861226206064' }),
          ],
        })
      )
    )

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.find('[data-testid="scan-quantity-input-1"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="scan-quantity-input-2"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="scan-quantity-input-3"]').exists()).toBe(false)
  })

  it('re-fetches the transfer when the route id changes while the component instance is reused', async () => {
    mockAuth(['recepcion.reception.view'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(recepcionApi.getTransfer).toHaveBeenCalledWith(7)
    expect(wrapper.text()).toContain('DOC-7')

    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })))
    routeParamsHolder.current.id = '8'
    await flushPromises()

    expect(recepcionApi.getTransfer).toHaveBeenCalledWith(8)
    expect(wrapper.text()).toContain('DOC-8')
  })

  it('shows an error message instead of a blank page when fetchTransfer fails', async () => {
    mockAuth(['recepcion.reception.view'])
    vi.mocked(recepcionApi.getTransfer).mockRejectedValue(new Error('down'))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo cargar el detalle de la transferencia.')
    expect(wrapper.find('[data-testid="scan-form"]').exists()).toBe(false)
  })

  it('always renders the lines table, but hides the editable scan controls when the user lacks recepcion.picking.scan', async () => {
    mockAuth([])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.find('[data-testid="scan-form"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="scan-quantity-input-1"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="scan-submit-btn"]').exists()).toBe(false)
    // Read-only scanned total is still shown.
    expect(wrapper.text()).toContain('4')
  })

  it('submits only the changed lines as a batch via the real line-picker, then re-fetches the transfer', async () => {
    mockAuth(['recepcion.picking.scan'])
    const lines = [buildLine({ lineId: 1, quantity: 10, scanned: 4 }), buildLine({ lineId: 2, itemCode: 'A2', quantity: 5, scanned: 2 })]
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer({ lines })))
      .mockResolvedValue(mockGetTransfer(buildTransfer({ lines: [lines[0], { ...lines[1], scanned: 5 }] })))
    vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    // Line 1 is left untouched — only line 2's quantity is edited.
    await wrapper.find('[data-testid="scan-quantity-input-2"]').setValue('5')
    await wrapper.find('[data-testid="scan-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(recepcionApi.scan).toHaveBeenCalledWith(7, {
      scans: [{ lineId: 2, scannedQuantity: 5 }],
      responsibleName: null,
      courierWaybillNumber: null,
    })
    expect(recepcionApi.getTransfer).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('5')
  })

  it('includes the optional responsible name and courier waybill number in the scan batch when filled', async () => {
    mockAuth(['recepcion.picking.scan'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))
    vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-quantity-input-1"]').setValue('6')
    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('Juan Perez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-123')
    await wrapper.find('[data-testid="scan-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(recepcionApi.scan).toHaveBeenCalledWith(7, {
      scans: [{ lineId: 1, scannedQuantity: 6 }],
      responsibleName: 'JUAN PEREZ',
      courierWaybillNumber: 'GUIA-123',
    })
  })

  it('does not call scan when no line quantity changed', async () => {
    mockAuth(['recepcion.picking.scan'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(recepcionApi.scan).not.toHaveBeenCalled()
  })

  it('shows the SAP-error modal on confirm 500, does not crash, and keeps the transfer retryable', async () => {
    mockAuth(['recepcion.reception.confirm'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))
    vi.mocked(recepcionApi.confirm).mockRejectedValue({ response: { status: 500 } })

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-btn"]').trigger('click')
    await flushPromises()

    const body = new DOMWrapper(document.body)
    expect(body.find('[data-testid="error-dialog"]').exists()).toBe(true)
    expect(body.text()).toContain(
      'No se pudo integrar la transferencia a SAP. Los escaneos se guardaron; vuelva a intentarlo cuando el servicio esté disponible.'
    )

    // Still on the detail view (no crash, no navigation away) and retryable.
    expect(wrapper.find('[data-testid="confirm-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="confirm-btn"]').attributes('disabled')).toBeFalsy()

    // Dismissing the modal clears the error without touching the transfer's state.
    await body.find('[data-testid="error-dialog-close-btn"]').trigger('click')
    await flushPromises()
    expect(body.find('[data-testid="error-dialog"]').exists()).toBe(false)

    // Explicitly unmount (unlike this file's other tests) so ErrorDialog's Teleport-to-body anchor
    // is torn down via Vue's own lifecycle instead of lingering in document.body for later tests.
    wrapper.unmount()
  })

  it('sends allowPartial: true only when confirming partially', async () => {
    mockAuth(['recepcion.reception.confirm', 'recepcion.reception.confirm.partial'])
    // Complete line (scanned === quantity) — the forced-recount gate only fires on incomplete
    // lines, and this test is about the payload shape, not that gate (covered separately below).
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer({ lines: [buildLine({ scanned: 10, quantity: 10 })] })))
    vi.mocked(recepcionApi.confirm).mockResolvedValue({ success: true, sapDocEntry: null, sapDocNum: null, message: '' })

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-partial-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.confirm).toHaveBeenCalledWith(7, {
      allowPartial: true,
      responsibleName: 'MARÍA PÉREZ',
      courierWaybillNumber: 'GUIA-12345',
    })
  })

  it('blocks complete confirmation when responsible name is blank or whitespace-only', async () => {
    mockAuth(['recepcion.reception.confirm'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('   ')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.confirm).not.toHaveBeenCalled()
    expect(new DOMWrapper(document.body).text()).toContain('Ingresa el nombre del responsable.')
    expect((wrapper.find('[data-testid="scan-responsible-input"]').element as HTMLInputElement).value).toBe('   ')
  })

  it('blocks partial confirmation when courier waybill is blank or whitespace-only', async () => {
    mockAuth(['recepcion.reception.confirm.partial'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(
      mockGetTransfer(buildTransfer({ lines: [buildLine({ scanned: 10, quantity: 10 })] }))
    )

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('   ')
    await wrapper.find('[data-testid="confirm-partial-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.confirm).not.toHaveBeenCalled()
    expect(new DOMWrapper(document.body).text()).toContain('Ingresa el número de guía.')
    expect((wrapper.find('[data-testid="scan-courier-input"]').element as HTMLInputElement).value).toBe('   ')
  })

  it.each(['GUIA-1234', 'GUIA-123456'])('blocks confirmation when courier waybill is not exactly 10 characters: %s', async (courierWaybill) => {
    mockAuth(['recepcion.reception.confirm'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue(courierWaybill)
    await wrapper.find('[data-testid="confirm-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.confirm).not.toHaveBeenCalled()
    expect(new DOMWrapper(document.body).text()).toContain('La guía debe tener exactamente 10 caracteres.')
    expect((wrapper.find('[data-testid="scan-courier-input"]').element as HTMLInputElement).value).toBe(courierWaybill)
  })

  it('blocks the first partial-confirm attempt on an incomplete transfer, resets the incomplete line inputs to 0, and opens the recount dialog', async () => {
    mockAuth(['recepcion.picking.scan', 'recepcion.reception.confirm.partial'])
    // Default buildLine() is incomplete: scanned(4) < quantity(10).
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-partial-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.confirm).not.toHaveBeenCalled()
    const dialog = new DOMWrapper(document.body).find('[data-testid="confirm-dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.text()).not.toMatch(/volvé|confirmá/i)
    expect((wrapper.find('[data-testid="scan-quantity-input-1"]').element as HTMLInputElement).value).toBe('0')

    wrapper.unmount()
  })

  it('allows the second partial-confirm attempt through, matching legacy behavior of trusting the recount flag rather than re-verifying the scan', async () => {
    mockAuth(['recepcion.reception.confirm.partial'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))
    vi.mocked(recepcionApi.confirm).mockResolvedValue({ success: true, sapDocEntry: null, sapDocNum: null, message: '' })

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-partial-btn"]').trigger('click')
    await flushPromises()
    expect(recepcionApi.confirm).not.toHaveBeenCalled()

    await wrapper.find('[data-testid="confirm-partial-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.confirm).toHaveBeenCalledWith(7, {
      allowPartial: true,
      responsibleName: 'MARÍA PÉREZ',
      courierWaybillNumber: 'GUIA-12345',
    })
  })

  it('confirms the partial reception directly from the recount dialog without needing a second click on the outer button', async () => {
    mockAuth(['recepcion.picking.scan', 'recepcion.reception.confirm.partial'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))
    vi.mocked(recepcionApi.confirm).mockResolvedValue({ success: true, sapDocEntry: null, sapDocNum: null, message: '' })

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-partial-btn"]').trigger('click')
    await flushPromises()
    expect(recepcionApi.confirm).not.toHaveBeenCalled()

    const body = new DOMWrapper(document.body)
    await body.find('[data-testid="confirm-dialog-confirm-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.confirm).toHaveBeenCalledWith(7, {
      allowPartial: true,
      responsibleName: 'MARÍA PÉREZ',
      courierWaybillNumber: 'GUIA-12345',
    })
    expect(body.find('[data-testid="confirm-dialog"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('closes the recount dialog without confirming when cancelled', async () => {
    mockAuth(['recepcion.picking.scan', 'recepcion.reception.confirm.partial'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-partial-btn"]').trigger('click')
    await flushPromises()

    const body = new DOMWrapper(document.body)
    await body.find('[data-testid="confirm-dialog-cancel-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.confirm).not.toHaveBeenCalled()
    expect(body.find('[data-testid="confirm-dialog"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('does not gate the partial confirm when there are no incomplete lines', async () => {
    mockAuth(['recepcion.reception.confirm.partial'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer({ lines: [buildLine({ scanned: 10, quantity: 10 })] })))
    vi.mocked(recepcionApi.confirm).mockResolvedValue({ success: true, sapDocEntry: null, sapDocNum: null, message: '' })

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-partial-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.confirm).toHaveBeenCalledWith(7, {
      allowPartial: true,
      responsibleName: 'MARÍA PÉREZ',
      courierWaybillNumber: 'GUIA-12345',
    })
  })

  it('disables the confirm button while a confirm call is in flight, to prevent duplicate POSTs on double-click', async () => {
    mockAuth(['recepcion.reception.confirm'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))
    let resolveConfirm!: (v: ConfirmTransferResponse) => void
    vi.mocked(recepcionApi.confirm).mockReturnValue(
      new Promise((resolve) => {
        resolveConfirm = resolve
      })
    )

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-btn"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="confirm-btn"]').attributes('disabled')).toBeDefined()

    resolveConfirm({ success: true, sapDocEntry: null, sapDocNum: null, message: '' })
    await flushPromises()

    expect(recepcionApi.confirm).toHaveBeenCalledTimes(1)
  })

  it('redirects to Historial once confirm succeeds, since a confirmed transfer no longer belongs on this picking detail', async () => {
    mockAuth(['recepcion.reception.confirm'])
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer()))
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer({ status: 'confirmed' })))
    vi.mocked(recepcionApi.confirm).mockResolvedValue({ success: true, sapDocEntry: null, sapDocNum: null, message: '' })

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-btn"]').trigger('click')
    await flushPromises()

    expect(routerPushMock).toHaveBeenCalledWith({ name: 'recepcion-historial' })
  })

  it('recovers from a confirm request that failed client-side (e.g. timeout) but actually went through on the backend: no error shown, redirects to Historial', async () => {
    mockAuth(['recepcion.reception.confirm'])
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer()))
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer({ status: 'confirmed' })))
    vi.mocked(recepcionApi.confirm).mockRejectedValue(new Error('timeout of 30000ms exceeded'))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-btn"]').trigger('click')
    await flushPromises()

    const body = new DOMWrapper(document.body)
    expect(body.find('[data-testid="error-dialog"]').exists()).toBe(false)
    expect(routerPushMock).toHaveBeenCalledWith({ name: 'recepcion-historial' })
  })

  it('recovers from a 400 "already confirmed" (duplicate click/tab racing automatic reconciliation): no error shown, redirects to Historial', async () => {
    mockAuth(['recepcion.reception.confirm'])
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer()))
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer({ status: 'confirmed' })))
    vi.mocked(recepcionApi.confirm).mockRejectedValue({
      response: { status: 400, data: { error: 'Reception transfer 7 is already confirmed.' } },
    })

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-btn"]').trigger('click')
    await flushPromises()

    const body = new DOMWrapper(document.body)
    expect(body.find('[data-testid="error-dialog"]').exists()).toBe(false)
    expect(routerPushMock).toHaveBeenCalledWith({ name: 'recepcion-historial' })
  })

  it('shows the confirm error when a refetch after a failed confirm confirms it really did not go through', async () => {
    mockAuth(['recepcion.reception.confirm'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))
    vi.mocked(recepcionApi.confirm).mockRejectedValue(new Error('network error'))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="scan-responsible-input"]').setValue('María Pérez')
    await wrapper.find('[data-testid="scan-courier-input"]').setValue('GUIA-12345')
    await wrapper.find('[data-testid="confirm-btn"]').trigger('click')
    await flushPromises()

    const body = new DOMWrapper(document.body)
    expect(body.find('[data-testid="error-dialog"]').exists()).toBe(true)
    expect(body.text()).toContain('No se pudo confirmar la transferencia.')
    expect(routerPushMock).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('hides the confirm button when the user lacks the confirm permission', async () => {
    mockAuth([])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.find('[data-testid="confirm-btn"]').exists()).toBe(false)
  })

  it('has no standalone manual "Registrar diferencia" form — legacy only records differences via the barcode-scanner-gun overflow, never a separate typed-barcode form', async () => {
    mockAuth(['recepcion.picking.scan', 'recepcion.diferencias.gestionar'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.find('[data-testid="differences-form"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="difference-barcode-input"]').exists()).toBe(false)
  })

  it('renders the differences log as a 4-column table matching legacy (Código de barras, Producto, Fecha / Hora, Acciones)', async () => {
    // Differences are only ever created via the barcode-scanner-gun overflow path (legacy has no
    // separate manual "register a difference" form — recP.php's procesarCodigo() is the only
    // entry point) — so triggering one here requires recepcion.picking.scan, not just
    // recepcion.diferencias.gestionar (which only gates managing existing differences).
    mockAuth(['recepcion.picking.scan', 'recepcion.diferencias.gestionar'])
    const transfer = buildTransfer({ lines: [buildLine({ barcode: '7791234' })] })
    // The real productDescription only exists once the store re-fetches the transfer after the
    // POST (the POST itself only returns { id }) — this is the fix under test.
    const created = buildDifference({ barcode: '999888777', productDescription: 'UWM-2478.M- BOXER', scannedAtUtc: '2026-01-02T15:30:00Z' })
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(transfer))
      .mockResolvedValue(mockGetTransfer(transfer, [created]))
    vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('999888777')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()

    const table = wrapper.find('[data-testid="differences-table"]')
    expect(table.exists()).toBe(true)
    expect(table.findAll('th').map((th) => th.text())).toEqual([
      'Código de barras',
      'Producto',
      'Cantidad',
      'Fecha / Hora',
      'Acciones',
    ])

    const row = table.findAll('tbody tr')[0]
    const cells = row.findAll('td')
    expect(cells[0].text()).toBe('999888777')
    expect(cells[1].text()).toBe('UWM-2478.M- BOXER')
    expect(cells[2].text()).toBe('1')
    expect(cells[3].text()).not.toBe('')
    expect(cells[4].text()).toContain('Eliminar')
  })

  it('groups repeated scans of the same barcode into one row with a Cantidad counter', async () => {
    mockAuth(['recepcion.diferencias.gestionar'])
    const transfer = buildTransfer({ lines: [buildLine({ barcode: '7791234' })] })
    const differences = [
      buildDifference({ differenceId: 1, barcode: '999888777', scannedAtUtc: '2026-01-02T15:00:00Z' }),
      buildDifference({ differenceId: 2, barcode: '999888777', scannedAtUtc: '2026-01-02T15:30:00Z' }),
      buildDifference({ differenceId: 3, barcode: '111', scannedAtUtc: '2026-01-02T16:00:00Z' }),
    ]
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer, differences))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    const rows = wrapper.find('[data-testid="differences-table"]').findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].findAll('td')[2].text()).toBe('2')
    expect(rows[1].findAll('td')[2].text()).toBe('1')
  })

  it('deletes every unit of the group when confirming Eliminar on a grouped difference row', async () => {
    mockAuth(['recepcion.diferencias.gestionar'])
    const transfer = buildTransfer({ lines: [buildLine({ barcode: '7791234' })] })
    const differences = [
      buildDifference({ differenceId: 1, barcode: '999888777' }),
      buildDifference({ differenceId: 2, barcode: '999888777' }),
    ]
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer, differences))
    vi.mocked(recepcionApi.deleteDifference).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.findAll('button').find((b) => b.text().includes('Eliminar'))!.trigger('click')
    await flushPromises()

    expect(recepcionApi.deleteDifference).toHaveBeenCalledTimes(2)
    expect(recepcionApi.deleteDifference).toHaveBeenCalledWith(1)
    expect(recepcionApi.deleteDifference).toHaveBeenCalledWith(2)
    expect(wrapper.text()).not.toContain('999888777')
  })

  it('stops the group delete and surfaces the error when one unit fails, instead of silently clearing it on the next unit', async () => {
    mockAuth(['recepcion.diferencias.gestionar'])
    const transfer = buildTransfer({ lines: [buildLine({ barcode: '7791234' })] })
    const differences = [
      buildDifference({ differenceId: 1, barcode: '999888777' }),
      buildDifference({ differenceId: 2, barcode: '999888777' }),
    ]
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(transfer, differences))
    vi.mocked(recepcionApi.deleteDifference).mockRejectedValueOnce(new Error('network blip')).mockResolvedValueOnce(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.findAll('button').find((b) => b.text().includes('Eliminar'))!.trigger('click')
    await flushPromises()

    // Stops after the first (failed) unit — the second deleteDifference call, which would reset
    // actionError back to null and mask the failure, must never run.
    expect(recepcionApi.deleteDifference).toHaveBeenCalledTimes(1)
    expect(new DOMWrapper(document.body).find('[data-testid="error-dialog"]').exists()).toBe(true)
    // The undeleted unit keeps the group visible with its count reduced by zero (still 2), not gone.
    expect(wrapper.find('[data-testid="differences-table"]').text()).toContain('999888777')

    wrapper.unmount()
  })

  it('treats a naive scannedAtUtc (no trailing Z — the confirmed EF Core DateTimeKind.Unspecified bug) as UTC, not local time', async () => {
    mockAuth(['recepcion.picking.scan'])
    const transfer = buildTransfer({ lines: [buildLine()] })
    // Same instant, one with the zone marker the backend SHOULD send and one "naive" like the
    // real backend currently sends — both must render identically once parsed defensively.
    const withZ = buildDifference({ differenceId: 1, barcode: '111', scannedAtUtc: '2026-01-02T15:30:00Z' })
    const naive = buildDifference({ differenceId: 2, barcode: '222', scannedAtUtc: '2026-01-02T15:30:00' })

    vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer, [withZ]))
    const wrapperWithZ = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()
    const withZText = wrapperWithZ.find('[data-testid="differences-table"]').findAll('tbody tr')[0].findAll('td')[3].text()

    vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(transfer, [naive]))
    const wrapperNaive = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()
    const naiveText = wrapperNaive.find('[data-testid="differences-table"]').findAll('tbody tr')[0].findAll('td')[3].text()

    expect(naiveText).toBe(withZText)
  })

  it('shows a placeholder in the Producto column when the backend could not identify the product', async () => {
    mockAuth(['recepcion.picking.scan', 'recepcion.diferencias.gestionar'])
    const transfer = buildTransfer({ lines: [buildLine({ barcode: '7791234' })] })
    const created = buildDifference({ barcode: '111222333', productDescription: null })
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(transfer))
      .mockResolvedValue(mockGetTransfer(transfer, [created]))
    vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('111222333')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()

    const row = wrapper.find('[data-testid="differences-table"]').findAll('tbody tr')[0]
    expect(row.findAll('td')[1].text()).toBe('—')
  })

  it('deletes a recorded difference via the store', async () => {
    mockAuth(['recepcion.picking.scan', 'recepcion.diferencias.gestionar'])
    const transfer = buildTransfer({ lines: [buildLine({ barcode: '7791234' })] })
    const created = buildDifference({ differenceId: 1, barcode: '999888777' })
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(transfer))
      .mockResolvedValue(mockGetTransfer(transfer, [created]))
    vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)
    vi.mocked(recepcionApi.deleteDifference).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('999888777')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('999888777')

    await wrapper.findAll('button').find((b) => b.text().includes('Eliminar'))!.trigger('click')
    await flushPromises()

    expect(recepcionApi.deleteDifference).toHaveBeenCalledWith(1)
    expect(wrapper.text()).not.toContain('999888777')
  })

  it('edits the GLPI ticket inline via the store without a full reload', async () => {
    mockAuth([])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer({ glpiTicket: null })))
    vi.mocked(recepcionApi.updateGlpiTicket).mockResolvedValue(buildTransfer({ glpiTicket: 'GLPI-99' }))

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="glpi-edit-btn"]').trigger('click')
    await wrapper.find('[data-testid="glpi-input"]').setValue('GLPI-99')
    await wrapper.find('[data-testid="glpi-save-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.updateGlpiTicket).toHaveBeenCalledWith(7, { glpiTicket: 'GLPI-99' })
    expect(wrapper.text()).toContain('GLPI-99')
  })

  it('downloads the differences report via the store', async () => {
    mockAuth(['recepcion.diferencias.gestionar'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))
    const blob = new Blob(['report'])
    vi.mocked(recepcionApi.downloadDifferencesReport).mockResolvedValue(blob)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="download-report-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.downloadDifferencesReport).toHaveBeenCalledWith(7)
  })

  it('downloads the picking report via the store', async () => {
    mockAuth(['recepcion.diferencias.gestionar'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer()))
    const blob = new Blob(['picking'])
    vi.mocked(recepcionApi.downloadPickingReport).mockResolvedValue(blob)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="download-picking-report-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.downloadPickingReport).toHaveBeenCalledWith(7)
  })

  it('shows a read-only scanned count for lines that have a barcode, since they are driven by the barcode scanner instead', async () => {
    mockAuth(['recepcion.picking.scan'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(
      mockGetTransfer(buildTransfer({ lines: [buildLine({ lineId: 1, quantity: 10, scanned: 4, barcode: '7791234' })] }))
    )

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.find('[data-testid="scan-quantity-input-1"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('4')
  })

  it('keeps a manual fallback quantity input for lines without a barcode, without touching differences', async () => {
    mockAuth(['recepcion.picking.scan'])
    const line = buildLine({ lineId: 1, quantity: 10, scanned: 4, barcode: null })
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer({ lines: [line] })))
      .mockResolvedValue(mockGetTransfer(buildTransfer({ lines: [{ ...line, scanned: 6 }] })))
    vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    expect(wrapper.find('[data-testid="scan-quantity-input-1"]').exists()).toBe(true)

    await wrapper.find('[data-testid="scan-quantity-input-1"]').setValue('6')
    await wrapper.find('[data-testid="scan-form"]').trigger('submit.prevent')
    await flushPromises()

    expect(recepcionApi.scan).toHaveBeenCalledWith(7, {
      scans: [{ lineId: 1, scannedQuantity: 6 }],
      responsibleName: null,
      courierWaybillNumber: null,
    })
    expect(recepcionApi.recordDifference).not.toHaveBeenCalled()
  })

  it('caps a manual entry above the line quantity at line.quantity and redirects the overflow to differences (lineId-identified)', async () => {
    mockAuth(['recepcion.picking.scan'])
    const line = buildLine({ lineId: 1, quantity: 10, scanned: 4, barcode: null })
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer({ lines: [line] })))
      .mockResolvedValue(mockGetTransfer(buildTransfer({ lines: [{ ...line, scanned: 10 }] })))
    vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)
    vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    // Manual input has no :max — typing above line.quantity must still submit the form.
    await wrapper.find('[data-testid="scan-quantity-input-1"]').setValue('13')
    await wrapper.find('[data-testid="scan-form"]').trigger('submit.prevent')
    await flushPromises()

    // entered = 13, line.quantity = 10 -> fillAmount = 10 (capped), excess = 3
    expect(recepcionApi.scan).toHaveBeenCalledWith(7, {
      scans: [{ lineId: 1, scannedQuantity: 10 }],
      responsibleName: null,
      courierWaybillNumber: null,
    })
    expect(recepcionApi.recordDifference).toHaveBeenCalledTimes(3)
    expect(recepcionApi.recordDifference).toHaveBeenCalledWith(7, { lineId: 1 })

    // Input reseeds from the capped line.scanned after the store's post-save re-fetch.
    expect((wrapper.find('[data-testid="scan-quantity-input-1"]').element as HTMLInputElement).value).toBe('10')
  })

  it('scans a recognized barcode with room, capping the fill with no leftover when it fits exactly', async () => {
    mockAuth(['recepcion.picking.scan'])
    const line = buildLine({ lineId: 1, itemCode: 'A1', quantity: 10, scanned: 8, barcode: '7791234' })
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer({ lines: [line] })))
      .mockResolvedValue(mockGetTransfer(buildTransfer({ lines: [{ ...line, scanned: 10 }] })))
    vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('7791234')
    await wrapper.find('[data-testid="barcode-scan-quantity-input"]').setValue('2')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.scan).toHaveBeenCalledWith(7, {
      scans: [{ lineId: 1, scannedQuantity: 10 }],
      responsibleName: null,
      courierWaybillNumber: null,
    })
    expect(recepcionApi.recordDifference).not.toHaveBeenCalled()
  })

  it('fills the next pending line on the second scan when the barcode is duplicated', async () => {
    mockAuth(['recepcion.picking.scan'])
    const firstLine = buildLine({ lineId: 1827, itemCode: 'A1', quantity: 1, scanned: 0, barcode: '7861228343378' })
    const secondLine = buildLine({ lineId: 1851, itemCode: 'A1', quantity: 1, scanned: 0, barcode: '7861228343378' })
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer({ lines: [firstLine, secondLine] })))
      .mockResolvedValueOnce(
        mockGetTransfer(buildTransfer({ lines: [{ ...firstLine, scanned: 1 }, secondLine] }))
      )
      .mockResolvedValue(
        mockGetTransfer(buildTransfer({ lines: [{ ...firstLine, scanned: 1 }, { ...secondLine, scanned: 1 }] }))
      )
    vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('7861228343378')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('7861228343378')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.scan).toHaveBeenCalledTimes(2)
    expect(recepcionApi.scan).toHaveBeenNthCalledWith(1, 7, {
      scans: [{ lineId: 1827, scannedQuantity: 1 }],
      responsibleName: null,
      courierWaybillNumber: null,
    })
    expect(recepcionApi.scan).toHaveBeenNthCalledWith(2, 7, {
      scans: [{ lineId: 1851, scannedQuantity: 1 }],
      responsibleName: null,
      courierWaybillNumber: null,
    })
    expect(recepcionApi.recordDifference).not.toHaveBeenCalled()
  })

  it('records a difference only after every line with the duplicated barcode is complete', async () => {
    mockAuth(['recepcion.picking.scan'])
    const firstLine = buildLine({ lineId: 1827, itemCode: 'A1', quantity: 1, scanned: 1, barcode: '7861228343378' })
    const secondLine = buildLine({ lineId: 1851, itemCode: 'A1', quantity: 1, scanned: 0, barcode: '7861228343378' })
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer({ lines: [firstLine, secondLine] })))
      .mockResolvedValue(
        mockGetTransfer(buildTransfer({ lines: [firstLine, { ...secondLine, scanned: 1 }] }))
      )
    vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)
    vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('7861228343378')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.scan).toHaveBeenCalledWith(7, {
      scans: [{ lineId: 1851, scannedQuantity: 1 }],
      responsibleName: null,
      courierWaybillNumber: null,
    })
    expect(recepcionApi.recordDifference).not.toHaveBeenCalled()

    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('7861228343378')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.scan).toHaveBeenCalledTimes(1)
    expect(recepcionApi.recordDifference).toHaveBeenCalledTimes(1)
    expect(recepcionApi.recordDifference).toHaveBeenCalledWith(7, { barcode: '7861228343378' })
  })

  it("caps the fill at the line's remaining quantity and redirects each excess unit to its own difference record, fixing legacy's silent-drop bug", async () => {
    mockAuth(['recepcion.picking.scan'])
    const line = buildLine({ lineId: 1, itemCode: 'A1', quantity: 10, scanned: 8, barcode: '7791234' })
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer({ lines: [line] })))
      .mockResolvedValue(mockGetTransfer(buildTransfer({ lines: [{ ...line, scanned: 10 }] })))
    vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)
    vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('7791234')
    await wrapper.find('[data-testid="barcode-scan-quantity-input"]').setValue('5')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.scan).toHaveBeenCalledTimes(1)
    expect(recepcionApi.scan).toHaveBeenCalledWith(7, {
      scans: [{ lineId: 1, scannedQuantity: 10 }],
      responsibleName: null,
      courierWaybillNumber: null,
    })
    expect(recepcionApi.recordDifference).toHaveBeenCalledTimes(3)
    expect(recepcionApi.recordDifference).toHaveBeenNthCalledWith(1, 7, { barcode: '7791234' })
    expect(recepcionApi.recordDifference).toHaveBeenNthCalledWith(3, 7, { barcode: '7791234' })
  })

  it('redirects a scan attempt on an already-complete line entirely to a difference record, without overfilling', async () => {
    mockAuth(['recepcion.picking.scan'])
    const line = buildLine({ lineId: 1, quantity: 10, scanned: 10, barcode: '7791234' })
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer({ lines: [line] })))
    vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('7791234')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.scan).not.toHaveBeenCalled()
    expect(recepcionApi.recordDifference).toHaveBeenCalledTimes(1)
    expect(recepcionApi.recordDifference).toHaveBeenCalledWith(7, { barcode: '7791234' })
  })

  it('records an unrecognized barcode as a difference and does not touch any line', async () => {
    mockAuth(['recepcion.picking.scan'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValue(mockGetTransfer(buildTransfer({ lines: [buildLine({ barcode: '7791234' })] })))
    vi.mocked(recepcionApi.recordDifference).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('000000')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()

    expect(recepcionApi.scan).not.toHaveBeenCalled()
    expect(recepcionApi.recordDifference).toHaveBeenCalledTimes(1)
    expect(recepcionApi.recordDifference).toHaveBeenCalledWith(7, { barcode: '000000' })
  })

  it('resets the barcode input and quantity back to 1 after each scan, matching legacy resetearCampos()', async () => {
    mockAuth(['recepcion.picking.scan'])
    const line = buildLine({ lineId: 1, quantity: 10, scanned: 8, barcode: '7791234' })
    vi.mocked(recepcionApi.getTransfer)
      .mockResolvedValueOnce(mockGetTransfer(buildTransfer({ lines: [line] })))
      .mockResolvedValue(mockGetTransfer(buildTransfer({ lines: [{ ...line, scanned: 9 }] })))
    vi.mocked(recepcionApi.scan).mockResolvedValue(undefined)

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    await wrapper.find('[data-testid="barcode-scan-input"]').setValue('7791234')
    await wrapper.find('[data-testid="barcode-scan-add-btn"]').trigger('click')
    await flushPromises()

    expect((wrapper.find('[data-testid="barcode-scan-input"]').element as HTMLInputElement).value).toBe('')
    expect((wrapper.find('[data-testid="barcode-scan-quantity-input"]').element as HTMLInputElement).value).toBe('1')
  })

  it('uses the transfer id captured at click time for the report filename, even if the route changes before the download resolves', async () => {
    mockAuth(['recepcion.diferencias.gestionar'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })))

    const mockAnchor = { href: '', download: '', click: vi.fn() }
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => (tag === 'a' ? (mockAnchor as unknown as HTMLElement) : originalCreateElement(tag)))
    // Only intercept the mock anchor — everything else (including ErrorDialog's real Teleport-to-body
    // node) must go through the real DOM, or Vue's own Teleport patching breaks on a later re-render.
    const originalAppendChild = document.body.appendChild.bind(document.body)
    const originalRemoveChild = document.body.removeChild.bind(document.body)
    const appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((n) => (n === (mockAnchor as unknown as Node) ? n : originalAppendChild(n)))
    const removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation((n) => (n === (mockAnchor as unknown as Node) ? n : originalRemoveChild(n)))
    window.URL.createObjectURL = vi.fn(() => 'blob:test-url')
    window.URL.revokeObjectURL = vi.fn()

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    let resolveDownload!: (blob: Blob) => void
    vi.mocked(recepcionApi.downloadDifferencesReport).mockReturnValue(
      new Promise((resolve) => {
        resolveDownload = resolve
      })
    )

    const clickPromise = wrapper.find('[data-testid="download-report-btn"]').trigger('click')

    // Navigate to transfer B before A's download resolves.
    vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })))
    routeParamsHolder.current.id = '8'
    await flushPromises()

    resolveDownload(new Blob(['report']))
    await clickPromise
    await flushPromises()

    expect(mockAnchor.download).toBe('diferencias-7.xlsx')

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })

  it('uses the transfer id captured at click time for the picking report filename, even if the route changes before the download resolves', async () => {
    mockAuth(['recepcion.diferencias.gestionar'])
    vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(buildTransfer({ transferId: 7, documentNumber: 'DOC-7' })))

    const mockAnchor = { href: '', download: '', click: vi.fn() }
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => (tag === 'a' ? (mockAnchor as unknown as HTMLElement) : originalCreateElement(tag)))
    // Only intercept the mock anchor — everything else (including ErrorDialog's real Teleport-to-body
    // node) must go through the real DOM, or Vue's own Teleport patching breaks on a later re-render.
    const originalAppendChild = document.body.appendChild.bind(document.body)
    const originalRemoveChild = document.body.removeChild.bind(document.body)
    const appendChildSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((n) => (n === (mockAnchor as unknown as Node) ? n : originalAppendChild(n)))
    const removeChildSpy = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation((n) => (n === (mockAnchor as unknown as Node) ? n : originalRemoveChild(n)))
    window.URL.createObjectURL = vi.fn(() => 'blob:test-url')
    window.URL.revokeObjectURL = vi.fn()

    const wrapper = mount(TransferDetailView, { global: { stubs: { RouterLink: true } } })
    await flushPromises()

    let resolveDownload!: (blob: Blob) => void
    vi.mocked(recepcionApi.downloadPickingReport).mockReturnValue(
      new Promise((resolve) => {
        resolveDownload = resolve
      })
    )

    const clickPromise = wrapper.find('[data-testid="download-picking-report-btn"]').trigger('click')

    // Navigate to transfer B before A's download resolves.
    vi.mocked(recepcionApi.getTransfer).mockResolvedValueOnce(mockGetTransfer(buildTransfer({ transferId: 8, documentNumber: 'DOC-8' })))
    routeParamsHolder.current.id = '8'
    await flushPromises()

    resolveDownload(new Blob(['picking']))
    await clickPromise
    await flushPromises()

    expect(mockAnchor.download).toBe('picking-7.xlsx')

    createElementSpy.mockRestore()
    appendChildSpy.mockRestore()
    removeChildSpy.mockRestore()
  })
})
