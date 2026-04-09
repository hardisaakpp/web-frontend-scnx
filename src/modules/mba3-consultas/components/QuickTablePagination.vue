<template>
  <div
    v-if="totalPages > 1"
    class="flex flex-wrap items-center gap-1.5 sm:gap-2"
    role="navigation"
    :aria-label="ariaLabel"
  >
    <button
      type="button"
      title="Primera página"
      :disabled="disabled || modelValue === 1"
      class="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm"
      @click="goToPage(1)"
    >
      «
    </button>
    <button
      type="button"
      title="Página anterior"
      :disabled="disabled || modelValue === 1"
      class="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm"
      @click="goToPage(modelValue - 1)"
    >
      ‹
    </button>

    <div class="flex flex-wrap items-center gap-1 max-w-[min(100%,28rem)]">
      <template v-for="(item, idx) in paginationRange" :key="'qp-' + idx + '-' + String(item)">
        <span
          v-if="item === 'ellipsis'"
          class="px-1.5 py-1 text-sm text-gray-400 dark:text-gray-500 select-none"
          aria-hidden="true"
        >…</span>
        <button
          v-else
          type="button"
          :title="'Ir a página ' + item"
          :disabled="disabled"
          class="min-w-[2.25rem] px-2 py-2 text-sm font-medium rounded-lg border transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          :class="
            item === modelValue
              ? 'border-blue-600 bg-blue-600 text-white dark:bg-blue-600 dark:border-blue-500'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600'
          "
          @click="goToPage(item)"
        >
          {{ item }}
        </button>
      </template>
    </div>

    <button
      type="button"
      title="Página siguiente"
      :disabled="disabled || modelValue >= totalPages"
      class="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm"
      @click="goToPage(modelValue + 1)"
    >
      ›
    </button>
    <button
      type="button"
      title="Última página"
      :disabled="disabled || modelValue >= totalPages"
      class="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm"
      @click="goToPage(totalPages)"
    >
      »
    </button>

    <Popover v-if="showJumpLink" v-slot="{ close }" class="relative inline-block">
      <PopoverButton
        type="button"
        title="Ir a un número de página (opcional)"
        :disabled="disabled"
        class="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-transparent rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        @click="jumpPageDraft = modelValue"
      >
        <span class="hidden sm:inline">Otra página</span>
        <span class="sm:hidden">#</span>
      </PopoverButton>
      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
      >
        <PopoverPanel
          class="absolute right-0 bottom-full z-30 mb-2 w-[min(100vw-2rem,16rem)] origin-bottom-right rounded-xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5 dark:ring-white/10 border border-gray-200 dark:border-gray-600 focus:outline-none p-3"
        >
          <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Número de página</p>
          <div class="flex gap-2 items-center">
            <input
              v-model.number="jumpPageDraft"
              type="number"
              :min="1"
              :max="totalPages"
              class="min-w-0 flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              @keydown.enter.prevent="applyJump(close)"
            />
            <button
              type="button"
              class="shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 transition-colors"
              @click="applyJump(close)"
            >
              Ir
            </button>
          </div>
          <p class="mt-2 text-[10px] text-gray-400 dark:text-gray-500">Solo si necesitas un número que no está en los botones (1–{{ totalPages }})</p>
        </PopoverPanel>
      </transition>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'

const props = withDefaults(
  defineProps<{
    /** Página actual (1-based). */
    modelValue: number
    totalPages: number
    disabled?: boolean
    ariaLabel?: string
    /** Panel “Otra página” con input numérico. */
    showJumpLink?: boolean
  }>(),
  {
    disabled: false,
    ariaLabel: 'Paginación',
    showJumpLink: true,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const jumpPageDraft = ref(1)

watch(
  () => props.modelValue,
  (v) => {
    jumpPageDraft.value = v
  },
  { immediate: true }
)

const paginationRange = computed((): (number | 'ellipsis')[] => {
  const total = props.totalPages
  const current = props.modelValue
  if (total <= 1) return []
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const pages = new Set<number>()
  pages.add(1)
  pages.add(total)
  for (let i = current - 2; i <= current + 2; i++) {
    if (i >= 1 && i <= total) pages.add(i)
  }
  const sorted = [...pages].sort((a, b) => a - b)
  const result: (number | 'ellipsis')[] = []
  for (let i = 0; i < sorted.length; i++) {
    const n = sorted[i]
    if (i > 0 && n - sorted[i - 1]! > 1) {
      result.push('ellipsis')
    }
    result.push(n)
  }
  return result
})

function goToPage(page: number) {
  const max = props.totalPages
  if (max < 1 || props.disabled) return
  emit('update:modelValue', Math.min(max, Math.max(1, Math.round(page))))
}

function applyJump(close: () => void) {
  if (props.totalPages < 1) {
    close()
    return
  }
  let n = Math.round(Number(jumpPageDraft.value))
  if (Number.isNaN(n)) {
    n = props.modelValue
  }
  goToPage(n)
  jumpPageDraft.value = props.modelValue
  close()
}
</script>
