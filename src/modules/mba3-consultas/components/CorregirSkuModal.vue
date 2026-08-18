<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      @click.self="$emit('close')"
    >
      <!-- Overlay -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity" @click.self="$emit('close')"></div>

      <!-- Modal -->
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 dark:text-gray-100 shadow-xl transition-all w-full max-w-5xl max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 flex-shrink-0">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Corregir SKU - ODC {{ odc?.oc_id?.substring(0, 8) }}...
              </h3>
              <button
                @click="$emit('close')"
                class="text-white hover:text-gray-200 transition-colors"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-4 overflow-y-auto flex-1">
            <!-- Información de la ODC -->
            <div class="mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3">Información de la Orden de Compra</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Proveedor:</span>
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ odc?.proveedor || '-' }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Fecha:</span>
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ formatDateTime(odc?.fecha_generacion) }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Error:</span>
                  <p class="font-medium text-red-600">{{ odc?.error_code || '-' }}</p>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Fuente:</span>
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ odc?.error_source || '-' }}</p>
                </div>
              </div>
              <div v-if="odc?.error_message" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span class="text-gray-500 dark:text-gray-400 text-sm">Mensaje de error:</span>
                <p class="text-sm text-gray-900 dark:text-gray-100 mt-1">{{ odc.error_message }}</p>
              </div>
            </div>

            <!-- Detalles de la ODC -->
            <div v-if="detallesOC.length > 0" class="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3">Detalles de la ODC</h4>
              <div v-if="detallesOC.length === 1" class="text-sm">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span class="text-gray-600 dark:text-gray-300">SKU SAP:</span>
                    <p class="font-mono font-medium text-gray-900 dark:text-gray-100">{{ detallesOC[0].sku_sap || '-' }}</p>
                  </div>
                  <div>
                    <span class="text-gray-600 dark:text-gray-300">Cantidad:</span>
                    <p class="font-medium text-gray-900 dark:text-gray-100">{{ detallesOC[0].cantidad_sap }} {{ detallesOC[0].unidad_sap }}</p>
                  </div>
                  <div>
                    <span class="text-gray-600 dark:text-gray-300">Precio Unit:</span>
                    <p class="font-medium text-gray-900 dark:text-gray-100">${{ detallesOC[0].precio_unitario?.toFixed(2) || '0.00' }}</p>
                  </div>
                  <div>
                    <span class="text-gray-600 dark:text-gray-300">Total:</span>
                    <p class="font-medium text-gray-900 dark:text-gray-100">${{ detallesOC[0].total_linea?.toFixed(2) || '0.00' }}</p>
                  </div>
                </div>
              </div>
              <div v-else>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecciona el detalle a corregir:
                </label>
                <select
                  v-model="detalleSeleccionado"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100"
                >
                  <option :value="null">Selecciona un detalle...</option>
                  <option
                    v-for="detalle in detallesOC"
                    :key="detalle.oc_detalle_id"
                    :value="detalle"
                  >
                    SKU: {{ detalle.sku_sap }} - Cantidad: {{ detalle.cantidad_sap }} {{ detalle.unidad_sap }} - Total: ${{ detalle.total_linea?.toFixed(2) }}
                  </option>
                </select>
              </div>
            </div>

            <!-- SKU Problemático -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SKU que causó el error (MBA3)
              </label>
              <div class="flex gap-2">
                <input
                  v-model="skuProblematico"
                  type="text"
                  placeholder="Ingrese el SKU de MBA3 que causó el error"
                  class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                  :disabled="buscandoSugerencias"
                />
                <button
                  @click="buscarSugerencias"
                  :disabled="!skuProblematico.trim() || buscandoSugerencias"
                  class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg v-if="buscandoSugerencias" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {{ buscandoSugerencias ? 'Buscando...' : 'Buscar Sugerencias' }}
                </button>
              </div>
            </div>

            <!-- Información del SKU en MBA3 -->
            <div v-if="infoSkuMba3" class="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 class="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Información del SKU en MBA3
              </h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="text-gray-600 dark:text-gray-300">Código:</span>
                  <p class="font-mono font-medium text-gray-900 dark:text-gray-100">{{ infoSkuMba3.codigo || '-' }}</p>
                </div>
                <div>
                  <span class="text-gray-600 dark:text-gray-300">Nombre:</span>
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ infoSkuMba3.nombre || '-' }}</p>
                </div>
                <div v-if="infoSkuMba3.corp">
                  <span class="text-gray-600 dark:text-gray-300">Corp:</span>
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ infoSkuMba3.corp }}</p>
                </div>
                <div v-if="infoSkuMba3.grupo_prenda">
                  <span class="text-gray-600 dark:text-gray-300">Grupo:</span>
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ infoSkuMba3.grupo_prenda }}</p>
                </div>
              </div>
            </div>

            <!-- Sugerencias -->
            <div v-if="buscandoSugerencias" class="text-center py-12">
              <svg class="animate-spin h-8 w-8 text-red-600 mx-auto" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-4 text-gray-500 dark:text-gray-400">Buscando sugerencias de SKU similares en SAP...</p>
            </div>

            <div v-else-if="sugerencias.length > 0" class="space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-gray-900">
                  Sugerencias de SKU en SAP ({{ sugerencias.length }})
                </h4>
                <span class="text-xs text-gray-500">Ordenadas por similitud</span>
              </div>

              <div class="space-y-3 max-h-96 overflow-y-auto">
                <div
                  v-for="(sugerencia, index) in sugerencias"
                  :key="sugerencia.codigo"
                  class="bg-white dark:bg-gray-800 rounded-lg border-2 dark:border-gray-700 p-4 transition-all cursor-pointer"
                  :class="sugerenciaSeleccionada?.codigo === sugerencia.codigo 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
                  @click="seleccionarSugerencia(sugerencia)"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <span class="font-mono font-semibold text-gray-900 dark:text-gray-100 text-lg">{{ sugerencia.codigo }}</span>
                        <span
                          :class="getScoreBadgeClass(sugerencia.score_porcentaje)"
                          class="px-2 py-1 rounded-full text-xs font-semibold"
                        >
                          {{ sugerencia.score_porcentaje.toFixed(0) }}% - {{ getScoreLabel(sugerencia.score_porcentaje) }}
                        </span>
                        <span
                          v-if="sugerencia.estado === 'inactivo'"
                          class="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        >
                          Inactivo
                        </span>
                      </div>
                      <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">{{ sugerencia.nombre }}</p>
                      <div class="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span v-if="sugerencia.pack">Pack: {{ sugerencia.pack }}</span>
                        <span v-if="sugerencia.group_code">Group Code: {{ sugerencia.group_code }}</span>
                        <span v-if="sugerencia.group_name">Grupo: {{ sugerencia.group_name }}</span>
                        <span
                          v-if="sugerencia.estado === 'activo'"
                          class="text-green-600 dark:text-green-300 font-semibold"
                        >
                          ✓ Activo
                        </span>
                      </div>
                    </div>
                    <div
                      v-if="sugerenciaSeleccionada?.codigo === sugerencia.codigo"
                      class="ml-4 flex-shrink-0"
                    >
                      <div class="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <!-- Barra de score -->
                  <div class="mb-3">
                    <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Confianza</span>
                      <span>{{ sugerencia.score_porcentaje.toFixed(1) }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        :class="getScoreBarClass(sugerencia.score_porcentaje)"
                        class="h-2 rounded-full transition-all duration-300"
                        :style="{ width: `${sugerencia.score_porcentaje}%` }"
                      ></div>
                    </div>
                  </div>

                  <!-- Motivos -->
                  <div v-if="sugerencia.motivos && sugerencia.motivos.length > 0" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      @click.stop="toggleMotivos(index)"
                      class="text-xs text-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium flex items-center gap-1 mb-2"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ver motivos ({{ sugerencia.motivos.length }})
                    </button>
                    <div v-if="motivosExpandidos[index]" class="space-y-1">
                      <div
                        v-for="(motivo, motivoIndex) in sugerencia.motivos"
                        :key="motivoIndex"
                        class="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs text-gray-600 dark:text-gray-400"
                      >
                        • {{ motivo }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="skuProblematico && !buscandoSugerencias" class="text-center py-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <svg class="w-12 h-12 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p class="text-gray-700 dark:text-gray-300 font-medium">No se encontraron sugerencias</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Intenta buscar manualmente el SKU en SAP</p>
            </div>

            <!-- Mensaje de error -->
            <div v-if="errorBusqueda" class="bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700 rounded-lg p-4">
              <div class="flex items-center gap-2 text-red-800 dark:text-red-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p class="font-medium">Error al buscar sugerencias</p>
              </div>
              <p class="text-sm text-red-700 dark:text-red-300 mt-2">{{ errorBusqueda }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
            <button
              @click="$emit('close')"
              class="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="aplicarCorreccion"
              :disabled="!sugerenciaSeleccionada || guardando || !detalleSeleccionado"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="guardando" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {{ guardando ? 'Guardando...' : 'Aplicar Corrección' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { useToast } from '@/composables/useToast'
import { formatDateTime } from '../utils/formatters'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { OrdenCompra, SugerenciaSkuSap, DetalleOC } from '../types'

const props = defineProps<{
  odc: OrdenCompra | null
}>()

const emit = defineEmits<{
  close: []
  correccionAplicada: [skuOriginal: string, skuNuevo: string]
}>()

const toast = useToast()
const skuProblematico = ref('')
const buscandoSugerencias = ref(false)
const guardando = ref(false)
const sugerencias = ref<SugerenciaSkuSap[]>([])
const sugerenciaSeleccionada = ref<SugerenciaSkuSap | null>(null)
const motivosExpandidos = ref<Record<number, boolean>>({})
const errorBusqueda = ref<string | null>(null)
const infoSkuMba3 = ref<any>(null)
const detallesOC = ref<DetalleOC[]>([])
const detalleSeleccionado = ref<DetalleOC | null>(null)
const cargandoDetalles = ref(false)

// Función para extraer SKU del mensaje de error
function extraerSkuDelError(errorMessage?: string | null, errorCode?: string | null): string {
  if (!errorMessage && !errorCode) return ''
  
  const texto = `${errorMessage || ''} ${errorCode || ''}`.toUpperCase()
  
  // Patrones comunes para encontrar SKU en mensajes de error
  const patrones = [
    /SKU[:\s]+([A-Z0-9\-_]+)/i,
    /ITEM[:\s]+([A-Z0-9\-_]+)/i,
    /ARTICULO[:\s]+([A-Z0-9\-_]+)/i,
    /CODIGO[:\s]+([A-Z0-9\-_]+)/i,
    /ITEMCODE[:\s]+([A-Z0-9\-_]+)/i,
    /"([A-Z0-9\-_]{5,})"/, // SKU entre comillas
    /'([A-Z0-9\-_]{5,})'/, // SKU entre comillas simples
  ]
  
  for (const patron of patrones) {
    const match = texto.match(patron)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return ''
}

// Cuando se abre el modal, cargar detalles y extraer SKU
watch(() => props.odc, async (odc: OrdenCompra | null) => {
  if (odc) {
    // Cargar detalles de la ODC
    await cargarDetallesOC()
    
    // Intentar extraer SKU del mensaje de error
    const skuExtraido = extraerSkuDelError(odc.error_message, odc.error_code)
    if (skuExtraido) {
      skuProblematico.value = skuExtraido
      // Auto-buscar si se encontró un SKU
      setTimeout(() => {
        buscarSugerencias()
      }, 500)
    }
  } else {
    skuProblematico.value = ''
    sugerencias.value = []
    sugerenciaSeleccionada.value = null
    infoSkuMba3.value = null
    detallesOC.value = []
    detalleSeleccionado.value = null
  }
}, { immediate: true })

// Función para cargar detalles de la ODC
async function cargarDetallesOC() {
  if (!props.odc?.oc_id) return
  
  cargandoDetalles.value = true
  try {
    const response = await mba3ConsultasService.obtenerDetallesOC(props.odc.oc_id)
    detallesOC.value = response.detalles || []
    
    // Si hay un solo detalle, seleccionarlo automáticamente
    if (detallesOC.value.length === 1) {
      detalleSeleccionado.value = detallesOC.value[0]
    }
  } catch (error: any) {
    console.error('Error al cargar detalles:', error)
    toast.warning('No se pudieron cargar los detalles', 'Los detalles de la ODC no están disponibles')
  } finally {
    cargandoDetalles.value = false
  }
}

// Función para buscar sugerencias
async function buscarSugerencias() {
  if (!skuProblematico.value.trim()) {
    toast.warning('SKU requerido', 'Por favor ingrese un SKU para buscar')
    return
  }

  buscandoSugerencias.value = true
  errorBusqueda.value = null
  sugerencias.value = []
  sugerenciaSeleccionada.value = null
  infoSkuMba3.value = null

  try {
    // Buscar información del SKU en MBA3
    const resultadoMba3 = await mba3ConsultasService.buscarSkuMba3(skuProblematico.value.trim())
    if (resultadoMba3.data) {
      infoSkuMba3.value = resultadoMba3.data
    }

    // Buscar sugerencias similares usando el nuevo endpoint
    const resultadoSugerencias = await mba3ConsultasService.buscarSugerenciasSku(skuProblematico.value.trim(), 100)
    
    if (resultadoSugerencias.status === 'success' && resultadoSugerencias.sugerencias.length > 0) {
      sugerencias.value = resultadoSugerencias.sugerencias
      toast.success('Sugerencias encontradas', `Se encontraron ${resultadoSugerencias.total_encontrados} sugerencia(s)`)
    } else {
      sugerencias.value = []
      toast.warning('Sin sugerencias', resultadoSugerencias.message || 'No se encontraron SKUs similares en SAP')
    }
  } catch (error: any) {
    console.error('Error al buscar sugerencias:', error)
    errorBusqueda.value = error.message || 'Error desconocido al buscar sugerencias'
    toast.error('Error al buscar', errorBusqueda.value ?? undefined)
  } finally {
    buscandoSugerencias.value = false
  }
}

// Función para seleccionar sugerencia
function seleccionarSugerencia(sugerencia: SugerenciaSkuSap) {
  sugerenciaSeleccionada.value = sugerenciaSeleccionada.value?.codigo === sugerencia.codigo ? null : sugerencia
}

// Función para toggle motivos
function toggleMotivos(index: number) {
  motivosExpandidos.value[index] = !motivosExpandidos.value[index]
}

// Función para aplicar corrección
async function aplicarCorreccion() {
  if (!sugerenciaSeleccionada.value || !props.odc?.oc_id) {
    return
  }

  // Si no hay detalle seleccionado y hay múltiples, pedir selección
  if (!detalleSeleccionado.value) {
    if (detallesOC.value.length === 0) {
      toast.warning('Sin detalles', 'No se encontraron detalles de la ODC. Por favor, recarga la página.')
      return
    }
    if (detallesOC.value.length > 1) {
      toast.warning('Selecciona un detalle', 'Por favor selecciona el detalle de la ODC que deseas corregir')
      return
    }
    detalleSeleccionado.value = detallesOC.value[0]
  }

  guardando.value = true

  try {
    const response = await mba3ConsultasService.actualizarSkuDetalle(
      props.odc.oc_id,
      detalleSeleccionado.value.oc_detalle_id,
      sugerenciaSeleccionada.value.codigo,
      true // validar en SAP
    )
    
    if (response.status === 'success') {
      toast.success('Corrección aplicada', `SKU actualizado de ${response.sku_anterior} a ${response.sku_nuevo}`)
      emit('correccionAplicada', response.sku_anterior, response.sku_nuevo)
      emit('close')
    } else {
      toast.error('Error al aplicar corrección', response.message || 'No se pudo actualizar el SKU')
    }
  } catch (error: any) {
    console.error('Error al aplicar corrección:', error)
    
    // Manejar errores específicos
    if (error.response?.status === 404) {
      toast.error('SKU no encontrado', 'El SKU seleccionado no existe en SAP')
    } else {
      toast.error('Error al aplicar corrección', error.message || 'No se pudo actualizar el SKU')
    }
  } finally {
    guardando.value = false
  }
}

// Funciones auxiliares
function getScoreBadgeClass(porcentaje: number): string {
  if (porcentaje >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  if (porcentaje >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
}

function getScoreLabel(porcentaje: number): string {
  if (porcentaje >= 80) return 'Alta'
  if (porcentaje >= 50) return 'Media'
  return 'Baja'
}

function getScoreBarClass(porcentaje: number): string {
  if (porcentaje >= 80) return 'bg-green-600'
  if (porcentaje >= 50) return 'bg-yellow-600'
  return 'bg-red-600'
}

</script>

