<template>
  <div class="flex items-center gap-2" :data-column-selector-id="selectorId">
    <button
      type="button"
      @click="emit('toggle-open')"
      class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
    >
      <slot name="icon">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </slot>
      Columnas
      <span v-if="visibleCount < columns.length" class="ml-1 px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full">
        {{ visibleCount }}
      </span>
    </button>
  </div>

  <!-- Selector de Columnas -->
  <div
    v-if="isOpen"
    :data-column-selector-id="selectorId"
    class="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-300"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200 transition-colors duration-300">Seleccionar Columnas</h3>
      <div class="flex items-center gap-2">
        <button type="button" @click="emit('select-all')" class="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
          Mostrar todas
        </button>
        <span class="text-gray-300">|</span>
        <button type="button" @click="emit('reset')" class="text-xs text-gray-600 hover:text-gray-700 font-medium">
          Restaurar predeterminadas
        </button>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <label
        v-for="column in columns"
        :key="column.key"
        class="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-600 transition-colors cursor-pointer"
      >
        <input
          type="checkbox"
          :checked="column.visible"
          @change="emit('toggle-column', column.key)"
          class="w-4 h-4 text-emerald-600 border-gray-300 dark:border-gray-600 rounded focus:ring-emerald-500"
        />
        <span class="text-sm text-gray-700 dark:text-gray-200 transition-colors duration-300">{{ column.label }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from '@vue/reactivity'
import type { ColumnVisibilityOption } from '../composables/useColumnVisibilityToggle'

const props = defineProps<{
  columns: ColumnVisibilityOption[]
  isOpen: boolean
  /** `selectorId` devuelto por useColumnVisibilityToggle(); habilita el cierre al click-outside. */
  selectorId: string
}>()

const emit = defineEmits<{
  'toggle-open': []
  'toggle-column': [key: string]
  'select-all': []
  'reset': []
}>()

const visibleCount = computed(() => props.columns.filter(c => c.visible).length)
</script>
