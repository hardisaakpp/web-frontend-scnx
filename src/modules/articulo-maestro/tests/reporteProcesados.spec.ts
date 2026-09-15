import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { articuloService, type TipoCargaMasiva } from '../services/articuloService'
import { useImportacionArticulosStore } from '../stores/importacionArticulosStore'

const { get, mostrarError } = vi.hoisted(() => ({ get: vi.fn(), mostrarError: vi.fn() }))
vi.mock('@/lib/http', () => ({ maestroHttp: {
    get, interceptors: { response: { use: vi.fn() } }
} }))
vi.mock('@/composables/useToast', () => ({ useToast: () => ({ error: mostrarError }) }))

describe('Reporte binario de artículos procesados', () => {
    const tipos: TipoCargaMasiva[] = ['crear', 'actualizar', 'actualizar_precios', 'actualizar_estado']
    let nombreDescargado: string

    beforeEach(() => {
        vi.resetAllMocks()
        vi.useFakeTimers()
        localStorage.clear()
        setActivePinia(createPinia())
        vi.stubGlobal('URL', class extends URL {
            static createObjectURL = vi.fn().mockReturnValue('blob:reporte')
            static revokeObjectURL = vi.fn()
        })
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            expect(this.isConnected).toBe(true)
            nombreDescargado = this.download
        })
    })
    afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

    it.each(tipos)('descarga %s sin alterar los bytes y libera la URL después del clic', async tipo => {
        const blob = new Blob([new Uint8Array([80, 75, 3, 4, 0, 255])], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        get.mockResolvedValue({ data: blob })
        const resultado = await articuloService.descargarReporteExitos(2021, tipo)
        expect(resultado).toBe(blob)
        expect(get).toHaveBeenCalledWith('/api/v1/articulos/importaciones/2021/reporte-exitos.xlsx', { responseType: 'blob' })
        expect(nombreDescargado).toBe(`articulos_procesados_${tipo}_2021.xlsx`)
        expect(document.querySelector('a[download]')).toBeNull()
        expect(URL.revokeObjectURL).not.toHaveBeenCalled()
        await vi.advanceTimersByTimeAsync(1000)
        expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:reporte')
    })

    it.each([new Blob([]), new Blob(['{"detail":"Error"}'], { type: 'application/json' })])(
        'rechaza respuestas vacías o JSON sin guardarlas como Excel', async blob => {
            get.mockResolvedValue({ data: blob })
            await expect(articuloService.descargarReporteExitos(2021)).rejects.toThrow('reporte Excel válido')
            expect(URL.createObjectURL).not.toHaveBeenCalled()
        }
    )

    it('limpia el enlace y la URL aunque falle el clic de descarga', async () => {
        get.mockResolvedValue({ data: new Blob(['excel']) })
        vi.mocked(HTMLAnchorElement.prototype.click).mockImplementation(() => { throw new Error('clic fallido') })
        await expect(articuloService.descargarReporteExitos(2021)).rejects.toThrow('clic fallido')
        expect(document.querySelector('a[download]')).toBeNull()
        await vi.advanceTimersByTimeAsync(1000)
        expect(URL.revokeObjectURL).toHaveBeenCalledOnce()
    })

    it('usa la operación del trabajo y libera el estado de descarga ante un error', async () => {
        const store = useImportacionArticulosStore()
        store.trabajo = {
            id: 2021, nombreArchivo: 'estado.xlsx', hashArchivo: 'hash', tipo: 'ACTUALIZAR_ESTADO',
            usuario: 'qa', estado: 'COMPLETADO', totalFilas: 1, totalGrupos: 1,
            gruposProcesados: 1, filasCorrectas: 1, filasError: 0, zipPendiente: false, grupos: []
        }
        get.mockResolvedValueOnce({ data: new Blob(['excel']) }).mockRejectedValueOnce(new Error('red'))
        await store.descargarReporteExitos()
        expect(nombreDescargado).toBe('articulos_procesados_actualizar_estado_2021.xlsx')
        await store.descargarReporteExitos()
        expect(store.downloading).toBe(false)
        expect(store.trabajo.estado).toBe('COMPLETADO')
        expect(mostrarError).toHaveBeenCalledOnce()
        await vi.advanceTimersByTimeAsync(1000)
    })
})
