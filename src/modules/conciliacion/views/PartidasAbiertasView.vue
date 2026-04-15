<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-2 mb-1">
          <router-link to="/conciliacion" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conciliación</router-link>
          <span class="text-gray-400 dark:text-gray-500">/</span>
          <span class="text-sm text-gray-700 dark:text-gray-300">Partidas Abiertas</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Partidas Abiertas</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Movimientos pendientes de conciliación a una fecha de corte</p>
      </div>

      <!-- Filtros -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fecha de corte</label>
            <input v-model="filtros.fecha_corte" type="date" class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Banco</label>
            <select v-model="filtros.id_banco" class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
              <option :value="undefined">Todos</option>
              <option v-for="b in store.bancos" :key="b.id_banco" :value="b.id_banco">{{ b.nombre_banco }}</option>
            </select>
          </div>
          <button @click="buscar" :disabled="store.loading" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors">
            Consultar
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>

      <!-- Resultados -->
      <template v-else-if="store.partidasAbiertas">
        <!-- Resumen -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha de Corte</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white mt-1">{{ store.partidasAbiertas.fecha_corte }}</p>
          </div>
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4 text-center">
            <p class="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Pendientes SAP</p>
            <p class="text-lg font-bold text-blue-700 dark:text-blue-300 mt-1">{{ store.partidasAbiertas.pendientes_sap.length }}</p>
            <p class="text-sm text-blue-600 dark:text-blue-400">${{ formatMonto(store.partidasAbiertas.total_monto_sap_pendiente) }}</p>
          </div>
          <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 p-4 text-center">
            <p class="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Pendientes Banco</p>
            <p class="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-1">{{ store.partidasAbiertas.pendientes_banca.length }}</p>
            <p class="text-sm text-emerald-600 dark:text-emerald-400">${{ formatMonto(store.partidasAbiertas.total_monto_banca_pendiente) }}</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="flex border-b border-gray-200 dark:border-gray-700">
            <button
              @click="activeTab = 'sap'"
              :class="[
                'px-5 py-3 text-sm font-medium transition-colors relative',
                activeTab === 'sap'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ]"
            >
              SAP ({{ store.partidasAbiertas.pendientes_sap.length }})
              <div v-if="activeTab === 'sap'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
            </button>
            <button
              @click="activeTab = 'banca'"
              :class="[
                'px-5 py-3 text-sm font-medium transition-colors relative',
                activeTab === 'banca'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ]"
            >
              Banco ({{ store.partidasAbiertas.pendientes_banca.length }})
              <div v-if="activeTab === 'banca'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400"></div>
            </button>
          </div>

          <!-- Tabla SAP -->
          <div v-if="activeTab === 'sap'" class="overflow-x-auto">
            <table v-if="store.partidasAbiertas.pendientes_sap.length > 0" class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Referencia</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descripción</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Banco</th>
                  <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                <tr v-for="p in store.partidasAbiertas.pendientes_sap" :key="p.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td class="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{{ p.fecha }}</td>
                  <td class="px-4 py-2.5 text-gray-900 dark:text-gray-200 font-mono text-xs">{{ p.referencia }}</td>
                  <td class="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-xs truncate max-w-[300px]">{{ p.descripcion || '—' }}</td>
                  <td class="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{{ p.banco || '—' }}</td>
                  <td class="px-4 py-2.5 text-right font-mono font-medium text-gray-900 dark:text-white text-xs">${{ formatMonto(p.monto) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Sin partidas SAP pendientes</div>
          </div>

          <!-- Tabla Banca -->
          <div v-if="activeTab === 'banca'" class="overflow-x-auto">
            <table v-if="store.partidasAbiertas.pendientes_banca.length > 0" class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Referencia</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descripción</th>
                  <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Banco</th>
                  <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                <tr v-for="p in store.partidasAbiertas.pendientes_banca" :key="p.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td class="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-xs">{{ p.fecha }}</td>
                  <td class="px-4 py-2.5 text-gray-900 dark:text-gray-200 font-mono text-xs">{{ p.referencia }}</td>
                  <td class="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-xs truncate max-w-[300px]">{{ p.descripcion || '—' }}</td>
                  <td class="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{{ p.banco || '—' }}</td>
                  <td class="px-4 py-2.5 text-right font-mono font-medium text-gray-900 dark:text-white text-xs">${{ formatMonto(p.monto) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">Sin partidas del banco pendientes</div>
          </div>
        </div>
      </template>

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

const store = useConciliacionStore()

const today = new Date().toISOString().split('T')[0]

const filtros = reactive({
  fecha_corte: today,
  id_banco: undefined as number | undefined,
})

const activeTab = ref<'sap' | 'banca'>('sap')

onMounted(async () => {
  if (!store.hasBancos) store.fetchBancos()
  await buscar()
})

async function buscar() {
  try {
    await store.fetchPartidasAbiertas(filtros)
  } catch {
    // handled
  }
}

function formatMonto(monto: number): string {
  return monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
