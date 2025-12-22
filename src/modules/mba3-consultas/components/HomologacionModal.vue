<template>
  <TransitionRoot :show="isOpen" as="template">
    <Dialog as="div" class="relative z-50" @close="close">
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
            <DialogPanel class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto">
              <DialogTitle class="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Editar Homologación de SKU
              </DialogTitle>

              <div v-if="homologacion" class="space-y-6">
                <!-- Información de MBA3 (solo lectura) -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 class="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Información MBA3 (Solo lectura)
                  </h3>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-blue-700 mb-1">SKU MBA3</label>
                      <div class="text-sm font-mono text-blue-900 bg-white px-3 py-2 rounded border border-blue-200">
                        {{ homologacion.sku_mba3 }}
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-blue-700 mb-1">Nombre Producto</label>
                      <div class="text-sm text-blue-900 bg-white px-3 py-2 rounded border border-blue-200">
                        {{ homologacion.nombre_producto_mba3 }}
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-blue-700 mb-1">Precio Unitario</label>
                      <div class="text-sm text-blue-900 bg-white px-3 py-2 rounded border border-blue-200">
                        {{ formatCurrency(homologacion.precio_unitario_mba3) }}
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-blue-700 mb-1">Cantidad Docena</label>
                      <div class="text-sm text-blue-900 bg-white px-3 py-2 rounded border border-blue-200">
                        {{ homologacion.cantidad_docena_mba3 }}
                      </div>
                    </div>
                    <div class="col-span-2">
                      <label class="block text-xs font-medium text-blue-700 mb-1">Total Línea</label>
                      <div class="text-sm font-semibold text-blue-900 bg-white px-3 py-2 rounded border border-blue-200">
                        {{ formatCurrency(homologacion.total_linea_mba3) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Información de SAP (editable) -->
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 class="text-sm font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Información SAP (Editable)
                  </h3>
                  <form @submit.prevent="handleSubmit" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">SKU SAP</label>
                        <input
                          v-model="form.sku_sap"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="Ingrese SKU SAP"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Nombre Producto SAP</label>
                        <input
                          v-model="form.nombre_producto_sap"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="Ingrese nombre producto SAP"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Precio Unitario SAP</label>
                        <input
                          v-model.number="form.precio_unitario_sap"
                          type="number"
                          step="0.01"
                          min="0"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Cantidad Pack SAP</label>
                        <input
                          v-model.number="form.cantidad_pack_sap"
                          type="number"
                          step="0.01"
                          min="0"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Unidad SAP</label>
                        <input
                          v-model="form.unidad_sap"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="Ej: UN, PC, etc."
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Subtotal SAP</label>
                        <input
                          v-model.number="form.subtotal_sap"
                          type="number"
                          step="0.01"
                          min="0"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                        <select
                          v-model="form.estado"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        >
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="HOMOLOGADO">Homologado</option>
                          <option value="ERROR">Error</option>
                        </select>
                      </div>
                    </div>

                    <!-- Botones de acción -->
                    <div class="flex gap-3 pt-4 border-t border-green-200">
                      <button
                        type="button"
                        @click="close"
                        class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        @click="limpiarCamposSAP"
                        class="px-4 py-2 border border-orange-300 rounded-lg text-orange-700 hover:bg-orange-50 transition-colors text-sm font-medium"
                      >
                        Limpiar SAP
                      </button>
                      <button
                        type="submit"
                        :disabled="loading"
                        class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
                      </button>
                    </div>
                  </form>
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
import { ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle, TransitionRoot, TransitionChild } from '@headlessui/vue'
import type { SkuHomologacion, SkuHomologacionUpdateRequest } from '../types'

interface Props {
  isOpen: boolean
  homologacion: SkuHomologacion | null
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: SkuHomologacionUpdateRequest): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref<SkuHomologacionUpdateRequest>({
  sku_sap: null,
  nombre_producto_sap: null,
  precio_unitario_sap: null,
  cantidad_pack_sap: null,
  unidad_sap: null,
  subtotal_sap: null,
  estado: 'PENDIENTE',
})

watch(() => props.homologacion, (newHomologacion) => {
  if (newHomologacion) {
    form.value = {
      sku_sap: newHomologacion.sku_sap || null,
      nombre_producto_sap: newHomologacion.nombre_producto_sap || null,
      precio_unitario_sap: newHomologacion.precio_unitario_sap || null,
      cantidad_pack_sap: newHomologacion.cantidad_pack_sap || null,
      unidad_sap: newHomologacion.unidad_sap || null,
      subtotal_sap: newHomologacion.subtotal_sap || null,
      estado: newHomologacion.estado || 'PENDIENTE',
    }
  } else {
    form.value = {
      sku_sap: null,
      nombre_producto_sap: null,
      precio_unitario_sap: null,
      cantidad_pack_sap: null,
      unidad_sap: null,
      subtotal_sap: null,
      estado: 'PENDIENTE',
    }
  }
}, { immediate: true })

function close() {
  emit('close')
}

function handleSubmit() {
  // Convertir strings vacíos a null
  const cleanedData: SkuHomologacionUpdateRequest = {
    sku_sap: form.value.sku_sap === '' ? null : form.value.sku_sap,
    nombre_producto_sap: form.value.nombre_producto_sap === '' ? null : form.value.nombre_producto_sap,
    precio_unitario_sap: form.value.precio_unitario_sap === null || form.value.precio_unitario_sap === undefined ? null : form.value.precio_unitario_sap,
    cantidad_pack_sap: form.value.cantidad_pack_sap === null || form.value.cantidad_pack_sap === undefined ? null : form.value.cantidad_pack_sap,
    unidad_sap: form.value.unidad_sap === '' ? null : form.value.unidad_sap,
    subtotal_sap: form.value.subtotal_sap === null || form.value.subtotal_sap === undefined ? null : form.value.subtotal_sap,
    estado: form.value.estado,
  }
  
  emit('submit', cleanedData)
}

function limpiarCamposSAP() {
  form.value = {
    ...form.value,
    sku_sap: null,
    nombre_producto_sap: null,
    precio_unitario_sap: null,
    cantidad_pack_sap: null,
    unidad_sap: null,
    subtotal_sap: null,
  }
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value)
}
</script>








