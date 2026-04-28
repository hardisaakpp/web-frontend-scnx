<template>
  <div class="space-y-2">
    <label class="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
      <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </span>
      Almacén
    </label>
    <div class="relative">
      <select
        :value="modelValue ?? ''"
        :disabled="disabled"
        @change="onChange"
        class="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      >
        <option value="" disabled>Seleccione un almacén</option>
        <option
          v-for="warehouse in warehouses"
          :key="warehouse.code"
          :value="warehouse.code"
        >
          {{ warehouse.code }} — {{ warehouse.name }}
        </option>
      </select>
      <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { WarehouseDto } from '../types'

defineProps<{
  modelValue: string | null
  warehouses: WarehouseDto[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
}
</script>
