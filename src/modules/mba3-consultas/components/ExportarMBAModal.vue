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
            <DialogPanel class="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
              <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar Pedido para MBA
              </DialogTitle>

              <!-- Información del pedido -->
              <div class="mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Pedido:</span>
                  <span class="font-medium text-gray-900 dark:text-white">{{ numeroPedido }}</span>
                </div>
                <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Configure los parámetros requeridos para generar el archivo de importación de MBA.
                </p>
              </div>

              <form @submit.prevent="handleSubmit" class="space-y-6">
                <!-- Campos obligatorios -->
                <div class="space-y-4">
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span class="inline-flex items-center justify-center w-5 h-5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold">*</span>
                    Campos Obligatorios
                  </h3>
                  
                  <div class="grid grid-cols-2 gap-4">
                    <!-- Código Cliente -->
                    <div>
                      <label for="codigo_cliente" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Código Cliente
                      </label>
                      <input
                        id="codigo_cliente"
                        v-model="form.codigo_cliente"
                        type="text"
                        required
                        maxlength="8"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ej: CLI0495"
                      />
                      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Código del cliente en MBA (máx. 8 caracteres)</p>
                    </div>

                    <!-- Bodega -->
                    <div>
                      <label for="bodega" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bodega
                      </label>
                      <input
                        id="bodega"
                        v-model="form.bodega"
                        type="text"
                        required
                        maxlength="5"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ej: BPT"
                      />
                      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Código de bodega en MBA (máx. 5 caracteres)</p>
                    </div>

                    <!-- Vendedor -->
                    <div>
                      <label for="vendedor" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vendedor
                      </label>
                      <input
                        id="vendedor"
                        v-model="form.vendedor"
                        type="text"
                        required
                        maxlength="5"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ej: JPC"
                      />
                      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Código del vendedor en MBA (máx. 5 caracteres)</p>
                    </div>

                    <!-- Código SubCliente -->
                    <div>
                      <label for="codigo_subcliente" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Código SubCliente
                        <span class="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
                      </label>
                      <input
                        id="codigo_subcliente"
                        v-model="form.codigo_subcliente"
                        type="text"
                        maxlength="8"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Ej: GO05"
                      />
                      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Dejar vacío si no aplica</p>
                    </div>
                  </div>
                </div>

                <!-- Campos opcionales -->
                <div class="space-y-4">
                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Configuración Adicional
                  </h3>
                  
                  <div class="grid grid-cols-2 gap-4">
                    <!-- Moneda -->
                    <div>
                      <label for="moneda" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Moneda
                      </label>
                      <select
                        id="moneda"
                        v-model="form.moneda"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="US">US - Dólar Americano</option>
                        <option value="PEN">PEN - Sol Peruano</option>
                      </select>
                    </div>

                    <!-- Número Pedido MBA -->
                    <div>
                      <label for="numero_pedido_mba" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        N° Pedido MBA
                      </label>
                      <input
                        id="numero_pedido_mba"
                        v-model.number="form.numero_pedido_mba"
                        type="number"
                        min="1"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Número temporal para agrupar líneas</p>
                    </div>
                  </div>

                  <!-- Opciones de formato -->
                  <div class="flex flex-col gap-3 mt-4">
                    <label class="flex items-center gap-3 cursor-pointer">
                      <input
                        v-model="form.consolidado"
                        type="checkbox"
                        class="w-4 h-4 text-cyan-600 border-gray-300 dark:border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <div>
                        <span class="text-sm text-gray-700 dark:text-gray-300">Consolidar por producto</span>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Genera una línea por producto (suma cantidades de todas las tiendas)</p>
                      </div>
                    </label>

                    <label class="flex items-center gap-3 cursor-pointer">
                      <input
                        v-model="form.incluir_encabezado"
                        type="checkbox"
                        class="w-4 h-4 text-cyan-600 border-gray-300 dark:border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <div>
                        <span class="text-sm text-gray-700 dark:text-gray-300">Incluir encabezado MBA</span>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Incluye las 19 líneas de encabezado del formato de importación</p>
                      </div>
                    </label>
                  </div>
                </div>

                <!-- Información del formato -->
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div class="flex items-start gap-2">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div class="text-sm text-blue-800 dark:text-blue-200">
                      <p class="font-medium mb-1">Formato de salida</p>
                      <ul class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                        <li>- Archivo .txt con 35 columnas separadas por TAB</li>
                        <li>- Formato de fechas: DD/MM/YYYY</li>
                        <li>- Compatible con la importación de "Pedidos de Clientes" de MBA</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <!-- Botones de acción -->
                <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    @click="handleClose"
                    :disabled="exportando"
                    class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    :disabled="!isFormValid || exportando"
                    class="px-6 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg v-if="exportando" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {{ exportando ? 'Exportando...' : 'Descargar Archivo' }}
                  </button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import type { ExportarMBAParams } from '../types'
import { EXPORTAR_MBA_DEFAULTS } from '../types'

const props = defineProps<{
  isOpen: boolean
  numeroPedido: string
  // Valores pre-cargados del pedido (opcionales)
  bodegaDefault?: string
  odcDefault?: string
}>()

const emit = defineEmits<{
  close: []
  exportar: [params: ExportarMBAParams]
}>()

// Estado del formulario
const form = ref<ExportarMBAParams>({
  codigo_cliente: '',
  codigo_subcliente: EXPORTAR_MBA_DEFAULTS.codigo_subcliente || '',
  moneda: EXPORTAR_MBA_DEFAULTS.moneda || 'US',
  bodega: '',
  vendedor: '',
  numero_pedido_mba: EXPORTAR_MBA_DEFAULTS.numero_pedido_mba || 1,
  consolidado: EXPORTAR_MBA_DEFAULTS.consolidado || false,
  incluir_encabezado: EXPORTAR_MBA_DEFAULTS.incluir_encabezado !== false,
})

const exportando = ref(false)

// Validación del formulario
const isFormValid = computed(() => {
  return (
    form.value.codigo_cliente.trim().length > 0 &&
    form.value.bodega.trim().length > 0 &&
    form.value.vendedor.trim().length > 0
  )
})

// Pre-cargar valores del pedido cuando se abre el modal
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Pre-cargar bodega si está disponible
    if (props.bodegaDefault) {
      form.value.bodega = props.bodegaDefault
    }
  }
})

function handleClose() {
  if (!exportando.value) {
    emit('close')
  }
}

async function handleSubmit() {
  if (!isFormValid.value || exportando.value) return
  
  exportando.value = true
  
  try {
    emit('exportar', { ...form.value })
  } finally {
    exportando.value = false
  }
}

// Exponer el estado de exportando para que el padre pueda controlarlo
defineExpose({
  setExportando: (value: boolean) => {
    exportando.value = value
  }
})
</script>
