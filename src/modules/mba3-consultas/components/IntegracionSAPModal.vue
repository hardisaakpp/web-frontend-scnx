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
            <DialogPanel class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto">
              <!-- Header -->
              <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg 
                  v-if="estadoGeneral === 'success'" 
                  class="w-6 h-6 text-green-600 dark:text-green-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg 
                  v-else-if="estadoGeneral === 'partial'" 
                  class="w-6 h-6 text-yellow-600 dark:text-yellow-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <svg 
                  v-else 
                  class="w-6 h-6 text-red-600 dark:text-red-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ tituloModal }}
              </DialogTitle>

              <div v-if="detalle" class="space-y-6">
                <!-- Sección 1: Orden de Compra (OC) -->
                <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Orden de Compra (OC)
                  </h3>
                  
                  <div v-if="detalle.success" class="space-y-2">
                    <div class="flex items-center gap-2 text-sm">
                      <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="font-medium text-gray-900 dark:text-white">
                        OC #{{ detalle.doc_num }} enviada exitosamente
                      </span>
                    </div>
                    <div v-if="detalle.doc_entry" class="text-xs text-gray-600 dark:text-gray-400 ml-7">
                      DocEntry: {{ detalle.doc_entry }}
                    </div>
                    <div v-if="detalle.message" class="text-xs text-gray-600 dark:text-gray-400 ml-7">
                      {{ detalle.message }}
                    </div>
                  </div>
                  
                  <div v-else class="space-y-2">
                    <div class="flex items-center gap-2 text-sm">
                      <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span class="font-medium text-red-900 dark:text-red-200">
                        Error al enviar OC
                      </span>
                    </div>
                    <div class="text-sm text-red-800 dark:text-red-300 ml-7">
                      {{ detalle.error || detalle.error_message || 'Error desconocido' }}
                    </div>
                    <div v-if="detalle.error_code" class="text-xs text-gray-600 dark:text-gray-400 ml-7">
                      Código de error: {{ detalle.error_code }}
                    </div>
                    <div v-if="detalle.error_source" class="text-xs text-gray-600 dark:text-gray-400 ml-7">
                      Origen: {{ detalle.error_source }}
                    </div>
                  </div>
                </div>

                <!-- Sección 2: Solicitudes de Transferencia (ITR) -->
                <div v-if="solicitudesTransferencia" class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Solicitudes de Transferencia (ITR)
                  </h3>
                  
                  <!-- Resumen -->
                  <div class="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-2 text-sm">
                      <span v-if="solicitudesTransferencia.transferencias_errores === 0" class="text-green-600 dark:text-green-400 font-medium">
                        ✅ {{ solicitudesTransferencia.transferencias_creadas }} de {{ solicitudesTransferencia.total_tiendas }} creadas exitosamente
                      </span>
                      <span v-else class="text-yellow-600 dark:text-yellow-400 font-medium">
                        ⚠️ {{ solicitudesTransferencia.transferencias_creadas }} exitosas, {{ solicitudesTransferencia.transferencias_errores }} con errores
                      </span>
                    </div>
                  </div>

                  <!-- Caso especial: Sin Solicitudes de Transferencia -->
                  <div v-if="solicitudesTransferencia.total_tiendas === 0 && solicitudesTransferencia.transferencias_creadas === 0" class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                      <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        OC enviada exitosamente, pero no se generaron Solicitudes de Transferencia (no aplicable para este pedido)
                      </span>
                    </div>
                  </div>

                  <!-- Lista de Tiendas -->
                  <div v-else-if="solicitudesTransferencia.resultados && solicitudesTransferencia.resultados.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
                    <div
                      v-for="(resultado, index) in solicitudesTransferencia.resultados"
                      :key="`${resultado.tienda_id}-${index}`"
                      class="p-3 rounded-lg border"
                      :class="resultado.success 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'"
                    >
                      <div class="flex items-start gap-2">
                        <svg 
                          v-if="resultado.success"
                          class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <svg 
                          v-else
                          class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 flex-wrap">
                            <span class="font-medium text-gray-900 dark:text-white">
                              {{ resultado.tienda_codigo }}
                            </span>
                            <span v-if="resultado.tienda_nombre" class="text-sm text-gray-600 dark:text-gray-400">
                              - {{ resultado.tienda_nombre }}
                            </span>
                          </div>
                          
                          <div v-if="resultado.success" class="mt-1 space-y-1">
                            <div class="text-sm text-gray-700 dark:text-gray-300">
                              ITR #{{ resultado.doc_num }}
                            </div>
                            <div v-if="resultado.doc_entry" class="text-xs text-gray-600 dark:text-gray-400">
                              DocEntry: {{ resultado.doc_entry }}
                            </div>
                          </div>
                          
                          <div v-else-if="resultado.error" class="mt-1 text-sm text-red-800 dark:text-red-300">
                            {{ resultado.error }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer con botón de cerrar -->
              <div class="mt-6 flex justify-end">
                <button
                  @click="handleClose"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Cerrar
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
import { computed } from '@vue/reactivity'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import type { IntegracionSAPDetalle, SolicitudesTransferencia } from '../types'

const props = defineProps<{
  isOpen: boolean
  detalle: IntegracionSAPDetalle | null
  solicitudesTransferencia: SolicitudesTransferencia | null
  estadoGeneral?: 'success' | 'partial' | 'error'
}>()

const emit = defineEmits<{
  close: []
}>()

// Determinar título del modal según el estado
const tituloModal = computed(() => {
  if (props.estadoGeneral === 'success' && props.detalle?.success) {
    return '✅ Integración con SAP Completada'
  } else if (props.estadoGeneral === 'partial') {
    return '⚠️ Integración con SAP - Resultados Parciales'
  } else {
    return '❌ Error en Integración con SAP'
  }
})

function handleClose() {
  emit('close')
}
</script>
