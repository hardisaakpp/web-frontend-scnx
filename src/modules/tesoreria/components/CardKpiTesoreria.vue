<template>
  <div
    :role="clickable ? 'button' : 'region'"
    :tabindex="clickable ? 0 : undefined"
    :aria-pressed="clickable ? active : undefined"
    :aria-label="ariaLabel || `${title}: ${value}`"
    class="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs transition-shadow hover:shadow-sm"
    :class="cardStateClasses"
    @click="onActivate"
    @keydown.enter="onActivate"
    @keydown.space.prevent="onActivate"
  >
    <span
      v-if="active"
      class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
      :class="activeBadgeClasses"
    >
      {{ badgeActiveText || 'Filtro activo' }}
      <span aria-hidden="true">●</span>
    </span>

    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <p class="truncate text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {{ title }}
        </p>

        <div v-if="loading" class="mt-2 space-y-2">
          <div class="h-8 w-32 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          <div v-if="subtitle" class="h-3.5 w-24 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"></div>
        </div>

        <div v-else class="mt-2">
          <p class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {{ value }}
          </p>
          <p v-if="subtitle" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div
        v-if="icon"
        class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border transition-colors"
        :class="iconToneClasses"
        aria-hidden="true"
      >
        <component :is="icon" class="h-6 w-6" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'

export type KpiTone = 'emerald' | 'amber' | 'rose' | 'blue' | 'indigo' | 'neutral'

const props = withDefaults(
  defineProps<{
    title: string
    value: string | number
    subtitle?: string
    tone?: KpiTone
    icon?: Component
    loading?: boolean
    ariaLabel?: string
    /** Vuelve la tarjeta un filtro rápido: cursor, foco por teclado, click/Enter/Espacio emiten `click`. */
    clickable?: boolean
    /** Filtro de esta tarjeta actualmente aplicado — resalta el borde/fondo y muestra el badge. */
    active?: boolean
    badgeActiveText?: string
  }>(),
  {
    subtitle: '',
    tone: 'indigo',
    icon: undefined,
    loading: false,
    ariaLabel: '',
    clickable: false,
    active: false,
    badgeActiveText: ''
  }
)

const emit = defineEmits<{ click: [] }>()

function onActivate(): void {
  if (!props.clickable) return
  emit('click')
}

const iconToneClasses = computed(() => {
  switch (props.tone) {
    case 'emerald':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
    case 'amber':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    case 'rose':
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
    case 'blue':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
    case 'neutral':
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    case 'indigo':
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
  }
})

// Clases de resaltado cuando la tarjeta ES el filtro activo, una por tono — solo emerald/amber
// tienen precedente visual en este módulo (KPI de pendientes/diferencia), el resto cae a un
// resaltado indigo genérico para no dejar un estado "activo" sin ningún feedback visual.
const activeToneClasses = computed(() => {
  switch (props.tone) {
    case 'emerald':
      return 'ring-2 ring-emerald-500/70 bg-emerald-500/10 border-emerald-500/50 shadow-emerald-950/40'
    case 'amber':
      return 'ring-2 ring-amber-500/70 bg-amber-500/10 border-amber-500/50 shadow-amber-950/40'
    case 'rose':
      return 'ring-2 ring-rose-500/70 bg-rose-500/10 border-rose-500/50 shadow-rose-950/40'
    case 'blue':
      return 'ring-2 ring-blue-500/70 bg-blue-500/10 border-blue-500/50 shadow-blue-950/40'
    case 'neutral':
      return 'ring-2 ring-gray-400/70 bg-gray-400/10 border-gray-400/50'
    case 'indigo':
    default:
      return 'ring-2 ring-indigo-500/70 bg-indigo-500/10 border-indigo-500/50 shadow-indigo-950/40'
  }
})

const activeBadgeClasses = computed(() => {
  switch (props.tone) {
    case 'emerald':
      return 'border-emerald-400/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
    case 'amber':
      return 'border-amber-400/60 bg-amber-500/15 text-amber-700 dark:text-amber-300'
    default:
      return 'border-indigo-400/60 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
  }
})

const cardStateClasses = computed(() => [
  props.clickable
    ? 'cursor-pointer transition-all duration-200 hover:scale-[1.015] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
    : '',
  props.active ? activeToneClasses.value : ''
])
</script>
