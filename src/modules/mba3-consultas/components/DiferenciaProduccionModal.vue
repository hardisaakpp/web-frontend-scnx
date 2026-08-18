<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="handleCancelar">
      <TransitionChild
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50" />
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
            <DialogPanel class="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
              <div class="flex flex-col gap-4">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <DialogTitle class="text-lg font-semibold text-gray-900 dark:text-white">
                      Diferencia con lo solicitado
                    </DialogTitle>
                    <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {{ detalles.length }} producto{{ detalles.length === 1 ? '' : 's' }} con una cantidad menor a lo solicitado originalmente en la plantilla Excel.
                    </p>
                  </div>
                </div>

                <div class="max-h-56 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                      <tr>
                        <th class="text-left px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Código</th>
                        <th class="text-right px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Solicitado</th>
                        <th class="text-right px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Confirmado</th>
                        <th class="text-right px-3 py-2 font-medium text-gray-500 dark:text-gray-400">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                      <tr v-for="d in detalles" :key="d.pedido_detalle_id">
                        <td class="px-3 py-2 text-gray-900 dark:text-gray-100">{{ d.codigo_interno || 'N/A' }}</td>
                        <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ d.cantidad_solicitada_original }}</td>
                        <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-300">{{ d.total_actual }}</td>
                        <td class="px-3 py-2 text-right font-medium text-amber-600 dark:text-amber-400">{{ d.diferencia }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div class="flex flex-col gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    :disabled="procesando"
                    @click="handleDiferenciaNoEntregada"
                    class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Diferencia no será entregada
                  </button>

                  <div class="flex flex-col gap-2">
                    <label class="text-sm text-gray-600 dark:text-gray-400" for="diferencia-fecha-entrega">
                      Nueva fecha de entrega para el pedido con la diferencia
                    </label>
                    <input
                      id="diferencia-fecha-entrega"
                      v-model="nuevaFechaEntrega"
                      type="date"
                      :disabled="procesando"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      :disabled="procesando || !nuevaFechaEntrega"
                      @click="handleConfirmarConDiferencia"
                      class="w-full px-4 py-2.5 bg-amber-600 dark:bg-amber-500 text-white rounded-lg hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Confirmar pedido, generar nuevo pedido con la diferencia
                    </button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, watch } from '@vue/reactivity'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import type { DetalleDiferenciaProduccion } from '../types'

const props = defineProps<{
  isOpen: boolean
  detalles: DetalleDiferenciaProduccion[]
  procesando?: boolean
}>()

const emit = defineEmits<{
  cancelar: []
  'diferencia-no-entregada': []
  'confirmar-con-diferencia': [nuevaFechaEntrega: string]
}>()

const nuevaFechaEntrega = ref('')

watch(() => props.isOpen, (open) => {
  if (!open) {
    nuevaFechaEntrega.value = ''
  }
})

function handleCancelar() {
  if (props.procesando) return
  emit('cancelar')
}

function handleDiferenciaNoEntregada() {
  emit('diferencia-no-entregada')
}

function handleConfirmarConDiferencia() {
  if (!nuevaFechaEntrega.value) return
  emit('confirmar-con-diferencia', nuevaFechaEntrega.value)
}
</script>
