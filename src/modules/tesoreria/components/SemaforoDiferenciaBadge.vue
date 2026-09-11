<template>
  <span
    class="inline-flex w-full min-w-0 max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
    :class="tonoClases"
    :title="etiqueta"
    role="status"
  >
    <component :is="icono" class="h-4 w-4 flex-shrink-0" aria-hidden="true" />
    <span class="truncate">{{ etiqueta }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '../utils/formatters'
import { ICONO_ALERTA, ICONO_EXITO, TONO_CLASES } from '../utils/estadoVisual'

const props = defineProps<{
  /** totalEfectivo - totalDepositado. Cero (con tolerancia de centavo) = cuadrado. */
  diferencia: number
}>()

// Tolerancia de un centavo para absorber redondeos de punto flotante, no un umbral de negocio.
const cuadrado = computed(() => Math.abs(props.diferencia) < 0.01)

const icono = computed(() => (cuadrado.value ? ICONO_EXITO : ICONO_ALERTA))
const tonoClases = computed(() => (cuadrado.value ? TONO_CLASES.success : TONO_CLASES.warning))
const etiqueta = computed(() =>
  cuadrado.value ? 'Cuadrado' : `Con diferencia — falta depositar ${formatCurrency(props.diferencia)}`
)
</script>
