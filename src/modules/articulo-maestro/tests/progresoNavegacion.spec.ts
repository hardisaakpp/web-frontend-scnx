import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { articuloService, type ImportacionTrabajo, type TipoCargaMasiva } from '../services/articuloService'
import { useImportacionArticulosStore } from '../stores/importacionArticulosStore'
import ImportacionProgreso from '../components/ImportacionProgreso.vue'
import ModalImportacion from '../components/ModalImportacion.vue'

vi.mock('../services/articuloService', () => ({ articuloService: {
    descargarReporteExitos: vi.fn(), descargarErroresPlantillaImportacion: vi.fn()
} }))

const operaciones: [TipoCargaMasiva, string][] = [
    ['crear', 'Descargar Reporte Completo de Artículos Creados (.xlsx)'],
    ['actualizar', 'Descargar Reporte de Modificaciones (.xlsx)'],
    ['actualizar_precios', 'Descargar Reporte de Precios Actualizados (.xlsx)'],
    ['actualizar_estado', 'Descargar Reporte de Estados Actualizados (.xlsx)']
]

describe('Resultado de importación y navegación SAP', () => {
    let wrapper: VueWrapper | undefined
    const router = createRouter({ history: createMemoryHistory(), routes: [
        { path: '/articulo-maestro/lista', component: { template: '<div />' } },
        { path: '/articulo-maestro/migracion', component: { template: '<div />' } }
    ] })

    beforeEach(async () => {
        vi.resetAllMocks()
        localStorage.clear()
        setActivePinia(createPinia())
        await router.push('/articulo-maestro/lista')
        const store = useImportacionArticulosStore()
        store.jobId = 2021
        store.trabajo = {
            id: 2021, nombreArchivo: 'articulos.xlsx', hashArchivo: 'hash', tipo: 'CREAR',
            usuario: 'qa', estado: 'COMPLETADO', totalFilas: 7, totalGrupos: 7,
            gruposProcesados: 7, filasCorrectas: 7, filasError: 0, zipPendiente: false,
            grupos: []
        }
    })
    afterEach(() => { wrapper?.unmount(); wrapper = undefined })

    it.each(operaciones)('muestra y descarga el reporte de %s sin depender del detalle de artículos', async (tipo, etiqueta) => {
        const store = useImportacionArticulosStore()
        store.trabajo!.tipo = tipo.toUpperCase() as ImportacionTrabajo['tipo']
        wrapper = mount(ImportacionProgreso, { global: { plugins: [router] } })
        const button = wrapper.findAll('button').find(item => item.text() === etiqueta)
        expect(button).toBeDefined()
        await button!.trigger('click')
        await flushPromises()
        expect(articuloService.descargarReporteExitos).toHaveBeenCalledWith(2021, tipo)
    })

    it.each(['COMPLETADO', 'COMPLETADO_CON_ERRORES'] as const)(
        'cierra el modal y navega desde un trabajo %s', async estado => {
            useImportacionArticulosStore().trabajo!.estado = estado
            wrapper = mount(ModalImportacion, { global: { plugins: [router], stubs: { Teleport: true } } })
            expect(wrapper.text()).toContain('✅ Artículos procesados y encolados para sincronización con SAP Business One.')
            await wrapper.findAll('button').find(button => button.text().includes('Ir a Monitoreo'))!.trigger('click')
            await flushPromises()
            expect(router.currentRoute.value.path).toBe('/articulo-maestro/migracion')
            expect(wrapper.emitted('close')).toHaveLength(1)
        }
    )

    it.each(['PROCESANDO', 'ERROR'] as const)('no anuncia encolamiento para un trabajo %s', estado => {
        useImportacionArticulosStore().trabajo!.estado = estado
        wrapper = mount(ImportacionProgreso, { global: { plugins: [router] } })
        expect(wrapper.text()).not.toContain('Artículos procesados y encolados')
        expect(wrapper.text()).not.toContain('Ir a Monitoreo')
    })

    it('mantiene la plantilla de errores separada aunque aún no llegue el detalle de rechazos', async () => {
        const store = useImportacionArticulosStore()
        store.trabajo!.estado = 'COMPLETADO_CON_ERRORES'
        store.trabajo!.filasCorrectas = 6
        store.trabajo!.filasError = 1
        wrapper = mount(ImportacionProgreso, { global: { plugins: [router] } })
        const errores = wrapper.findAll('button').filter(button => button.text().includes('Plantilla de Errores'))
        expect(errores).toHaveLength(1)
        expect(wrapper.text()).toContain('Descargar Reporte Completo de Artículos Creados (.xlsx)')
        await errores[0]!.trigger('click')
        expect(articuloService.descargarErroresPlantillaImportacion).toHaveBeenCalledWith(2021)
    })
})
