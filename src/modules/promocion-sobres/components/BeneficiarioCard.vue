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

    <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
      <div>
        <dt class="text-slate-500 dark:text-slate-400">Cupo disponible</dt>
        <dd class="mt-0.5 font-semibold text-slate-900 dark:text-white">
          {{ formatCupo(beneficiario.cupoDisponible) }}
        </dd>
      </div>
      <div>
        <dt class="text-slate-500 dark:text-slate-400">Puede escanear</dt>
        <dd
          class="mt-0.5 font-semibold"
          :class="beneficiario.puedeEscanear ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'"
        >
          {{ beneficiario.puedeEscanear ? 'Sí' : 'No' }}
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
  if (props.beneficiario.entregado) return 'Ya entregado'
  if (props.beneficiario.puedeEscanear) return 'Listo para entregar'
  return 'No habilitado'
})

const statusBadgeClass = computed(() => {
  if (props.beneficiario.entregado) {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
  }
  if (props.beneficiario.puedeEscanear) {
    return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
  }
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
})

const cardClass = computed(() => {
  if (props.beneficiario.entregado) {
    return 'border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20'
  }
  if (props.beneficiario.puedeEscanear) {
    return 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
  }
  return 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800/80'
})

function formatCupo(value: number): string {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
</script>
