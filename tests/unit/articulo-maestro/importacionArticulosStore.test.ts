import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { articuloService } from '@/modules/articulo-maestro/services/articuloService'
import { useImportacionArticulosStore } from '@/modules/articulo-maestro/stores/importacionArticulosStore'

vi.mock('@/modules/articulo-maestro/services/articuloService', () => ({
    articuloService: {
        crearImportacion: vi.fn(),
        getImportacion: vi.fn(),
        getErroresImportacion: vi.fn(),
        descargarErroresImportacion: vi.fn(),
        reintentarImportacion: vi.fn()
    }
}))

describe('importacionArticulosStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            value: {
                getItem: vi.fn().mockReturnValue(null),
                setItem: vi.fn(),
                removeItem: vi.fn()
            }
        })
    })

    it('persiste el job y calcula métricas de progreso reales', async () => {
        vi.mocked(articuloService.crearImportacion).mockResolvedValue({
            jobId: 123,
            estado: 'ESPERANDO',
            totalFilas: 4,
            totalGrupos: 3
        })
        vi.mocked(articuloService.getImportacion).mockResolvedValue({
            id: 123,
            nombreArchivo: 'articulos.xlsx',
            hashArchivo: 'hash',
            tipo: 'CREAR',
            usuario: 'tester',
            estado: 'COMPLETADO_CON_ERRORES',
            totalGrupos: 3,
            gruposProcesados: 3,
            totalFilas: 4,
            filasCorrectas: 3,
            filasError: 1,
            grupos: [
                {
                    id: 1,
                    grupoProducto: 'A',
                    estado: 'COMPLETADO',
                    intentos: 1,
                    filas: [],
                    imagenes: []
                },
                {
                    id: 2,
                    grupoProducto: 'B',
                    estado: 'ERROR',
                    intentos: 1,
                    filas: [],
                    imagenes: []
                },
                {
                    id: 3,
                    grupoProducto: 'C',
                    estado: 'COMPLETADO',
                    intentos: 1,
                    filas: [],
                    imagenes: []
                }
            ]
        })
        vi.mocked(articuloService.getErroresImportacion).mockResolvedValue([])
        const store = useImportacionArticulosStore()

        await store.iniciar(
            new File(['xlsx'], 'articulos.xlsx'),
            'crear'
        )

        expect(store.jobId).toBe(123)
        expect(store.progress).toBe(100)
        expect(store.gruposCorrectos).toBe(2)
        expect(store.gruposError).toBe(1)
        expect(localStorage.setItem).toHaveBeenCalledWith(
            'articulo-maestro:importacion-activa',
            '123'
        )
    })

    it('limpia el estado temporal y el identificador persistido', () => {
        const store = useImportacionArticulosStore()
        store.jobId = 44

        store.limpiar()

        expect(store.jobId).toBeNull()
        expect(localStorage.removeItem).toHaveBeenCalled()
    })
})
