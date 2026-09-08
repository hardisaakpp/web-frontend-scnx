import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePickingStore } from '@/modules/recepcion-proveedores/stores/pickingStore'
import { pickingApi } from '@/modules/recepcion-proveedores/services/pickingApi'
import type { OrdenPickingLineaResponse, OrdenPickingScanResponse, OrdenPickingSesionResponse } from '@/modules/recepcion-proveedores/types'

vi.mock('@/modules/recepcion-proveedores/services/pickingApi', () => ({
  pickingApi: {
    obtenerSesionActiva: vi.fn(),
    iniciar: vi.fn(),
    obtenerSesion: vi.fn(),
    obtenerScans: vi.fn(),
    obtenerLogs: vi.fn(),
    escanear: vi.fn(),
    eliminarScan: vi.fn(),
    cerrar: vi.fn(),
  },
}))

function buildLinea(overrides: Partial<OrdenPickingLineaResponse> = {}): OrdenPickingLineaResponse {
  return {
    id: 10,
    lineNum: 1,
    itemCode: 'ITEM1',
    itemDescription: 'Item 1',
    codeBars: '123',
    cantidadPedida: 10,
    cantidadPendiente: 10,
    cantidadPickeada: 0,
    estadoLinea: 'Pendiente',
    ...overrides,
  }
}

function buildSesion(overrides: Partial<OrdenPickingSesionResponse> = {}): OrdenPickingSesionResponse {
  return {
    id: 1,
    docNum: 1001,
    whsCode: 'RL-PSC',
    estado: 'EnProceso',
    fechaInicio: '2026-01-01T00:00:00Z',
    lineas: [buildLinea()],
    ...overrides,
  }
}

function buildScan(overrides: Partial<OrdenPickingScanResponse> = {}): OrdenPickingScanResponse {
  return {
    id: 50,
    lineaId: 10,
    codigoEscaneado: 'ITEM1',
    cantidad: 4,
    usuarioId: 'user-1',
    fechaHora: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('usePickingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('iniciar sets the returned sesion', async () => {
    const sesion = buildSesion()
    vi.mocked(pickingApi.iniciar).mockResolvedValue(sesion)
    const store = usePickingStore()

    const resultado = await store.iniciar(1001, 'RL-PSC')

    expect(pickingApi.iniciar).toHaveBeenCalledWith(1001, 'RL-PSC')
    expect(resultado).toEqual(sesion)
    expect(store.sesion).toEqual(sesion)
  })

  it('cargarSesion carga la sesion y descarta una respuesta obsoleta si el usuario ya navego a otra', async () => {
    let resolveLenta: (value: OrdenPickingSesionResponse) => void = () => {}
    const pendienteLenta = new Promise<OrdenPickingSesionResponse>((resolve) => {
      resolveLenta = resolve
    })

    vi.mocked(pickingApi.obtenerSesion).mockImplementationOnce(() => pendienteLenta)
    vi.mocked(pickingApi.obtenerScans).mockResolvedValue([])

    const store = usePickingStore()

    const cargaLenta = store.cargarSesion(1) // sesion 1: se resuelve tarde, mas abajo
    vi.mocked(pickingApi.obtenerSesion).mockResolvedValueOnce(buildSesion({ id: 2, docNum: 2002 }))
    await store.cargarSesion(2) // sesion 2: gana la carrera, pasa a ser la activa

    resolveLenta(buildSesion({ id: 1 }))
    await cargaLenta

    expect(store.sesion?.id).toBe(2)
  })

  it('escanear actualiza la linea correspondiente y recarga los scans', async () => {
    const sesion = buildSesion()
    vi.mocked(pickingApi.obtenerSesion).mockResolvedValue(sesion)
    vi.mocked(pickingApi.obtenerScans).mockResolvedValue([])
    const store = usePickingStore()
    await store.cargarSesion(1)

    const lineaActualizada = buildLinea({ cantidadPickeada: 4, estadoLinea: 'Parcial' })
    vi.mocked(pickingApi.escanear).mockResolvedValue(lineaActualizada)
    vi.mocked(pickingApi.obtenerScans).mockResolvedValue([buildScan()])

    const ok = await store.escanear('ITEM1', 4)

    expect(ok).toBe(true)
    expect(pickingApi.escanear).toHaveBeenCalledWith(1, 'ITEM1', 4)
    expect(store.sesion?.lineas[0]).toEqual(lineaActualizada)
    expect(store.scans).toEqual([buildScan()])
  })

  it('escanear en error deja actionError con el mensaje del backend y no marca exito', async () => {
    const sesion = buildSesion()
    vi.mocked(pickingApi.obtenerSesion).mockResolvedValue(sesion)
    vi.mocked(pickingApi.obtenerScans).mockResolvedValue([])
    const store = usePickingStore()
    await store.cargarSesion(1)

    vi.mocked(pickingApi.escanear).mockRejectedValue({
      response: { status: 409, data: { detail: 'La cantidad escaneada supera el pendiente de la linea 1.' } },
    })

    const ok = await store.escanear('ITEM1', 999)

    expect(ok).toBe(false)
    expect(store.actionError).toBe('La cantidad escaneada supera el pendiente de la linea 1.')
  })

  it('eliminarScan llama al backend y refresca sesion y scans', async () => {
    const sesion = buildSesion()
    vi.mocked(pickingApi.obtenerSesion).mockResolvedValue(sesion)
    vi.mocked(pickingApi.obtenerScans).mockResolvedValue([buildScan()])
    const store = usePickingStore()
    await store.cargarSesion(1)
    await store.cargarScans()

    const sesionActualizada = buildSesion({ lineas: [buildLinea({ cantidadPickeada: 0, estadoLinea: 'Pendiente' })] })
    vi.mocked(pickingApi.obtenerSesion).mockResolvedValue(sesionActualizada)
    vi.mocked(pickingApi.obtenerScans).mockResolvedValue([])

    await store.eliminarScan(50)

    expect(pickingApi.eliminarScan).toHaveBeenCalledWith(1, 50)
    expect(store.sesion).toEqual(sesionActualizada)
    expect(store.scans).toEqual([])
  })

  it('cerrar actualiza la sesion a Finalizada', async () => {
    const sesion = buildSesion()
    vi.mocked(pickingApi.obtenerSesion).mockResolvedValue(sesion)
    vi.mocked(pickingApi.obtenerScans).mockResolvedValue([])
    const store = usePickingStore()
    await store.cargarSesion(1)

    vi.mocked(pickingApi.cerrar).mockResolvedValue(buildSesion({ estado: 'Finalizada' }))

    const ok = await store.cerrar()

    expect(ok).toBe(true)
    expect(store.sesion?.estado).toBe('Finalizada')
  })
})
