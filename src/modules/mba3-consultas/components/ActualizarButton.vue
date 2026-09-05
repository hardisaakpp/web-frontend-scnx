<template>
  <button
    type="button"
    @click="emit('click')"
    :disabled="loading"
    class="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
  >
    <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    <LoadingSpinner v-else layout="inline" size="md" color="current" :aria-label="ariaLabel" />
    {{ loading ? 'Cargando...' : label }}
  </button>
</template>

<script setup lang="ts">
import LoadingSpinner from './LoadingSpinner.vue'

withDefaults(defineProps<{
  loading: boolean
  label?: string
  ariaLabel?: string
}>(), {
  label: 'Actualizar',
  ariaLabel: 'Cargando pedidos'
})

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>
