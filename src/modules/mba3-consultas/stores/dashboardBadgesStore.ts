import { defineStore } from 'pinia'
import { ref } from '@vue/reactivity'
import { pedidosService } from '../services/domains/pedidos'

/** Estado usado por el backend para "Nuevo Pedido" (acepta con/sin guión bajo, ver pedido_estados.py) */
const ESTADO_NUEVO_PEDIDO = 'NUEVO PEDIDO'

/** Contadores de "pedidos que requieren acción" para los badges del Dashboard
 * (Cargar Plantilla, Listado de Pedidos, Redistribución, Producción El Rayo). Vive en un store (no
 * en refs locales de DashboardView.vue) para que el valor sobreviva al desmontaje/remontaje del
 * componente al navegar fuera y volver a /mba3-consultas -- igual que
 * `ordenesCompraStore.totalPendientesReintento`, así el badge no vuelve a mostrar 0 mientras se
 * re-consulta el backend. */
export const useDashboardBadgesStore = defineStore('mba3DashboardBadges', () => {
  const cargarPlantilla = ref(0)
  const pedidos = ref(0)
  const redistribucion = ref(0)
  /** Pedidos en estado Nuevo Pedido dentro del universo de Producción El Rayo (NUEVO_PEDIDO/
   * GESTIONAR_PEDIDO) -- el único de esos 2 estados aún no "tomado" por Producción. `solo_pendientes_
   * accion` no aplica aquí: el backend lo cruza con estados que este modo nunca ve (ver
   * ESTADOS_PRODUCCION_EL_RAYO_IDS), así que se filtra directo por estado. */
  const produccion = ref(0)

  async function fetchContadores(opts: { canViewMabel: boolean; canViewOrderList: boolean; canViewProduccionElRayo: boolean }) {
    try {
      const [plantillasRes, pedidosRes, redistribucionRes, produccionRes] = await Promise.all([
        opts.canViewMabel
          ? pedidosService.getPlantillasPedidos({ solo_pendientes_accion: true, limit: 1 })
          : Promise.resolve(null),
        opts.canViewOrderList
          ? pedidosService.getPedidosListado({ solo_pendientes_accion: true, limit: 1 })
          : Promise.resolve(null),
        opts.canViewMabel
          ? pedidosService.getPedidosListado({ solo_redistribucion: true, solo_pendientes_accion: true, limit: 1 })
          : Promise.resolve(null),
        opts.canViewProduccionElRayo
          ? pedidosService.getPedidosListado({ estado: ESTADO_NUEVO_PEDIDO, solo_produccion_elrayo: true, limit: 1 })
          : Promise.resolve(null)
      ])
      cargarPlantilla.value = plantillasRes?.metadata.total ?? 0
      pedidos.value = pedidosRes?.metadata.total ?? 0
      redistribucion.value = redistribucionRes?.metadata.total ?? 0
      produccion.value = produccionRes?.metadata.total ?? 0
    } catch (error) {
      console.error('Error al cargar contadores de pedidos pendientes:', error)
    }
  }

  return {
    cargarPlantilla,
    pedidos,
    redistribucion,
    produccion,
    fetchContadores,
  }
})
