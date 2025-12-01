<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Integración MBA3-SAP</h1>
      <p class="mt-1 text-sm text-gray-500">Vista general del sistema de integración MBA3-SAP</p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-lg shadow p-6 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div class="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center text-2xl">
          📋
        </div>
        <div class="flex-1">
          <h3 class="text-2xl font-bold text-gray-900">{{ facturasCount }}</h3>
          <p class="text-sm text-gray-500">Facturas</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div class="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center text-2xl">
          ⏳
        </div>
        <div class="flex-1">
          <h3 class="text-2xl font-bold text-gray-900">{{ ordenesCompraStore.pendientes }}</h3>
          <p class="text-sm text-gray-500">OCs Pendientes</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div class="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center text-2xl">
          ✅
        </div>
        <div class="flex-1">
          <h3 class="text-2xl font-bold text-gray-900">{{ ordenesCompraStore.enviadas }}</h3>
          <p class="text-sm text-gray-500">OCs Enviadas</p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
        <div class="w-16 h-16 rounded-lg bg-red-100 flex items-center justify-center text-2xl">
          ❌
        </div>
        <div class="flex-1">
          <h3 class="text-2xl font-bold text-gray-900">{{ ordenesCompraStore.errores }}</h3>
          <p class="text-sm text-gray-500">OCs con Error</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-lg shadow p-6 border border-gray-200 text-center">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Consultar Facturas</h3>
        <p class="text-sm text-gray-500 mb-4">Consulta y filtra facturas desde MBA3</p>
        <router-link 
          to="/mba3-consultas/facturas" 
          class="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Ir a Facturas
        </router-link>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border border-gray-200 text-center">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Órdenes de Compra</h3>
        <p class="text-sm text-gray-500 mb-4">Gestiona y envía órdenes de compra a SAP</p>
        <router-link 
          to="/mba3-consultas/ordenes-compra" 
          class="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Ver Órdenes
        </router-link>
      </div>

      <div class="bg-white rounded-lg shadow p-6 border border-gray-200 text-center">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Proceso Completo</h3>
        <p class="text-sm text-gray-500 mb-4">Ejecuta el flujo completo de procesamiento</p>
        <router-link 
          to="/mba3-consultas/proceso" 
          class="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Ejecutar Proceso
        </router-link>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 class="text-xl font-semibold text-gray-900 mb-4">Estado del Sistema</h3>
      <div class="space-y-3">
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span class="font-medium text-gray-600">API Status:</span>
          <span :class="getHealthStatus() === 'ok' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
            {{ getHealthStatus() === 'ok' ? '✓ Conectado' : '✗ Desconectado' }}
          </span>
        </div>
        <div v-if="getHealthTime()" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <span class="font-medium text-gray-600">Última verificación:</span>
          <span class="font-semibold text-gray-900">{{ formatTime(getHealthTime()!) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useFacturasStore } from '../stores/facturasStore'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'

const facturasStore = useFacturasStore()
const ordenesCompraStore = useOrdenesCompraStore()

const healthStatus = ref<'ok' | 'error'>('error')
const healthTime = ref<string | null>(null)

const facturasCount = computed(() => facturasStore.count)

function getHealthStatus(): 'ok' | 'error' {
  return healthStatus.value
}

function getHealthTime(): string | null {
  return healthTime.value
}

onMounted(async () => {
  await checkHealth()
  await ordenesCompraStore.fetchOrdenesCompra()
})

async function checkHealth() {
  try {
    const response = await mba3ConsultasService.healthCheck()
    healthStatus.value = response.status === 'ok' ? 'ok' : 'error'
    healthTime.value = response.time
  } catch {
    healthStatus.value = 'error'
  }
}

function formatTime(timeString: string): string {
  try {
    const date = new Date(timeString)
    return date.toLocaleString('es-ES')
  } catch {
    return timeString
  }
}
</script>


