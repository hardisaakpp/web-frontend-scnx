import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { tesoreriaService } from '@/modules/tesoreria/services/tesoreriaService'
import { useMisDepositos } from '@/modules/tesoreria/composables/useMisDepositos'
import { useContactosNotificacion } from '@/modules/tesoreria/composables/useContactosNotificacion'
import { useComprobante } from '@/modules/tesoreria/composables/useComprobante'
import type { ContactoNotificacionDto, DetalleDiarioDto, UrlComprobanteDto } from '@/modules/tesoreria/types/tesoreria.types'

vi.mock('@/lib/http', () => ({ tesoreriaHttp: {} }))
vi.mock('@/composables/useToast', () => ({ useToast: () => ({ error: vi.fn(), warning: vi.fn(), success: vi.fn() }) }))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => { resolve = done })
  return { promise, resolve }
}

const detalle = (codigoAlmacen: string, permitirNuevoDeposito: boolean): DetalleDiarioDto => ({
  codigoAlmacen, fechaCierreCaja: '2026-09-18', permitirNuevoDeposito, motivoBloqueo: null, depositos: []
})

describe('concurrencia de Tesorería', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('borra la autorización anterior y descarta una respuesta de otro día que llega tarde', async () => {
    const store = useMisDepositos()
    store.detalleActual.value = detalle('A', true)
    const primera = deferred<DetalleDiarioDto>()
    const segunda = deferred<DetalleDiarioDto>()
    vi.spyOn(tesoreriaService, 'getDetalle').mockReturnValueOnce(primera.promise).mockReturnValueOnce(segunda.promise)
    const a = store.fetchDetalle('A', '2026-09-18')
    expect(store.detalleActual.value).toBeNull()
    const b = store.fetchDetalle('B', '2026-09-18')
    primera.resolve(detalle('A', true))
    await a
    expect(store.loadingDetalle.value).toBe(true)
    expect(store.detalleActual.value).toBeNull()
    segunda.resolve(detalle('B', false))
    await b
    expect(store.detalleActual.value).toEqual(detalle('B', false))
    expect(store.loadingDetalle.value).toBe(false)
  })

  it('comparte la carga de contactos y permite una actualización explícita', async () => {
    const store = useContactosNotificacion()
    store.contactos.value = []
    const carga = deferred<ContactoNotificacionDto[]>()
    const get = vi.spyOn(tesoreriaService, 'getContactosNotificacion').mockReturnValue(carga.promise)
    const pending = store.cargar()
    await store.cargar()
    expect(get).toHaveBeenCalledTimes(1)
    carga.resolve([{ id: 1, empresaId: 1, nombreCompleto: 'Contabilidad', email: 'prueba@mabeltrading.com.ec', cargo: null, activo: true, fechaCreacion: '' }])
    await pending
    await store.cargar()
    expect(get).toHaveBeenCalledTimes(1)
    await store.cargar(true)
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('el visor conserva solo la última selección y descarta respuestas después de cerrar', async () => {
    const scope = effectScope()
    const visor = scope.run(() => useComprobante())!
    const primera = deferred<UrlComprobanteDto>()
    const segunda = deferred<UrlComprobanteDto>()
    const get = vi.spyOn(tesoreriaService, 'obtenerUrlComprobante')
      .mockReturnValueOnce(primera.promise).mockReturnValueOnce(segunda.promise)
    const a = visor.abrirComprobante(1)
    const b = visor.abrirComprobante(2)
    segunda.resolve({ url: '/segundo.pdf', nombreArchivo: 'segundo.pdf' })
    await b
    primera.resolve({ url: '/primero.png', nombreArchivo: 'primero.png' })
    await a
    expect(visor.urlComprobante.value).toBe('/segundo.pdf')
    expect(visor.nombreComprobante.value).toBe('segundo.pdf')
    const tercera = deferred<UrlComprobanteDto>()
    get.mockReturnValueOnce(tercera.promise)
    const c = visor.abrirComprobante(3)
    visor.modalVisorAbierto.value = false
    tercera.resolve({ url: '/cerrado.pdf', nombreArchivo: 'cerrado.pdf' })
    await c
    expect(visor.urlComprobante.value).toBeNull()
    scope.stop()
  })
})
