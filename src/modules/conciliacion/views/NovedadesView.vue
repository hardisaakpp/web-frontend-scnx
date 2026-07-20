<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-64px)] flex flex-col">
    
    <!-- Filtros Superiores -->
    <div class="flex-shrink-0 space-y-4 mb-6">
      <div class="flex items-center justify-between">
        <div>
           <div class="flex items-center gap-2 mb-1">
            <router-link to="/conciliacion" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 transition-colors font-medium">Conciliación</router-link>
            <span class="text-gray-400">/</span>
            <span class="text-sm text-gray-700 dark:text-gray-300 font-medium font-medium">Novedades</span>
          </div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white uppercase tracking-tight">Sugerencias de Conciliación</h1>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm flex items-end gap-3 text-sm">
        <div class="flex-1">
          <label class="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Banco</label>
          <select v-model="filtros.id_banco" class="w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white">
            <option :value="undefined" disabled>Seleccione un banco</option>
            <option v-for="b in store.bancos" :key="b.id_banco" :value="b.id_banco">{{ b.nombre_banco }}</option>
          </select>
        </div>
        <div class="w-44">
           <label class="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Desde</label>
           <input v-model="filtros.fecha_desde" type="date" class="w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white" />
        </div>
        <div class="w-44">
           <label class="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Hasta</label>
           <input v-model="filtros.fecha_hasta" type="date" class="w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white" />
        </div>
        <button @click="buscar" :disabled="store.loading" class="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">
          {{ store.loading ? 'Consultando...' : 'Consultar' }}
        </button>
      </div>
    </div>

    <!-- ÁREA PRINCIPAL -->
    <div class="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
      
      <!-- LISTADO DE TARJETAS (CASOS) -->
      <div class="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
        <div v-if="!store.novedades?.novedades.length" class="py-20 text-center text-gray-400 italic font-medium">No hay sugerencias disponibles</div>
        
        <div v-for="(nov, idx) in store.novedades?.novedades" :key="idx" 
          class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col group transition-all hover:border-blue-400"
        >
          <!-- Cabecera de la Tarjeta -->
          <div class="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div class="flex items-center gap-3">
              <span class="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded uppercase">Caso #{{ idx+1 }}</span>
              <h3 class="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{{ nov.tipo_novedad }}</h3>
            </div>
            <button 
              @click="prepararCaso(idx)" 
              :disabled="!hasSelectionInCase(idx)"
              class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase rounded shadow-sm transition-all border-b-2 border-emerald-800 active:translate-y-0.5 disabled:opacity-30 disabled:grayscale"
            >
              Confirmar Selección
            </button>
          </div>

          <!-- Tablas Internas con POSIBILIDAD DE SELECCIÓN PERSONALIZADA -->
          <div class="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x dark:divide-gray-700">
            <!-- SAP Side -->
            <div class="flex-1">
              <table class="w-full text-[11px] text-left">
                <thead class="bg-gray-50/50 dark:bg-gray-900/30">
                  <tr class="text-[9px] text-gray-400 uppercase font-black border-b dark:border-gray-700">
                    <th class="px-3 py-2 w-8"></th>
                    <th class="px-3 py-2 text-blue-600">Saldos en SAP</th>
                    <th class="px-4 py-2">Referencia</th>
                    <th class="px-4 py-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                  <tr v-for="s in nov.movimientos_sap" :key="s.id" 
                    @click="toggleItemSelection('sap', s.id)"
                    :class="['hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors outline-none font-medium', isItemSelected('sap', s.id) ? 'bg-blue-50 dark:bg-blue-900/20' : '']"
                  >
                    <td class="px-3 py-2 text-center">
                       <div :class="['w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all', isItemSelected('sap', s.id) ? 'bg-blue-600 border-blue-600 shadow-sm' : 'border-gray-300 dark:border-gray-600']">
                        <svg v-if="isItemSelected('sap', s.id)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="4"/></svg>
                      </div>
                    </td>
                    <td class="px-3 py-2 text-gray-500 font-mono italic">{{ s.fecha }}</td>
                    <td class="px-4 py-2 font-mono text-gray-900 dark:text-white truncate max-w-[120px]" :title="s.referencia">{{ s.referencia }}</td>
                    <td class="px-4 py-2 text-right font-black font-mono text-gray-900 dark:text-white italic tracking-tighter">${{ formatMonto(s.monto) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Bank Side -->
            <div class="flex-1">
              <table class="w-full text-[11px] text-left">
                <thead class="bg-gray-50/50 dark:bg-gray-900/30">
                  <tr class="text-[9px] text-gray-400 uppercase font-black border-b dark:border-gray-700">
                    <th class="px-3 py-2 w-8"></th>
                    <th class="px-3 py-2 text-emerald-600">Extractos Banco</th>
                    <th class="px-4 py-2">Referencia</th>
                    <th class="px-4 py-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                  <tr v-for="b in nov.movimientos_banca" :key="b.id" 
                    @click="toggleItemSelection('banca', b.id)"
                    :class="['hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors outline-none font-medium', isItemSelected('banca', b.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : '']"
                  >
                    <td class="px-3 py-2 text-center">
                       <div :class="['w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-all', isItemSelected('banca', b.id) ? 'bg-emerald-600 border-emerald-600 shadow-sm' : 'border-gray-300 dark:border-gray-600']">
                        <svg v-if="isItemSelected('banca', b.id)" class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-width="4"/></svg>
                      </div>
                    </td>
                    <td class="px-3 py-2 text-gray-500 font-mono italic">{{ b.fecha }}</td>
                    <td class="px-4 py-2 font-mono text-gray-900 dark:text-white truncate max-w-[120px]" :title="b.referencia">{{ b.referencia }}</td>
                    <td class="px-4 py-2 text-right font-black font-mono text-gray-900 dark:text-white italic tracking-tighter">${{ formatMonto(b.monto) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- BOLSA LATERAL -->
      <div class="w-full lg:w-80 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden min-h-0">
        <div class="px-4 py-3 bg-gray-900 dark:bg-black text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-between">
           Bolsa de Conciliación
           <span v-if="bolsa.length" class="bg-blue-600 px-2 py-0.5 rounded text-[9px] shadow-sm">{{ bolsa.length }}</span>
        </div>
        <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
           <div v-if="!bolsa.length" class="py-20 text-center text-xs text-gray-400 italic font-medium font-medium">No hay lotes preparados</div>
           <div v-for="(g, idx) in bolsa" :key="idx" class="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 relative group shadow-sm transition-all hover:border-blue-300">
              <button @click="quitarDeBolsa(idx)" class="absolute top-2.5 right-2.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-width="2.5"/></svg>
              </button>
              <div class="text-[11px] space-y-1.5">
                 <div class="flex justify-between font-black text-gray-400 uppercase text-[9px] tracking-tight">
                    <span>Lote #{{ idx+1 }}</span>
                    <span class="truncate max-w-[120px]">{{ g.caseType }}</span>
                 </div>
                 <div class="flex justify-between items-center font-mono font-bold leading-none">
                    <div class="flex gap-2 font-mono">
                       <span class="text-blue-600 dark:text-blue-400">S:{{ g.ids_sap.length }}</span>
                       <span class="text-emerald-600 dark:text-emerald-400">B:{{ g.ids_banca.length }}</span>
                    </div>
                    <span v-if="g.status === 'success'" class="text-emerald-500 font-black italic flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
                      HECHO
                    </span>
                    <span v-else class="text-gray-900 dark:text-white font-black tracking-tighter italic">${{ formatMonto(g.total) }}</span>
                 </div>
              </div>
           </div>
        </div>
        <div v-if="bolsa.length > 0" class="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
           <button @click="ejecutarBolsa" :disabled="procesando || bolsa.every(g => g.status === 'success')" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-sm transition-all disabled:opacity-50 tracking-wider">
              {{ procesando ? 'Sincronizando...' : 'Guardar conciliaciones' }}
           </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'
import { NUMBER_LOCALE } from '@/plugins/locale'

const store = useConciliacionStore()
const toast = useToast()

const filtros = reactive({
  id_banco: undefined as number | undefined,
  fecha_desde: '',
  fecha_hasta: '',
})

const selectedItems = reactive({ sap: [] as string[], banca: [] as string[] })
const bolsa = ref<{ids_sap: string[], ids_banca: string[], total: number, status: string, caseType: string}[]>([])
const procesando = ref(false)

onMounted(async () => {
  if (!store.hasBancos) await store.fetchBancos()
  const d = new Date(); d.setDate(d.getDate() - 30)
  filtros.fecha_desde = d.toISOString().split('T')[0]
  filtros.fecha_hasta = new Date().toISOString().split('T')[0]
})

// Al recibir nuevas novedades, marcamos todo por defecto (personalización proactiva)
watch(() => store.novedades, (newVal) => {
  if (newVal) {
    selectedItems.sap = newVal.novedades.flatMap(n => n.movimientos_sap.map(m => m.id))
    selectedItems.banca = newVal.novedades.flatMap(n => n.movimientos_banca.map(m => m.id))
  }
}, { immediate: true })

async function buscar() {
  bolsa.value = []
  selectedItems.sap = []; selectedItems.banca = []
  try { await store.fetchNovedades(filtros) } catch {}
}

const toggleItemSelection = (side: 'sap' | 'banca', id: string) => {
  const arr = selectedItems[side]; const idx = arr.indexOf(id)
  if (idx > -1) arr.splice(idx, 1)
  else arr.push(id)
}

const isItemSelected = (side: 'sap' | 'banca', id: string) => selectedItems[side].includes(id)

const hasSelectionInCase = (idx: number) => {
  const nov = store.novedades!.novedades[idx]
  return nov.movimientos_sap.some(m => isItemSelected('sap', m.id)) || 
         nov.movimientos_banca.some(m => isItemSelected('banca', m.id))
}

function prepararCaso(idx: number) {
  const nov = store.novedades!.novedades[idx]
  const sapSel = nov.movimientos_sap.filter(m => isItemSelected('sap', m.id))
  const banSel = nov.movimientos_banca.filter(m => isItemSelected('banca', m.id))
  
  const total = sapSel.reduce((a,b) => a+b.monto, 0) || banSel.reduce((a,b) => a+b.monto, 0)
  
  bolsa.value.push({
    ids_sap: sapSel.map(m => m.id),
    ids_banca: banSel.map(m => m.id),
    total,
    status: 'idle',
    caseType: nov.tipo_novedad
  })
  
  // Limpiamos la selección de estos ítems para que desaparezcan del "pool" de ese caso
  sapSel.forEach(m => toggleItemSelection('sap', m.id))
  banSel.forEach(m => toggleItemSelection('banca', m.id))
}

function quitarDeBolsa(idx: number) { bolsa.value.splice(idx, 1) }

async function ejecutarBolsa() {
  procesando.value = true
  for (const g of bolsa.value.filter(x => x.status === 'idle')) {
    g.status = 'loading'
    try {
      await store.conciliarManual({ ids_sap: g.ids_sap, ids_banca: g.ids_banca, comentario: 'Revision de Novedades Sugerida' })
      g.status = 'success'
    } catch (e: any) {
      g.status = 'idle'; toast.error('Error', e.message); break
    }
  }
  procesando.value = false; if (bolsa.value.every(g => g.status === 'success')) { toast.success('Conciliaciones guardadas'); buscar() }
}
const formatMonto = (m: number) => m.toLocaleString(NUMBER_LOCALE, { minimumFractionDigits: 2 })
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
</style>
