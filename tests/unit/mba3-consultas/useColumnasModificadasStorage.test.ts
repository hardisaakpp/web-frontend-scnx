import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useColumnasModificadasStorage } from '@/modules/mba3-consultas/composables/useColumnasModificadasStorage'

describe('useColumnasModificadasStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('guardar() persiste el set actual bajo una clave por numero de pedido', () => {
    const numeroPedido = ref<string | undefined>('PED-1')
    const columnasModificadas = ref(new Set(['costo_unitario', 'comentario']))
    const rolesModificacion = ref(new Map<string, string | null>())
    const { guardar } = useColumnasModificadasStorage(numeroPedido, columnasModificadas, rolesModificacion)

    guardar()

    const stored = sessionStorage.getItem('pedido_columnas_modificadas_PED-1')
    expect(JSON.parse(stored!)).toEqual(['costo_unitario', 'comentario'])
  })

  it('guardar() no hace nada si no hay numeroPedido', () => {
    const numeroPedido = ref<string | undefined>(undefined)
    const columnasModificadas = ref(new Set(['x']))
    const rolesModificacion = ref(new Map<string, string | null>())
    const { guardar } = useColumnasModificadasStorage(numeroPedido, columnasModificadas, rolesModificacion)

    guardar()

    expect(sessionStorage.getItem('pedido_columnas_modificadas_undefined')).toBeNull()
  })

  it('cargar() restaura el set guardado', () => {
    const numeroPedido = ref<string | undefined>('PED-2')
    sessionStorage.setItem('pedido_columnas_modificadas_PED-2', JSON.stringify(['total']))
    const columnasModificadas = ref(new Set<string>())
    const rolesModificacion = ref(new Map<string, string | null>())
    const { cargar } = useColumnasModificadasStorage(numeroPedido, columnasModificadas, rolesModificacion)

    cargar()

    expect(columnasModificadas.value).toEqual(new Set(['total']))
  })

  it('cargar() no toca el set si no hay nada guardado', () => {
    const numeroPedido = ref<string | undefined>('PED-3')
    const columnasModificadas = ref(new Set(['ya_existente']))
    const rolesModificacion = ref(new Map<string, string | null>())
    const { cargar } = useColumnasModificadasStorage(numeroPedido, columnasModificadas, rolesModificacion)

    cargar()

    expect(columnasModificadas.value).toEqual(new Set(['ya_existente']))
  })

  it('limpiar() borra el storage, el set de columnas y el mapa de roles', () => {
    const numeroPedido = ref<string | undefined>('PED-4')
    sessionStorage.setItem('pedido_columnas_modificadas_PED-4', JSON.stringify(['x']))
    const columnasModificadas = ref(new Set(['x']))
    const rolesModificacion = ref(new Map<string, string | null>([['x', 'ODCSAP']]))
    const { limpiar } = useColumnasModificadasStorage(numeroPedido, columnasModificadas, rolesModificacion)

    limpiar()

    expect(sessionStorage.getItem('pedido_columnas_modificadas_PED-4')).toBeNull()
    expect(columnasModificadas.value.size).toBe(0)
    expect(rolesModificacion.value.size).toBe(0)
  })
})
