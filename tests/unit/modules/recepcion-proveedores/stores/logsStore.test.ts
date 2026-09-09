import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLogsStore } from '@/modules/recepcion-proveedores/stores/logsStore'
import { pickingApi } from '@/modules/recepcion-proveedores/services/pickingApi'
import type { OrdenPickingLogGeneralResponse } from '@/modules/recepcion-proveedores/types'

vi.mock('@/modules/recepcion-proveedores/services/pickingApi', () => ({
  pickingApi: {
    obtenerLogsGeneral: vi.fn(),
  },
}))

function buildLog(overrides: Partial<OrdenPickingLogGeneralResponse> = {}): OrdenPickingLogGeneralResponse {
  return {
    id: 1,
    docNum: 1001,
    whsCode: 'RL-PSC',
    fechaHora: '2026-09-09T10:00:00Z',
    nivel: 'Info',
    evento: 'INICIO_SESION',
    detalle: null,
    usuarioId: 'user-1',
    ...overrides,
  }
}

describe('useLogsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('buscar convierte las fechas locales a limites UTC de dia antes de llamar al service', async () => {
    vi.mocked(pickingApi.obtenerLogsGeneral).mockResolvedValue([])
    const store = useLogsStore()

    await store.buscar({ desde: '2026-09-01', hasta: '2026-09-09', docNum: 1001 })

    expect(pickingApi.obtenerLogsGeneral).toHaveBeenCalledTimes(1)
    const params = vi.mocked(pickingApi.obtenerLogsGeneral).mock.calls[0]![0]
    expect(params.docNum).toBe(1001)
    expect(new Date(params.desde!).getHours()).toBe(0)
    expect(new Date(params.hasta!).getHours()).toBe(23)
  })

  it('buscar sin docNum lo pasa como undefined', async () => {
    vi.mocked(pickingApi.obtenerLogsGeneral).mockResolvedValue([])
    const store = useLogsStore()

    await store.buscar({ desde: '2026-09-01', hasta: '2026-09-09' })

    const params = vi.mocked(pickingApi.obtenerLogsGeneral).mock.calls[0]![0]
    expect(params.docNum).toBeUndefined()
  })

  it('guarda el resultado exitoso en logs', async () => {
    const logs = [buildLog(), buildLog({ id: 2, evento: 'SCAN' })]
    vi.mocked(pickingApi.obtenerLogsGeneral).mockResolvedValue(logs)
    const store = useLogsStore()

    await store.buscar({ desde: '2026-09-01', hasta: '2026-09-09' })

    expect(store.logs).toEqual(logs)
    expect(store.error).toBeNull()
  })

  it('en error usa mapApiError y vacia logs', async () => {
    vi.mocked(pickingApi.obtenerLogsGeneral).mockRejectedValue({
      response: { status: 400, data: { detail: "'Desde' no puede ser posterior a 'Hasta'." } },
    })
    const store = useLogsStore()

    await store.buscar({ desde: '2026-09-09', hasta: '2026-09-01' })

    expect(store.logs).toEqual([])
    expect(store.error).toBe("'Desde' no puede ser posterior a 'Hasta'.")
  })

  it('limpiarError vacia el error', async () => {
    vi.mocked(pickingApi.obtenerLogsGeneral).mockRejectedValue({ response: { status: 500 } })
    const store = useLogsStore()
    await store.buscar({ desde: '2026-09-01', hasta: '2026-09-09' })
    expect(store.error).not.toBeNull()

    store.limpiarError()

    expect(store.error).toBeNull()
  })
})
