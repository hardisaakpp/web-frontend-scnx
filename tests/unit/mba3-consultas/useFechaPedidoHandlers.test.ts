import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useFechaPedidoHandlers } from '@/modules/mba3-consultas/composables/useFechaPedidoHandlers'
import { mba3ConsultasService } from '@/modules/mba3-consultas/services/mba3ConsultasApi'

vi.mock('@/modules/mba3-consultas/services/mba3ConsultasApi', () => ({
  mba3ConsultasService: {
    actualizarCabeceraPedido: vi.fn()
  }
}))

function crearToastMock() {
  return { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() } as any
}

describe('useFechaPedidoHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handleUpdateFechaPedido actualiza la cabecera local, muestra toast de exito y recarga', async () => {
    const pedido = ref({ cabecera: { pedido_id: 'p1', fecha_pedido: '2026-01-01' } } as any)
    const toast = crearToastMock()
    const loadPedido = vi.fn().mockResolvedValue(undefined)
    vi.mocked(mba3ConsultasService.actualizarCabeceraPedido).mockResolvedValue({} as any)

    const { handleUpdateFechaPedido } = useFechaPedidoHandlers(pedido, toast, loadPedido)
    await handleUpdateFechaPedido('2026-02-01')

    expect(mba3ConsultasService.actualizarCabeceraPedido).toHaveBeenCalledWith('p1', { fecha_pedido: '2026-02-01' })
    expect(pedido.value.cabecera.fecha_pedido).toBe('2026-02-01')
    expect(toast.success).toHaveBeenCalledWith('Fecha actualizada', 'La fecha de pedido se ha actualizado correctamente')
    expect(loadPedido).toHaveBeenCalledTimes(1)
  })

  it('handleUpdateFechaPedido no hace nada si no hay pedido_id', async () => {
    const pedido = ref({ cabecera: {} } as any)
    const toast = crearToastMock()
    const loadPedido = vi.fn()

    const { handleUpdateFechaPedido } = useFechaPedidoHandlers(pedido, toast, loadPedido)
    await handleUpdateFechaPedido('2026-02-01')

    expect(mba3ConsultasService.actualizarCabeceraPedido).not.toHaveBeenCalled()
    expect(loadPedido).not.toHaveBeenCalled()
  })

  it('handleUpdateFechaPedido muestra toast de error y recarga igual si falla el backend', async () => {
    const pedido = ref({ cabecera: { pedido_id: 'p1', fecha_pedido: '2026-01-01' } } as any)
    const toast = crearToastMock()
    const loadPedido = vi.fn().mockResolvedValue(undefined)
    vi.mocked(mba3ConsultasService.actualizarCabeceraPedido).mockRejectedValue(new Error('boom'))

    const { handleUpdateFechaPedido } = useFechaPedidoHandlers(pedido, toast, loadPedido)
    await handleUpdateFechaPedido('2026-02-01')

    expect(toast.error).toHaveBeenCalledWith('Error al actualizar', 'boom')
    expect(loadPedido).toHaveBeenCalledTimes(1)
  })

  it('handleUpdateFechaEntrega actualiza fecha_entrega y muestra su propio mensaje', async () => {
    const pedido = ref({ cabecera: { pedido_id: 'p1', fecha_entrega: null } } as any)
    const toast = crearToastMock()
    const loadPedido = vi.fn().mockResolvedValue(undefined)
    vi.mocked(mba3ConsultasService.actualizarCabeceraPedido).mockResolvedValue({} as any)

    const { handleUpdateFechaEntrega } = useFechaPedidoHandlers(pedido, toast, loadPedido)
    await handleUpdateFechaEntrega('2026-03-01')

    expect(mba3ConsultasService.actualizarCabeceraPedido).toHaveBeenCalledWith('p1', { fecha_entrega: '2026-03-01' })
    expect(pedido.value.cabecera.fecha_entrega).toBe('2026-03-01')
    expect(toast.success).toHaveBeenCalledWith('Fecha actualizada', 'La fecha de entrega se ha actualizado correctamente')
  })
})
