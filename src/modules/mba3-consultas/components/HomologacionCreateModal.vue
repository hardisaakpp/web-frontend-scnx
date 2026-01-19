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
            <DialogPanel class="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all max-h-[90vh] overflow-y-auto">
              <DialogTitle class="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Crear Nueva Homologaciรณn de SKU
              </DialogTitle>

              <div class="space-y-6">
                <!-- Informaciรณn de MBA3 -->
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Informaciรณn MBA3
                  </h3>
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">SKU MBA3 *</label>
                      <div class="flex gap-2">
                        <input
                          v-model="skuMba3"
                          type="text"
                          class="flex-1 px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Ej: RL-CD-001"
                        />
                        <button
                          @click="buscarSkuMba3"
                          :disabled="!skuMba3.trim() || buscandoMba3"
                          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {{ buscandoMba3 ? 'Buscando...' : 'Buscar' }}
                        </button>
                      </div>
                      <p v-if="errorMba3" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errorMba3 }}</p>
                    </div>
                    <div v-if="datosMba3">
                      <label class="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Nombre Producto</label>
                      <div class="text-sm text-blue-900 dark:text-blue-100 bg-white dark:bg-gray-700 px-3 py-2 rounded border border-blue-200 dark:border-blue-600">
                        {{ datosMba3.nombre || '-' }}
                      </div>
                    </div>
                  </div>
                  <div v-if="datosMba3" class="mt-4 grid grid-cols-2 gap-4 text-xs text-blue-700 dark:text-blue-300">
                    <div v-if="datosMba3.corp">
                      <span class="font-medium">Corp:</span> {{ datosMba3.corp }}
                    </div>
                    <div v-if="datosMba3.grupo_prenda">
                      <span class="font-medium">Grupo:</span> {{ datosMba3.grupo_prenda }}
                    </div>
                    <div v-if="datosMba3.talla">
                      <span class="font-medium">Talla:</span> {{ datosMba3.talla }}
                    </div>
                    <div v-if="datosMba3.presentacion">
                      <span class="font-medium">Presentaciรณn:</span> {{ datosMba3.presentacion }}
                    </div>
                  </div>
                </div>

                <!-- Informaciรณn de SAP -->
                <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <h3 class="text-sm font-semibold text-green-900 dark:text-green-200 mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Informaciรณn SAP
                  </h3>
                  <form @submit.prevent="handleSubmit" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">SKU SAP *</label>
                        <div class="flex gap-2">
                          <input
                            v-model="form.sku_sap"
                            type="text"
                            required
                            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Ingrese SKU SAP"
                          />
                          <button
                            type="button"
                            @click="buscarSkuSap"
                            :disabled="!form.sku_sap || buscandoSap"
                            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {{ buscandoSap ? 'Buscando...' : 'Buscar' }}
                          </button>
                        </div>
                        <p v-if="errorSap" class="mt-1 text-xs text-red-600 dark:text-red-400">{{ errorSap }}</p>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre Producto SAP</label>
                        <input
                          v-model="form.nombre_producto_sap"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Ingrese nombre producto SAP"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Precio Unitario SAP</label>
                        <input
                          v-model.number="form.precio_unitario_sap"
                          type="number"
                          step="0.01"
                          min="0"
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Cantidad Pack SAP</label>
                        <input
                          v-model.number="form.cantidad_pack_sap"
                          type="number"
                          step="0.01"
                          min="0"
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Unidad SAP</label>
                        <input
                          v-model="form.unidad_sap"
                          type="text"
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Ej: UN, PC, etc."
                        />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Subtotal SAP</label>
                        <input
                          v-model.number="form.subtotal_sap"
                          type="number"
                          step="0.01"
                          min="0"
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div class="col-span-2">
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Estado</label>
                        <select
                          v-model="form.estado"
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="HOMOLOGADO">Homologado</option>
                          <option value="ERROR">Error</option>
                        </select>
                      </div>
                    </div>

                    <!-- Botones de acciรณn -->
                    <div class="flex gap-3 pt-4 border-t border-green-200 dark:border-green-700">
                      <button
                        type="button"
                        @click="close"
                        class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        @click="limpiarCampos"
                        class="px-4 py-2 border border-orange-300 dark:border-orange-600 rounded-lg text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-sm font-medium"
                      >
                        Limpiar
                      </button>
                      <button
                        type="submit"
                        :disabled="loading || !skuMba3.trim() || !form.sku_sap"
                        class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {{ loading ? 'Creando...' : 'Crear Homologaciรณn' }}
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
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { SkuHomologacionCreateRequest } from '../types'

interface Props {
  isOpen: boolean
  loading?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: SkuHomologacionCreateRequest): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()

const skuMba3 = ref('')
const datosMba3 = ref<any>(null)
const buscandoMba3 = ref(false)
const errorMba3 = ref<string | null>(null)

const buscandoSap = ref(false)
const errorSap = ref<string | null>(null)

const form = ref<Omit<SkuHomologacionCreateRequest, 'sku_mba3'>>({
  sku_sap: '',
  nombre_producto_sap: null,
  precio_unitario_sap: null,
  cantidad_pack_sap: null,
  unidad_sap: null,
  subtotal_sap: null,
  estado: 'PENDIENTE',
})

watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    // Limpiar formulario al cerrar
    resetForm()
  }
})

function resetForm() {
  skuMba3.value = ''
  datosMba3.value = null
  errorMba3.value = null
  errorSap.value = null
  form.value = {
    sku_sap: '',
    nombre_producto_sap: null,
    precio_unitario_sap: null,
    cantidad_pack_sap: null,
    unidad_sap: null,
    subtotal_sap: null,
    estado: 'PENDIENTE',
  }
}

function close() {
  emit('close')
}

async function buscarSkuMba3() {
  if (!skuMba3.value.trim()) {
    toast.warning('SKU requerido', 'Por favor ingrese un SKU MBA3')
    return
  }

  buscandoMba3.value = true
  errorMba3.value = null
  datosMba3.value = null

  try {
    const response = await mba3ConsultasService.buscarSkuMba3(skuMba3.value.trim())
    if (response.status === 'success' && response.data) {
      datosMba3.value = response.data
      toast.success('SKU encontrado', `SKU MBA3: ${response.data.codigo}`)
    } else {
      errorMba3.value = 'No se encontrรณ el SKU en MBA3'
      toast.warning('SKU no encontrado', 'No se encontrรณ el SKU en MBA3')
    }
  } catch (error: any) {
    errorMba3.value = error.message || 'Error al buscar SKU'
    toast.error('Error al buscar', errorMba3.value ?? undefined)
  } finally {
    buscandoMba3.value = false
  }
}

async function buscarSkuSap() {
  if (!form.value.sku_sap) {
    toast.warning('SKU requerido', 'Por favor ingrese un SKU SAP')
    return
  }

  buscandoSap.value = true
  errorSap.value = null

  try {
    const response = await mba3ConsultasService.buscarSkuSap(form.value.sku_sap)
    if (response.data) {
      const datos = response.data
      form.value.nombre_producto_sap = datos.nombre || null
      if (datos.pack) {
        // Intentar parsear pack si es posible
      }
      toast.success('SKU encontrado', `SKU SAP: ${datos.codigo}`)
    } else {
      errorSap.value = 'No se encontrรณ el SKU en SAP'
      toast.warning('SKU no encontrado', 'No se encontrรณ el SKU en SAP')
    }
  } catch (error: any) {
    errorSap.value = error.message || 'Error al buscar SKU'
    toast.error('Error al buscar', errorSap.value ?? undefined)
  } finally {
    buscandoSap.value = false
  }
}

function limpiarCampos() {
  form.value = {
    ...form.value,
    nombre_producto_sap: null,
    precio_unitario_sap: null,
    cantidad_pack_sap: null,
    unidad_sap: null,
    subtotal_sap: null,
  }
}

function handleSubmit() {
  if (!skuMba3.value.trim() || !form.value.sku_sap) {
    toast.warning('Campos requeridos', 'SKU MBA3 y SKU SAP son requeridos')
    return
  }

  // Convertir strings vacรญos a null
  const cleanedData: SkuHomologacionCreateRequest = {
    sku_mba3: skuMba3.value.trim(),
    sku_sap: form.value.sku_sap,
    nombre_producto_sap: form.value.nombre_producto_sap === '' ? null : form.value.nombre_producto_sap,
    precio_unitario_sap: form.value.precio_unitario_sap === null || form.value.precio_unitario_sap === undefined ? null : form.value.precio_unitario_sap,
    cantidad_pack_sap: form.value.cantidad_pack_sap === null || form.value.cantidad_pack_sap === undefined ? null : form.value.cantidad_pack_sap,
    unidad_sap: form.value.unidad_sap === '' ? null : form.value.unidad_sap,
    subtotal_sap: form.value.subtotal_sap === null || form.value.subtotal_sap === undefined ? null : form.value.subtotal_sap,
    estado: form.value.estado,
  }

  emit('submit', cleanedData)
}
</script>
