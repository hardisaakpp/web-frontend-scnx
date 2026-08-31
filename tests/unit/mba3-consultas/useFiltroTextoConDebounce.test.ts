import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useFiltroTextoConDebounce } from '@/modules/mba3-consultas/composables/useFiltroTextoConDebounce'

describe('useFiltroTextoConDebounce', () => {
  it('al hacer commit, actualiza el campo indicado y llama aplicarFiltros', () => {
    const filtros = ref({ numero_pedido: '', creado_por: '' })
    const aplicarFiltros = vi.fn()
    const { texto, commit } = useFiltroTextoConDebounce(filtros, 'numero_pedido', aplicarFiltros)

    texto.value = 'PED-123'
    commit()

    expect(filtros.value.numero_pedido).toBe('PED-123')
    expect(aplicarFiltros).toHaveBeenCalledTimes(1)
  })

  it('no llama aplicarFiltros si el valor no cambió', () => {
    const filtros = ref({ numero_pedido: 'PED-123', creado_por: '' })
    const aplicarFiltros = vi.fn()
    const { texto, commit } = useFiltroTextoConDebounce(filtros, 'numero_pedido', aplicarFiltros)

    texto.value = 'PED-123'
    commit()

    expect(aplicarFiltros).not.toHaveBeenCalled()
  })

  it('clear() vacía el texto y aplica filtros con valor vacío', () => {
    const filtros = ref({ numero_pedido: 'PED-123', creado_por: '' })
    const aplicarFiltros = vi.fn()
    const { texto, clear } = useFiltroTextoConDebounce(filtros, 'numero_pedido', aplicarFiltros)

    clear()

    expect(texto.value).toBe('')
    expect(filtros.value.numero_pedido).toBe('')
    expect(aplicarFiltros).toHaveBeenCalledTimes(1)
  })

  it('opera de forma independiente sobre distintos campos del mismo filtros', () => {
    const filtros = ref({ numero_pedido: '', creado_por: '' })
    const aplicarFiltros1 = vi.fn()
    const aplicarFiltros2 = vi.fn()
    const numeroPedido = useFiltroTextoConDebounce(filtros, 'numero_pedido', aplicarFiltros1)
    const creadoPor = useFiltroTextoConDebounce(filtros, 'creado_por', aplicarFiltros2)

    numeroPedido.texto.value = 'PED-1'
    numeroPedido.commit()
    creadoPor.texto.value = 'jperez'
    creadoPor.commit()

    expect(filtros.value).toEqual({ numero_pedido: 'PED-1', creado_por: 'jperez' })
    expect(aplicarFiltros1).toHaveBeenCalledTimes(1)
    expect(aplicarFiltros2).toHaveBeenCalledTimes(1)
  })
})
