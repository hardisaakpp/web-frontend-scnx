<script setup lang="ts">
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Acción irreversible (eliminar): icono y botón de confirmar en rojo en vez de verde. */
  destructive?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" data-testid="confirm-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('cancel')"></div>
      <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md p-6">
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            :class="destructive ? 'bg-red-50 dark:bg-red-900/30' : 'bg-amber-50 dark:bg-amber-900/30'"
          >
            <ExclamationTriangleIcon class="w-5 h-5" :class="destructive ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">{{ title }}</h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ message }}</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            data-testid="confirm-modal-cancel-btn"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors shadow-sm"
            @click="emit('cancel')"
          >
            {{ cancelLabel ?? 'Cancelar' }}
          </button>
          <button
            type="button"
            data-testid="confirm-modal-confirm-btn"
            :class="destructive
              ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
              : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'"
            class="px-4 py-2 text-sm font-medium border rounded-lg transition-colors shadow-sm"
            @click="emit('confirm')"
          >
            {{ confirmLabel ?? 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
