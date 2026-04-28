<template>
  <div
    :class="[
      'flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm shadow-sm',
      toneClass
    ]"
    role="status"
  >
    <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/60 dark:bg-black/20">
      <!-- loading -->
      <svg
        v-if="status === 'loading-warehouses' || status === 'scanning'"
        class="h-5 w-5 animate-spin text-current"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <!-- success -->
      <svg
        v-else-if="status === 'detected'"
        class="h-5 w-5 text-emerald-600 dark:text-emerald-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <!-- warning -->
      <svg
        v-else-if="status === 'not-found'"
        class="h-5 w-5 text-amber-600 dark:text-amber-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <!-- error -->
      <svg
        v-else-if="status === 'error'"
        class="h-5 w-5 text-red-600 dark:text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <!-- info -->
      <svg
        v-else
        class="h-5 w-5 text-slate-500 dark:text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
    </span>
    <div class="min-w-0 flex-1 space-y-1">
      <p class="leading-relaxed">
        {{ message }}
      </p>
      <p
        v-if="isDev && correlationId"
        class="font-mono text-[11px] text-slate-500 dark:text-slate-400"
      >
        Correlation: {{ correlationId }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ScanStatus } from '../types'

const isDev = import.meta.env.DEV

const props = defineProps<{
  status: ScanStatus
  customMessage?: string | null
  correlationId?: string | null
}>()

const toneClass = computed(() => {
  if (props.status === 'error') {
    return 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200'
  }
  if (props.status === 'not-found') {
    return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200'
  }
  if (props.status === 'detected') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100'
  }
  if (props.status === 'loading-warehouses' || props.status === 'scanning') {
    return 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-100'
  }
  return 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-200'
})

const message = computed(() => {
  if (props.customMessage) return props.customMessage
  if (props.status === 'loading-warehouses') return 'Cargando almacenes…'
  if (props.status === 'scanning') return 'Consultando artículo…'
  if (props.status === 'detected') return 'Artículo encontrado.'
  if (props.status === 'not-found') return 'No se encontró el artículo en ese almacén.'
  if (props.status === 'error') return 'Se presentó un error al consultar.'
  return 'Selecciona almacén e ingresa un código para consultar.'
})
</script>
