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
              <tr v-for="proceso in store.historial" :key="proceso.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-4 py-3 text-gray-900 dark:text-gray-200 text-xs">
                  <div>{{ proceso.fecha_proceso }}</div>
                  <div class="text-[10px] text-gray-400">{{ formatDate(proceso.created_at) }}</div>
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
                      @click="verDetalle(proceso.id)"
                      class="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                      title="Ver detalle"
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
              <p v-if="store.detalleProceso" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ store.detalleProceso.estado }} · {{ store.detalleProceso.fecha_proceso }} · {{ store.detalleProceso.banco }}
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

            <div v-else-if="store.detalleProceso" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- SAP -->
              <div>
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                  Movimientos SAP ({{ store.detalleProceso.movimientos_sap.length }})
                </h4>
                <div class="space-y-1">
                  <div
                    v-for="mov in store.detalleProceso.movimientos_sap"
                    :key="mov.id"
                    class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-gray-400 dark:text-gray-500">{{ mov.fecha }}</span>
                      <span class="text-gray-700 dark:text-gray-300 truncate font-mono">{{ mov.referencia }}</span>
                    </div>
                    <span class="font-medium text-gray-900 dark:text-white ml-2">${{ mov.monto.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                  <div v-if="store.detalleProceso.movimientos_sap.length === 0" class="text-xs text-gray-400 italic py-2">No hay movimientos SAP</div>
                </div>
              </div>

              <!-- Banca -->
              <div>
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Movimientos Banco ({{ store.detalleProceso.movimientos_banca.length }})
                </h4>
                <div class="space-y-1">
                  <div
                    v-for="mov in store.detalleProceso.movimientos_banca"
                    :key="mov.id"
                    class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-gray-400 dark:text-gray-500">{{ mov.fecha }}</span>
                      <span class="text-gray-700 dark:text-gray-300 truncate font-mono">{{ mov.referencia }}</span>
                    </div>
                    <span class="font-medium text-gray-900 dark:text-white ml-2">${{ mov.monto.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</span>
                  </div>
                  <div v-if="store.detalleProceso.movimientos_banca.length === 0" class="text-xs text-gray-400 italic py-2">No hay movimientos del banco</div>
                </div>
              </div>
            </div>

            <!-- Totales -->
            <div v-if="store.detalleProceso" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">Total SAP</span>
                <span class="font-semibold text-gray-900 dark:text-white">${{ formatMonto(store.detalleProceso.total_sap) }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-500 dark:text-gray-400">Total Banco</span>
                <span class="font-semibold text-gray-900 dark:text-white">${{ formatMonto(store.detalleProceso.total_banco) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Diferencia</span>
                <span class="text-lg font-bold" :class="store.detalleProceso.diferencia !== 0 ? 'text-amber-600' : 'text-emerald-600'">
                  ${{ formatMonto(store.detalleProceso.diferencia) }}
                </span>
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

function formatMonto(monto: number): string {
  return monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
