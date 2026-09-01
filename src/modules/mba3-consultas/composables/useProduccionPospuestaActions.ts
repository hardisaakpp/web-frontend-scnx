/**
 * Req. 1.2: par "Rechazar" / "Aceptar" sobre un pedido "hijo" en Producción Pospuesta
 * (estado_id 22), exclusivo de mabel.view. Compartido entre PedidoDetalleView.vue y
 * CargarPlantillaView.vue.
 */
import { ref, computed, type Ref } from '@vue/reactivity'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { mba3ConsultasService, extractErrorMessage } from '../services/mba3ConsultasApi'
import type { PedidoCompleto } from '../types'

export function useProduccionPospuestaActions(pedido: Ref<PedidoCompleto | null>) {
  const toast = useToast()
  const authStore = useAuthStore()

  const rechazando = ref(false)
  const aceptando = ref(false)

  const puedeRechazar = computed(() => {
    if (!authStore.canViewMabel) return false
    const cabecera = pedido.value?.cabecera
    if (!cabecera) return false
    const estadoId = cabecera.estado_id != null ? Number(cabecera.estado_id) : null
    return estadoId === 22 && pedido.value?.puede_cancelar_pedido === true
  })

  const puedeAceptar = computed(() => {
    if (!authStore.canViewMabel) return false
    const cabecera = pedido.value?.cabecera
    if (!cabecera) return false
    const estadoId = cabecera.estado_id != null ? Number(cabecera.estado_id) : null
    return estadoId === 22 && pedido.value?.puede_aceptar_produccion_pospuesta === true
  })

  async function handleRechazar() {
    const pedidoId = pedido.value?.cabecera?.pedido_id
    if (!pedidoId) {
      toast.error('Error', 'No hay pedido para rechazar')
      return
    }
    if (rechazando.value) return

    const numeroPedidoDisplay = pedido.value?.cabecera?.numero_pedido
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas rechazar este pedido?\n\n` +
      `Pedido: ${numeroPedidoDisplay}\n` +
      `El pedido cambiará a estado "Rechazado".`
    )
    if (!confirmado) return

    rechazando.value = true
    toast.info('Rechazando pedido...', 'Por favor espera')
    try {
      await mba3ConsultasService.cancelarPedido(pedidoId)
      toast.success('Pedido rechazado', 'El pedido ha sido rechazado exitosamente')
      if (pedido.value?.cabecera) {
        pedido.value.cabecera.estado = 'RECHAZADO'
        pedido.value.cabecera.estado_id = 24
      }
    } catch (e: any) {
      toast.error('Error al rechazar', extractErrorMessage(e))
    } finally {
      rechazando.value = false
    }
  }

  async function handleAceptar() {
    const pedidoId = pedido.value?.cabecera?.pedido_id
    if (!pedidoId) {
      toast.error('Error', 'No hay pedido para aceptar')
      return
    }
    if (aceptando.value) return

    const numeroPedidoDisplay = pedido.value?.cabecera?.numero_pedido
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas aceptar este pedido?\n\n` +
      `Pedido: ${numeroPedidoDisplay}\n` +
      `El pedido pasará a "Listo para Redistribución".`
    )
    if (!confirmado) return

    aceptando.value = true
    toast.info('Aceptando pedido...', 'Por favor espera')
    try {
      await mba3ConsultasService.aceptarProduccionPospuesta(pedidoId)
      toast.success('Pedido aceptado', 'El pedido está listo para redistribución')
      if (pedido.value?.cabecera) {
        pedido.value.cabecera.estado = 'LISTO PARA REDISTRIBUCION'
        pedido.value.cabecera.estado_id = 25
      }
    } catch (e: any) {
      toast.error('Error al aceptar', extractErrorMessage(e))
    } finally {
      aceptando.value = false
    }
  }

  return { puedeRechazar, puedeAceptar, rechazando, aceptando, handleRechazar, handleAceptar }
}
