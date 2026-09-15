import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import ModalImportacion from '../components/ModalImportacion.vue'
import ImportacionProgreso from '../components/ImportacionProgreso.vue'
import { articuloService, type DryRunSummary, type ImportacionTrabajo } from '../services/articuloService'
import { useImportacionArticulosStore } from '../stores/importacionArticulosStore'

vi.mock('../services/articuloService', () => ({
    articuloService: {
        downloadTemplate: vi.fn(), verificarImportacion: vi.fn(),
        descargarErroresPlantilla: vi.fn(),
    }
}))

const resumen: DryRunSummary = {
    totalFilas: 2, filasValidas: 2, filasConError: 0, esLoteValido: true,
    errores: [], resumenMarcas: {}, resumenNiveles: {}
}

describe('Actualización masiva de estado', () => {
    beforeEach(() => {
        localStorage.clear()
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })
    afterEach(() => { document.body.innerHTML = '' })

    it('descarga la cuarta plantilla y limpia el ZIP al cambiar de acción', async () => {
        const wrapper = mount(ModalImportacion, { global: { stubs: { Teleport: true } } })
        const zipInput = wrapper.get('input[accept=".zip"]')
        Object.defineProperty(zipInput.element, 'files', { value: [new File(['zip'], 'fotos.zip')] })
        await zipInput.trigger('change')
        expect(wrapper.text()).toContain('fotos.zip')
        await wrapper.get('input[value="actualizar_estado"]').setValue()
        expect(wrapper.find('input[accept=".zip"]').exists()).toBe(false)
        expect(wrapper.text()).toContain('congelar/descongelar en SAP Business One')
        await wrapper.findAll('button').find(button => button.text() === 'Descargar .xlsx')!.trigger('click')
        expect(articuloService.downloadTemplate).toHaveBeenCalledWith('actualizar_estado')
        await wrapper.get('input[value="crear"]').setValue()
        expect(wrapper.text()).not.toContain('fotos.zip')
        wrapper.unmount()
    })

    it('verifica el Excel de estado sin ZIP', async () => {
        vi.mocked(articuloService.verificarImportacion).mockResolvedValue(resumen)
        const wrapper = mount(ModalImportacion, { global: { stubs: { Teleport: true } } })
        await wrapper.get('input[value="actualizar_estado"]').setValue()
        const file = new File(['excel'], 'estado.xlsx')
        const input = wrapper.get('input[accept=".xlsx"]')
        Object.defineProperty(input.element, 'files', { value: [file] })
        await input.trigger('change')
        await wrapper.findAll('button').find(button => button.text() === 'Verificar Archivo')!.trigger('click')
        await flushPromises()
        expect(articuloService.verificarImportacion).toHaveBeenCalledWith(file, 'actualizar_estado', null)
        expect(wrapper.text()).toContain('Importar Definitivo (2 Artículos)')
        wrapper.unmount()
    })

    it('descarta un pre-vuelo anterior si cambia el archivo o tipo durante la petición', async () => {
        let resolve!: (value: DryRunSummary) => void
        vi.mocked(articuloService.verificarImportacion).mockReturnValue(new Promise(done => { resolve = done }))
        const store = useImportacionArticulosStore()
        const pending = store.verificar(new File(['excel'], 'crear.xlsx'), 'crear')
        store.resetVerificacion()
        resolve(resumen)
        await pending
        expect(store.archivoVerificado).toBe(false)
        expect(store.estadoSimulacion).toBe('IDLE')
    })

    it('muestra avance de estado y permite descargar el reporte corregible', async () => {
        const store = useImportacionArticulosStore()
        const job: ImportacionTrabajo = {
            id: 4, nombreArchivo: 'estado.xlsx', hashArchivo: 'hash', tipo: 'ACTUALIZAR_ESTADO',
            usuario: 'qa', estado: 'COMPLETADO_CON_ERRORES', totalGrupos: 2, gruposProcesados: 2,
            totalFilas: 2, filasCorrectas: 1, filasError: 1, zipPendiente: false, grupos: []
        }
        store.trabajo = job
        store.errores = [{
            tipo: 'FILA', grupoProducto: 'A', numeroFila: 3,
            campoError: 'estadoProducto', codigoError: 'VALIDACION',
            mensaje: 'Debe seleccionar ACTIVO o INACTIVO.'
        }]
        const download = vi.spyOn(store, 'descargarErroresPlantilla').mockResolvedValue()
        const router = createRouter({ history: createMemoryHistory(), routes: [
            { path: '/', component: { template: '<div />' } }
        ] })
        await router.push('/')
        const wrapper = mount(ImportacionProgreso, { global: { plugins: [router], stubs: { RouterLink: true } } })
        expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('100')
        expect(wrapper.text()).toContain('1 actualizado(s) exitosamente')
        const button = wrapper.findAll('button').find(item => /plantilla/i.test(item.text()))
        expect(button).toBeDefined()
        await button!.trigger('click')
        expect(download).toHaveBeenCalledOnce()
        wrapper.unmount()
    })
})
