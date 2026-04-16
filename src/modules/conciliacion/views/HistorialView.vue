<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-2 mb-1">
          <router-link to="/conciliacion" class="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conciliación</router-link>
          <span class="text-gray-400 dark:text-gray-500">/</span>
          <span class="text-sm text-gray-700 dark:text-gray-300">Historial</span>
        </div>
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Historial de Conciliaciones</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Procesos de conciliación ejecutados (automáticos y manuales)</p>
      </div>

      <!-- Filtros -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Banco</label>
            <select v-model="filtros.id_banco" class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
              <option :value="null">Todos</option>
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
          <div>
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Estado</label>
            <select v-model="filtros.estado" class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
              <option :value="null">Todos</option>
              <option value="CONCILIADO">Conciliado</option>
              <option value="ANULADO">Anulado</option>
            </select>
          </div>
          <button @click="buscar" :disabled="store.loading" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors">
            Buscar
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.loading && !store.historial.length" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>

      <!-- Tabla -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table v-if="store.historial.length > 0" class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Banco / Cuenta</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Estado</th>
                <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">SAP</th>
                <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Banco</th>
                <th class="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Diferencia</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
                <th class="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
              <tr v-for="proceso in store.historial" :key="proceso.id || (proceso as any).id_proceso" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-4 py-3 text-gray-900 dark:text-gray-200 text-xs text-center">
                  <div class="font-medium">#{{ proceso.id || (proceso as any).id_proceso }}</div>
                  <div class="text-[10px] text-gray-400">{{ formatDate(proceso.created_at) }}</div>
                </td>
                <td class="px-4 py-3 text-gray-900 dark:text-gray-200 text-xs">
                  <div>{{ proceso.fecha_proceso || (proceso as any).fecha }}</div>
                </td>
                <td class="px-4 py-3 min-w-[150px]">
                  <div class="text-xs font-medium text-gray-900 dark:text-white">{{ proceso.banco }}</div>
                  <div class="text-[10px] text-gray-500 dark:text-gray-400">{{ proceso.cuenta }}</div>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="proceso.estado === 'CONCILIADO' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'"
                  >
                    {{ proceso.estado }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-mono font-medium">${{ formatMonto(proceso.total_sap) }}</td>
                <td class="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-mono font-medium">${{ formatMonto(proceso.total_banco) }}</td>
                <td class="px-4 py-3 text-right font-mono" :class="proceso.diferencia !== 0 ? 'text-amber-600 font-bold' : 'text-gray-400'">
                  ${{ formatMonto(proceso.diferencia) }}
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ proceso.usuario_creacion || '—' }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      @click="verDetalle(proceso.id || (proceso as any).id_proceso)"
                      class="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      v-if="proceso.estado === 'CONCILIADO'"
                      @click="confirmarRevertir(proceso.id)"
                      class="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                      title="Revertir"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="px-5 py-12 text-center">
            <svg class="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm text-gray-500 dark:text-gray-400">No hay procesos en el historial</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Ajuste los filtros o ejecute una conciliación</p>
          </div>
        </div>
      </div>

      <!-- Modal de detalle -->
      <div v-if="showDetalle" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showDetalle = false">
        <div class="fixed inset-0 bg-black/50" @click="showDetalle = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden z-10">
          <!-- Modal header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Detalle del Proceso</h3>
              <p v-if="store.detalleProceso" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider font-medium">
                {{ store.detalleProceso.estado }} · Lote: {{ store.detalleProceso.id_lote }} · {{ store.detalleProceso.banco }}
              </p>
            </div>
            <button @click="showDetalle = false" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal body -->
          <div class="overflow-y-auto max-h-[calc(80vh-5rem)] p-6">
            <div v-if="detalleLoading" class="flex items-center justify-center py-8">
              <div class="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            </div>

            <!-- Grid de Grupos -->
            <div v-if="store.detalleProceso" class="space-y-6">
              <div v-for="grupo in store.detalleProceso.grupos" :key="grupo.id_grupo" class="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <!-- Header del Grupo -->
                <div class="px-4 py-2 bg-white dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-600 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span :class="[
                      'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                      grupo.tipo === 'AUTOMATICA' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                    ]">
                      {{ grupo.tipo }}
                    </span>
                    <span class="text-xs font-mono text-gray-500">ID: {{ grupo.id_grupo }}</span>
                  </div>
                  <div class="text-xs font-bold text-gray-900 dark:text-white">
                    Total: ${{ formatMonto(grupo.monto_total) }}
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700 p-4 gap-4">
                  <!-- SAP -->
                  <div class="space-y-3">
                    <h5 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                       SAP
                    </h5>
                    <div class="space-y-2">
                      <div v-for="m in grupo.sap" :key="m.id" class="flex flex-col p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-xs font-mono text-gray-700 dark:text-gray-300 truncate" :title="m.referencia">{{ m.referencia }}</span>
                          <span class="text-xs font-bold text-gray-900 dark:text-white">${{ formatMonto(m.monto) }}</span>
                        </div>
                        <span v-if="m.fecha" class="text-[9px] text-gray-400 mt-1">{{ m.fecha }}</span>
                      </div>
                      <div v-if="!grupo.sap.length" class="text-xs text-gray-400 italic py-1 text-center">Sin registros SAP</div>
                    </div>
                  </div>

                  <!-- Banca -->
                  <div class="space-y-3">
                    <h5 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                       BANCO
                    </h5>
                    <div class="space-y-2">
                      <div v-for="m in grupo.banca" :key="m.id" class="flex flex-col p-2 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                        <div class="flex items-center justify-between gap-2">
                          <span class="text-xs font-mono text-gray-700 dark:text-gray-300 truncate" :title="m.referencia">{{ m.referencia }}</span>
                          <span class="text-xs font-bold text-gray-900 dark:text-white">${{ formatMonto(m.monto) }}</span>
                        </div>
                        <span v-if="m.fecha" class="text-[9px] text-gray-400 mt-1">{{ m.fecha }}</span>
                      </div>
                      <div v-if="!grupo.banca.length" class="text-xs text-gray-400 italic py-1 text-center">Sin registros bancarios</div>
                    </div>
                  </div>
                </div>
                
                <!-- Comentario -->
                <div v-if="grupo.comentario" class="px-4 py-2 bg-amber-50/50 dark:bg-amber-900/10 border-t border-gray-100 dark:border-gray-700">
                   <p class="text-[10px] text-amber-700 dark:text-amber-400 italic">"{{ grupo.comentario }}"</p>
                </div>
              </div>

              <!-- Totales Globales -->
              <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div class="bg-gray-900 dark:bg-black rounded-xl p-5 shadow-inner">
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                      <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Total SAP</p>
                      <p class="text-xl font-bold text-white">${{ formatMonto(store.detalleProceso.total_sap) }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Total Banco</p>
                      <p class="text-xl font-bold text-white">${{ formatMonto(store.detalleProceso.total_banco) }}</p>
                    </div>
                    <div class="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-gray-800 pt-4 md:pt-0 md:pl-6">
                      <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Diferencia</p>
                      <p class="text-2xl font-black" :class="(store.detalleProceso.total_sap - store.detalleProceso.total_banco) !== 0 ? 'text-amber-500' : 'text-emerald-400'">
                        ${{ formatMonto(store.detalleProceso.total_sap - store.detalleProceso.total_banco) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirmation dialog for revert -->
      <div v-if="showRevertConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showRevertConfirm = false">
        <div class="fixed inset-0 bg-black/50" @click="showRevertConfirm = false"></div>
        <div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 z-10">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">¿Revertir conciliación?</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Esta acción liberará todos los movimientos y marcará el proceso como ANULADO. Los movimientos podrán conciliarse de nuevo.</p>
              <div class="flex justify-end gap-3 mt-5">
                <button @click="showRevertConfirm = false" class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button
                  @click="ejecutarRevertir"
                  :disabled="revirtiendo"
                  class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg v-if="revirtiendo" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sí, revertir
                </button>
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
import { ref, reactive, onMounted } from 'vue'
import { useConciliacionStore } from '../stores/conciliacionStore'
import { useToast } from '@/composables/useToast'

const store = useConciliacionStore()
const toast = useToast()

const filtros = reactive({
  id_banco: null as number | null,
  fecha_desde: null as string | null,
  fecha_hasta: null as string | null,
  estado: null as string | null,
})

const showDetalle = ref(false)
const detalleLoading = ref(false)
const showRevertConfirm = ref(false)
const procesoIdToRevert = ref('')
const revirtiendo = ref(false)

onMounted(async () => {
  if (!store.hasBancos) store.fetchBancos()
  await buscar()
})

async function buscar() {
  try {
    await store.fetchHistorial(filtros)
  } catch {
    // handled
  }
}

async function verDetalle(idProceso: string) {
  showDetalle.value = true
  detalleLoading.value = true
  try {
    await store.fetchDetalleProceso(idProceso)
  } catch (e: any) {
    toast.error('Error', 'No se pudo cargar el detalle')
  } finally {
    detalleLoading.value = false
  }
}

function confirmarRevertir(idProceso: string) {
  procesoIdToRevert.value = idProceso
  showRevertConfirm.value = true
}

async function ejecutarRevertir() {
  revirtiendo.value = true
  try {
    await store.revertirConciliacion(procesoIdToRevert.value)
    toast.success('Conciliación revertida', 'Los movimientos han sido liberados')
    showRevertConfirm.value = false
  } catch (e: any) {
    toast.error('Error', e.message || 'No se pudo revertir')
  } finally {
    revirtiendo.value = false
  }
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return dateStr
  }
}

function formatMonto(monto: number | undefined | null): string {
  if (monto === undefined || monto === null) return '0.00'
  return monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
