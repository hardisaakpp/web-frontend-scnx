<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-semibold text-gray-900">Integración MBA3-SAP</h1>
      </div>

      <!-- Estadísticas -->
      <div class="bg-white rounded border border-gray-200 p-4">
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-semibold text-orange-600">{{ ordenesCompraStore.pendientes }}</div>
            <div class="text-xs text-gray-500 mt-1">Pendientes</div>
          </div>
          <div class="text-center border-x border-gray-200">
            <div class="text-2xl font-semibold text-green-600">{{ ordenesCompraStore.enviadas }}</div>
            <div class="text-xs text-gray-500 mt-1">Enviadas</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-semibold text-red-600">{{ ordenesCompraStore.errores }}</div>
            <div class="text-xs text-gray-500 mt-1">Errores</div>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <!-- Procesos -->
        <button
          @click="navigateToProceso"
          :disabled="loadingDespachos"
          class="bg-white rounded border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">Procesos</div>
              <div class="text-xs text-gray-500 mt-1">Migración y procesamiento</div>
              <div v-if="loadingDespachos" class="text-xs text-indigo-600 mt-2 flex items-center gap-1">
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
          class="bg-white rounded border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">Órdenes de Compra</div>
              <div class="text-xs text-gray-500 mt-1">Historial completo</div>
            </div>
          </div>
        </button>

        <!-- ODC con Errores -->
        <button
          @click="$router.push('/mba3-consultas/odc-errores')"
          class="bg-white rounded border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-red-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">ODC con Errores</div>
              <div class="text-xs text-gray-500 mt-1">
                <span v-if="ordenesCompraStore.errores > 0">{{ ordenesCompraStore.errores }} pendiente(s)</span>
                <span v-else>Corregir SKUs</span>
              </div>
            </div>
          </div>
        </button>

        <!-- Remisiones -->
        <button
          @click="$router.push('/mba3-consultas/remisiones')"
          class="bg-white rounded border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-cyan-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">Remisiones</div>
              <div class="text-xs text-gray-500 mt-1">Documentos disponibles</div>
            </div>
          </div>
        </button>

        <!-- Homologaciones -->
        <button
          @click="$router.push('/mba3-consultas/homologaciones')"
          class="bg-white rounded border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-violet-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">Homologaciones</div>
              <div class="text-xs text-gray-500 mt-1">SKUs no coincidentes</div>
            </div>
          </div>
        </button>

        <!-- Cargar Plantillas -->
        <button
          @click="$router.push('/mba3-consultas/cargar-plantillas')"
          class="bg-white rounded border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">Cargar Plantillas</div>
              <div class="text-xs text-gray-500 mt-1">Subir archivos Excel</div>
            </div>
          </div>
        </button>

        <!-- Gestión de Pedidos (Fase 3) -->
        <button
          @click="showBuscarPedidoModal = true"
          class="bg-white rounded border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left"
        >
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded bg-purple-50 flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">Gestionar Pedidos</div>
              <div class="text-xs text-gray-500 mt-1">Ver y gestionar pedidos</div>
            </div>
          </div>
        </button>

      </div>
    </div>

    <!-- Modal para buscar pedido por ID -->
    <div
      v-if="showBuscarPedidoModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showBuscarPedidoModal = false"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Acceder a Pedido</h3>
          <button
            @click="showBuscarPedidoModal = false"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p class="text-sm text-gray-600 mb-4">
          Ingresa el ID del pedido para acceder a su detalle y gestionar la respuesta del proveedor.
        </p>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              ID del Pedido
            </label>
            <input
              v-model="pedidoIdInput"
              @keyup.enter="goToPedido"
              type="text"
              placeholder="Ingresa el ID del pedido (UUID)"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              autofocus
            />
          </div>
          
          <div class="flex items-center gap-3">
            <button
              @click="goToPedido"
              class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Abrir Pedido
            </button>
            <button
              @click="showBuscarPedidoModal = false"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
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
const showBuscarPedidoModal = ref(false)
const pedidoIdInput = ref('')

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

function goToPedido() {
  const pedidoId = pedidoIdInput.value.trim()
  if (!pedidoId) {
    toast.error('Error', 'Por favor ingresa un ID de pedido válido')
    return
  }
  
  showBuscarPedidoModal.value = false
  pedidoIdInput.value = ''
  router.push(`/mba3-consultas/pedidos/${pedidoId}`)
}

onMounted(async () => {
  await ordenesCompraStore.fetchEstadisticas()
})
</script>
