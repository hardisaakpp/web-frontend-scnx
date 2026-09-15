<script setup lang="ts">
import { CheckCircleIcon } from '@heroicons/vue/24/outline'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message?: string
    closeLabel?: string
  }>(),
  { closeLabel: 'Aceptar' }
)

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" data-testid="success-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6">
        <div class="flex flex-col items-center text-center gap-4">
          <div class="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <CheckCircleIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h2>
            <p v-if="message" class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ message }}</p>
          </div>
          <button
            type="button"
            data-testid="success-modal-close-btn"
            class="w-full sm:w-auto px-6 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors font-medium"
            @click="emit('close')"
          >
            {{ closeLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
