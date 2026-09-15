<script setup lang="ts">
import { useId } from 'vue'

const props = defineProps<{ page: number; totalPages: number }>()
const emit = defineEmits<(e: 'go', page: number) => void>()

// Unique per instance — a static id would break the label association if this component is ever
// rendered more than once on the same page (e.g. two lists in a combined view or a modal).
const inputId = useId()

function onPageInput(event: Event): void {
  const input = event.target as HTMLInputElement
  const parsed = Number(input.value)
  const clamped = Number.isFinite(parsed) ? Math.min(Math.max(1, Math.trunc(parsed)), props.totalPages) : props.page
  input.value = String(clamped)
  if (clamped !== props.page) emit('go', clamped)
}
</script>

<template>
  <div class="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium">
    <label :for="inputId" class="sr-only">Ir a la página</label>
    <input
      :id="inputId"
      data-testid="pagination-page-input"
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      :value="page"
      class="w-14 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
      @keydown.enter="onPageInput"
      @blur="onPageInput"
    />
    <span>/ {{ totalPages }}</span>
  </div>
</template>
