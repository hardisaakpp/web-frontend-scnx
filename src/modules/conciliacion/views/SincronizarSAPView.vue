<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-2 mb-1">
          <router-link to="/conciliacion" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conciliación</router-link>
          <span class="text-gray-400 dark:text-gray-500">/</span>
          <span class="text-sm text-gray-700 dark:text-gray-300">Sincronizar SAP</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Sincronizar Movimientos SAP</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Traer movimientos contables de bancos desde SAP HANA</p>
      </div>

      <!-- Card principal -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <!-- Configuración -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Período de sincronización
          </label>
          <div class="flex items-center gap-3">
            <input
              v-model.number="diasAtras"
              type="number"
              min="1"
              max="90"
              class="w-24 px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
              :disabled="syncing"
            />
            <span class="text-sm text-gray-600 dark:text-gray-400">días atrás desde hoy</span>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Se sincronizarán movimientos desde {{ fechaDesde }} hasta hoy
          </p>
        </div>

        <!-- Botón -->
        <button
          @click="handleSync"
          :disabled="syncing"
          class="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="syncing" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ syncing ? 'Sincronizando...' : 'Sincronizar desde SAP' }}
        </button>
      </div>

      <!-- Resultado -->
      <div v-if="store.lastSyncResult" class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-5">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="font-medium text-emerald-800 dark:text-emerald-200">{{ store.lastSyncResult.mensaje }}</p>
            <div class="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ store.lastSyncResult.registros_insertados }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Nuevos</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ store.lastSyncResult.registros_actualizados }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Actualizados</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center sm:col-span-1 col-span-2">
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ store.lastSyncResult.fecha_inicio_filtro }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Desde fecha</p>
              </div>
            </div>
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
import { ref, computed } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'

const store = useConciliacionStore()
const toast = useToast()

const diasAtras = ref(14)
const syncing = ref(false)

const fechaDesde = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() - diasAtras.value)
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
})

async function handleSync() {
  syncing.value = true
  store.lastSyncResult = null
  try {
    await store.syncSAP(diasAtras.value)
    toast.success('Sincronización completa', store.lastSyncResult?.mensaje || 'SAP sincronizado')
  } catch (e: any) {
    toast.error('Error de sincronización', e.message || 'No se pudo conectar con SAP')
  } finally {
    syncing.value = false
  }
}
</script>
