<template>
  <div class="relative" :data-column-selector-id="selectorId">
    <button
      type="button"
      @click="emit('toggle-open')"
      class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
    >
      <slot name="icon">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </slot>
      Columnas
    </button>

    <!-- Dropdown de selección de columnas -->
    <div
      v-if="isOpen"
      @click.stop
      class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3"
    >
      <div class="flex items-center justify-between mb-2 px-2">
        <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Seleccionar columnas</div>
        <div v-if="isSyncing" class="flex items-center gap-1">
          <LoadingSpinner layout="inline" size="xs" aria-label="Guardando preferencias" />
          <span class="text-xs text-indigo-600 dark:text-indigo-400">Guardando...</span>
        </div>
      </div>
      <div class="space-y-1 max-h-80 overflow-y-auto">
        <label
          v-for="column in columns"
          :key="column.key"
          :class="[
            'flex items-center gap-2 px-2 py-2 rounded transition-colors',
            column.fixed
              ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
          ]"
        >
          <input
            type="checkbox"
            :checked="column.visible"
            :disabled="column.fixed"
            @change="!column.fixed && emit('toggle-column', column.key)"
            class="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ column.label }}
            <span v-if="column.fixed" class="text-xs text-gray-500 dark:text-gray-500 ml-1">(fija)</span>
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoadingSpinner from './LoadingSpinner.vue'
import type { ColumnVisibilityOption } from '../composables/useColumnVisibilityToggle'

defineProps<{
  columns: ColumnVisibilityOption[]
  isOpen: boolean
  /** `selectorId` devuelto por useColumnVisibilityToggle(); habilita el cierre al click-outside. */
  selectorId: string
  /** Muestra el spinner "Guardando..." mientras las preferencias se sincronizan con el backend. */
  isSyncing?: boolean
}>()

const emit = defineEmits<{
  'toggle-open': []
  'toggle-column': [key: string]
}>()
</script>
