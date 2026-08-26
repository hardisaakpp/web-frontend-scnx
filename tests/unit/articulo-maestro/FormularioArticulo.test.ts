import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FormularioArticulo from '@/modules/articulo-maestro/views/FormularioArticulo.vue'
import SearchableSelect from '@/modules/articulo-maestro/components/SearchableSelect.vue'
import { articuloService, catalogoService } from '@/modules/articulo-maestro/services/articuloService'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

// Regresión: al crear un artículo, FormularioArticulo.vue hacía
// `submitSuccess.value = '...'` y luego `router.replace('/articulo-maestro/editar/:itemCode')`
// en la MISMA función. MainLayout.vue renderiza el router-view con
// `:key="route.path"`, así que ese replace remonta el componente entero
// -destruyendo submitSuccess- antes de que el mensaje llegara a pintarse:
// el usuario terminaba en "Editar Artículo" sin ningún aviso de que la
// sincronización con SAP había arrancado. El fix cambió ese aviso a un
// toast (useToast), cuyo estado vive en un ref a nivel de módulo, fuera
// del árbol de componentes que el router remonta.
const mockReplace = vi.fn()
const mockPush = vi.fn()

vi.mock('vue-router', async () => {
    const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
    return {
        ...actual,
        useRoute: () => ({ params: {} }), // sin itemCode -> modo creación
        useRouter: () => ({ replace: mockReplace, push: mockPush })
    }
})

vi.mock('@/modules/articulo-maestro/services/articuloService', () => ({
    articuloService: {
        createArticulo: vi.fn()
    },
    catalogoService: {
        getGenerales: vi.fn().mockResolvedValue([]),
        getSecciones: vi.fn().mockResolvedValue([]),
        getLineasAtributo: vi.fn().mockResolvedValue([])
    }
}))

describe('FormularioArticulo - aviso de creación', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
        // El store de toasts es un singleton a nivel de módulo: se limpia
        // a mano entre pruebas para que no arrastren estado entre sí.
        useToast().toasts.value.splice(0)
    })

    it('el toast de creación sobrevive al remount que dispara router.replace', async () => {
        vi.mocked(articuloService.createArticulo).mockResolvedValue({
            itemCode: 'LR00001',
            imagenes: []
        })

        const wrapper = mount(FormularioArticulo, {
            global: {
                stubs: { RouterLink: true }
            }
        })
        await flushPromises()

        await wrapper.find('#formItemName').setValue('ARTICULO DE PRUEBA')
        await wrapper.find('#formItemsGroupCode').setValue(100)

        const negocioSelect = wrapper
            .findAllComponents(SearchableSelect)
            .find(c => c.props('inputId') === 'selectNegocio')
        expect(negocioSelect, 'no se encontró el SearchableSelect de Negocio').toBeTruthy()
        await negocioSelect!.vm.$emit('update:modelValue', 'ROLAND')

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        expect(articuloService.createArticulo).toHaveBeenCalledTimes(1)
        expect(mockReplace).toHaveBeenCalledWith('/articulo-maestro/editar/LR00001')

        const { toasts } = useToast()
        expect(toasts.value).toHaveLength(1)
        expect(toasts.value[0]).toMatchObject({
            type: 'success',
            title: 'Artículo creado',
            message: 'Artículo LR00001 creado. Sincronización con SAP iniciada en segundo plano.'
        })

        // Simula lo que hace el `:key="route.path"` de MainLayout al navegar
        // de /nuevo a /editar/:itemCode: destruye este componente. Antes del
        // fix, el mensaje vivía en un ref local (submitSuccess) y se perdía
        // acá. El toast, al vivir fuera del árbol, debe sobrevivir.
        wrapper.unmount()

        expect(toasts.value).toHaveLength(1)
        expect(toasts.value[0].message).toContain('LR00001')
    })

    it('homologa el toast de creación con el banner de edición: incluye "Ver monitoreo de SAP" cuando el usuario tiene permiso', async () => {
        useAuthStore().role = 'Admin' // igual criterio que puedeVerMonitoreoSap (isAdmin || permiso puntual)

        vi.mocked(articuloService.createArticulo).mockResolvedValue({
            itemCode: 'LR00002',
            imagenes: []
        })

        const wrapper = mount(FormularioArticulo, {
            global: {
                stubs: { RouterLink: true }
            }
        })
        await flushPromises()

        await wrapper.find('#formItemName').setValue('ARTICULO DE PRUEBA 2')
        await wrapper.find('#formItemsGroupCode').setValue(100)
        const negocioSelect = wrapper
            .findAllComponents(SearchableSelect)
            .find(c => c.props('inputId') === 'selectNegocio')
        await negocioSelect!.vm.$emit('update:modelValue', 'ROLAND')

        await wrapper.find('form').trigger('submit.prevent')
        await flushPromises()

        const { toasts } = useToast()
        expect(toasts.value).toHaveLength(1)
        const [toastCreado] = toasts.value
        expect(toastCreado.action?.label).toBe('Ver monitoreo de SAP →')

        // El toast sigue vivo tras el remount (ver test anterior); simularlo
        // acá también, para probar que el link no depende de refs del
        // componente ya destruido -solo del itemCode capturado por valor.
        wrapper.unmount()

        toastCreado.action?.onClick()
        expect(mockPush).toHaveBeenCalledWith({
            path: '/articulo-maestro/migracion',
            query: { codigo: 'LR00002' }
        })
    })
})
