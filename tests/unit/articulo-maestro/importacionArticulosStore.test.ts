import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { articuloService } from '@/modules/articulo-maestro/services/articuloService'
import { useImportacionArticulosStore } from '@/modules/articulo-maestro/stores/importacionArticulosStore'

vi.mock('@/modules/articulo-maestro/services/articuloService', () => ({
    articuloService: {
        crearImportacion: vi.fn(),
        verificarImportacion: vi.fn(),
        getImportacion: vi.fn(),
        getErroresImportacion: vi.fn(),
        descargarErroresImportacion: vi.fn(),
        reintentarImportacion: vi.fn()
    }
}))

describe('importacionArticulosStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.resetAllMocks()
        vi.useFakeTimers()
        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            value: {
                getItem: vi.fn().mockReturnValue(null),
                setItem: vi.fn(),
                removeItem: vi.fn()
            }
        })
    })

    afterEach(() => {
        useImportacionArticulosStore().detenerPolling()
        vi.useRealTimers()
    })

    it('libera la carga al recibir 202 aunque la primera consulta siga pendiente', async () => {
        vi.mocked(articuloService.crearImportacion).mockResolvedValue({
            jobId: 2023, estado: 'ESPERANDO', totalFilas: 7, totalGrupos: 7
        })
        let rechazarConsulta!: (error: Error) => void
        vi.mocked(articuloService.getImportacion).mockReturnValue(new Promise((_, reject) => {
            rechazarConsulta = reject
        }))
        const store = useImportacionArticulosStore()
        let envioTerminado = false
        const envio = store.iniciar(new File(['xlsx'], 'articulos.xlsx'), 'crear')
            .then(() => { envioTerminado = true })
        await vi.advanceTimersByTimeAsync(7500)

        try {
            expect(envioTerminado).toBe(true)
            expect(store.loading).toBe(false)
            expect(store.jobId).toBe(2023)
            expect(store.isActive).toBe(true)
            expect(articuloService.getImportacion).toHaveBeenCalledTimes(1)
            await store.iniciar(new File(['xlsx'], 'articulos.xlsx'), 'crear')
            expect(articuloService.crearImportacion).toHaveBeenCalledTimes(1)
        } finally {
            rechazarConsulta(new Error('timeout'))
            await envio
        }
        expect(store.pollTimer).not.toBeNull()
        expect(store.error).toBeTruthy()
    })

    it('continúa consultando tras un timeout sin volver a enviar el archivo', async () => {
        vi.mocked(articuloService.crearImportacion).mockResolvedValue({
            jobId: 2023, estado: 'ESPERANDO', totalFilas: 7, totalGrupos: 7
        })
        vi.mocked(articuloService.getImportacion)
            .mockResolvedValueOnce({
                id: 2023, estado: 'PROCESANDO', nombreArchivo: 'articulos.xlsx',
                hashArchivo: 'hash', tipo: 'CREAR', usuario: 'tester',
                totalFilas: 7, totalGrupos: 7, gruposProcesados: 0,
                filasCorrectas: 0, filasError: 0, grupos: []
            })
            .mockRejectedValueOnce(new Error('timeout'))
            .mockResolvedValueOnce({
                id: 2023, estado: 'COMPLETADO', nombreArchivo: 'articulos.xlsx',
                hashArchivo: 'hash', tipo: 'CREAR', usuario: 'tester',
                totalFilas: 7, totalGrupos: 7, gruposProcesados: 7,
                filasCorrectas: 7, filasError: 0, grupos: []
            })
        vi.mocked(articuloService.getErroresImportacion).mockResolvedValue([])
        const store = useImportacionArticulosStore()
        await store.iniciar(new File(['xlsx'], 'articulos.xlsx'), 'crear')
        await vi.advanceTimersByTimeAsync(5000)

        expect(articuloService.crearImportacion).toHaveBeenCalledTimes(1)
        expect(articuloService.getImportacion).toHaveBeenCalledTimes(3)
        expect(store.trabajo?.estado).toBe('COMPLETADO')
        expect(store.error).toBeNull()
        expect(store.pollTimer).toBeNull()
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

    describe('verificar (pre-vuelo)', () => {
        it('marca el estado como VALIDO cuando el lote no tiene errores', async () => {
            vi.mocked(articuloService.verificarImportacion).mockResolvedValue({
                totalFilas: 5,
                filasValidas: 5,
                filasConError: 0,
                esLoteValido: true,
                errores: [],
                resumenMarcas: { MARCA1: 5 },
                resumenNiveles: { SECCION1: 5 }
            })
            const store = useImportacionArticulosStore()

            await store.verificar(new File(['xlsx'], 'articulos.xlsx'), 'crear')

            expect(store.estadoSimulacion).toBe('VALIDO')
            expect(store.archivoVerificado).toBe(true)
        })

        it('marca el estado como CON_ERRORES y bloquea archivoVerificado', async () => {
            vi.mocked(articuloService.verificarImportacion).mockResolvedValue({
                totalFilas: 20,
                filasValidas: 3,
                filasConError: 17,
                esLoteValido: false,
                errores: [
                    {
                        tipo: 'FILA',
                        grupoProducto: 'G1',
                        numeroFila: 2,
                        mensaje: 'Campo obligatorio faltante'
                    }
                ],
                resumenMarcas: {},
                resumenNiveles: {}
            })
            const store = useImportacionArticulosStore()

            await store.verificar(new File(['xlsx'], 'articulos.xlsx'), 'crear')

            expect(store.estadoSimulacion).toBe('CON_ERRORES')
            expect(store.archivoVerificado).toBe(false)
            expect(store.resumenSimulacion?.errores).toHaveLength(1)
        })

        it('vuelve a IDLE y descarta el resumen al llamar resetVerificacion', async () => {
            vi.mocked(articuloService.verificarImportacion).mockResolvedValue({
                totalFilas: 1,
                filasValidas: 1,
                filasConError: 0,
                esLoteValido: true,
                errores: [],
                resumenMarcas: {},
                resumenNiveles: {}
            })
            const store = useImportacionArticulosStore()
            await store.verificar(new File(['xlsx'], 'articulos.xlsx'), 'crear')
            expect(store.estadoSimulacion).toBe('VALIDO')

            store.resetVerificacion()

            expect(store.estadoSimulacion).toBe('IDLE')
            expect(store.resumenSimulacion).toBeNull()
        })
    })
})
