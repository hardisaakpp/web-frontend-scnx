import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { articuloService, sapService, type SapTask } from '../services/articuloService'
import { esTareaDeLote, tareasSinLote } from '../utils/monitoreoSap'
import MigracionSAP from '../views/MigracionSAP.vue'

vi.mock('../services/articuloService', () => ({
    articuloService: { listarImportaciones: vi.fn(), getArticulosByEstado: vi.fn() },
    sapService: { getTasks: vi.fn() },
    resumirDetalleSap: vi.fn(), diagnosticoDeArticulo: vi.fn()
}))

function tarea(id: number, nombre_tarea: string, total_items = 1): SapTask {
    return {
        id, nombre_tarea, total_items, usuario: 'qa', estado: 'PROCESANDO',
        items_procesados: 0, fecha_creacion: '2026-09-12T12:00:00',
        fecha_fin: null, progreso_porcentaje: 0
    }
}

describe('Consolidación de tareas de importación', () => {
    it.each([
        'Importación #2021 (grupo A): 1 artículo(s)',
        'Lote #2021: 1 artículo',
        'Importación estado #2021: SKU-1',
        'IMPORTACION PRECIOS # 2021: SKU-1',
        'Sincronización: Importación de modificaciones #2021',
        'plantilla_articulos_crear_v2.8.xlsx',
        'Procesar PLANTILLA_estados.xlsx',
        'Carga masiva de artículos'
    ])('excluye la subtarea %s aunque tenga un solo SKU', nombre => {
        expect(esTareaDeLote(nombre)).toBe(true)
        expect(tareasSinLote([tarea(1, nombre)])).toEqual([])
    })

    it('conserva tareas individuales y excluye operaciones de varios SKU sin mutar la lista', () => {
        const manual = tarea(1, 'Creación individual: SKU-1')
        const entrada = [manual, tarea(2, 'Sincronización automática', 3), tarea(3, 'Importación estado #2021')]
        expect(tareasSinLote(entrada)).toEqual([manual])
        expect(entrada).toHaveLength(3)
        expect(esTareaDeLote('Actualizar artículo LOTE123')).toBe(false)
    })
})

describe('Monitoreo de subtareas ocultas', () => {
    beforeEach(() => { vi.resetAllMocks(); vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('muestra una tarjeta de lote y continúa el polling hasta que finalice su tarea SAP', async () => {
        const router = createRouter({ history: createMemoryHistory(), routes: [
            { path: '/articulo-maestro/migracion', component: { template: '<div />' } },
            { path: '/articulo-maestro/lista', component: { template: '<div />' } },
            { path: '/articulo-maestro', component: { template: '<div />' } }
        ] })
        await router.push('/articulo-maestro/migracion')
        const subtarea = tarea(1, 'Importación estado #2021: SKU-1')
        const manual = { ...tarea(2, 'Creación individual: SKU-2'), estado: 'COMPLETADO' }
        vi.mocked(sapService.getTasks).mockResolvedValue([subtarea, manual])
        vi.mocked(articuloService.getArticulosByEstado).mockResolvedValue([])
        vi.mocked(articuloService.listarImportaciones).mockResolvedValue({ total: 1, items: [{
            id: 2021, nombreArchivo: 'plantilla_estado.xlsx', hashArchivo: 'hash',
            tipo: 'ACTUALIZAR_ESTADO', usuario: 'qa', estado: 'COMPLETADO',
            totalFilas: 7, totalGrupos: 7, gruposProcesados: 7,
            filasCorrectas: 7, filasError: 0, zipPendiente: false
        }] })
        const wrapper = mount(MigracionSAP, { global: { plugins: [router] } })
        try {
            await flushPromises()
            expect(wrapper.text().match(/Lote #2021/g)).toHaveLength(1)
            expect(wrapper.text()).not.toContain('Tarea #1:')
            expect(wrapper.text()).toContain('Tarea #2:')
            await vi.advanceTimersByTimeAsync(2000)
            expect(sapService.getTasks).toHaveBeenCalledTimes(2)
            vi.mocked(sapService.getTasks).mockResolvedValue([
                { ...subtarea, estado: 'COMPLETADO' }, manual
            ])
            await vi.advanceTimersByTimeAsync(2000)
            expect(wrapper.text()).not.toContain('Actualizando en vivo...')
            await vi.advanceTimersByTimeAsync(4000)
            expect(sapService.getTasks).toHaveBeenCalledTimes(3)
        } finally { wrapper.unmount() }
    })
})
