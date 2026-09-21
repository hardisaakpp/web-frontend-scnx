import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, disposePinia, setActivePinia } from 'pinia'

const { get, put } = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }))
vi.mock('axios', () => ({
  default: {
    create: () => ({
      get,
      put,
      post: vi.fn(),
      delete: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    }),
  },
}))

import { TEMA_DEFECTO, useTemaStore } from '@/modules/ruleta/stores/temaStore'

function temaBackend(configuracion: Record<string, unknown>) {
  return {
    id: 'tema-1',
    nombre: 'Global',
    configuracionJson: JSON.stringify(configuracion),
    esGlobalPredeterminado: true,
    esPublicado: true,
    rowVersion: 'AAAA',
    updatedAt: new Date().toISOString(),
  }
}

let pinia: ReturnType<typeof createPinia>
afterEach(() => { disposePinia(pinia); vi.useRealTimers(); vi.restoreAllMocks() })

describe('temaStore', () => {
  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    localStorage.clear()
    get.mockReset()
    put.mockReset()
    get.mockResolvedValue({ data: temaBackend(TEMA_DEFECTO) })
  })

  it('deshacer/rehacer navegan el historial de cambios del borrador', async () => {
    const store = useTemaStore()
    await store.cargarTema(null)

    store.actualizarBorrador({ color_boton: '#111111' })
    store.actualizarBorrador({ color_boton: '#222222' })
    expect(store.temaBorrador.color_boton).toBe('#222222')

    store.deshacer()
    expect(store.temaBorrador.color_boton).toBe('#111111')

    store.deshacer()
    expect(store.temaBorrador.color_boton).toBe(TEMA_DEFECTO.color_boton)
    expect(store.puedeDeshacer).toBe(false)

    store.rehacer()
    expect(store.temaBorrador.color_boton).toBe('#111111')
    expect(store.puedeRehacer).toBe(true)
  })

  it('publicarTemaEnTiendas sincroniza temaActivo con el borrador y limpia el historial', async () => {
    const store = useTemaStore()
    await store.cargarTema(null)

    store.actualizarBorrador({ color_boton: '#333333' })
    expect(store.hayCambiosSinPublicar).toBe(true)

    put.mockResolvedValueOnce({ data: temaBackend({ ...TEMA_DEFECTO, color_boton: '#333333' }) })
    await store.publicarTemaEnTiendas()

    expect(store.temaActivo.color_boton).toBe('#333333')
    expect(store.hayCambiosSinPublicar).toBe(false)
    expect(store.puedeDeshacer).toBe(false)
  })

  it('aplicarPreset fusiona la configuración del preset sobre el borrador y permite deshacer', async () => {
    const store = useTemaStore()
    await store.cargarTema(null)

    store.aplicarPreset({
      id: 'preset-1',
      nombre: 'Navidad de Gala',
      configuracionJson: JSON.stringify({ color_boton: '#7A1F2B' }),
      miniaturaUrl: null,
      esSistema: true,
    })

    expect(store.temaBorrador.color_boton).toBe('#7A1F2B')
    expect(store.puedeDeshacer).toBe(true)
  })

  it('restablecerCambios descarta el borrador y vuelve al último tema publicado', async () => {
    const store = useTemaStore()
    await store.cargarTema(null)

    store.actualizarBorrador({ color_boton: '#444444' })
    store.restablecerCambios()

    expect(store.temaBorrador.color_boton).toBe(store.temaActivo.color_boton)
    expect(store.hayCambiosSinPublicar).toBe(false)
    expect(store.puedeDeshacer).toBe(false)
  })
  it('preserva tema y borrador ante fallos de red', async () => {
    const store = useTemaStore()
    await store.cargarTema()
    store.actualizarBorrador({ color_boton: '#123456' })
    get.mockRejectedValueOnce(new Error('offline'))
    await store.cargarTema(null, true)
    expect(store.tema.color_boton).toBe(TEMA_DEFECTO.color_boton)
    expect(store.temaBorrador.color_boton).toBe('#123456')
    expect(store.errorCarga).not.toBe('')
  })

  it('conserva el tema de campaña ante un 500 en vez de sustituirlo por el predeterminado', async () => {
    const store = useTemaStore()
    get.mockResolvedValueOnce({ data: temaBackend({ color_boton: '#abcdef' }) })
    await store.cargarTema('campana-1')
    get.mockRejectedValueOnce({ response: { status: 500 } })
    await store.cargarTema('campana-1', true)
    expect(store.tema.color_boton).toBe('#abcdef')
    expect(store.errorCarga).not.toBe('')
  })

  it('ignora una respuesta global tardía después de seleccionar campaña', async () => {
    let responder!: (value: unknown) => void
    get.mockImplementationOnce(() => new Promise(resolve => { responder = resolve }))
    const store = useTemaStore()
    const global = store.cargarTema()
    get.mockResolvedValueOnce({ data: temaBackend({ color_boton: '#abcdef' }) })
    await store.cargarTema('campana-2')
    responder({ data: temaBackend({ color_boton: '#111111' }) })
    await global
    expect(store.tema.color_boton).toBe('#abcdef')
    expect(store.campanaIdActual).toBe('campana-2')
  })

  it.each([null, 'campana-1'])('limpia temas antiguos al cargar y publicar: %s', async (campanaId) => {
    const antiguo = { hub: { logo_url: '/logo.svg', escala: 1.5 }, fondo: { tipo: 'imagen', imagen_url: '/fondo.jpg' } }
    localStorage.setItem('ruleta_tema', JSON.stringify(antiguo))
    get.mockResolvedValueOnce({ data: temaBackend(antiguo) })
    const store = useTemaStore()
    expect(store.tema.hub).not.toHaveProperty('logo_url')
    await store.cargarTema(campanaId)
    expect(store.tema.hub).not.toHaveProperty('logo_url')
    expect(store.tema.hub?.escala).toBe(1.5)
    expect(store.tema.fondo?.tipo).toBe('gradiente')
    expect(store.tema.fondo).not.toHaveProperty('imagen_url')
    put.mockResolvedValueOnce({ data: temaBackend(store.temaBorrador) })
    await store.publicarTemaEnTiendas()
    const [endpoint, body] = put.mock.calls[0] as [string, { configuracionJson: string }]
    expect(endpoint).toBe(campanaId ? `/api/campanas/${campanaId}/tema` : '/api/temas/global')
    expect(body.configuracionJson).not.toMatch(/logo_url|imagen_url/)
  })

  it('recibe publicaciones por polling sin tocar el borrador y detiene al desmontar', async () => {
    vi.useFakeTimers()
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    const store = useTemaStore()
    await store.cargarTema()
    store.actualizarBorrador({ color_boton: '#123456' })
    const detener = store.iniciarSincronizacion(() => 'campana-1', 1000)
    await vi.advanceTimersByTimeAsync(0)
    get.mockResolvedValue({ data: temaBackend({ color_boton: '#abcdef' }) })
    await vi.advanceTimersByTimeAsync(1000)
    expect(store.tema.color_boton).toBe('#abcdef')
    expect(store.temaBorrador.color_boton).toBe('#123456')
    expect(get).toHaveBeenLastCalledWith('/api/campanas/campana-1/tema')
    detener()
    get.mockClear()
    await vi.advanceTimersByTimeAsync(5000)
    expect(get).not.toHaveBeenCalled()
  })

  it('no consulta mientras la tablet est? oculta y refresca al volver', async () => {
    vi.useFakeTimers()
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    const store = useTemaStore()
    const detener = store.iniciarSincronizacion(() => null, 1000)
    await vi.advanceTimersByTimeAsync(3000)
    expect(get).not.toHaveBeenCalled()
    hidden.mockReturnValue(false)
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(get).toHaveBeenCalledOnce()
    detener()
  })
})
