<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-2 mb-1">
          <router-link to="/conciliacion" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conciliación</router-link>
          <span class="text-gray-400 dark:text-gray-500">/</span>
          <span class="text-sm text-gray-700 dark:text-gray-300">Conciliación Automática</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Conciliación Automática</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Ejecutar matching automático entre movimientos bancarios y SAP</p>
      </div>

      <!-- Filtros -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Banco -->
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Banco</label>
            <select
              v-model="filtros.id_banco"
              class="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              :disabled="ejecutando"
            >
              <option :value="null">Todos los bancos</option>
              <option v-for="banco in store.bancos" :key="banco.id_banco" :value="banco.id_banco">{{ banco.nombre_banco }}</option>
            </select>
          </div>

          <!-- Fecha Desde -->
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Fecha desde <span class="text-red-500">*</span></label>
            <input
              v-model="filtros.fecha_desde"
              type="date"
              class="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              :disabled="ejecutando"
            />
          </div>

          <!-- Fecha Hasta -->
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Fecha hasta <span class="text-red-500">*</span></label>
            <input
              v-model="filtros.fecha_hasta"
              type="date"
              class="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              :disabled="ejecutando"
            />
          </div>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <button
            @click="ejecutarConciliacion"
            :disabled="ejecutando || !filtros.fecha_desde || !filtros.fecha_hasta"
            class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="ejecutando" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            {{ ejecutando ? 'Procesando...' : 'Ejecutar Conciliación' }}
          </button>

          <router-link
            v-if="store.lastConciliacionResult"
            to="/conciliacion/novedades"
            class="px-4 py-2.5 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            Ver novedades →
          </router-link>
        </div>
      </div>

      <!-- Resultado -->
      <div v-if="store.lastConciliacionResult" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Resultado de la conciliación</h3>

        <div v-if="store.lastConciliacionResult.mensaje" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p class="text-sm text-blue-800 dark:text-blue-200">{{ store.lastConciliacionResult.mensaje }}</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ store.lastConciliacionResult.procesados }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Conciliados</p>
          </div>
          <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-lg font-bold text-blue-600 dark:text-blue-400">${{ formatMonto(store.lastConciliacionResult.total_monto) }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Monto total</p>
          </div>
          <div class="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ store.lastConciliacionResult.sap_pendientes }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">SAP pendientes</p>
          </div>
          <div class="text-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
            <p class="text-2xl font-bold text-rose-600 dark:text-rose-400">{{ store.lastConciliacionResult.banca_pendientes }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Banca pendientes</p>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="store.error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-700 dark:text-red-300">{{ store.error }}</p>
          <button @click="store.clearError()" class="ml-auto text-red-500 hover:text-red-700 text-sm">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'

const store = useConciliacionStore()
const toast = useToast()

const ejecutando = ref(false)

// Default: último mes
const today = new Date()
const monthAgo = new Date()
monthAgo.setMonth(monthAgo.getMonth() - 1)

const filtros = reactive({
  id_banco: null as number | null,
  fecha_desde: monthAgo.toISOString().split('T')[0],
  fecha_hasta: today.toISOString().split('T')[0],
})

onMounted(() => {
  if (!store.hasBancos) store.fetchBancos()
})

function formatMonto(monto: number): string {
  return monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function ejecutarConciliacion() {
  if (!filtros.fecha_desde || !filtros.fecha_hasta) return

  ejecutando.value = true
  store.lastConciliacionResult = null
  try {
    await store.conciliarAutomatica({
      id_banco: filtros.id_banco,
      fecha_desde: filtros.fecha_desde,
      fecha_hasta: filtros.fecha_hasta,
    })
    toast.success('Conciliación ejecutada', `${(store.lastConciliacionResult as any)?.procesados ?? 0} movimientos conciliados`)
  } catch (e: any) {
    toast.error('Error', e.message || 'Error al ejecutar conciliación')
  } finally {
    ejecutando.value = false
  }
}
</script>
