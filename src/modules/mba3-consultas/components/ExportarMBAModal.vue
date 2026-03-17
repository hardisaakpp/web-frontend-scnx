<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="handleClose">
      <TransitionChild
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-30" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
              <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar Pedido para MBA
              </DialogTitle>

              <div class="space-y-4">
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Pedido:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ numeroPedido }}</span>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300">
                  Se generará el archivo para importar en MBA (Cliente CLI1795, moneda US).
                </p>
              </div>

              <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  @click="handleClose"
                  :disabled="exportando"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  @click="handleDescargar"
                  :disabled="exportando"
                  class="px-6 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg v-if="exportando" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {{ exportando ? 'Exportando...' : 'Descargar archivo' }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref } from '@vue/reactivity'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import type { ExportarMBAParams } from '../types'

defineProps<{
  isOpen: boolean
  numeroPedido: string
  /** No usado en modal simplificado; el backend toma bodega del pedido. Mantenido por compatibilidad. */
  bodegaDefault?: string
  /** No usado en modal simplificado. Mantenido por compatibilidad. */
  odcDefault?: string
}>()

const emit = defineEmits<{
  close: []
  exportar: [params: ExportarMBAParams]
}>()

const exportando = ref(false)

function handleClose() {
  if (!exportando.value) {
    emit('close')
  }
}

function handleDescargar() {
  if (exportando.value) return
  // Parámetros fijos: backend usa CLI1795, US y defaults (bodega desde pedido, etc.)
  emit('exportar', {
    codigo_cliente: 'CLI1795',
    moneda: 'US',
    bodega: '',
    vendedor: '',
    formato: 'txt',
  })
}

defineExpose({
  setExportando: (value: boolean) => {
    exportando.value = value
  }
})
</script>
