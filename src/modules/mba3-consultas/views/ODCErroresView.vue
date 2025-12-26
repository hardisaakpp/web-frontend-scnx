<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">ODC con Errores</h1>
        <p class="mt-1 text-sm text-gray-500">Corrige los SKUs de las órdenes de compra que no se pudieron enviar a SAP</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="refreshODCErrores" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          :disabled="loading"
        >
          <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>
    </div>

    <!-- Estadísticas rápidas -->
    <div class="bg-white rounded border border-gray-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center">
          <div class="text-2xl font-semibold text-red-600">{{ totalErrores }}</div>
          <div class="text-xs text-gray-500 mt-1">Total con Error</div>
        </div>
        <div class="text-center border-x border-gray-200">
          <div class="text-2xl font-semibold text-orange-600">{{ erroresSAP }}</div>
          <div class="text-xs text-gray-500 mt-1">Errores de SAP</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-semibold text-purple-600">{{ erroresSKU }}</div>
          <div class="text-xs text-gray-500 mt-1">Errores de SKU</div>
        </div>
      </div>
    </div>

    <!-- Tabla de ODC con Errores -->
    <div class="bg-white rounded-lg shadow border border-gray-200">
      <div class="px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Órdenes de Compra con Error</h2>
            <p class="mt-1 text-sm text-gray-500">
              Total: <span class="font-semibold">{{ odcErrores.length }}</span> orden(es) con error
            </p>
          </div>
        </div>
      </div>
      
      <SkeletonTable v-if="loading && odcErrores.length === 0" />

      <div v-else-if="odcErrores.length === 0" class="px-6 py-12 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p class="text-gray-500 text-lg font-medium">No hay órdenes de compra con error</p>
        <p class="text-gray-400 text-sm mt-1">
          Todas las órdenes se han procesado correctamente
        </p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                OC ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proveedor
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha Generación
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Error
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código Error
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="odc in odcErrores" 
              :key="odc.oc_id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-mono text-gray-900">{{ odc.oc_id.substring(0, 8) }}...</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ odc.proveedor || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ formatDate(odc.fecha_generacion) }}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900 max-w-md truncate" :title="odc.error_message || 'Sin mensaje de error'">
                  {{ odc.error_message || 'Error desconocido' }}
                </div>
                <div v-if="odc.error_source" class="text-xs text-gray-500 mt-1">
                  Fuente: {{ odc.error_source }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  v-if="odc.error_code"
                  class="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800"
                >
                  {{ odc.error_code }}
                </span>
                <span v-else class="text-xs text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  @click="abrirModalCorregirSKU(odc)"
                  class="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Corregir SKU
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Corrección de SKU -->
    <CorregirSkuModal
      v-if="odcSeleccionada"
      :odc="odcSeleccionada"
      @close="cerrarModal"
      @correccion-aplicada="handleCorreccionAplicada"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { useToast } from '@/composables/useToast'
import SkeletonTable from '../components/SkeletonTable.vue'
import CorregirSkuModal from '../components/CorregirSkuModal.vue'
import type { OrdenCompra } from '../types'

const ordenesCompraStore = useOrdenesCompraStore()
const toast = useToast()

const loading = ref(false)
const odcErrores = ref<OrdenCompra[]>([])
const odcSeleccionada = ref<OrdenCompra | null>(null)

// Estadísticas
const totalErrores = computed(() => odcErrores.value.length)
const erroresSAP = computed(() => 
  odcErrores.value.filter(odc => odc.error_source?.toUpperCase() === 'SAP').length
)
const erroresSKU = computed(() => 
  odcErrores.value.filter(odc => 
    odc.error_code?.toUpperCase().includes('ITEMCODE') || 
    odc.error_code?.toUpperCase().includes('SKU') ||
    odc.error_message?.toLowerCase().includes('sku') ||
    odc.error_message?.toLowerCase().includes('artículo')
  ).length
)

// Función para cargar ODC con errores
async function cargarODCErrores() {
  loading.value = true
  try {
    // Cargar con un pageSize grande para obtener todas las ODC con error
    const response = await mba3ConsultasService.getOrdenesCompra('ERROR', 1, 1000)
    odcErrores.value = response.data || []
  } catch (error: any) {
    console.error('Error al cargar ODC con errores:', error)
    toast.error('Error al cargar ODC', error.message || 'No se pudieron cargar las órdenes de compra con error')
  } finally {
    loading.value = false
  }
}

// Función para actualizar
async function refreshODCErrores() {
  await ordenesCompraStore.fetchEstadisticas()
  await cargarODCErrores()
  toast.success('Lista actualizada', 'Las ODC con errores se han actualizado correctamente')
}

// Función para formatear fecha
function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Función para abrir modal de corrección
function abrirModalCorregirSKU(odc: OrdenCompra) {
  odcSeleccionada.value = odc
}

// Función para cerrar modal
function cerrarModal() {
  odcSeleccionada.value = null
}

// Función para manejar corrección aplicada
async function handleCorreccionAplicada(skuOriginal: string, skuNuevo: string) {
  toast.success('Corrección aplicada', `SKU actualizado de ${skuOriginal} a ${skuNuevo}`)
  // Recargar la lista de ODC con errores
  await refreshODCErrores()
  cerrarModal()
}

onMounted(async () => {
  await cargarODCErrores()
})
</script>

