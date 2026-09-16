import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useDelayedFlag } from '@/composables/useDelayedFlag'

function mountWithFlag(source: () => boolean, delayMs: number) {
  const flag = ref(false)
  const wrapper = mount(
    defineComponent({
      setup() {
        flag.value = false
        const activo = useDelayedFlag(source, delayMs)
        return () => h('div', String(activo.value))
      },
    })
  )
  return wrapper
}

describe('useDelayedFlag', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('permanece false mientras no pase el delay', async () => {
    const activa = ref(true)
    const wrapper = mountWithFlag(() => activa.value, 10000)

    await vi.advanceTimersByTimeAsync(9999)

    expect(wrapper.text()).toBe('false')
  })

  it('pasa a true justo despues del delay si la fuente sigue activa', async () => {
    const activa = ref(true)
    const wrapper = mountWithFlag(() => activa.value, 10000)

    await vi.advanceTimersByTimeAsync(10000)

    expect(wrapper.text()).toBe('true')
  })

  it('vuelve a false de inmediato si la fuente se desactiva antes del delay', async () => {
    const activa = ref(true)
    const wrapper = mountWithFlag(() => activa.value, 10000)

    await vi.advanceTimersByTimeAsync(5000)
    activa.value = false
    await vi.advanceTimersByTimeAsync(0)

    expect(wrapper.text()).toBe('false')

    // Y no deberia activarse despues, aunque pase el delay original: el timer se limpio.
    await vi.advanceTimersByTimeAsync(10000)
    expect(wrapper.text()).toBe('false')
  })

  it('un segundo ciclo activo/inactivo vuelve a esperar el delay completo', async () => {
    const activa = ref(true)
    const wrapper = mountWithFlag(() => activa.value, 10000)

    await vi.advanceTimersByTimeAsync(10000)
    expect(wrapper.text()).toBe('true')

    activa.value = false
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.text()).toBe('false')

    activa.value = true
    await vi.advanceTimersByTimeAsync(9999)
    expect(wrapper.text()).toBe('false')

    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.text()).toBe('true')
  })
})
