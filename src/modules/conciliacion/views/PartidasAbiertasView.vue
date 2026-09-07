<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-64px)] flex flex-col">
    
    <!-- Header y Filtros -->
    <div class="flex-shrink-0 space-y-4 mb-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <router-link to="/conciliacion" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors font-medium">Conciliación</router-link>
            <span class="text-gray-400">/</span>
            <span class="text-sm text-gray-700 dark:text-gray-300 font-medium">Movimientos Pendientes</span>
          </div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white uppercase tracking-tight">Movimientos Pendientes</h1>
        </div>
        <div v-if="store.partidasAbiertas" class="flex gap-4 font-mono text-xs">
          <div class="text-right">
            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saldo SAP</p>
            <p class="font-bold text-blue-600">${{ formatMonto(store.partidasAbiertas.total_monto_sap_pendiente) }}</p>
          </div>
          <div class="text-right border-l dark:border-gray-700 pl-4">
            <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saldo Banco</p>
            <p class="font-bold text-emerald-600">${{ formatMonto(store.partidasAbiertas.total_monto_banca_pendiente) }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm flex items-end gap-3 text-sm">
        <div class="w-44">
          <label class="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Fecha de Corte</label>
          <input v-model="filtros.fecha_corte" type="date" class="w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white" />
        </div>
        <div class="flex-1">
          <label class="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Banco</label>
          <select v-model="filtros.id_banco" class="w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white">
            <option :value="undefined">Todos los bancos</option>
            <option v-for="b in store.bancos" :key="b.id_banco" :value="b.id_banco">{{ b.nombre_banco }}</option>
          </select>
        </div>
        <button @click="buscar" :disabled="store.loading" class="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm shadow-sm">
          {{ store.loading ? '...' : 'Consultar' }}
        </button>
      </div>
    </div>

    <!-- BOTÓN ACCIÓN SUPERIOR (VERDE ESMERALDA) -->
    <div class="flex-shrink-0 flex justify-center pb-4">
       <button 
        @click="prepararGrupo" 
        :disabled="!canPrepare"
        class="px-10 py-2.5 bg-green-600 dark:bg-green-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        Preparar Conciliación
      </button>
    </div>

    <!-- ÁREA DE TABLAS -->
    <div class="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-0">
      
      <!-- SAP -->
      <div class="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 class="text-xs font-bold text-blue-600 uppercase tracking-tighter">Saldos en SAP (Libros)</h3>
          <span v-if="store.partidasAbiertas" class="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 px-2 py-0.5 rounded">{{ store.partidasAbiertas.pendientes_sap.length }}</span>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <table class="w-full text-[11px] text-left">
            <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10 border-b dark:border-gray-700">
              <tr class="text-[9px] text-gray-400 uppercase select-none font-black">
                <th class="px-3 py-2 w-8 text-center uppercase">ID</th>
                <th @click="toggleSort('sap', 'fecha')" class="px-3 py-2 cursor-pointer hover:text-blue-600">Fecha</th>
                <th @click="toggleSort('sap', 'banco')" class="px-3 py-2 cursor-pointer hover:text-blue-600">Banco</th>
                <th @click="toggleSort('sap', 'referencia')" class="px-3 py-2 cursor-pointer hover:text-blue-600">Referencia</th>
                <th @click="toggleSort('sap', 'monto')" class="px-3 py-2 text-right cursor-pointer hover:text-blue-600">Monto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50 font-medium">
              <tr v-for="m in sortedSap" :key="m.id" @click="toggleSelection('sap', m.id)" :class="['hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors outline-none', isSelected('sap', m.id) ? 'bg-blue-50 dark:bg-blue-900/20' : '']">
                <td class="px-3 py-2">
                  <div :class="['w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all', isSelected('sap', m.id) ? 'bg-blue-600 border-blue-600 shadow-sm' : 'border-gray-300 dark:border-gray-600']">
                    <svg v-if="isSelected('sap', m.id)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="4"/></svg>
                  </div>
                </td>
                <td class="px-3 py-2 text-gray-500 whitespace-nowrap">{{ m.fecha }}</td>
                <td class="px-3 py-2 text-blue-600 dark:text-blue-400 font-black uppercase truncate max-w-[80px]" :title="m.banco">{{ m.banco || '—' }}</td>
                <td class="px-3 py-2 font-mono text-gray-900 dark:text-white truncate max-w-[120px]">{{ m.referencia }}</td>
                <td class="px-3 py-2 text-right font-black font-mono text-gray-900 dark:text-white tracking-tighter italic">${{ formatMonto(m.monto) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- BANCO -->
      <div class="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs">
          <h3 class="font-bold text-emerald-600 uppercase tracking-tighter">Extractos en Banco</h3>
          <span v-if="store.partidasAbiertas" class="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 px-2 py-0.5 rounded">{{ store.partidasAbiertas.pendientes_banca.length }}</span>
        </div>
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <table class="w-full text-[11px] text-left">
            <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10 border-b dark:border-gray-700">
              <tr class="text-[9px] text-gray-400 uppercase select-none font-black">
                <th class="px-3 py-2 w-8 text-center uppercase">ID</th>
                <th @click="toggleSort('banca', 'fecha')" class="px-3 py-2 cursor-pointer hover:text-emerald-600">Fecha</th>
                <th @click="toggleSort('banca', 'banco')" class="px-3 py-2 cursor-pointer hover:text-emerald-600">Banco</th>
                <th @click="toggleSort('banca', 'referencia')" class="px-3 py-2 cursor-pointer hover:text-emerald-600">Referencia</th>
                <th @click="toggleSort('banca', 'monto')" class="px-3 py-2 text-right cursor-pointer hover:text-emerald-600">Monto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50 font-medium">
              <tr v-for="m in sortedBanca" :key="m.id" @click="toggleSelection('banca', m.id)" :class="['hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors outline-none', isSelected('banca', m.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : '']">
                <td class="px-3 py-2">
                   <div :class="['w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all', isSelected('banca', m.id) ? 'bg-emerald-600 border-emerald-600 shadow-sm' : 'border-gray-300 dark:border-gray-600']">
                    <svg v-if="isSelected('banca', m.id)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="4"/></svg>
                  </div>
                </td>
                <td class="px-3 py-2 text-gray-500 whitespace-nowrap">{{ m.fecha }}</td>
                <td class="px-3 py-2 text-emerald-600 dark:text-emerald-400 font-black uppercase truncate max-w-[80px]" :title="m.banco">{{ m.banco || '—' }}</td>
                <td class="px-3 py-2 font-mono text-gray-900 dark:text-white truncate max-w-[120px]">{{ m.referencia }}</td>
                <td class="px-3 py-2 text-right font-black font-mono text-gray-900 dark:text-white tracking-tighter italic">${{ formatMonto(m.monto) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- BOLSA -->
      <div class="w-full lg:w-72 flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-0">
         <div class="px-4 py-3 bg-gray-900 dark:bg-black text-white text-[10px] font-bold uppercase tracking-widest border-b dark:border-gray-800 flex-shrink-0">
            Lotes Preparados
            <span v-if="bolsa.length" class="ml-2 bg-blue-600 px-1.5 py-0.5 rounded text-[9px]">{{ bolsa.length }}</span>
         </div>
         <div class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            <div v-if="bolsa.length === 0" class="py-10 text-center text-[10px] text-gray-400 italic">No hay grupos para sincronizar</div>
            <div v-for="(g, idx) in bolsa" :key="idx" class="p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded border dark:border-gray-600 relative transition-all group shadow-sm">
               <button v-if="g.status === 'idle'" @click="quitarDeBolsa(idx)" class="absolute top-1.5 right-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2.5"/></svg>
               </button>
               <div class="text-[11px] space-y-1.5">
                  <p class="font-black text-gray-400 uppercase tracking-tighter">Grupo #{{ idx+1 }}</p>
                  <div class="flex justify-between items-center font-mono font-bold">
                     <div class="flex gap-2">
                        <span class="text-blue-600 dark:text-blue-400">S:{{ g.ids_sap.length }}</span>
                        <span class="text-emerald-600 dark:text-emerald-400">B:{{ g.ids_banca.length }}</span>
                     </div>
                     <span v-if="g.status === 'success'" class="text-emerald-500 font-bold italic flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                        OK
                     </span>
                     <span v-else class="text-gray-900 dark:text-white">${{ formatMonto(g.total) }}</span>
                  </div>
               </div>
            </div>
         </div>
         <div v-if="bolsa.length > 0" class="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 flex-shrink-0">
            <button @click="ejecutarBolsa" :disabled="procesando || bolsa.every(g => g.status === 'success')" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all disabled:opacity-50 tracking-wider">
              {{ procesando ? 'Enviando...' : 'Guardar conciliaciones' }}
            </button>
         </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'
import { NUMBER_LOCALE } from '@/plugins/locale'

const store = useConciliacionStore()
const toast = useToast()

const filtros = reactive({
  fecha_corte: new Date().toISOString().split('T')[0],
  id_banco: undefined as number | undefined,
})

const selected = reactive({ sap: [] as string[], banca: [] as string[] })
const bolsa = ref<{ids_sap: string[], ids_banca: string[], total: number, status: string}[]>([])
const procesando = ref(false)

const sortSap = reactive({ key: 'fecha', dir: 'desc' })
const sortBanca = reactive({ key: 'fecha', dir: 'desc' })

onMounted(async () => {
  if (!store.hasBancos) await store.fetchBancos()
  await buscar()
})

async function buscar() {
  selected.sap = []; selected.banca = []
  try { await store.fetchPartidasAbiertas(filtros) } catch {}
}

const toggleSort = (side: 'sap' | 'banca', key: string) => {
  const config = side === 'sap' ? sortSap : sortBanca
  if (config.key === key) config.dir = config.dir === 'asc' ? 'desc' : 'asc'
  else { config.key = key; config.dir = 'asc' }
}

const sortItems = (items: any[], config: { key: string, dir: string }) => {
  return [...items].sort((a, b) => {
    let valA = a[config.key]; let valB = b[config.key]
    if (config.key === 'fecha') {
      const vA = new Date(valA || 0).getTime(); const vB = new Date(valB || 0).getTime()
      return config.dir === 'asc' ? vA - vB : vB - vA
    }
    if (typeof valA === 'string') return config.dir === 'asc' ? (valA||'').localeCompare(valB||'') : (valB||'').localeCompare(valA||'')
    return config.dir === 'asc' ? (valA||0) - (valB||0) : (valB||0) - (valA||0)
  })
}

const sortedSap = computed(() => sortItems(store.partidasAbiertas?.pendientes_sap || [], sortSap))
const sortedBanca = computed(() => sortItems(store.partidasAbiertas?.pendientes_banca || [], sortBanca))

const toggleSelection = (side: 'sap' | 'banca', id: string) => {
  const arr = selected[side]; const idx = arr.indexOf(id)
  if (idx > -1) arr.splice(idx, 1)
  else arr.push(id)
}

const isSelected = (side: 'sap' | 'banca', id: string) => selected[side].includes(id)
const canPrepare = computed(() => selected.sap.length > 0 || selected.banca.length > 0)

function prepararGrupo() {
  const sap = store.partidasAbiertas!.pendientes_sap.filter(p => selected.sap.includes(p.id))
  const ban = store.partidasAbiertas!.pendientes_banca.filter(p => selected.banca.includes(p.id))
  // SAP suele mandar el monto real
  const total = sap.reduce((a, b) => a + b.monto, 0) || ban.reduce((a, b) => a + b.monto, 0)
  
  bolsa.value.push({ ids_sap: [...selected.sap], ids_banca: [...selected.banca], total, status: 'idle' })
  selected.sap = []; selected.banca = []; toast.success('Añadido')
}

function quitarDeBolsa(idx: number) { bolsa.value.splice(idx, 1) }

async function ejecutarBolsa() {
  procesando.value = true
  for (const g of bolsa.value.filter(x => x.status === 'idle')) {
    g.status = 'loading'
    try {
      await store.conciliarManual({ ids_sap: g.ids_sap, ids_banca: g.ids_banca, comentario: 'Lote libre' })
      g.status = 'success'
    } catch (e: any) {
      g.status = 'idle'; toast.error('Error', e.message); break
    }
  }
  procesando.value = false; if (bolsa.value.every(g => g.status === 'success')) { toast.success('Completado'); buscar() }
}
const formatMonto = (m: number) => m.toLocaleString(NUMBER_LOCALE, { minimumFractionDigits: 2 })
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
</style>
