<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Integración MBA3-SAP</h1>
      </div>

      <!-- Estadísticas -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-semibold text-orange-600 dark:text-orange-400">{{ ordenesCompraStore.pendientes }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Pendientes</div>
          </div>
          <div class="text-center border-x border-gray-200 dark:border-gray-700">
            <div class="text-2xl font-semibold text-green-600 dark:text-green-400">{{ ordenesCompraStore.enviadas }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Enviadas</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold text-red-600 dark:text-red-400">{{ ordenesCompraStore.errores }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Errores</div>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <!-- Procesos -->
        <button
          @click="navigateToProceso"
          :disabled="loadingDespachos"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Procesos</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Migración y procesamiento</div>
              <div v-if="loadingDespachos" class="text-xs text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1">
                <svg class="animate-spin w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Cargando...
              </div>
            </div>
          </div>
        </button>

        <!-- Órdenes de Compra -->
        <button
          @click="$router.push('/mba3-consultas/ordenes-compra')"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Órdenes de Compra</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Historial completo</div>
            </div>
          </div>
        </button>

        <!-- ODC con Errores -->
        <button
          @click="$router.push('/mba3-consultas/odc-errores')"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">ODC con Errores</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span v-if="ordenesCompraStore.errores > 0">{{ ordenesCompraStore.errores }} pendiente(s)</span>
                <span v-else>Corregir SKUs</span>
              </div>
            </div>
          </div>
        </button>

        <!-- Remisiones -->
        <button
          @click="$router.push('/mba3-consultas/remisiones')"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Remisiones</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Documentos disponibles</div>
            </div>
          </div>
        </button>

        <!-- Homologaciones -->
        <button
          @click="$router.push('/mba3-consultas/homologaciones')"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Homologaciones</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">SKUs no coincidentes</div>
            </div>
          </div>
        </button>

        <!-- Cargar Plantillas -->
        <button
          @click="$router.push('/mba3-consultas/cargar-plantillas')"
          class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Cargar Plantillas</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Subir archivos Excel</div>
            </div>
          </div>
        </button>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const ordenesCompraStore = useOrdenesCompraStore()
const toast = useToast()

const loadingDespachos = ref(false)

// Función para cargar despachos antes de navegar
async function cargarDespachos() {
  loadingDespachos.value = true
  try {
    await mba3ConsultasService.getDespachos(1, 100)
    // Los despachos se cargarán automáticamente en ProcesoCompletoView cuando se monte
    // pero cargarlos aquí asegura que estén disponibles más rápido
  } catch (error: any) {
    console.error('Error al cargar despachos:', error)
    // No mostrar error al usuario, ya que ProcesoCompletoView intentará cargarlos de nuevo
  } finally {
    loadingDespachos.value = false
  }
}

// Función para navegar a la página de procesos después de cargar despachos
async function navigateToProceso() {
  await cargarDespachos()
  router.push('/mba3-consultas/proceso')
}

onMounted(async () => {
  await ordenesCompraStore.fetchEstadisticas()
})
</script>
