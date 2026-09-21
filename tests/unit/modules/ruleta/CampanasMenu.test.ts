import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import type { Campana } from '@/modules/ruleta/types'
import CampanasView from '@/modules/ruleta/views/admin/CampanasView.vue'

const { store, push } = vi.hoisted(() => ({
  store: { campanas: [] as Campana[], loadingCampanas: false, cargarCampanas: vi.fn() },
  push: vi.fn(),
}))
vi.mock('@/modules/ruleta/stores/adminStore', () => ({ useAdminStore: () => store }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/composables/useToast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))

let wrapper: VueWrapper
let triggerRect: DOMRect
let menuHeight: number
const menu = () => document.querySelector<HTMLElement>('[role="menu"]')

async function abrir(index = 0): Promise<HTMLButtonElement> {
  const button = wrapper.findAll('button[aria-haspopup="menu"]')[index]!
  await button.trigger('click')
  await flushPromises()
  return button.element as HTMLButtonElement
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('innerWidth', 1366)
  vi.stubGlobal('innerHeight', 768)
  vi.stubGlobal('scrollY', 900)
  vi.stubGlobal('scrollX', 400)
  vi.stubGlobal('visualViewport', null)
  menuHeight = 280
  triggerRect = new DOMRect(1200, 200, 44, 44)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return this.getAttribute('role') === 'menu' ? new DOMRect(0, 0, 208, menuHeight) : triggerRect
  })
  store.campanas = Array.from({ length: 20 }, (_, index) => ({
    id: String(index + 1), nombre: `Campaña ${index + 1}`, estado: 'borrador', estado_operativo: 'borrador',
    fecha_inicio: '2026-01-01', fecha_fin: '2026-12-31', cooldown_dias: 15, max_giros: 1,
    segmentos_permitidos: [], esta_vigente: true, disponible_para_giro: false,
    requiere_validacion_onecard: true, tiene_premios: false,
  }))
  wrapper = mount(CampanasView, {
    attachTo: document.body,
    global: { stubs: { VolverButton: true, DuplicarCampanaModal: true } },
  })
})

afterEach(() => {
  wrapper.unmount()
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('menú contextual de campañas', () => {
  it('ancla la fila 20 al viewport aunque scrollY y scrollX sean grandes', async () => {
    const button = await abrir(19)
    expect(document.body.contains(menu())).toBe(true)
    expect(wrapper.element.contains(menu())).toBe(false)
    expect(menu()?.style.top).toBe('250px')
    expect(menu()?.style.left).toBe('1036px')
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement?.textContent).toContain('Configurar premios')
    ;(document.activeElement as HTMLButtonElement).click()
    await flushPromises()
    expect(push).toHaveBeenCalledWith({ name: 'ruleta-admin-campana-detalle', params: { campanaId: '20' } })
    expect(menu()).toBeNull()
  })

  it('invierte hacia arriba cuando la última fila no deja espacio debajo', async () => {
    triggerRect = new DOMRect(1200, 700, 44, 44)
    await abrir(19)
    expect(menu()?.style.top).toBe('414px')
  })

  it.each([10, 375])('limita el menú horizontalmente en móvil con disparador x=%i', async x => {
    vi.stubGlobal('innerWidth', 390)
    triggerRect = new DOMRect(x, 200, 44, 44)
    await abrir()
    const left = Number.parseFloat(menu()!.style.left)
    expect(left).toBeGreaterThanOrEqual(12)
    expect(left + 208).toBeLessThanOrEqual(378)
    expect(menu()?.style.maxWidth).toBe('366px')
  })

  it('limita el alto al lado con más espacio y permite su scroll interno', async () => {
    vi.stubGlobal('innerHeight', 240)
    triggerRect = new DOMRect(200, 140, 44, 44)
    await abrir()
    expect(menu()?.style.maxHeight).toBe('122px')
    expect(menu()?.style.top).toBe('12px')
    menu()!.dispatchEvent(new Event('scroll'))
    await flushPromises()
    expect(menu()).not.toBeNull()
    expect(menu()?.classList.contains('overflow-y-auto')).toBe(true)
  })

  it.each(['window', 'table', 'resize'])('cierra al cambiar %s', async target => {
    await abrir()
    if (target === 'table') wrapper.get('table').element.dispatchEvent(new Event('scroll'))
    else window.dispatchEvent(new Event(target === 'resize' ? 'resize' : 'scroll'))
    await flushPromises()
    expect(menu()).toBeNull()
    expect(document.querySelector('[aria-hidden="true"].fixed')).toBeNull()
  })

  it('soporta flechas, omite acciones deshabilitadas y restaura el foco con Escape', async () => {
    const button = await abrir()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }))
    expect(document.activeElement?.textContent).toContain('Duplicar campaña')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', cancelable: true }))
    expect(document.activeElement?.textContent).toContain('Eliminar')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }))
    expect(document.activeElement?.textContent).toContain('Editar configuración')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }))
    await flushPromises()
    expect(menu()).toBeNull()
    expect(document.activeElement).toBe(button)
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('cierra por Tab y por click en el backdrop', async () => {
    await abrir()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    await flushPromises()
    expect(menu()).toBeNull()
    await abrir()
    document.querySelector<HTMLElement>('[aria-hidden="true"].fixed')!.click()
    await flushPromises()
    expect(menu()).toBeNull()
  })

  it('no reabre tras cerrar antes de completar nextTick', async () => {
    const button = wrapper.get('button[aria-haspopup="menu"]').element
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(menu()).toBeNull()
    expect(document.querySelector('[aria-hidden="true"].fixed')).toBeNull()
  })

  it('retira los listeners tanto al cerrar como al desmontar', async () => {
    const add = vi.spyOn(window, 'addEventListener')
    const remove = vi.spyOn(window, 'removeEventListener')
    await abrir()
    const handlers = add.mock.calls.filter(([type]) => ['scroll', 'resize', 'keydown'].includes(type))
    expect(handlers).toHaveLength(3)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    for (const [type, handler] of handlers) {
      expect(remove.mock.calls.some(([removedType, removedHandler, capture]) =>
        type === removedType && handler === removedHandler && (type !== 'scroll' || capture === true))).toBe(true)
    }
    await abrir()
    remove.mockClear()
    wrapper.unmount()
    for (const [type, handler] of handlers) {
      expect(remove.mock.calls.some(([removedType, removedHandler]) => type === removedType && handler === removedHandler)).toBe(true)
    }
  })
})
