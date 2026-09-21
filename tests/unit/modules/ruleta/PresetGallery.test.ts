import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import type { TemaPresetBackend } from '@/modules/ruleta/types'
import PresetGallery from '@/modules/ruleta/components/PresetGallery.vue'

const { store, toast } = vi.hoisted(() => ({
  store: {
    presets: [] as TemaPresetBackend[],
    aplicarPreset: vi.fn(),
    guardarNuevoPreset: vi.fn().mockResolvedValue(undefined),
    eliminarPreset: vi.fn().mockResolvedValue(undefined),
  },
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))
vi.mock('@/modules/ruleta/stores/temaStore', () => ({ useTemaStore: () => store }))
vi.mock('@/composables/useToast', () => ({ useToast: () => toast }))

const PRESET_SISTEMA: TemaPresetBackend = {
  id: 'p1', nombre: 'Navidad de Gala', configuracionJson: '{}',
  miniaturaUrl: 'data:image/svg+xml;base64,AAA', esSistema: true,
}
const PRESET_PROPIO: TemaPresetBackend = {
  id: 'p2', nombre: 'Mi plantilla', configuracionJson: '{}',
  miniaturaUrl: null, esSistema: false,
}

let wrapper: VueWrapper

beforeEach(() => {
  vi.clearAllMocks()
  store.presets = [PRESET_SISTEMA, PRESET_PROPIO]
  wrapper = mount(PresetGallery)
})

afterEach(() => {
  wrapper.unmount()
  vi.restoreAllMocks()
})

describe('PresetGallery', () => {
  it('aplica el preset correspondiente al hacer clic en su tarjeta', async () => {
    const boton = wrapper.findAll('button').find((b) => b.text().includes(PRESET_SISTEMA.nombre))
    expect(boton).toBeTruthy()

    await boton!.trigger('click')

    expect(store.aplicarPreset).toHaveBeenCalledWith(PRESET_SISTEMA)
  })

  it('no muestra botón de eliminar para plantillas de sistema', () => {
    const botonesEliminar = wrapper.findAll('button[title="Eliminar plantilla"]')
    expect(botonesEliminar).toHaveLength(1) // solo la plantilla propia (no la de sistema)
  })

  it('elimina una plantilla propia tras confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const botonEliminar = wrapper.find('button[title="Eliminar plantilla"]')
    await botonEliminar.trigger('click')

    expect(store.eliminarPreset).toHaveBeenCalledWith(PRESET_PROPIO.id)
  })

  it('no elimina si el usuario cancela la confirmación', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)

    const botonEliminar = wrapper.find('button[title="Eliminar plantilla"]')
    await botonEliminar.trigger('click')

    expect(store.eliminarPreset).not.toHaveBeenCalled()
  })

  it('guarda el borrador actual como nueva plantilla con el nombre ingresado', async () => {
    const botonMostrar = wrapper.findAll('button').find((b) => b.text().includes('Guardar como nueva plantilla'))
    await botonMostrar!.trigger('click')

    const input = wrapper.find('input[type="text"]')
    await input.setValue('Mi nueva plantilla')

    const botonGuardar = wrapper.findAll('button').find((b) => b.text() === 'Guardar')
    await botonGuardar!.trigger('click')
    await wrapper.vm.$nextTick()

    expect(store.guardarNuevoPreset).toHaveBeenCalledWith('Mi nueva plantilla')
  })
})
