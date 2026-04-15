<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-2 mb-1">
          <router-link to="/conciliacion" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conciliación</router-link>
          <span class="text-gray-400 dark:text-gray-500">/</span>
          <span class="text-sm text-gray-700 dark:text-gray-300">Novedades</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Novedades y Conciliación Manual</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Discrepancias entre movimientos bancarios y SAP que requieren revisión</p>
      </div>

      <!-- Filtros -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Banco</label>
            <select v-model="filtros.id_banco" class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
              <option :value="undefined">Todos</option>
              <option v-for="b in store.bancos" :key="b.id_banco" :value="b.id_banco">{{ b.nombre_banco }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Desde</label>
            <input v-model="filtros.fecha_desde" type="date" class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
            <input v-model="filtros.fecha_hasta" type="date" class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
          </div>
          <button @click="buscar" :disabled="store.loading" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors">
            Buscar
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>

      <!-- Sin novedades -->
      <div v-else-if="store.novedades && store.novedades.total_casos === 0" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
        <svg class="mx-auto h-12 w-12 text-emerald-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-gray-600 dark:text-gray-400">No hay novedades en el período seleccionado</p>
      </div>

      <!-- Novedades -->
      <div v-else-if="store.novedades && store.novedades.total_casos > 0" class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Mostrando <span class="font-semibold text-gray-900 dark:text-white">{{ store.novedades.total_casos }}</span> novedades para 
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 ml-1">
              {{ selectedBancoName }}
            </span>
          </p>
          <button
            v-if="selectedSap.length > 0 || selectedBanca.length > 0"
            @click="ejecutarManual"
            :disabled="conciliandoManual || selectedSap.length === 0 || selectedBanca.length === 0"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg v-if="conciliandoManual" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Conciliar Manual ({{ selectedSap.length }} SAP + {{ selectedBanca.length }} Banca)
          </button>
        </div>

        <!-- Cards por novedad -->
        <div
          v-for="(novedad, idx) in store.novedades.novedades"
          :key="idx"
          class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <!-- Header de la novedad -->
          <div class="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getTipoNovedadClass(novedad.tipo_novedad)"
              >
                {{ novedad.tipo_novedad }}
              </span>
              <span v-if="novedad.referencia_comun" class="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Ref: {{ novedad.referencia_comun }}
              </span>
            </div>
            <div class="text-right">
              <span v-if="novedad.diferencia !== 0" class="text-sm font-medium" :class="novedad.diferencia > 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'">
                Δ ${{ Math.abs(novedad.diferencia).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
            </div>
          </div>

          <!-- Contenido: dos columnas -->
          <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
            <!-- Movimientos SAP -->
            <div class="p-3">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Movimientos SAP</p>
                <span class="text-[10px] text-blue-500 font-semibold px-1 bg-blue-50 dark:bg-blue-900/20 rounded">Origen SAP</span>
              </div>
              
              <!-- Header tabla SAP -->
              <div v-if="novedad.movimientos_sap.length > 0" class="flex items-center gap-2 px-1 mb-1 border-b border-gray-100 dark:border-gray-700 pb-1">
                <div class="w-3.5 h-3.5"></div> <!-- Placeholder para checkbox -->
                <span class="text-[10px] font-bold text-gray-400 uppercase w-20">Fecha</span>
                <span class="text-[10px] font-bold text-gray-400 uppercase flex-1">Referencia</span>
                <span class="text-[10px] font-bold text-gray-400 uppercase w-24 text-right">Monto</span>
              </div>

              <div v-if="novedad.movimientos_sap.length === 0" class="text-xs text-gray-400 dark:text-gray-500 italic py-2 text-center">Sin movimientos SAP</div>
              <div v-for="mov in novedad.movimientos_sap" :key="mov.id" class="flex items-center gap-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded px-1 transition-colors">
                <input
                  type="checkbox"
                  :value="Number(mov.id)"
                  v-model="selectedSap"
                  class="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <span class="text-xs text-gray-500 dark:text-gray-400 w-20">{{ mov.fecha }}</span>
                <span class="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate font-mono" :title="mov.referencia">{{ mov.referencia }}</span>
                <span class="text-xs font-semibold text-gray-900 dark:text-white w-24 text-right">${{ mov.monto.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
              </div>
            </div>

            <!-- Movimientos Banca -->
            <div class="p-3">
              <div class="flex items-center justify-between mb-2">
                <p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Movimientos Banco</p>
                <div class="flex gap-1">
                   <span class="text-[10px] text-emerald-500 font-semibold px-1 bg-emerald-50 dark:bg-emerald-900/20 rounded">Extracto</span>
                </div>
              </div>

              <!-- Header tabla Banca -->
              <div v-if="novedad.movimientos_banca.length > 0" class="flex items-center gap-2 px-1 mb-1 border-b border-gray-100 dark:border-gray-700 pb-1">
                <div class="w-3.5 h-3.5"></div> <!-- Placeholder para checkbox -->
                <span class="text-[10px] font-bold text-gray-400 uppercase w-20">Fecha</span>
                <span class="text-[10px] font-bold text-gray-400 uppercase flex-1">Referencia</span>
                <span class="text-[10px] font-bold text-gray-400 uppercase w-24 text-right">Monto</span>
              </div>

              <div v-if="novedad.movimientos_banca.length === 0" class="text-xs text-gray-400 dark:text-gray-500 italic py-2 text-center">Sin movimientos del banco</div>
              <div v-for="mov in novedad.movimientos_banca" :key="mov.id" class="flex items-center gap-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 rounded px-1 transition-colors">
                <input
                  type="checkbox"
                  :value="Number(mov.id)"
                  v-model="selectedBanca"
                  class="h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <span class="text-xs text-gray-500 dark:text-gray-400 w-20">{{ mov.fecha }}</span>
                <span class="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate font-mono" :title="mov.referencia">{{ mov.referencia }}</span>
                <span class="text-xs font-semibold text-gray-900 dark:text-white w-24 text-right">${{ mov.monto.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
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
import { ref, reactive, onMounted, computed } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'

const store = useConciliacionStore()
const toast = useToast()

const today = new Date()
const monthAgo = new Date()
monthAgo.setMonth(monthAgo.getMonth() - 1)

const filtros = reactive({
  id_banco: undefined as number | undefined,
  fecha_desde: monthAgo.toISOString().split('T')[0],
  fecha_hasta: today.toISOString().split('T')[0],
})

const selectedSap = ref<number[]>([])
const selectedBanca = ref<number[]>([])
const conciliandoManual = ref(false)

const selectedBancoName = computed(() => {
  if (!filtros.id_banco) return 'Todos los bancos'
  const b = store.bancos.find(b => b.id_banco === filtros.id_banco)
  return b ? b.nombre_banco : 'Banco seleccionado'
})

onMounted(async () => {
  if (!store.hasBancos) await store.fetchBancos()
  await buscar()
})

async function buscar() {
  selectedSap.value = []
  selectedBanca.value = []
  try {
    await store.fetchNovedades(filtros)
  } catch {
    // handled
  }
}

function getTipoNovedadClass(tipo: string): string {
  const map: Record<string, string> = {
    POSIBLE_MATCH_REFERENCIA: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
    MONTO_DIFERENTE: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    SOLO_SAP: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    SOLO_BANCA: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300',
    FECHA_DIFERENTE: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  }
  return map[tipo] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
}

async function ejecutarManual() {
  if (selectedSap.value.length === 0 || selectedBanca.value.length === 0) {
    toast.error('Selección requerida', 'Seleccione al menos un movimiento de SAP y uno del Banco')
    return
  }

  conciliandoManual.value = true
  try {
    await store.conciliarManual({
      ids_sap: selectedSap.value,
      ids_banca: selectedBanca.value,
      comentario: 'Conciliación manual desde frontend',
    })
    toast.success('Conciliación manual exitosa', 'Los movimientos han sido conciliados')
    // Refrescar
    await buscar()
  } catch (e: any) {
    toast.error('Error', e.message || 'No se pudo conciliar')
  } finally {
    conciliandoManual.value = false
  }
}
</script>
