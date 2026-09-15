import { ref, type Ref } from 'vue'
import type { useToast } from '@/composables/useToast'
import type { PedidoCompleto } from '../types'
import { pedidosService } from '../services/domains/pedidos'

/** Handlers de actualización de fecha_pedido/fecha_entrega desde la cabecera del pedido (HU-06). */
export function useFechaPedidoHandlers(
  pedido: Ref<PedidoCompleto | null>,
  toast: ReturnType<typeof useToast>,
  loadPedido: () => Promise<void>
) {
  // Feedback de "guardando" mientras se persiste la fecha (PATCH + recarga completa del
  // pedido): PedidoCabecera.vue deshabilita el input y muestra un spinner con esto.
  const guardandoFechaPedido = ref(false)
  const guardandoFechaEntrega = ref(false)

  async function handleUpdateFechaPedido(fecha: string | null) {
    if (!pedido.value?.cabecera?.pedido_id) return

    guardandoFechaPedido.value = true
    try {
      await pedidosService.actualizarCabeceraPedido(pedido.value.cabecera.pedido_id, {
        fecha_pedido: fecha
      })

      // Actualizar el valor localmente
      if (pedido.value.cabecera) {
        pedido.value.cabecera.fecha_pedido = fecha
      }

      toast.success('Fecha actualizada', 'La fecha de pedido se ha actualizado correctamente')

      // Recargar el pedido para asegurar sincronización
      await loadPedido()
    } catch (e: any) {
      console.error('Error al actualizar fecha de pedido:', e)
      toast.error('Error al actualizar', e.message || 'No se pudo actualizar la fecha de pedido')
      // Recargar para restaurar valor original
      await loadPedido()
    } finally {
      guardandoFechaPedido.value = false
    }
  }

  async function handleUpdateFechaEntrega(fecha: string | null) {
    if (!pedido.value?.cabecera?.pedido_id) return

    guardandoFechaEntrega.value = true
    try {
      await pedidosService.actualizarCabeceraPedido(pedido.value.cabecera.pedido_id, {
        fecha_entrega: fecha
      })

      // Actualizar el valor localmente
      if (pedido.value.cabecera) {
        pedido.value.cabecera.fecha_entrega = fecha
      }

      toast.success('Fecha actualizada', 'La fecha de entrega se ha actualizado correctamente')

      // Recargar el pedido para asegurar sincronización
      await loadPedido()
    } catch (e: any) {
      console.error('Error al actualizar fecha de entrega:', e)
      toast.error('Error al actualizar', e.message || 'No se pudo actualizar la fecha de entrega')
      // Recargar para restaurar valor original
      await loadPedido()
    } finally {
      guardandoFechaEntrega.value = false
    }
  }

  return { handleUpdateFechaPedido, handleUpdateFechaEntrega, guardandoFechaPedido, guardandoFechaEntrega }
}
