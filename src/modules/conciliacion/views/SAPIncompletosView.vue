<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-2 mb-1">
          <router-link to="/conciliacion" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conciliación</router-link>
          <span class="text-gray-400 dark:text-gray-500">/</span>
          <span class="text-sm text-gray-700 dark:text-gray-300">SAP Incompletos</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Movimientos SAP Incompletos</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Registros sincronizados con información faltante para la conciliación automática.</p>
      </div>

      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all hover:shadow-md">
        <div class="relative w-full sm:max-w-xs">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            v-model="search"
            type="text"
            placeholder="Buscar por referencia, banco..."
            class="block w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div class="flex items-center gap-2">
          <button 
            @click="refreshData" 
            :disabled="store.loading"
            class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-all shadow-sm active:scale-95"
          >
            <svg v-if="!store.loading" class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <svg v-else class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      <!-- Table Content -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table v-if="filteredData.length > 0" class="w-full text-sm text-left">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha / Banco</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Origen / Ref</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Observaciones</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Identificadores SAP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="item in filteredData" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-sm font-semibold text-gray-900 dark:text-white">{{ formatDate(item.fecha) }}</div>
                  <div class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{{ item.banco }}</div>
                  <div class="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{{ item.cuenta }}</div>
                </td>
                <td class="px-4 py-4">
                   <div class="flex items-center gap-1.5">
                    <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px] font-bold uppercase tracking-tight">
                      {{ item.origen }}
                    </span>
                    <span class="text-xs font-mono font-medium text-gray-500">#{{ item.numero_origen }}</span>
                  </div>
                  <div class="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1.5 truncate max-w-[200px]" :title="item.referencia1">
                    {{ item.referencia1 }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span class="text-sm font-black text-gray-900 dark:text-white font-mono">
                    ${{ formatMonto(item.monto) }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="text-xs text-gray-600 dark:text-gray-300 max-w-xs line-clamp-2" :title="item.observaciones">
                    {{ item.observaciones }}
                  </div>
                  <div v-if="item.info_detallada" class="inline-flex mt-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded text-[10px] font-medium border border-amber-100 dark:border-amber-800/30 italic">
                    {{ item.info_detallada }}
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="flex flex-col gap-2">
                    <!-- Trans ID -->
                    <div class="flex items-center gap-2 group/id">
                      <span class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase w-8">Trans</span>
                      <div class="flex items-center bg-blue-50 dark:bg-blue-900/40 border border-blue-100 dark:border-blue-800 rounded-md overflow-hidden">
                        <span class="px-2 py-0.5 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold">
                          {{ item.trans_id }}
                        </span>
                        <button 
                          @click="copyText(String(item.trans_id))"
                          class="p-1 bg-blue-100/50 dark:bg-blue-800/50 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                          title="Copiar Trans ID"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <!-- Line ID -->
                    <div class="flex items-center gap-2 group/id">
                      <span class="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase w-8">Line</span>
                      <div class="flex items-center bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 rounded-md overflow-hidden">
                        <span class="px-2 py-0.5 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                          {{ item.line_id }}
                        </span>
                        <button 
                          @click="copyText(String(item.line_id))"
                          class="p-1 bg-indigo-100/50 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors"
                          title="Copiar Line ID"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Empty State -->
          <div v-else-if="!store.loading" class="px-5 py-20 text-center">
            <div class="relative inline-block mb-6">
               <div class="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl scale-150 animate-pulse"></div>
               <div class="relative flex items-center justify-center w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shadow-sm">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 class="text-xl font-bold text-gray-900 dark:text-white">¡No hay datos incompletos!</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">Todos los movimientos sincronizados de SAP cuentan con la información requerida para el proceso de conciliación.</p>
          </div>

          <!-- Loading State -->
          <div v-else class="px-5 py-24 text-center">
            <div class="relative inline-block mb-4">
              <div class="w-12 h-12 border-4 border-blue-100 dark:border-gray-700 rounded-full"></div>
              <div class="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400 animate-pulse">Analizando registros de SAP...</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <transition 
        enter-active-class="transform transition ease-out duration-300" 
        enter-from-class="translate-y-4 opacity-0" 
        enter-to-class="translate-y-0 opacity-100"
      >
        <div v-if="store.error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5 shadow-lg">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div class="ml-4">
              <h3 class="text-sm font-bold text-red-800 dark:text-red-200 uppercase tracking-wider">Error de Sincronización</h3>
              <p class="mt-1 text-sm text-red-700 dark:text-red-300 leading-relaxed">{{ store.error }}</p>
              <button 
                @click="refreshData" 
                class="mt-3 text-xs font-bold text-red-600 dark:text-red-400 underline decoration-dotted underline-offset-4 hover:text-red-800"
              >
                Reintentar cargar
              </button>
            </div>
            <div class="ml-auto pl-3">
              <button @click="store.clearError()" class="bg-transparent rounded-full p-1 text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'
import { APP_LOCALE, NUMBER_LOCALE } from '@/plugins/locale'

const store = useConciliacionStore()
const toast = useToast()
const search = ref('')

onMounted(async () => {
  await refreshData()
})

const refreshData = async () => {
  try {
    await store.fetchSAPIncompletos()
  } catch (e) {
    console.error('Error fetching SAP incompletos:', e)
  }
}

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copiado', `ID ${text} copiado al portapapeles`, 2000)
  } catch (err) {
    console.error('Error al copiar:', err)
  }
}

const filteredData = computed(() => {
  if (!search.value) return store.sapIncompletos
  const q = search.value.toLowerCase()
  return store.sapIncompletos.filter(item => 
    item.referencia1?.toLowerCase().includes(q) ||
    item.banco?.toLowerCase().includes(q) ||
    item.observaciones?.toLowerCase().includes(q) ||
    item.numero_origen?.toLowerCase().includes(q) ||
    item.info_detallada?.toLowerCase().includes(q)
  )
})

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString(APP_LOCALE, {
      day: '2-digit',
      month: 'short', 
      year: 'numeric' 
    })
  } catch {
    return dateStr
  }
}

function formatMonto(monto: number | undefined | null): string {
  if (monto === undefined || monto === null) return '0.00'
  return monto.toLocaleString(NUMBER_LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<style scoped>
/* Transiciones fluidas para la tabla */
table {
  border-collapse: separate;
  border-spacing: 0;
}

tbody tr {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

tbody tr:last-child td {
  border-bottom: none;
}
</style>
