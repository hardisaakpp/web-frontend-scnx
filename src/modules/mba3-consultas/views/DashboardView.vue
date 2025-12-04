<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Integración MBA3-SAP</h1>
        <p class="mt-1 text-sm text-gray-500">Vista general del sistema de integración MBA3-SAP</p>
      </div>

    <!-- Tarjetas de Estadísticas -->
    <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Estadísticas de Órdenes de Compra</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center text-2xl">
            ⏳
          </div>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-gray-900">{{ ordenesCompraStore.pendientes }}</h3>
            <p class="text-sm text-gray-500">ODCs Pendientes</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center text-2xl">
            ✅
          </div>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-gray-900">{{ ordenesCompraStore.enviadas }}</h3>
            <p class="text-sm text-gray-500">ODCs Enviadas</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-lg bg-red-100 flex items-center justify-center text-2xl">
            ❌
          </div>
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-gray-900">{{ ordenesCompraStore.errores }}</h3>
            <p class="text-sm text-gray-500">ODCs con Error</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Acciones Rápidas -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Panel de Procesos -->
      <div class="bg-white rounded-lg shadow-lg p-6 border border-gray-200 flex flex-col h-full">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Procesos de Integración</h2>
            <p class="text-sm text-gray-500 mt-1">Ejecuta migración y procesamiento de ODC</p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
        </div>
        <p class="text-sm text-gray-600 mb-4 flex-grow">
          Ejecuta el flujo completo de integración: Importar despachos desde MBA3 y procesar órdenes de compra.
        </p>
        <button
          @click="navigateToProceso"
          :disabled="loadingDespachos"
          class="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="loadingDespachos" class="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          <span>{{ loadingDespachos ? 'Cargando despachos...' : 'Gestionar Procesos' }}</span>
        </button>
      </div>

      <!-- Panel de Historial de Órdenes de Compra -->
      <div class="bg-white rounded-lg shadow-lg p-6 border border-gray-200 flex flex-col h-full">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Historial de Órdenes</h2>
            <p class="text-sm text-gray-500 mt-1">Consulta y visualiza el historial completo</p>
          </div>
          <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
        <div class="mb-4 flex-grow">
          <p class="text-sm text-gray-600 mb-3">
            Visualiza el historial completo de órdenes de compra: pendientes, enviadas y con error. Filtra, busca y exporta los datos según tus necesidades.
          </p>
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <div class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>{{ ordenesCompraStore.pendientes }} Pendientes</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              <span>{{ ordenesCompraStore.enviadas }} Enviadas</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              <span>{{ ordenesCompraStore.errores }} Errores</span>
            </div>
          </div>
        </div>
        <button
          @click="$router.push('/mba3-consultas/ordenes-compra')"
          class="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-auto"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Ver Historial</span>
        </button>
      </div>
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
