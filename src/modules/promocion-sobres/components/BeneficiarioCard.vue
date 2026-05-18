<template>
  <div class="rounded-2xl border p-5 shadow-sm" :class="cardClass">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Beneficiario
        </p>
        <h2 class="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
          {{ beneficiario.nombre }}
        </h2>
        <p class="mt-1 font-mono text-sm text-slate-600 dark:text-slate-300">
          {{ beneficiario.identificacion }}
        </p>
      </div>
      <span class="shrink-0 rounded-full px-3 py-1 text-xs font-semibold" :class="statusBadgeClass">
        {{ statusLabel }}
      </span>
    </div>

    <dl class="mt-4 text-sm">
      <div>
        <dt class="text-slate-500 dark:text-slate-400">Cupo disponible</dt>
        <dd class="mt-0.5 font-semibold text-slate-900 dark:text-white">
          {{ formatCupo(beneficiario.cupoDisponible) }}
        </dd>
      </div>
    </dl>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BeneficiarioDto } from '../types'

const props = defineProps<{
  beneficiario: BeneficiarioDto
}>()

const statusLabel = computed(() => {
  if (props.beneficiario.puedeEscanear) {
    return props.beneficiario.entregado ? 'Validar código' : 'Listo para entregar'
  }
  if (props.beneficiario.entregado) return 'Ya entregado'
  return 'No habilitado'
})

const statusBadgeClass = computed(() => {
  if (props.beneficiario.puedeEscanear) {
    return props.beneficiario.entregado
      ? 'bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200'
      : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
  }
  if (props.beneficiario.entregado) {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
})

const cardClass = computed(() => {
  if (props.beneficiario.puedeEscanear) {
    return props.beneficiario.entregado
      ? 'border-violet-200 bg-violet-50/50 dark:border-violet-900/40 dark:bg-violet-950/20'
      : 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
  }
  if (props.beneficiario.entregado) {
    return 'border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20'
  }
  return 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/80'
})

function formatCupo(value: number): string {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
</script>
