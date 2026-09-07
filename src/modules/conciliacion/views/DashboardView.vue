<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header with Filters -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Conciliación Bancaria</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ store.dashboard?.titulo || 'Cargando métricas...' }}
          </p>
        </div>
        
        <!-- Filters -->
        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <select 
            v-model="filtros.mm" 
            class="bg-transparent text-sm border-none focus:ring-0 text-gray-700 dark:text-gray-300"
            @change="actualizarDashboard"
          >
            <option :value="''">Todo el año</option>
            <option v-for="(mes, i) in meses" :key="i" :value="String(i + 1).padStart(2, '0')">
              {{ mes }}
            </option>
          </select>
          <div class="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
          <select 
            v-model="filtros.yyyy" 
            class="bg-transparent text-sm border-none focus:ring-0 text-gray-700 dark:text-gray-300 font-medium"
            @change="actualizarDashboard"
          >
            <option v-for="año in años" :key="año" :value="año">{{ año }}</option>
          </select>
          <button 
            @click="actualizarDashboard" 
            class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
            title="Refrescar"
          >
            <svg class="w-4 h-4" :class="{ 'animate-spin': store.loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div v-if="store.dashboard" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Conciliaciones Realizadas -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 relative overflow-hidden group">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conciliaciones</span>
            <div class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ store.dashboard.total_conciliaciones }}</p>
          <p class="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">${{ formatMonto(store.dashboard.monto_conciliado) }}</p>
          <div class="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-500" :style="{ width: '100%' }"></div>
        </div>

        <!-- SAP Pendientes -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SAP Pend.</span>
            <div class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ store.dashboard.sap_pendientes_conteo }}</p>
          <p class="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">${{ formatMonto(Math.abs(store.dashboard.sap_pendientes_monto)) }}</p>
        </div>

        <!-- Banca Pendientes -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Banco Pend.</span>
            <div class="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
              <svg class="w-4 h-4 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ store.dashboard.banca_pendientes_conteo }}</p>
          <p class="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">${{ formatMonto(store.dashboard.banca_pendientes_monto) }}</p>
        </div>

        <!-- Resumen General -->
        <div class="bg-gray-900 dark:bg-gray-700 rounded-lg p-4 text-white shadow-lg overflow-hidden relative">
          <div class="relative z-10">
             <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Periodo</span>
             <p class="text-lg font-bold mt-1 text-white">{{ store.dashboard.titulo }}</p>
             <div class="flex items-center gap-2 mt-2">
                <span v-if="store.dashboard.es_mensual" class="px-2 py-0.5 bg-blue-500 text-[10px] rounded font-bold uppercase">Mensual</span>
                <span v-else class="px-2 py-0.5 bg-emerald-500 text-[10px] rounded font-bold uppercase">Histórico</span>
             </div>
          </div>
          <svg class="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-else-if="store.loading" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3"></div>
          <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
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

      <!-- Navigation Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <!-- Importar Movimientos -->
        <router-link
          v-if="authStore.isAdmin || authStore.hasPermission('conciliacion.importacion')"
          to="/conciliacion/importar"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all text-left block group"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Importar Movimientos</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Cargar archivo Excel del banco</div>
            </div>
          </div>
        </router-link>

        <!-- Sincronizar SAP -->
        <router-link
          v-if="authStore.isAdmin || authStore.hasPermission('conciliacion.importacion')"
          to="/conciliacion/sincronizar-sap"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all text-left block group"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Sincronizar SAP</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Traer movimientos contables de SAP HANA</div>
            </div>
          </div>
        </router-link>

        <!-- Conciliación Automática -->
        <router-link
          v-if="authStore.isAdmin || authStore.hasPermission('conciliacion.conciliar')"
          to="/conciliacion/conciliar"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all text-left block group"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Conciliación Automática</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ejecutar matching automático</div>
            </div>
          </div>
        </router-link>

        <!-- Novedades -->
        <router-link
          v-if="authStore.isAdmin || authStore.hasPermission('conciliacion.conciliar')"
          to="/conciliacion/novedades"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all text-left block group"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Novedades</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Discrepancias y conciliación manual</div>
            </div>
          </div>
        </router-link>

        <!-- Historial -->
        <router-link
          v-if="authStore.isAdmin || authStore.hasPermission('conciliacion.historial')"
          to="/conciliacion/historial"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-cyan-300 dark:hover:border-cyan-600 hover:shadow-md transition-all text-left block group"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Historial</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Procesos anteriores de conciliación</div>
            </div>
          </div>
        </router-link>

        <!-- Partidas Abiertas -->
        <router-link
          v-if="authStore.isAdmin || authStore.hasPermission('conciliacion.conciliar')"
          to="/conciliacion/partidas-abiertas"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-rose-300 dark:hover:border-rose-600 hover:shadow-md transition-all text-left block group"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Partidas Abiertas</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Reporte de pendientes por fecha de corte</div>
            </div>
          </div>
        </router-link>

        <!-- SAP Incompletos -->
        <router-link
          v-if="authStore.isAdmin || authStore.hasPermission('conciliacion.imcompletos')"
          to="/conciliacion/sap-incompletos"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md transition-all text-left block group"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">SAP Incompletos</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Reporte de datos faltantes en SAP</div>
            </div>
          </div>
        </router-link>

        <!-- Reporte Maestro -->
        <router-link
          v-if="authStore.isAdmin || authStore.hasPermission('conciliacion.reporte')"
          to="/conciliacion/reporte-maestro"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all text-left block group"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 dark:text-white text-sm">Reporte Maestro</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">Reporte unificado completo con descarga a Excel</div>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useAuthStore } from '@/stores/auth'
import { NUMBER_LOCALE } from '@/plugins/locale'

const store = useConciliacionStore()
const authStore = useAuthStore()

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const años = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

// Estado inicial: mes actual
const today = new Date()
const filtros = reactive({
  mm: String(today.getMonth() + 1).padStart(2, '0'),
  yyyy: String(today.getFullYear())
})

function formatMonto(monto: number): string {
  return (monto || 0).toLocaleString(NUMBER_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function actualizarDashboard() {
  try {
    const params = filtros.mm ? { mm: filtros.mm, yyyy: filtros.yyyy } : { yyyy: filtros.yyyy }
    await store.fetchDashboard(params)
  } catch {
    // handled
  }
}

onMounted(async () => {
  actualizarDashboard()
})
</script>
