<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header con botones de acción -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Detalle del Pedido</h1>
          <p class="mt-1 text-sm text-gray-500" v-if="pedido?.cabecera.numero_pedido">
            Número de pedido: {{ pedido.cabecera.numero_pedido }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            @click="goBack"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Volver
          </button>
          <button
            v-if="canExportForProvider"
            @click="handleExportForProvider"
            :disabled="loading"
            class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar para Proveedor
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading && !pedido" class="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-sm text-gray-600">Cargando pedido...</p>
      </div>

      <!-- Error state -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-red-900">Error al cargar el pedido</p>
            <p class="text-sm text-red-800 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Contenido del pedido -->
      <div v-if="pedido && !loading">
        <!-- Información de la cabecera -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Información del Pedido</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase">Número de Pedido</label>
              <p class="mt-1 text-sm text-gray-900">{{ pedido.cabecera.numero_pedido || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase">Fecha de Pedido</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(pedido.cabecera.fecha_pedido) }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase">Fecha de Entrega</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(pedido.cabecera.fecha_entrega) }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase">Proveedor</label>
              <p class="mt-1 text-sm text-gray-900">{{ pedido.cabecera.proveedor_nombre || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase">Comprador</label>
              <p class="mt-1 text-sm text-gray-900">{{ pedido.cabecera.comprador_nombre || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase">Forma de Pago</label>
              <p class="mt-1 text-sm text-gray-900">{{ pedido.cabecera.forma_pago || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <!-- Sección de Respuesta del Proveedor -->
        <div v-if="pedido.respuesta_proveedor" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Respuesta del Proveedor</h2>
            <span class="px-3 py-1 text-xs font-medium rounded-full" :class="getEstadoBadgeClass(pedido.respuesta_proveedor.cabecera.estado)">
              {{ pedido.respuesta_proveedor.cabecera.estado }}
            </span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase">Versión</label>
              <p class="mt-1 text-sm text-gray-900">{{ pedido.respuesta_proveedor.cabecera.version }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase">Fecha de Respuesta</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(pedido.respuesta_proveedor.cabecera.fecha_respuesta) }}</p>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 uppercase">Creado por</label>
              <p class="mt-1 text-sm text-gray-900">{{ pedido.respuesta_proveedor.cabecera.creado_por }}</p>
            </div>
          </div>

          <!-- Tabla comparativa: Solicitado vs Confirmado -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitado</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Confirmado</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Original</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Ajustado</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="detalle in pedido.respuesta_proveedor.detalles" :key="detalle.codigo_producto">
                  <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">{{ detalle.codigo_producto }}</div>
                    <div class="text-xs text-gray-500">{{ detalle.descripcion }}</div>
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {{ formatNumber(detalle.cantidad_solicitada_total) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm" :class="getCantidadClass(detalle.cantidad_solicitada_total, detalle.cantidad_confirmada_total)">
                    {{ formatNumber(detalle.cantidad_confirmada_total) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {{ formatCurrency(detalle.costo_doc_sin_iva_original) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm" :class="getPrecioClass(detalle.costo_doc_sin_iva_original, detalle.costo_doc_sin_iva_ajustado)">
                    {{ formatCurrency(detalle.costo_doc_sin_iva_ajustado) }}
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-500">
                    {{ detalle.observaciones || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sección para cargar respuesta del proveedor -->
        <div v-if="canUploadResponse" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Cargar Respuesta del Proveedor</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Selecciona el archivo Excel con la respuesta del proveedor
              </label>
              <input
                ref="fileInput"
                type="file"
                @change="handleFileSelect"
                accept=".xlsx,.xls"
                class="hidden"
                :disabled="uploading"
              />
              <div
                @click="triggerFileInput"
                class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors"
              >
                <svg class="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="text-sm text-gray-600">
                  <span v-if="!selectedFile">Haz clic para seleccionar archivo</span>
                  <span v-else class="font-medium text-indigo-600">{{ selectedFile.name }}</span>
                </p>
                <p class="text-xs text-gray-500 mt-1">Formatos: XLSX, XLS (máx. 10 MB)</p>
              </div>
            </div>

            <div v-if="selectedFile" class="flex items-center gap-3">
              <button
                @click="handleUploadResponse"
                :disabled="uploading"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <svg v-if="!uploading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <svg v-else class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ uploading ? 'Cargando...' : 'Cargar Respuesta' }}
              </button>
              <button
                @click="clearFile"
                :disabled="uploading"
                class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Cancelar
              </button>
            </div>

            <!-- Resultado de la carga -->
            <div v-if="uploadResult" class="mt-4">
              <div v-if="uploadResult.status === 'success'" class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <svg class="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-green-900">{{ uploadResult.message }}</p>
                    <p class="text-xs text-green-700 mt-1">
                      Cantidades guardadas: {{ uploadResult.cantidades_guardadas }}, 
                      Precios guardados: {{ uploadResult.precios_guardados }}
                    </p>
                  </div>
                </div>
              </div>
              <div v-else class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex items-start gap-3">
                  <svg class="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm font-semibold text-yellow-900">{{ uploadResult.message }}</p>
                    <div v-if="uploadResult.validacion && (uploadResult.validacion.errores.length > 0 || uploadResult.validacion.warnings.length > 0)" class="mt-2 space-y-2">
                      <div v-if="uploadResult.validacion.errores.length > 0">
                        <p class="text-xs font-medium text-red-700">Errores:</p>
                        <ul class="list-disc list-inside text-xs text-red-600 mt-1">
                          <li v-for="(error, idx) in uploadResult.validacion.errores" :key="idx">
                            {{ error.mensaje }} <span v-if="error.producto">({{ error.producto }})</span>
                          </li>
                        </ul>
                      </div>
                      <div v-if="uploadResult.validacion.warnings.length > 0">
                        <p class="text-xs font-medium text-yellow-700">Advertencias:</p>
                        <ul class="list-disc list-inside text-xs text-yellow-600 mt-1">
                          <li v-for="(warning, idx) in uploadResult.validacion.warnings" :key="idx">
                            {{ warning.mensaje }} <span v-if="warning.producto">({{ warning.producto }})</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="uploadError" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-red-900">Error al cargar respuesta</p>
                  <p class="text-sm text-red-800 mt-1">{{ uploadError }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detalles del pedido (tabla de productos) -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Productos del Pedido</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Total</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Unit.</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="detalle in pedido.detalles" :key="detalle.pedido_detalle_id">
                  <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ detalle.codigo_interno || 'N/A' }}
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-900">
                    {{ detalle.descripcion_sap || 'N/A' }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ detalle.marca || 'N/A' }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {{ formatNumber(getTotalCantidad(detalle.tiendas)) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {{ formatCurrency(detalle.costo_doc_sin_iva) }}
                  </td>
                  <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                    {{ formatCurrency(detalle.total) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { PedidoCompleto, CargarRespuestaProveedorResponse } from '../types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const pedido = ref<PedidoCompleto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadResult = ref<CargarRespuestaProveedorResponse | null>(null)
const uploadError = ref<string | null>(null)

const pedidoId = computed(() => route.params.id as string)

const canExportForProvider = computed(() => {
  // Permitir exportar si no hay respuesta aún o si el estado lo permite
  return !pedido.value?.respuesta_proveedor
})

const canUploadResponse = computed(() => {
  // Permitir cargar respuesta si no existe o si el estado permite actualización
  return !pedido.value?.respuesta_proveedor || 
         pedido.value?.respuesta_proveedor?.cabecera.estado === 'PENDIENTE_REVISION'
})

async function loadPedido() {
  loading.value = true
  error.value = null
  
  try {
    // Cargar pedido con respuesta si existe
    pedido.value = await mba3ConsultasService.getPedido(pedidoId.value, true)
  } catch (e: any) {
    error.value = e.message || 'Error al cargar el pedido'
    toast.error('Error', error.value)
  } finally {
    loading.value = false
  }
}

async function handleExportForProvider() {
  if (!pedido.value) return
  
  try {
    const blob = await mba3ConsultasService.exportarPedidoParaProveedor(pedidoId.value)
    
    // Crear URL del blob y descargar
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Pedido_${pedido.value.cabecera.numero_pedido || pedidoId.value}_Proveedor.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('Archivo exportado', 'El archivo Excel se ha descargado correctamente')
  } catch (e: any) {
    toast.error('Error al exportar', e.message || 'No se pudo exportar el archivo')
  }
}

function triggerFileInput() {
  if (fileInput.value && !uploading.value) {
    fileInput.value.click()
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    uploadError.value = null
    uploadResult.value = null
  }
}

function clearFile() {
  selectedFile.value = null
  uploadError.value = null
  uploadResult.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

async function handleUploadResponse() {
  if (!selectedFile.value || !pedido.value) return
  
  uploading.value = true
  uploadError.value = null
  uploadResult.value = null
  
  try {
    const result = await mba3ConsultasService.cargarRespuestaProveedor(pedidoId.value, selectedFile.value)
    uploadResult.value = result
    
    if (result.status === 'success') {
      toast.success('Respuesta cargada', result.message)
      clearFile()
      // Recargar el pedido para actualizar la información
      await loadPedido()
    } else {
      toast.warning('Respuesta con advertencias', result.message)
    }
  } catch (e: any) {
    uploadError.value = e.message || 'Error al cargar la respuesta'
    toast.error('Error', uploadError.value)
  } finally {
    uploading.value = false
  }
}

function goBack() {
  router.back()
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return dateString
  }
}

function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('es-ES').format(value)
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

function getTotalCantidad(tiendas: any[]): number {
  return tiendas.reduce((sum, t) => sum + (t.cantidad || 0), 0)
}

function getEstadoBadgeClass(estado: string): string {
  const classes: Record<string, string> = {
    'PENDIENTE_REVISION': 'bg-yellow-100 text-yellow-800',
    'APROBADA': 'bg-green-100 text-green-800',
    'RECHAZADA': 'bg-red-100 text-red-800'
  }
  return classes[estado] || 'bg-gray-100 text-gray-800'
}

function getCantidadClass(solicitada: number, confirmada: number): string {
  const porcentaje = solicitada > 0 ? (confirmada / solicitada) * 100 : 0
  if (porcentaje < 80) return 'text-red-600 font-medium'
  if (porcentaje < 100) return 'text-yellow-600'
  return 'text-green-600'
}

function getPrecioClass(original: number | null, ajustado: number | null): string {
  if (!original || !ajustado) return 'text-gray-900'
  const aumento = ((ajustado - original) / original) * 100
  if (aumento > 10) return 'text-red-600 font-medium'
  if (aumento > 0) return 'text-yellow-600'
  if (aumento < 0) return 'text-green-600'
  return 'text-gray-900'
}

onMounted(() => {
  loadPedido()
})
</script>

