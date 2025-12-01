<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Órdenes de Compra</h1>
        <p class="mt-1 text-sm text-gray-500">Gestiona y envía órdenes de compra a SAP</p>
      </div>
      <div class="flex items-center gap-3">
        <select 
          v-model="estadoFilter" 
          @change="handleFilterChange"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="ENVIADA">Enviadas</option>
          <option value="ERROR">Con Error</option>
        </select>
        <button 
          @click="refreshOrdenes" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="ordenesCompraStore.loading"
        >
          {{ ordenesCompraStore.loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>
    </div>

    <div v-if="ordenesCompraStore.error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
      <div class="flex">
        <div class="ml-3">
          <p class="text-sm text-red-700">
            <strong>Error:</strong> {{ ordenesCompraStore.error }}
          </p>
        </div>
      </div>
    </div>

    <LoadingSpinner v-if="ordenesCompraStore.loading" message="Cargando órdenes de compra..." />

    <OrdenCompraTable 
      v-else
      :ordenes-compra="ordenesCompraStore.ordenesCompra"
      :loading="ordenesCompraStore.loading"
      @integrar="handleIntegrar"
    />

    <div 
      v-if="getIntegrationResult()" 
      class="p-4 rounded border-l-4 mt-6"
      :class="getIntegrationResult()?.status === 'success' 
        ? 'bg-green-50 border-green-500 text-green-700' 
        : 'bg-red-50 border-red-500 text-red-700'"
    >
      <p class="text-sm font-medium">
        <strong>{{ getIntegrationResult()?.status === 'success' ? '✓ Éxito' : '✗ Error' }}:</strong>
        {{ getIntegrationResult()?.message }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import OrdenCompraTable from '../components/OrdenCompraTable.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const ordenesCompraStore = useOrdenesCompraStore()
const estadoFilter = ref<string>('')
const integrationResult = ref<{ status: string; message: string } | null>(null)

function getIntegrationResult(): { status: string; message: string } | null {
  return integrationResult.value
}

onMounted(() => {
  ordenesCompraStore.fetchOrdenesCompra()
})

function handleFilterChange() {
  ordenesCompraStore.fetchOrdenesCompra(estadoFilter.value || undefined)
}

function refreshOrdenes() {
  ordenesCompraStore.fetchOrdenesCompra(estadoFilter.value || undefined)
}

async function handleIntegrar(referenciaDespacho: string) {
  integrationResult.value = null
  try {
    const result = await ordenesCompraStore.integrarSAP(referenciaDespacho)
    integrationResult.value = {
      status: 'success',
      message: result.message || 'Orden de compra enviada exitosamente a SAP'
    }
    setTimeout(() => {
      integrationResult.value = null
    }, 5000)
  } catch (error: any) {
    integrationResult.value = {
      status: 'error',
      message: error.message || 'Error al enviar orden de compra a SAP'
    }
    setTimeout(() => {
      integrationResult.value = null
    }, 5000)
  }
}
</script>


