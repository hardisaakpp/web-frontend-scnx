<template>
  <span
    v-if="contador > 0"
    class="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-semibold leading-none ring-2 ring-white dark:ring-gray-800"
    :title="`${contador} pedido${contador !== 1 ? 's' : ''} requiere${contador !== 1 ? 'n' : ''} acción`"
  >
    {{ textoContador }}
  </span>
</template>

<script setup lang="ts">
/**
 * Badge circular de notificación (esquina superior derecha de un botón con position: relative)
 * con el total de pedidos que requieren acción. Puramente de presentación: cada vista/dashboard
 * que lo usa decide qué cuenta como "requiere acción" y de dónde sale el número.
 */
import { computed } from '@vue/reactivity'

const props = defineProps<{
  /** Cantidad de pedidos que requieren acción (0 oculta el badge). */
  contador: number
}>()

const textoContador = computed(() => (props.contador > 99 ? '99+' : props.contador))
</script>
