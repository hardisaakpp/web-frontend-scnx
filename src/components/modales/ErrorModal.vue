<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/24/outline'

defineProps<{
  open: boolean
  title: string
  message: string
  closeLabel?: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" data-testid="error-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <ExclamationCircleIcon class="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">{{ title }}</h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ message }}</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button
            type="button"
            data-testid="error-modal-close-btn"
            class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 transition-colors shadow-sm"
            @click="emit('close')"
          >
            {{ closeLabel ?? 'Cerrar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
