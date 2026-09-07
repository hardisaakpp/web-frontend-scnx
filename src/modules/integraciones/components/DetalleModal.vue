<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      :aria-label="titulo"
      @click.self="emit('close')"
      @keydown.esc="emit('close')"
    >
      <div class="w-full max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <div class="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ titulo }}</h3>
            <p v-if="subtitulo" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ subtitulo }}</p>
          </div>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Cerrar"
            @click="emit('close')"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <div class="px-6 py-4 overflow-y-auto space-y-4">
          <slot />
        </div>

        <div v-if="$slots.footer" class="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

defineProps<{
  open: boolean
  titulo: string
  subtitulo?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>
