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
                :disabled="enProgreso"
              />
            </div>
            <div>
              <label class="block text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 mb-1 ml-1">Hasta</label>
              <input
                v-model="fechaHasta"
                type="date"
                class="w-full px-3 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                :disabled="enProgreso"
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
          :disabled="enProgreso"
          class="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg v-if="enProgreso" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ enProgreso ? 'Sincronizando...' : 'Sincronizar desde SAP' }}
        </button>
      </div>

      <!-- En progreso: barra de progreso en vivo -->
      <div v-if="enProgreso" class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-5">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium text-orange-800 dark:text-orange-200">Sincronizando movimientos...</p>
          <p v-if="sync?.total_filas" class="text-xs font-mono text-orange-700 dark:text-orange-300">
            {{ sync.procesados ?? 0 }} / {{ sync.total_filas }}
          </p>
        </div>
        <div class="w-full h-2 bg-orange-100 dark:bg-orange-900/40 rounded-full overflow-hidden">
          <div
            v-if="sync?.total_filas"
            class="h-full bg-orange-500 transition-all duration-500"
            :style="{ width: `${porcentajeProgreso}%` }"
          ></div>
          <div v-else class="h-full bg-orange-500 animate-pulse w-full"></div>
        </div>
        <p v-if="!sync?.total_filas" class="text-xs text-orange-600 dark:text-orange-400 mt-2">Consultando SAP HANA, esto puede tardar unos segundos...</p>
      </div>

      <!-- Resultado (COMPLETADO) -->
      <div v-if="sync?.estado === 'COMPLETADO'" class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-5">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="font-medium text-emerald-800 dark:text-emerald-200">Sincronización completada</p>
            <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-emerald-100 dark:border-emerald-900/50">
                <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">{{ sync.insertados ?? 0 }}</p>
                <p class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mt-1">Nuevos</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-blue-100 dark:border-blue-900/50">
                <p class="text-xl font-bold text-blue-600 dark:text-blue-400">{{ sync.actualizados ?? 0 }}</p>
                <p class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mt-1">Actualizados</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-amber-100 dark:border-amber-900/50">
                <p class="text-xl font-bold text-amber-600 dark:text-amber-400">{{ sync.registros_incompletos ?? 0 }}</p>
                <p class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mt-1">Incompletos</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-100 dark:border-gray-900/50">
                <p class="text-[11px] font-bold text-gray-700 dark:text-gray-300 leading-tight">
                  {{ sync.fecha_desde_filtro }}<br/>
                  <span class="text-[10px] text-gray-400 font-normal">al {{ sync.fecha_hasta_filtro }}</span>
                </p>
                <p class="text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mt-1">Período</p>
              </div>
            </div>
            <p v-if="sync.alertas_conciliados_modificados" class="mt-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              ⚠ {{ sync.alertas_conciliados_modificados }} movimiento{{ sync.alertas_conciliados_modificados === 1 ? '' : 's' }} ya conciliado{{ sync.alertas_conciliados_modificados === 1 ? '' : 's' }} cambió de valor en esta resincronización. Revisa el historial de sincronizaciones para más detalle.
            </p>
          </div>
        </div>
      </div>

      <!-- Resultado (ERROR) -->
      <div v-if="sync?.estado === 'ERROR'" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-700 dark:text-red-300">{{ sync.error_mensaje || 'La sincronización falló' }}</p>
        </div>
      </div>

      <!-- Error de validación / red -->
      <div v-if="errorGeneral" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-red-700 dark:text-red-300">{{ errorGeneral }}</p>
          <button @click="errorGeneral = ''" class="ml-auto text-red-500 hover:text-red-700 text-sm">✕</button>
        </div>
      </div>

      <div class="text-center">
        <button
          @click="mostrarHistorial = true"
          class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline"
        >
          Ver historial de sincronizaciones
        </button>
      </div>
    </div>

    <HistorialSincronizacionesModal v-if="mostrarHistorial" @close="mostrarHistorial = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'
import HistorialSincronizacionesModal from '../components/HistorialSincronizacionesModal.vue'

const POLL_INTERVAL_MS = 2000

const store = useConciliacionStore()
const toast = useToast()

const fechaDesde = ref('')
const fechaHasta = ref('')
const errorGeneral = ref('')
const mostrarHistorial = ref(false)
let pollTimer: ReturnType<typeof setInterval> | null = null

const sync = computed(() => store.sincronizacionActual)
const enProgreso = computed(() => sync.value?.estado === 'EN_PROGRESO')
const porcentajeProgreso = computed(() => {
  if (!sync.value?.total_filas) return 0
  return Math.min(100, Math.round(((sync.value.procesados ?? 0) / sync.value.total_filas) * 100))
})

onMounted(async () => {
  const today = new Date()
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(today.getDate() - 14)
  fechaHasta.value = today.toISOString().split('T')[0]
  fechaDesde.value = fourteenDaysAgo.toISOString().split('T')[0]

  // Si el usuario recarga la página mientras hay una sincronización corriendo, retomar el polling.
  try {
    const ultima = await store.fetchUltimaSincronizacionSAP()
    if (ultima?.estado === 'EN_PROGRESO') iniciarPolling()
  } catch {
    // sin historial previo o error de red al consultar; no bloquea la pantalla
  }
})

onUnmounted(() => detenerPolling())

function iniciarPolling() {
  detenerPolling()
  pollTimer = setInterval(async () => {
    try {
      const ultima = await store.fetchUltimaSincronizacionSAP()
      if (ultima?.estado !== 'EN_PROGRESO') {
        detenerPolling()
        if (ultima?.estado === 'COMPLETADO') {
          toast.success('Sincronización completa', `${ultima.insertados ?? 0} nuevos, ${ultima.actualizados ?? 0} actualizados`)
        } else if (ultima?.estado === 'ERROR') {
          toast.error('Sincronización fallida', ultima.error_mensaje || 'La sincronización terminó con error')
        }
      }
    } catch {
      // error transitorio de red en el polling: se reintenta en el siguiente tick
    }
  }, POLL_INTERVAL_MS)
}

function detenerPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function handleSync() {
  errorGeneral.value = ''

  if (!fechaDesde.value || !fechaHasta.value) {
    toast.error('Campos requeridos', 'Debe seleccionar ambas fechas.')
    return
  }
  if (new Date(fechaDesde.value) > new Date(fechaHasta.value)) {
    toast.error('Rango inválido', 'La fecha inicial no puede ser mayor a la final.')
    return
  }

  try {
    await store.iniciarSyncSAP(fechaDesde.value, fechaHasta.value)
    toast.success('Sincronización iniciada', 'Se está ejecutando en segundo plano')
    iniciarPolling()
  } catch (e: any) {
    if (e.response?.data?.error_code === 'SYNC_EN_CURSO') {
      toast.warning('Ya hay una sincronización en curso', e.response.data.message)
      await store.fetchUltimaSincronizacionSAP()
      iniciarPolling()
    } else {
      errorGeneral.value = e.response?.data?.message || e.message || 'No se pudo iniciar la sincronización'
      toast.error('Error de sincronización', errorGeneral.value)
    }
  }
}
</script>
