<script setup lang="ts">
import { computed } from 'vue'
import { etiquetaEstado, type EstadoTransferencia } from '../types'

const props = defineProps<{ estado: EstadoTransferencia | string }>()

// gris=Borrador · verde=Aprobado · rojo=Rechazado · azul=TransferenciaCreada · amarillo=resto
const clases = computed(() => {
  switch (props.estado) {
    case 'Borrador':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    case 'Aprobado':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'Rechazado':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    case 'ErrorEnvioSap':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
    case 'TransferenciaCreada':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    default:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  }
})

const label = computed(() => etiquetaEstado(props.estado))
</script>

<template>
  <span class="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
    :class="clases">
    {{ label }}
  </span>
</template>
