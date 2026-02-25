<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Reporte de Diferencias</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-300">Visualiza y exporta reportes de diferencias entre pedidos solicitados y confirmados</p>
        </div>
        <button
          @click="$router.push('/mba3-consultas')"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver al Dashboard
        </button>
      </div>

      <!-- Buscar Pedido -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="space-y-4">
          <div>
            <label for="pedido-buscar" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar Pedido por Número
            </label>
            <div class="flex gap-3">
              <input
                id="pedido-buscar"
                v-model="pedidoIdInput"
                type="text"
                placeholder="Ej: P-12.48 - 12 - 2025"
                @keydown.enter="buscarReporte"
                @focus="showSearchHelp = true"
                @blur="handleSearchBlur"
                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                :disabled="loadingReporte"
              />
              <button
                @click="buscarReporte"
                :disabled="loadingReporte || !pedidoIdInput.trim()"
                class="px-6 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg
                  v-if="loadingReporte"
                  class="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg
                  v-else
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {{ loadingReporte ? 'Buscando...' : 'Buscar' }}
              </button>
            </div>
            <p v-if="showSearchHelp" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Ingrese el número completo del pedido (ej: P-12.48 - 12 - 2025) y presione Enter o haga clic en Buscar
            </p>
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 transition-colors duration-300">
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-red-900 dark:text-red-200">Error al cargar el reporte</p>
            <p class="text-sm text-red-800 dark:text-red-300 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loadingReporte && !reporteDiferencias" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
        <svg class="animate-spin h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando reporte de diferencias...</p>
      </div>

      <!-- Reporte de Diferencias -->
      <ReporteDiferencias
        v-if="reporteDiferencias"
        :reporte-diferencias="reporteDiferencias"
        @exportar="handleExportReporteDiferencias"
      />

      <!-- Mensaje cuando no hay reporte -->
      <div v-if="!loadingReporte && !reporteDiferencias && !error && pedidoIdInput.trim()" class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 transition-colors duration-300">
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-yellow-900 dark:text-yellow-200">No hay reporte disponible</p>
            <p class="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
              Este pedido aún no tiene un reporte de diferencias. El reporte se genera automáticamente después de que MABEL TRADING confirma la redistribución.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@vue/reactivity'
import { useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { ReporteDiferenciasResponse } from '../types'
import ReporteDiferencias from '../components/ReporteDiferencias.vue'

const route = useRoute()
const toast = useToast()

const pedidoIdInput = ref('')
const showSearchHelp = ref(false)
const reporteDiferencias = ref<ReporteDiferenciasResponse | null>(null)
const loadingReporte = ref(false)
const error = ref<string | null>(null)

// Cargar pedido desde parámetros de ruta si existe
if (route.params.id) {
  pedidoIdInput.value = decodeURIComponent(route.params.id as string)
  buscarReporte()
}

// Función para buscar el reporte
async function buscarReporte() {
  if (!pedidoIdInput.value.trim()) {
    toast.warning('Campo requerido', 'Por favor ingrese un número de pedido')
    return
  }

  error.value = null
  loadingReporte.value = true
  reporteDiferencias.value = null

  try {
    const numeroPedido = pedidoIdInput.value.trim()
    const reporte = await mba3ConsultasService.getReporteDiferencias(numeroPedido)
    
    if (reporte instanceof Blob) {
      // Si es un Blob, es un archivo Excel para descargar
      const url = window.URL.createObjectURL(reporte)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_diferencias_${numeroPedido.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Reporte descargado', 'El reporte se ha descargado como archivo Excel')
    } else {
      // Es un objeto de reporte
      reporteDiferencias.value = reporte
      toast.success('Reporte cargado', 'El reporte de diferencias se ha cargado correctamente')
    }
  } catch (e: any) {
    console.error('Error al cargar reporte de diferencias:', e)
    error.value = e.message || 'No se pudo cargar el reporte de diferencias'
    
    if (e.message?.includes('No existe reporte')) {
      toast.warning('Reporte no disponible', 'Este pedido aún no tiene un reporte de diferencias. Debe procesar la confirmación del proveedor primero.')
    } else {
      toast.error('Error', error.value ?? undefined)
    }
  } finally {
    loadingReporte.value = false
  }
}

// Función para exportar el reporte
async function handleExportReporteDiferencias() {
  if (!pedidoIdInput.value.trim() || !reporteDiferencias.value) {
    toast.warning('Sin datos', 'No hay reporte para exportar')
    return
  }

  try {
    const numeroPedido = pedidoIdInput.value.trim()
    const blob = await mba3ConsultasService.getReporteDiferencias(numeroPedido, 'excel')
    
    // Asegurar que es un Blob para exportación
    if (!(blob instanceof Blob)) {
      throw new Error('La respuesta no es un archivo descargable')
    }
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_diferencias_${numeroPedido.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.success('Reporte exportado', 'El reporte se ha descargado como archivo Excel')
  } catch (e: any) {
    console.error('Error al exportar reporte:', e)
    toast.error('Error al exportar', e.message || 'No se pudo exportar el reporte')
  }
}

// Función para manejar el blur del input de búsqueda
function handleSearchBlur() {
  setTimeout(() => {
    showSearchHelp.value = false
  }, 200)
}
</script>
