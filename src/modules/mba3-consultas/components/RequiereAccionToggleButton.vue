<template>
  <div v-if="contador > 0" class="mt-2">
    <button
      type="button"
      @click="$emit('toggle')"
      :aria-pressed="activo"
      :title="activo ? tituloActivo : tituloInactivo"
      class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-sm font-medium text-orange-800 dark:text-orange-300 transition-colors hover:bg-orange-100 dark:hover:bg-orange-900/30 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
    >
      <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span class="text-sm font-semibold text-orange-800 dark:text-orange-200">
        {{ contador }} pedido{{ contador !== 1 ? 's' : '' }} {{ sufijo }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Botón toggle "N pedidos requieren acción" reutilizado por los 3 listados de pedidos
 * (CargarPlantillaListadoView, PedidosListView, RedistribucionListadoView). Puramente de
 * presentación: no decide qué estados cuentan como "requiere acción" ni qué parámetro de API
 * enviar -- cada vista sigue siendo dueña de esa lógica (su propio `contadorPedidosPendientes`
 * computed y su propio `aplicarFiltroPendientes`) y solo le pasa el resultado a este componente.
 * Ver estadoPedido.ts (ESTADOS_QUE_REQUIEREN_ACCION_CARGAR_PLANTILLA / _PEDIDOS / genérico) para
 * los 3 conjuntos de estados, distintos entre sí a propósito.
 */
withDefaults(
  defineProps<{
    /** Cantidad de pedidos que requieren acción (0 oculta el botón). */
    contador: number
    /** Estado actual del filtro rápido (aria-pressed + decide qué title mostrar). */
    activo: boolean
    /** Tooltip cuando el filtro está inactivo -- describe los estados que aplica cada vista. */
    tituloInactivo: string
    /** Tooltip cuando el filtro ya está activo. Mismo texto en las 3 vistas hoy. */
    tituloActivo?: string
    /** Texto tras el contador (ej. "requieren acción" / "requieren tu acción" en modo El Rayo). */
    sufijo?: string
  }>(),
  {
    tituloActivo: 'Quitar el filtro y ver todos los pedidos',
    sufijo: 'requieren acción'
  }
)

defineEmits<{ toggle: [] }>()
</script>
