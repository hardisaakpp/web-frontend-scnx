<template>
  <span
    role="status"
    class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shadow-2xs"
    :class="clasesTono"
  >
    <component :is="icono" class="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
    <span>{{ etiqueta }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { EstadoDeposito, ESTADO_DEPOSITO_META } from '../types/tesoreria.types'
import { ESTADO_DEPOSITO_ICONO, ESTADO_DEPOSITO_TONO, TONO_CLASES } from '../utils/estadoVisual'

const props = withDefaults(
  defineProps<{
    estado: EstadoDeposito
    creadoSAP?: boolean
    docEntrySAP?: number | null
  }>(),
  {
    creadoSAP: false,
    docEntrySAP: null
  }
)

const icono = computed(() => ESTADO_DEPOSITO_ICONO[props.estado])

const tono = computed(() => {
  if (props.creadoSAP || props.estado === EstadoDeposito.IntegradoSAP) {
    return 'success'
  }
  return ESTADO_DEPOSITO_TONO[props.estado]
})

const clasesTono = computed(() => TONO_CLASES[tono.value])

const etiqueta = computed(() => {
  if (props.creadoSAP && props.docEntrySAP) {
    return `En SAP (DocEntry ${props.docEntrySAP})`
  }
  if (props.estado === EstadoDeposito.IntegradoSAP && props.docEntrySAP) {
    return `Integrado en SAP (${props.docEntrySAP})`
  }
  return ESTADO_DEPOSITO_META[props.estado]?.label || 'Desconocido'
})
</script>
