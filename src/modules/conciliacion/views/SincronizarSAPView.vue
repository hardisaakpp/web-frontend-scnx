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
        <!-- Configuración: Rango de Fechas -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Rango de fechas para sincronización
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1 ml-1">Desde</label>
              <input
                v-model="fechaDesde"
                type="date"
                class="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :disabled="syncing"
              />
            </div>
            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1 ml-1">Hasta</label>
              <input
                v-model="fechaHasta"
                type="date"
                class="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :disabled="syncing"
              />
            </div>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Se recomienda sincronizar rangos cortos (menores a 30 días) para un mejor rendimiento.
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
            <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-emerald-100 dark:border-emerald-900/50">
                <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{ store.lastSyncResult.registros_insertados }}</p>
                <p class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mt-1">Nuevos</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-blue-100 dark:border-blue-900/50">
                <p class="text-xl font-bold text-blue-600 dark:text-blue-400">{{ store.lastSyncResult.registros_actualizados }}</p>
                <p class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mt-1">Actualizados</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-amber-100 dark:border-amber-900/50">
                <p class="text-xl font-bold text-amber-600 dark:text-amber-400">{{ store.lastSyncResult.registros_incompletos || 0 }}</p>
                <p class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mt-1">Incompletos</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-100 dark:border-gray-900/50">
                <p class="text-[11px] font-bold text-gray-700 dark:text-gray-300 leading-tight">
                  {{ store.lastSyncResult.fecha_inicio_filtro }}<br/>
                  <span class="text-[10px] text-gray-400 font-normal">al {{ store.lastSyncResult.fecha_fin_filtro || '-' }}</span>
                </p>
                <p class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mt-1">Período</p>
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
import { ref, onMounted } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'

const store = useConciliacionStore()
const toast = useToast()

const fechaDesde = ref('')
const fechaHasta = ref('')
const syncing = ref(false)

onMounted(() => {
  // Inicializar con los últimos 14 días
  const today = new Date()
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(today.getDate() - 14)

  fechaHasta.value = today.toISOString().split('T')[0]
  fechaDesde.value = fourteenDaysAgo.toISOString().split('T')[0]
})

async function handleSync() {
  if (!fechaDesde.value || !fechaHasta.value) {
    toast.error('Campos requeridos', 'Debe seleccionar ambas fechas.')
    return
  }

  if (new Date(fechaDesde.value) > new Date(fechaHasta.value)) {
    toast.error('Rango inválido', 'La fecha inicial no puede ser mayor a la final.')
    return
  }

  syncing.value = true
  try {
    const result = await store.syncSAP(fechaDesde.value, fechaHasta.value)
    toast.success('Sincronización completa', result?.mensaje || 'SAP sincronizado')
  } catch (e: any) {
    toast.error('Error de sincronización', e.message || 'No se pudo conectar con SAP')
  } finally {
    syncing.value = false
  }
}
</script>
