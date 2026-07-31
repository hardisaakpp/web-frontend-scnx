<template>
  <div class="space-y-6 relative">
    <!-- Overlay de bloqueo cuando se ejecuta la importación -->
    <Teleport to="body">
      <div 
        v-if="procesoStore.loading && procesoStore.currentStep === 'migrar'"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
        @click.prevent
        @mousedown.prevent
        @mouseup.prevent
        @touchstart.prevent
        @touchmove.prevent
        @touchend.prevent
      >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center transition-colors duration-300">
        <div class="flex flex-col items-center gap-4">
          <svg class="animate-spin h-12 w-12 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Ejecutando Importación</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">Por favor espera mientras se completa el proceso...</p>
            <div class="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden transition-colors duration-300">
              <div
                class="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 transition-all duration-300"
                :style="{ width: `${procesoStore.progress}%` }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors duration-300">{{ procesoStore.progress }}% completado</p>
          </div>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Overlay de bloqueo cuando se ejecuta el envío a SAP desde Procesar ODC -->
    <Teleport to="body">
      <div 
        v-if="procesoStore.isBlocking || (procesoStore.loading && (procesoStore.currentStep === 'integrar-sap' || procesoStore.currentStep === 'procesar-oc'))"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
        @click.prevent
        @mousedown.prevent
        @mouseup.prevent
        @touchstart.prevent
        @touchmove.prevent
        @touchend.prevent
      >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center transition-colors duration-300">
        <div class="flex flex-col items-center gap-4">
          <svg class="animate-spin h-12 w-12 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
              {{ getModalTitle() }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
              {{ getModalMessage() }}
            </p>
            <div v-if="procesoStore.odcProcessId" class="mt-2 text-xs text-gray-500 dark:text-gray-400 font-mono transition-colors duration-300">
              ID: {{ procesoStore.odcProcessId }}
            </div>
            <div class="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden transition-colors duration-300">
              <div
                class="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 transition-all duration-300"
                :style="{ width: `${procesoStore.progress}%` }"
              ></div>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors duration-300">{{ procesoStore.progress }}% completado</p>
          </div>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Contenedor principal con bloqueo de interacción -->
    <div 
      :class="{
        'pointer-events-none opacity-75': procesoStore.isBlocking || (procesoStore.loading && (procesoStore.currentStep === 'migrar' || procesoStore.currentStep === 'integrar-sap' || procesoStore.currentStep === 'procesar-oc'))
      }"
    >
      <div class="space-y-6">
          <OdcSapVolverButton
            v-if="odcSapVolverTarget"
            :to="odcSapVolverTarget"
            :title="odcSapVolverTitle"
            class="shrink-0 self-start"
          />
          <!-- Botón de acción y estado -->
          <div class="flex flex-col gap-4 p-6 rounded-xl border border-white/30 dark:border-gray-600/30 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl"
            :class="getProcesoCardClass('procesar-oc')">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 dark:from-gray-700/20 via-transparent to-transparent pointer-events-none"></div>
            <div class="flex items-center gap-4 relative z-10 flex-1 min-w-0">
              <div 
                class="w-14 h-14 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md transition-all duration-300 border-2 relative overflow-hidden"
              :class="getProcesoIconClass('procesar-oc')"
            >
              <div class="absolute inset-0 bg-gradient-to-br from-white/30 dark:from-gray-700/30 to-transparent"></div>
              <div class="relative z-10">
                <span v-if="getStepStatus('procesar-oc') === 'active'" class="animate-spin">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
                <span v-else-if="getStepStatus('procesar-oc') === 'completed'">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span v-else-if="getStepStatus('procesar-oc') === 'error'">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              </div>
              <div class="relative z-10">
                <h3 class="text-lg font-semibold mb-1 transition-colors duration-300">{{ getStepTitle('procesar-oc') }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">{{ getStepDescription('procesar-oc') }}</p>
              </div>
            </div>
          </div>

          <!-- Barra de progreso para Procesar ODC / Integrar SAP -->
          <div v-if="procesoStore.loading && (procesoStore.currentStep === 'procesar-oc' || procesoStore.currentStep === 'integrar-sap')" 
               class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-2xl p-4 border border-white/30 dark:border-gray-600/30 relative overflow-hidden transition-all duration-300">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 dark:from-gray-700/20 via-transparent to-transparent pointer-events-none"></div>
            
            <!-- Efecto de ondas animadas (shimmer) -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
            
            <!-- Partículas/puntos animados -->
            <div class="absolute inset-0 pointer-events-none">
              <div class="absolute top-2 left-1/4 w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style="animation-delay: 0s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-1/2 w-2 h-2 bg-purple-400/60 rounded-full animate-bounce" style="animation-delay: 0.3s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-3/4 w-2 h-2 bg-pink-400/60 rounded-full animate-bounce" style="animation-delay: 0.6s; animation-duration: 1s;"></div>
            </div>
            
            <div class="flex items-center justify-between mb-2 relative z-10">
              <div class="flex items-center gap-2">
                <!-- Spinner animado -->
                <div class="relative w-4 h-4">
                  <svg class="animate-spin h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div class="absolute inset-0 border-2 border-indigo-300/30 dark:border-indigo-500/30 rounded-full animate-ping"></div>
                </div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors duration-300">Progreso del proceso</span>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400 font-semibold transition-colors duration-300">{{ procesoStore.progress }}%</span>
            </div>
            <div class="w-full h-4 bg-gray-200/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner relative z-10 transition-colors duration-300">
              <div
                class="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                :style="{ width: `${procesoStore.progress}%` }"
              >
                <!-- Efecto shimmer sobre la barra de progreso -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                
                <!-- Barra de progreso animada interna -->
                <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/30 overflow-hidden">
                  <div class="h-full bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300 animate-progress-bar"></div>
                </div>
                
                <!-- Efecto de pulso en la barra -->
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- Barra de progreso para Eliminar ODC -->
          <div v-if="eliminando" 
               class="flex items-center justify-between flex-wrap gap-4 p-6 rounded-xl border border-emerald-300/50 dark:border-emerald-700/50 backdrop-blur-xl transition-all duration-300 relative overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-100/80 dark:from-emerald-900/30 to-emerald-200/60 dark:to-emerald-800/40">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 dark:from-gray-700/20 via-transparent to-transparent pointer-events-none"></div>
            
            <!-- Efecto de ondas animadas (shimmer) -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
            
            <!-- Partículas/puntos animados -->
            <div class="absolute inset-0 pointer-events-none">
              <div class="absolute top-2 left-1/4 w-2 h-2 bg-red-400/60 rounded-full animate-bounce" style="animation-delay: 0s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-1/2 w-2 h-2 bg-red-500/60 rounded-full animate-bounce" style="animation-delay: 0.3s; animation-duration: 1s;"></div>
              <div class="absolute top-2 left-3/4 w-2 h-2 bg-red-600/60 rounded-full animate-bounce" style="animation-delay: 0.6s; animation-duration: 1s;"></div>
            </div>
            
            <div class="relative z-10 w-full space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <!-- Spinner animado -->
                  <div class="relative w-4 h-4">
                  <svg class="animate-spin h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div class="absolute inset-0 border-2 border-red-300/30 dark:border-red-500/30 rounded-full animate-ping"></div>
                </div>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors duration-300">Eliminando órdenes de compra</span>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400 font-semibold transition-colors duration-300">{{ progresoEliminar }}%</span>
            </div>
            <div class="w-full h-4 bg-gray-200/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-full overflow-hidden shadow-inner transition-colors duration-300">
                <div
                  class="h-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                  :style="{ width: `${progresoEliminar}%` }"
                >
                  <!-- Efecto shimmer sobre la barra de progreso -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  
                  <!-- Barra de progreso animada interna -->
                  <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/30 overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-orange-300 via-orange-400 to-orange-300 animate-progress-bar"></div>
                  </div>
                  
                  <!-- Efecto de pulso en la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabla de Órdenes de Compra (Todas) -->
          <div class="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-2xl border border-white/30 dark:border-gray-600/30 relative overflow-hidden transition-colors duration-300">
            <div class="absolute inset-0 bg-gradient-to-br from-white/20 dark:from-gray-700/20 via-transparent to-transparent pointer-events-none"></div>

            <!-- Buscador de pedidos/ODC -->
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <input
                id="search-procesar-oc"
                v-model.trim="searchProcesarOC"
                type="search"
                placeholder="Buscar por número de pedido, ODC SAP, estado..."
                class="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
              />
            </div>

            <div class="p-6">
            <div v-if="ordenesCompraStore.loading && ordenesCompraStore.ordenesCompra.length === 0" class="space-y-4">
              <LoadingSpinner message="Cargando órdenes de compra..." />
              <SkeletonTable />
            </div>

            <OrdenCompraTable 
              v-else
              :ordenes-compra="ordenesCompraStore.ordenesCompra"
              :loading="ordenesCompraStore.loading"
              :total-ordenes="ordenesCompraStore.total"
              :allow-delete="false"
              :current-page="currentPageOC"
              :page-size="pageSizeOC"
              server-paginated
              @integrar="handleIntegrarOC"
              @integrar-multiples="handleIntegrarOCMultiples"
              @ver-detalle-sap="handleVerDetalleSAP"
              @st-reintentado="handleStReintentado"
              ref="ordenCompraTableRef"
            />

            <!-- Paginación -->
            <div v-if="totalPagesOC > 1 && !ordenesCompraStore.loading" class="mt-4 flex items-center justify-between flex-wrap gap-4">
              <div class="text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                Mostrando {{ ocRangeStart }}–{{ ocRangeEnd }} de {{ ordenesCompraStore.total }} órdenes
                (página {{ currentPageOC }} de {{ totalPagesOC }}{{ searchProcesarOC ? ' — búsqueda en servidor' : '' }})
              </div>
              <QuickTablePagination
                v-model="currentPageOC"
                :total-pages="totalPagesOC"
                :disabled="ordenesCompraStore.loading || (procesoStore.loading && procesoStore.currentStep === 'migrar')"
                aria-label="Paginación de órdenes de compra"
              />
            </div>
            </div>
          </div>
      </div>

      <!-- Mensajes de error globales -->
      <div v-if="procesoStore.error" 
           :class="isConsultaMBA3Error(procesoStore.error) 
             ? 'bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-600 p-4 rounded-lg shadow-md transition-colors duration-300' 
             : 'bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-600 p-4 rounded-lg shadow-md transition-colors duration-300'">
        <div :class="isConsultaMBA3Error(procesoStore.error)
          ? 'absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-transparent pointer-events-none'
          : 'absolute inset-0 bg-gradient-to-br from-red-200/20 via-transparent to-transparent pointer-events-none'"></div>
        <div class="flex relative z-10">
          <div class="ml-3">
            <p :class="isConsultaMBA3Error(procesoStore.error)
              ? 'text-sm text-yellow-700 dark:text-yellow-300 font-medium transition-colors duration-300'
              : 'text-sm text-red-700 dark:text-red-300 font-medium transition-colors duration-300'">
              <strong>{{ isConsultaMBA3Error(procesoStore.error) ? 'Reintentar:' : 'Error:' }}</strong> {{ procesoStore.error }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Integración SAP -->
    <IntegracionSAPModal
      :is-open="showIntegracionSAPModal"
      :detalle="integracionSAPDetalle"
      :solicitudes-transferencia="integracionSAPSolicitudes"
      :estado-general="integracionSAPEstado"
      :show-retry-sap-cta="showIntegracionSAPRetryCta"
      :retry-loading="sapRetryLoading"
      @close="showIntegracionSAPModal = false"
      @retry-sap="handleRetryProcesoCompletoSAP"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import { onMounted, onUnmounted, nextTick } from '@vue/runtime-core'
import { useRoute } from 'vue-router'
import { useProcesoStore } from '../stores/procesoStore'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { useToast } from '@/composables/useToast'
import { APP_LOCALE } from '@/plugins/locale'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { Despacho, OrdenCompra, PedidoCompleto } from '../types'
import DespachosTable from '../components/DespachosTable.vue'
import OrdenCompraTable from '../components/OrdenCompraTable.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import IntegracionSAPModal from '../components/IntegracionSAPModal.vue'
import OdcSapVolverButton from '@/components/OdcSapVolverButton.vue'
import type { AjusteDetalle, IntegracionSAPDetalle, ProcesoCompletoSAPResponse, SolicitudesTransferencia } from '../types'
import { useOdcSapVolver } from '../../../composables/useOdcSapVolver'
import QuickTablePagination from '@/components/QuickTablePagination.vue'
import { ejecutarProcesoCompletoSap } from '../composables/ejecutarProcesoCompletoSap'
import { isTransientClientError, SAP_MAY_STILL_PROCESSING_MESSAGE } from '../utils/httpErrors'
import { isProcesoTransientError } from '../utils/procesoAsyncHelpers'

const procesoStore = useProcesoStore()
const ordenesCompraStore = useOrdenesCompraStore()
const toast = useToast()
const route = useRoute()
const { target: odcSapVolverTarget, title: odcSapVolverTitle } = useOdcSapVolver()

// Estados para modal de integración SAP
const showIntegracionSAPModal = ref(false)
const integracionSAPDetalle = ref<IntegracionSAPDetalle | null>(null)
const integracionSAPSolicitudes = ref<SolicitudesTransferencia | null>(null)
const integracionSAPEstado = ref<'success' | 'partial' | 'error'>('success')

/** Payload para re-ejecutar POST proceso-completo-sap tras fallo transitorio (retry_recommended). */
const sapRetryContext = ref<{ numeroPedido: string; ajustesDetalle: AjusteDetalle[] } | null>(null)
const sapRetryLoading = ref(false)

const showIntegracionSAPRetryCta = computed(() => {
  if (!sapRetryContext.value) return false
  const d = integracionSAPDetalle.value
  return !!(d && d.retry_recommended === true && !d.success)
})

function aplicarRespuestaProcesoCompletoSAPAlModal(response: ProcesoCompletoSAPResponse) {
  const envio = response.envio_sap
  const errorMsg = response.error ?? response.message ?? null
  const solicitudes =
    response.solicitudes_transferencia ?? envio?.solicitudes_transferencia ?? null

  if (envio) {
    integracionSAPDetalle.value = {
      oc_id: envio.oc_id ?? '',
      success: !!envio.doc_num,
      doc_num: envio.doc_num ?? null,
      doc_entry: envio.doc_entry ?? null,
      numero_oc_sap: (envio as { numero_oc_sap?: string | null }).numero_oc_sap ?? null,
      message: envio.message ?? response.message ?? null,
      error: envio.error ?? errorMsg,
      error_message: envio.error ?? errorMsg,
      error_code: (envio as { error_code?: string | null }).error_code ?? null,
      error_source: (envio as { error_source?: string | null }).error_source ?? null,
      solicitudes_transferencia: envio.solicitudes_transferencia ?? null,
      sap_response: null,
      sap_error_details: null,
      retry_recommended: envio.retry_recommended ?? null,
      proveedor: integracionSAPDetalle.value?.proveedor
    }
  }

  integracionSAPSolicitudes.value = solicitudes

  const innerStatus =
    response.status === 'success' || response.status === 'partial' || response.status === 'error'
      ? response.status
      : envio?.doc_num != null
        ? 'success'
        : response.error
          ? 'partial'
          : 'error'

  if (innerStatus === 'success') {
    integracionSAPEstado.value =
      solicitudes && solicitudes.transferencias_errores > 0 ? 'partial' : 'success'
  } else if (innerStatus === 'partial') {
    integracionSAPEstado.value = 'partial'
  } else {
    integracionSAPEstado.value = 'error'
  }
}

async function handleRetryProcesoCompletoSAP() {
  const ctx = sapRetryContext.value
  if (!ctx || sapRetryLoading.value) return
  sapRetryLoading.value = true
  try {
    const response = await ejecutarProcesoCompletoSap(ctx.numeroPedido, ctx.ajustesDetalle, {
      onFallbackSync: () => {
        toast.info('Proceso en segundo plano no disponible', 'Se ejecutará en modo síncrono.')
      },
      onResumePending: () => {
        toast.info('Proceso en curso', 'Retomando el envío SAP iniciado anteriormente...')
      },
    })
    aplicarRespuestaProcesoCompletoSAPAlModal(response)
    if (response.envio_sap?.doc_num != null) {
      sapRetryContext.value = null
      toast.success('Envío a SAP', response.message || 'Proceso completado correctamente.')
    } else if (response.envio_sap?.retry_recommended !== true) {
      sapRetryContext.value = null
    }
  } catch (e: unknown) {
    if (isProcesoTransientError(e)) {
      toast.warning('Tiempo de espera agotado', SAP_MAY_STILL_PROCESSING_MESSAGE)
      await Promise.all([
        ordenesCompraStore.fetchEstadisticas(),
        cargarOrdenesCompraPendientes(),
      ]).catch((err) => console.warn('[handleRetryProcesoCompletoSAP] refresh:', err))
      return
    }
    const err = e as { response?: { data?: { message?: string; detail?: string } }; message?: string }
    const detail = err?.response?.data?.detail
    const msg =
      (typeof detail === 'string' ? detail : undefined) ??
      err?.response?.data?.message ??
      err?.message ??
      'No se pudo reintentar'
    toast.error('Error al reintentar envío a SAP', msg)
  } finally {
    sapRetryLoading.value = false
  }
}

// Estados para despachos
const hayDespachos = ref(false)
const despachosCount = ref(0)
const despachos = ref<Despacho[]>([])
const loadingDespachos = ref(false)
const initialSearchDespacho = ref<string>('')
const currentPageDespachos = ref(1)
const pageSizeDespachos = ref(10)
const filteredDespachosCount = ref(0)

// ========== POLLING AUTOMÁTICO ==========
// Configuración de auto-refresh
const POLLING_INTERVAL = 5 * 60 * 1000 // 5 minutos (ajustable según necesidades)
let pollingIntervalId: ReturnType<typeof setInterval> | null = null
let timeDisplayIntervalId: ReturnType<typeof setInterval> | null = null
const lastRefreshTime = ref<Date | null>(null)
const nextRefreshTime = ref<Date | null>(null)
const timeAgoDisplay = ref<string>('')

// Paginación de órdenes de compra (servidor)
// Paginación ODC en /proceso: tamaño fijo (no configurable desde preferencias ni API)
const OC_LIST_PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 400
const currentPageOC = ref(1)
const pageSizeOC = OC_LIST_PAGE_SIZE
const totalPagesOCServer = ref(1)
const searchProcesarOC = ref('')
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

// ⭐ NUEVO: Estados para pedidos confirmados
const pedidosConfirmados = ref<PedidoCompleto[]>([])
const pedidosConfirmadosCount = ref(0)
const loadingPedidosConfirmados = ref(false)
const currentPagePedidos = ref(1)
const pageSizePedidos = ref(10)
const filteredPedidosCount = ref(0)
const searchPedidosConfirmados = ref('')

// Estado para eliminación
const eliminando = ref(false)
const progresoEliminar = ref(0)

// Estado para generación de ODC desde despachos
const generandoODC = ref(false)
const progresoGenerarODC = ref(0)

// Constantes de timing (evitar números mágicos)
const AUTO_RESET_DELAY = 1000  // ms para auto-reset del estado 'ready'
const ERROR_RESET_DELAY = 2000  // ms para reset después de error
const PROGRESS_UPDATE_INTERVAL = 300  // ms para actualizar progreso simulado
const PROGRESS_DISPLAY_DELAY = 300  // ms para mostrar 100% antes de continuar

// Estado para almacén destino
const almacenDestino = ref<string>('')

// Lista de almacenes disponibles según iniciales del SKU
const almacenesDisponibles = ref([
  { codigo: 'RL-CD', nombre: 'Roland' },
  { codigo: 'RG-CD', nombre: 'Regions' },
  { codigo: 'OUT-CD', nombre: 'Descuentón' }
])

// Referencia al componente de tabla de órdenes de compra
const ordenCompraTableRef = ref<{ 
  clearSendingState?: () => void
  clearSelection?: () => void
  clearSendingMultipleState?: () => void
} | null>(null)

// Referencia al componente de tabla de despachos
const despachosTableRef = ref<{
  clearSendingState?: () => void
  clearSelection?: () => void
  clearSendingMultipleState?: () => void
} | null>(null)

// Funciones auxiliares
function isConsultaMBA3Error(error: string | null): boolean {
  if (!error) return false
  return error.toLowerCase().includes('error al ejecutar consulta en mba3') || 
         error.toLowerCase().includes('ejecutar consulta en mba3')
}

// Computed: pedidos confirmados filtrados por búsqueda (número, proveedor, estado)
const filteredPedidosConfirmados = computed(() => {
  const term = searchPedidosConfirmados.value.toLowerCase()
  if (!term) return pedidosConfirmados.value
  return pedidosConfirmados.value.filter((p) => {
    const cab = p.cabecera
    const numero = (cab?.numero_pedido ?? '').toString().toLowerCase()
    const proveedor = (cab?.proveedor_nombre ?? '').toLowerCase()
    const estado = (cab?.estado ?? '').toLowerCase()
    return numero.includes(term) || proveedor.includes(term) || estado.includes(term)
  })
})

// Computed para verificar si hay órdenes de compra disponibles
const hayOrdenesCompra = computed(() => {
  const totalODCs = ordenesCompraStore.pendientes + ordenesCompraStore.enviadas + ordenesCompraStore.errores
  return totalODCs > 0
})

// Computed para transformar las órdenes de compra al formato esperado por DespachosTable
const ordenesCompraParaDespachos = computed(() => {
  return ordenesCompraStore.ordenesCompra.map((oc: OrdenCompra) => ({
    despacho_id: oc.despacho_id ?? undefined,
    referencia_despacho: oc.referencia_despacho || undefined
  }))
})

// Función para verificar despachos disponibles
async function verificarDespachos() {
  try {
    const result = await mba3ConsultasService.getDespachosCount()
    hayDespachos.value = result.disponible && result.count > 0
    despachosCount.value = result.count || 0
    
    if (hayDespachos.value && despachos.value.length === 0) {
      await cargarDespachos()
    }
  } catch (error: any) {
    console.error('Error al verificar despachos:', error)
    if (error.message && (error.message.includes('Decimal') || error.message?.includes('serialización'))) {
      console.warn('⚠️ Error de serialización en el backend. El backend necesita convertir Decimal a números.')
    }
    hayDespachos.value = false
    despachosCount.value = 0
  }
}

// ⭐ NUEVO: Función para cargar pedidos confirmados
async function cargarPedidosConfirmados() {
  loadingPedidosConfirmados.value = true
  try {
    const response = await mba3ConsultasService.getPedidosConfirmados({
      page: currentPagePedidos.value,
      pageSize: pageSizePedidos.value
    })
    pedidosConfirmados.value = response.data || []
    pedidosConfirmadosCount.value = response.total || 0
    filteredPedidosCount.value = response.total || 0
  } catch (error: any) {
    console.error('Error al cargar pedidos confirmados:', error)
    toast.error('Error', 'No se pudieron cargar los pedidos confirmados')
    pedidosConfirmados.value = []
    pedidosConfirmadosCount.value = 0
    filteredPedidosCount.value = 0
  } finally {
    loadingPedidosConfirmados.value = false
  }
}

// Función para cargar la lista de despachos
async function cargarDespachos() {
  loadingDespachos.value = true
  try {
    // Cargar todos los despachos (el backend devuelve todos)
    const response = await mba3ConsultasService.getDespachos(1, 1000)
    despachos.value = response.data || []
    
    // Actualizar el conteo con el valor más confiable disponible
    // La longitud del array es la fuente más confiable, ya que refleja lo que realmente está en la BD
    if (response.data && response.data.length > 0) {
      despachosCount.value = response.data.length
    } else if (response.metadata?.count !== undefined) {
      despachosCount.value = response.metadata.count
    } else if (response.total !== undefined) {
      despachosCount.value = response.total
    }
    
    // Resetear el conteo filtrado (se actualizará cuando DespachosTable emita el evento)
    filteredDespachosCount.value = 0
    
    // Resetear a la primera página
    currentPageDespachos.value = 1
    
    // Actualizar tiempo de última actualización
    lastRefreshTime.value = new Date()
    
    // Actualizar display de tiempo en tiempo real
    startTimeDisplayUpdate()
  } catch (error: any) {
    console.error('Error al cargar despachos:', error)
    toast.error('Error al cargar despachos', error.message || 'No se pudieron cargar los despachos')
    despachos.value = []
    filteredDespachosCount.value = 0
  } finally {
    loadingDespachos.value = false
  }
}

// ========== FUNCIONES DE POLLING AUTOMÁTICO ==========

// Función para auto-refrescar despachos (sin pestaña migrar; no ejecuta)
async function autoRefreshDespachos() {
  // Pestaña migrar/despachos retirada
}

// Iniciar polling
function startPolling() {
  stopPolling() // Limpiar cualquier intervalo existente
  
  pollingIntervalId = setInterval(autoRefreshDespachos, POLLING_INTERVAL)
  if (import.meta.env.DEV) console.log(`✅ Polling iniciado: cada ${POLLING_INTERVAL / 1000 / 60} minutos`)
  
  // Calcular próximo refresh
  nextRefreshTime.value = new Date(Date.now() + POLLING_INTERVAL)
}

// Detener polling
function stopPolling() {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId)
    pollingIntervalId = null
    if (import.meta.env.DEV) console.log('⏹️ Polling detenido')
  }
}

// Actualizar el display del tiempo en tiempo real
function updateTimeDisplay() {
  if (lastRefreshTime.value) {
    timeAgoDisplay.value = formatTimeAgo(lastRefreshTime.value)
  }
}

// Iniciar actualización del display de tiempo
function startTimeDisplayUpdate() {
  stopTimeDisplayUpdate() // Limpiar cualquier intervalo existente
  
  // Actualizar inmediatamente
  updateTimeDisplay()
  
  // Actualizar cada 30 segundos para mantenerlo actualizado
  timeDisplayIntervalId = setInterval(updateTimeDisplay, 30000)
}

// Detener actualización del display de tiempo
function stopTimeDisplayUpdate() {
  if (timeDisplayIntervalId) {
    clearInterval(timeDisplayIntervalId)
    timeDisplayIntervalId = null
  }
}

// Función helper para formatear tiempo transcurrido
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  
  if (seconds < 60) return 'Hace menos de 1 min'
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Hace ${minutes} min`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Hace ${hours}h ${minutes % 60}min`
  
  return date.toLocaleString(APP_LOCALE, { 
    day: '2-digit', 
    month: 'short', 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Computed para total de páginas de despachos
// Usar el conteo de despachos filtrados para calcular las páginas correctamente
const totalPagesDespachos = computed(() => {
  const count = filteredDespachosCount.value > 0 ? filteredDespachosCount.value : despachosCount.value
  return Math.ceil(count / pageSizeDespachos.value)
})

// Función para manejar el cambio en el conteo de despachos filtrados
function handleFilteredCountChanged(count: number) {
  filteredDespachosCount.value = count
  // Resetear a la primera página si estamos en una página que ya no existe
  const totalPages = Math.ceil(count / pageSizeDespachos.value)
  if (currentPageDespachos.value > totalPages && totalPages > 0) {
    currentPageDespachos.value = 1
  }
}

// Funciones de paginación para despachos
function prevPageDespachos() {
  if (currentPageDespachos.value > 1) {
    currentPageDespachos.value--
  }
}

function nextPageDespachos() {
  if (currentPageDespachos.value < totalPagesDespachos.value) {
    currentPageDespachos.value++
  }
}

// Función para cargar órdenes de compra pendientes
// Función auxiliar para refrescar datos con retry inteligente
async function refrescarDatosOrdenesCompra(maxRetries: number = 1, delayMs: number = 500) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await ordenesCompraStore.fetchEstadisticas()
      await cargarOrdenesCompraPendientes()
      
      // Asegurar que Vue detecte los cambios reactivos
      await nextTick()
      
      if (import.meta.env.DEV) console.log('[refrescarDatosOrdenesCompra] ✅ Datos sincronizados con el servidor')
      return // Si se completa exitosamente, salir
    } catch (error: any) {
      console.warn(`Intento ${attempt + 1}/${maxRetries + 1} de refrescar datos falló:`, error)
      if (attempt < maxRetries) {
        // Esperar un poco antes de reintentar
        await new Promise(resolve => setTimeout(resolve, delayMs))
      } else {
        // En el último intento, lanzar el error
        console.error('Error al refrescar datos después de múltiples intentos:', error)
        throw error
      }
    }
  }
}

/** Listado paginado en servidor (todos los estados, búsqueda opcional). */
async function cargarOrdenesCompraPendientes() {
  ordenesCompraStore.loading = true
  try {
    const search = searchProcesarOC.value.trim()
    const response = await mba3ConsultasService.getOrdenesCompra(
      undefined,
      currentPageOC.value,
      OC_LIST_PAGE_SIZE,
      search ? { search } : undefined
    )

    const rows = (response.data ?? []).slice(0, OC_LIST_PAGE_SIZE)
    ordenesCompraStore.ordenesCompra = rows.map((oc) => ({ ...oc }))
    const total =
      response.total ??
      response.metadata?.total ??
      response.metadata?.count ??
      rows.length
    ordenesCompraStore.total = total
    ordenesCompraStore.estadoFilter = undefined
    ordenesCompraStore.currentPage = currentPageOC.value

    totalPagesOCServer.value = Math.max(1, Math.ceil(total / OC_LIST_PAGE_SIZE))

    if (currentPageOC.value > totalPagesOCServer.value && totalPagesOCServer.value >= 1) {
      currentPageOC.value = totalPagesOCServer.value
      return
    }

    await nextTick()
  } catch (error: any) {
    console.error('Error al cargar órdenes de compra:', error)
    toast.error('Error al cargar órdenes', error.message || 'No se pudieron cargar las órdenes de compra')
    ordenesCompraStore.ordenesCompra = []
    ordenesCompraStore.total = 0
    totalPagesOCServer.value = 1
  } finally {
    ordenesCompraStore.loading = false
  }
}

const totalPagesOC = computed(() => totalPagesOCServer.value)

const ocRangeStart = computed(() => {
  if (ordenesCompraStore.total === 0) return 0
  return (currentPageOC.value - 1) * OC_LIST_PAGE_SIZE + 1
})

const ocRangeEnd = computed(() => {
  if (ordenesCompraStore.total === 0) return 0
  return Math.min(currentPageOC.value * OC_LIST_PAGE_SIZE, ordenesCompraStore.total)
})

watch(currentPageOC, (page, prev) => {
  if (page !== prev) {
    void cargarOrdenesCompraPendientes()
  }
})

watch(searchProcesarOC, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    searchDebounceTimer = null
    if (currentPageOC.value !== 1) {
      currentPageOC.value = 1
    } else {
      void cargarOrdenesCompraPendientes()
    }
  }, SEARCH_DEBOUNCE_MS)
})

async function refreshDatosTrasTimeoutProcesoLegado() {
  try {
    await Promise.all([
      ordenesCompraStore.fetchEstadisticas(),
      cargarOrdenesCompraPendientes(),
      cargarDespachos(),
    ])
  } catch (err) {
    console.warn('[ProcesoCompletoView] refresh tras timeout:', err)
  }
}

function esTimeoutProcesoLegado(error: unknown): boolean {
  return isProcesoTransientError(error)
}

// Funciones de ejecución de procesos
async function ejecutarMigrar() {
  try {
    toast.info('Ejecutando importación...', 'Importando despachos y guardando prefacturas en base de datos')
    await procesoStore.migrar()
    
    // Mostrar resultados si están disponibles
    if (procesoStore.resultados?.metadata?.save_status) {
      // showMigrarResults.value = true  // TODO: Mostrar modal de resultados
      const status = procesoStore.resultados.metadata.save_status
      toast.success(
        'Importación completada',
        `${status.prefacturas_guardadas || 0} guardadas, ${status.prefacturas_actualizadas || 0} actualizadas`
      )
    }
    
    // SIEMPRE cargar despachos después de la migración, independientemente del resultado
    // Intentar cargar con reintentos en caso de delay en la BD
    let intentos = 0
    const maxIntentos = 3
    const delayEntreIntentos = 500 // 500ms entre intentos
    
    const cargarDespachosConReintento = async () => {
      while (intentos < maxIntentos) {
        try {
          // Pequeño delay solo en reintentos (no en el primer intento)
          if (intentos > 0) {
            await new Promise(resolve => setTimeout(resolve, delayEntreIntentos))
          }
          
          // Cargar despachos directamente
          await cargarDespachos()
          
          // Si se cargaron despachos exitosamente (incluso si es 0), actualizar estado y salir
          despachosCount.value = despachos.value.length
          hayDespachos.value = despachos.value.length > 0
          return // Salir del loop si la carga fue exitosa (incluso con 0 despachos)
          
        } catch (err: any) {
          console.warn(`Intento ${intentos + 1}/${maxIntentos} de cargar despachos:`, err)
          intentos++
          
          // Si es el último intento, intentar verificar el conteo como fallback
          if (intentos >= maxIntentos) {
            try {
              await verificarDespachos()
              // Si el conteo indica que hay despachos, intentar cargar una vez más
              if (despachosCount.value > 0 && despachos.value.length === 0) {
                await cargarDespachos()
              }
            } catch (verifyErr) {
              console.warn('Error al verificar despachos después de migración:', verifyErr)
            }
            // No lanzar el error, solo loguearlo - queremos mostrar la tabla incluso si hay errores
            return
          }
        }
      }
    }
    
    // Intentar cargar despachos con reintentos
    await cargarDespachosConReintento()
    
    // Actualizar estadísticas y órdenes de compra después de la migración
    // para mantener los datos sincronizados (similar a los botones "Enviar" y "Enviar a SAP")
    // La migración puede generar nuevas órdenes de compra, por lo que es importante actualizar
    try {
      await refrescarDatosOrdenesCompra(2, 300)
    } catch (refreshError: any) {
      console.warn('Error al actualizar órdenes de compra después de migración:', refreshError)
      // No bloquear el flujo si falla la actualización, pero intentar al menos las estadísticas
      try {
        await ordenesCompraStore.fetchEstadisticas()
      } catch (statsError: any) {
        console.warn('Error al actualizar estadísticas después de migración:', statsError)
      }
    }
    
  } catch (error: any) {
    console.error('Error al importar:', error)
    const errorMessage = error.message || 'No se pudo completar la importación'

    if (esTimeoutProcesoLegado(error)) {
      toast.warning('Tiempo de espera agotado', SAP_MAY_STILL_PROCESSING_MESSAGE)
      await refreshDatosTrasTimeoutProcesoLegado()
    } else if (isConsultaMBA3Error(errorMessage)) {
      toast.warning('Error al ejecutar consulta', 'Por favor, intenta nuevamente haciendo clic en "Reintentar"')
    } else {
      toast.error('Error en importación', errorMessage)
    }
    
    // Intentar cargar despachos incluso si hubo error en la migración
    // (puede que haya despachos previos que mostrar)
    try {
      await cargarDespachos()
    } catch (loadError) {
      console.warn('Error al cargar despachos después de error en migración:', loadError)
    }
  }
}

// Funciones auxiliares para el modal
function getModalTitle(): string {
  if (procesoStore.odcProcessState === 'generating') {
    return 'Generando ODC'
  }
  if (procesoStore.odcProcessState === 'syncing') {
    return 'Sincronizando datos'
  }
  if (procesoStore.currentStep === 'integrar-sap') {
    return 'Enviando Órdenes a SAP'
  }
  return 'Procesando...'
}

function getModalMessage(): string {
  if (procesoStore.odcProcessState === 'generating') {
    return 'Por favor espera mientras se genera la orden de compra...'
  }
  if (procesoStore.odcProcessState === 'syncing') {
    return 'Actualizando información y verificando cambios...'
  }
  if (procesoStore.currentStep === 'integrar-sap') {
    return 'Por favor espera mientras se procesan y envían las órdenes de compra...'
  }
  return 'Por favor espera...'
}

// Función auxiliar para manejar la respuesta del backend (reduce duplicación)
// TODO: Refactorizar lógica duplicada entre handleGenerarODCIndividual y handleGenerarODCMultiples
async function handleODCResponse(
  response: any,
  despachoIds: string[],
  isMultiple: boolean = false
): Promise<{ shouldChangeTab: boolean; shouldShowWarning: boolean }> {
  const ocStatus = response?.metadata?.oc_status
  
  if (!ocStatus) {
    throw new Error('Respuesta del backend sin metadata oc_status')
  }
  
  // Manejar error
  if (ocStatus.status === 'error') {
    const errorMsg = ocStatus.detalles?.[0]?.error || (isMultiple ? 'Error al generar las ODCs' : 'Error al generar ODC')
    throw new Error(errorMsg)
  }
  
  // Manejar estado parcial
  if (ocStatus.status === 'partial') {
    toast.warning(
      isMultiple ? 'ODCs generadas parcialmente' : 'ODC generada parcialmente',
      `${ocStatus.oc_creadas} ODC(s) generada(s), ${ocStatus.oc_errores} con errores. Revisa los detalles.`
    )
    procesoStore.setODCProcessSyncing()
    await Promise.all([
      ordenesCompraStore.fetchEstadisticas(),
      cargarOrdenesCompraPendientes(),
      cargarDespachos()
    ])
    procesoStore.completeODCProcess()
    // Auto-reset después de un momento (UX)
    setTimeout(() => {
      if (procesoStore.odcProcessState === 'ready') {
        procesoStore.resetODCProcess()
      }
    }, AUTO_RESET_DELAY)
    return { shouldChangeTab: false, shouldShowWarning: true }
  }
  
  // Reservado: backend documenta oc_status 'processing' como futuro; hoy /procesar-oc es síncrono.
  if (ocStatus.status === 'processing') {
    toast.info(
      isMultiple ? 'ODCs en proceso' : 'ODC en proceso',
      'La orden de compra se está generando. Se actualizará automáticamente cuando esté lista.'
    )
    procesoStore.setODCProcessSyncing()
    // Sin poll de job hasta que el backend exponga process_id + GET resultado para procesar-oc.
    await Promise.all([
      ordenesCompraStore.fetchEstadisticas(),
      cargarOrdenesCompraPendientes(),
      cargarDespachos()
    ])
    procesoStore.completeODCProcess()
    setTimeout(() => {
      if (procesoStore.odcProcessState === 'ready') {
        procesoStore.resetODCProcess()
      }
    }, AUTO_RESET_DELAY)
    return { shouldChangeTab: true, shouldShowWarning: false }
  }
  
  // Manejar estado completed
  if (ocStatus.status === 'completed') {
    if (ocStatus.datos_sincronizados === true && ocStatus.despachos_actualizados === true) {
      // ✅ Backend confirma que TODO está listo
      
      // Actualizar UI optimísticamente (el backend ya confirmó)
      despachoIds.forEach(despachoId => {
        const despachoIndex = despachos.value.findIndex(d => d.despacho_id === despachoId)
        if (despachoIndex !== -1) {
          despachos.value[despachoIndex] = {
            ...despachos.value[despachoIndex],
            tiene_odc: true
          } as Despacho
        }
      })
      
      // Recargar datos (el backend ya confirmó que están listos)
      await Promise.all([
        ordenesCompraStore.fetchEstadisticas(),
        cargarOrdenesCompraPendientes(),
        cargarDespachos()
      ])
      
      toast.success(
        isMultiple ? 'ODCs generadas' : 'ODC generada',
        `${isMultiple ? `${ocStatus.oc_creadas || despachoIds.length} ODC(s) generada(s)` : 'Orden de compra generada exitosamente'}${ocStatus.oc_errores > 0 ? ` (con advertencias)` : ''}`
      )
      
      procesoStore.completeODCProcess()
      // Auto-reset después de un momento (UX)
      setTimeout(() => {
        if (procesoStore.odcProcessState === 'ready') {
          procesoStore.resetODCProcess()
        }
      }, AUTO_RESET_DELAY)
      
      return { shouldChangeTab: true, shouldShowWarning: false }
      
    } else {
      // ⚠️ Backend no confirma completamente, necesitamos sincronizar
      procesoStore.setODCProcessSyncing()
      
      // Recargar datos y esperar a que se actualicen
      await Promise.all([
        ordenesCompraStore.fetchEstadisticas(),
        cargarOrdenesCompraPendientes(),
        cargarDespachos()
      ])
      
      toast.success(
        isMultiple ? 'ODCs generadas' : 'ODC generada',
        isMultiple ? `${despachoIds.length} orden(es) de compra generada(s)` : 'La orden de compra se ha generado exitosamente'
      )
      
      procesoStore.completeODCProcess()
      setTimeout(() => {
        if (procesoStore.odcProcessState === 'ready') {
          procesoStore.resetODCProcess()
        }
      }, AUTO_RESET_DELAY)
      
      return { shouldChangeTab: true, shouldShowWarning: false }
    }
  }
  
  // Estado desconocido
  throw new Error(`Estado desconocido del backend: ${ocStatus.status}`)
}

// ⭐ NUEVO: Función para generar ODC desde pedido
async function handleGenerarODCDesdePedido(numeroPedido: string) {
  generandoODC.value = true
  progresoGenerarODC.value = 0
  
  try {
    toast.info('Generando ODC...', `Generando orden de compra para pedido ${numeroPedido}`)
    
    // Usar el nuevo endpoint que reutiliza la lógica de procesarOC
    const response = await procesoStore.procesarOCDesdePedido(numeroPedido)
    
    progresoGenerarODC.value = 100
    
    // Manejar respuesta similar a handleODCResponse
    const ocStatus = response?.metadata?.oc_status
    if (ocStatus?.status === 'completed') {
      toast.success('ODC generada', 'La orden de compra se ha generado exitosamente')
      await ordenesCompraStore.fetchEstadisticas()
      await cargarOrdenesCompraPendientes()
    } else if (ocStatus?.status === 'processing') {
      toast.info('ODC en proceso', 'La orden de compra se está generando. Revisa el estado en "Procesar ODC"')
      await cargarPedidosConfirmados()
    } else if (ocStatus?.status === 'partial') {
      toast.warning(
        'ODC generada parcialmente',
        `${ocStatus.oc_creadas} artículo(s) procesado(s), ${ocStatus.oc_errores} con errores`
      )
      await cargarPedidosConfirmados()
    } else {
      toast.success('ODC generada', 'La orden de compra se ha generado exitosamente')
      await cargarPedidosConfirmados()
    }
  } catch (error: any) {
    console.error('Error al generar ODC desde pedido:', error)
    if (esTimeoutProcesoLegado(error)) {
      toast.warning('Tiempo de espera agotado', SAP_MAY_STILL_PROCESSING_MESSAGE)
      await refreshDatosTrasTimeoutProcesoLegado()
    } else {
      toast.error('Error al generar ODC', error.message || 'No se pudo generar la orden de compra')
    }
  } finally {
    generandoODC.value = false
    progresoGenerarODC.value = 0
  }
}

// Funciones para generar ODC individual y múltiple
async function handleGenerarODCIndividual(despachoId: string) {
  // Iniciar el proceso (activa el modal)
  procesoStore.startODCProcess(despachoId)
  
  try {
    generandoODC.value = true
    progresoGenerarODC.value = 0
    
    const despacho = despachos.value.find(d => d.despacho_id === despachoId)
    const referencia = despacho?.codigo_factura || despachoId
    
    toast.info('Generando ODC...', `Generando orden de compra para despacho ${referencia}`)
    
    // Generar la ODC
    const response = await procesoStore.procesarOC(despachoId)
    
    progresoGenerarODC.value = 100
    
    // Manejar la respuesta del backend
    const result = await handleODCResponse(response, [despachoId], false)
    
    // Cambiar de pestaña solo si el proceso fue exitoso y completo
    if (result.shouldChangeTab) {
      await ordenesCompraStore.fetchEstadisticas()
      await cargarOrdenesCompraPendientes()
    }
    
    // Limpiar estado del botón individual
    if (despachosTableRef.value?.clearSendingState) {
      despachosTableRef.value.clearSendingState()
    }
    
  } catch (error: any) {
    console.error('Error al generar ODC individual:', error)

    if (despachosTableRef.value?.clearSendingState) {
      despachosTableRef.value.clearSendingState()
    }

    if (esTimeoutProcesoLegado(error)) {
      procesoStore.resetODCProcess()
      toast.warning('Tiempo de espera agotado', SAP_MAY_STILL_PROCESSING_MESSAGE)
      await refreshDatosTrasTimeoutProcesoLegado()
    } else {
      procesoStore.setODCProcessError(error.message || 'No se pudo generar la orden de compra')
      toast.error('Error al generar ODC', error.message || 'No se pudo generar la orden de compra')
      setTimeout(() => {
        procesoStore.resetODCProcess()
      }, ERROR_RESET_DELAY)
    }
  } finally {
    generandoODC.value = false
    progresoGenerarODC.value = 0
  }
}

async function handleGenerarODCMultiples(despachoIds: string[]) {
  // Iniciar el proceso
  procesoStore.startODCProcess(despachoIds)
  
  try {
    generandoODC.value = true
    progresoGenerarODC.value = 0
    
    toast.info('Generando ODCs...', `Generando ${despachoIds.length} orden(es) de compra`)
    
    // Si es un solo despacho, usar el método individual
    if (despachoIds.length === 1) {
      await handleGenerarODCIndividual(despachoIds[0])
      generandoODC.value = false
      progresoGenerarODC.value = 0
      return
    }
    
    // Si son múltiples, enviar array
    const response = await procesoStore.procesarOC(despachoIds)
    
    progresoGenerarODC.value = 100
    
    // Manejar la respuesta del backend
    const result = await handleODCResponse(response, despachoIds, true)
    
    // Cambiar de pestaña solo si el proceso fue exitoso y completo
    if (result.shouldChangeTab) {
      await ordenesCompraStore.fetchEstadisticas()
      await cargarOrdenesCompraPendientes()
    }
    
    // Limpiar estado de envío múltiple
    if (despachosTableRef.value?.clearSendingMultipleState) {
      despachosTableRef.value.clearSendingMultipleState()
    }
    
  } catch (error: any) {
    console.error('Error al generar ODCs múltiples:', error)

    if (despachosTableRef.value?.clearSendingMultipleState) {
      despachosTableRef.value.clearSendingMultipleState()
    }

    if (esTimeoutProcesoLegado(error)) {
      procesoStore.resetODCProcess()
      toast.warning('Tiempo de espera agotado', SAP_MAY_STILL_PROCESSING_MESSAGE)
      await refreshDatosTrasTimeoutProcesoLegado()
    } else {
      procesoStore.setODCProcessError(error.message || 'No se pudieron generar las órdenes de compra')
      toast.error('Error al generar ODCs', error.message || 'No se pudieron generar las órdenes de compra')
      setTimeout(() => {
        procesoStore.resetODCProcess()
      }, ERROR_RESET_DELAY)
    }
  } finally {
    generandoODC.value = false
    progresoGenerarODC.value = 0
  }
}

async function handleVerDetalleSAP(oc: OrdenCompra) {
  if (!oc) return

  // 1) Si ya tenemos en memoria el detalle para ESTA OC, reutilizarlo tal cual
  if (integracionSAPDetalle.value && integracionSAPDetalle.value.oc_id === oc.oc_id) {
    integracionSAPEstado.value = integracionSAPDetalle.value.success ? 'success' : 'error'
    showIntegracionSAPModal.value = true
    return
  }

  // 2) No hay detalle en memoria (o es de otra OC): pedirlo al backend
  try {
    const response = await mba3ConsultasService.getIntegracionSAP(oc.oc_id)
    const envio = response.envio_sap
    if (!envio) {
      throw new Error('Respuesta sin envio_sap')
    }

    const detalle: IntegracionSAPDetalle = {
      oc_id: envio.oc_id,
      proveedor: (envio as { proveedor?: string }).proveedor ?? oc.proveedor ?? undefined,
      success: envio.success,
      doc_entry: envio.doc_entry ?? null,
      doc_num: envio.doc_num ?? null,
      numero_oc_sap: envio.numero_oc_sap ?? null,
      message: envio.message ?? oc.respuesta_sap ?? 'Enviada exitosamente',
      error: envio.error ?? null,
      error_message: envio.error ?? null,
      error_code: null,
      error_source: null,
      solicitudes_transferencia: null,
      sap_response: null,
      sap_error_details: null,
    }

    integracionSAPDetalle.value = detalle
    integracionSAPSolicitudes.value =
      response.solicitudes_transferencia ?? envio.solicitudes_transferencia ?? null
    integracionSAPEstado.value = envio.success ? 'success' : 'error'
    showIntegracionSAPModal.value = true
    return
  } catch (err: any) {
    if (err?.response?.status === 404) {
      if (import.meta.env.DEV) console.debug('[handleVerDetalleSAP] No hay integración SAP para esta OC (404), mostrando detalle mínimo')
    } else {
      console.warn('[handleVerDetalleSAP] Error al obtener integración SAP:', err)
      toast.warning('No se pudo cargar el detalle de integración', err?.response?.data?.detail ?? err?.message ?? 'Error desconocido')
    }
  }

  // 3) Fallback: detalle mínimo solo con datos de la OC (sin ITR)
  const detalle: IntegracionSAPDetalle = {
    oc_id: oc.oc_id,
    proveedor: oc.proveedor ?? undefined,
    success: true,
    doc_entry: oc.doc_entry ?? null,
    doc_num: oc.doc_num ?? null,
    numero_oc_sap: oc.numero_oc_sap ?? null,
    message: oc.respuesta_sap || 'Enviada exitosamente',
    error: null,
    error_message: null,
    error_code: null,
    error_source: null,
    solicitudes_transferencia: null,
    sap_response: null,
    sap_error_details: null,
  }

  integracionSAPDetalle.value = detalle
  integracionSAPSolicitudes.value = null
  integracionSAPEstado.value = 'success'
  showIntegracionSAPModal.value = true
}

/**
 * El usuario reintentó las ITR/ST de una OC ya enviada (no reenvía la ODC).
 * El backend ya invalidó su caché; aquí refrescamos estadísticas y la lista de OCs
 * para que los flags `st_pendientes_reintento` / `mostrar_reintentar_st` queden sincronizados.
 */
async function handleStReintentado(_payload: { oc: OrdenCompra; result: any }) {
  try {
    await Promise.all([
      ordenesCompraStore.fetchEstadisticas(),
      cargarOrdenesCompraPendientes(),
    ])
  } catch (err) {
    console.warn('[handleStReintentado] Error al refrescar lista de OCs tras reintento ST:', err)
  }
}

// Funciones de integración individuales
async function handleIntegrarOC(referenciaDespacho: string, almacenDestinoParam?: string) {
  // Verificar que no esté ya ejecutándose
  if (procesoStore.loading || ordenesCompraStore.loading) {
    return
  }
  
  try {
    // Establecer loading en procesoStore para mostrar el overlay
    procesoStore.loading = true
    procesoStore.currentStep = 'integrar-sap'
    procesoStore.progress = 0
    
    // Esperar a que Vue actualice el DOM para que el overlay aparezca
    await nextTick()
    
    const almacenMsg = almacenDestinoParam ? ` (Almacén: ${almacenDestinoParam})` : ''
    toast.info('Enviando orden a SAP...', `Enviando ${referenciaDespacho}${almacenMsg}`)
    
    // Simular progreso mientras se envía
    procesoStore.progress = 50
    
    // ✅ ESPERAR LA RESPUESTA COMPLETA del endpoint (esto toma ~5 segundos)
    // Usar almacén destino del parámetro si se proporciona, sino undefined
    const response = await mba3ConsultasService.integrarSAP(referenciaDespacho, almacenDestinoParam)
    
    // Completar el progreso
    procesoStore.progress = 100
    
    // ✅ ACTUALIZAR ESTADO LOCAL INMEDIATAMENTE basándose en la respuesta
    const metadata = response?.metadata || {}
    let detalles = metadata.detalles || []
    // Normalizar formato alternativo del backend: { resultado, oc_id, oc_doc_num } → detalle + solicitudes
    if (detalles.length === 0 && response?.resultado && typeof response.resultado === 'object' && response.oc_id) {
      const res = response.resultado as { success?: boolean; resultados?: Array<{ doc_entry?: number; doc_num?: number }> }
      const firstResult = res.resultados?.[0]
      const resp = response as any
      const envioSap = resp.envio_sap ?? resp
      detalles = [{
        oc_id: response.oc_id as string,
        success: res.success === true,
        doc_entry: firstResult?.doc_entry ?? envioSap.doc_entry ?? null,
        doc_num: firstResult?.doc_num ?? envioSap.doc_num ?? resp.oc_doc_num ?? null,
        numero_oc_sap: envioSap.numero_oc_sap ?? resp.numero_oc_sap ?? null,
        message: 'Enviada exitosamente',
        error: null,
        error_message: null,
        error_code: null,
        error_source: null,
        solicitudes_transferencia: {
          success: res.success === true,
          pedido_id: (response as any).pedido_id ?? '',
          total_tiendas: (res as any).total_tiendas ?? (res.resultados?.length ?? 0),
          transferencias_creadas: (res as any).transferencias_creadas ?? 0,
          transferencias_errores: (res as any).transferencias_errores ?? 0,
          resultados: (res as any).resultados ?? []
        }
      }]
    }

    if (detalles.length > 0) {
      const detalle = detalles[0]
      const success = detalle.success === true
      
      // Buscar y actualizar la orden en el array local
      const ordenIndex = ordenesCompraStore.ordenesCompra.findIndex(
        (oc: any) => oc.referencia_despacho === referenciaDespacho
      )
      
      if (ordenIndex !== -1) {
        // Crear un nuevo objeto para asegurar reactividad de Vue
        const ordenActualizada = { ...ordenesCompraStore.ordenesCompra[ordenIndex] }
        
        if (success) {
          ordenActualizada.estado = 'ENVIADA'
          ordenActualizada.numero_oc_sap = detalle.numero_oc_sap ?? detalle.doc_num?.toString() ?? null
          ordenActualizada.doc_entry = detalle.doc_entry || null
          ordenActualizada.doc_num = detalle.doc_num ?? null
          ordenActualizada.fecha_procesado = new Date().toISOString()
          ordenActualizada.respuesta_sap = detalle.message || 'Enviada exitosamente'
          
          const numOdc = detalle.numero_oc_sap ?? (detalle.doc_num != null ? String(detalle.doc_num) : null)
          const docInfo = detalle.doc_entry
            ? `DocEntry: ${detalle.doc_entry}${numOdc != null ? `, Num ODC: ${numOdc}` : ''}`
            : (numOdc != null ? `Num ODC: ${numOdc}` : 'N/A')
          toast.success('Orden enviada', docInfo)
        } else {
          ordenActualizada.estado = 'ERROR'
          // Usar error_message si existe, sino error
          const errorMsg = detalle.error_message || detalle.error || 'Error desconocido'
          ordenActualizada.error_message = errorMsg
          ordenActualizada.error_source = detalle.error_source || 'BACKEND'
          ordenActualizada.error_code = detalle.error_code || null
          ordenActualizada.fecha_procesado = new Date().toISOString()
          ordenActualizada.respuesta_sap = errorMsg
          
          // Parsear errores múltiples si están separados por ';'
          const errores = typeof errorMsg === 'string' && errorMsg.includes(';')
            ? errorMsg.split(';').map(e => e.trim()).filter(e => e.length > 0)
            : [errorMsg]
          
          // Determinar título según el origen del error
          const errorTitle = detalle.error_source === 'BACKEND' 
            ? 'Error de validación'
            : detalle.error_source === 'SAP_CONNECTION'
            ? 'Error de conexión con SAP'
            : detalle.error_source === 'SAP'
            ? 'Error de SAP'
            : 'Error al integrar'
          
          // Mostrar primer error en toast, resto en consola
          if (errores.length > 1) {
            console.warn(`[handleIntegrarOC] Múltiples errores para ${referenciaDespacho}:`, errores)
            toast.error(errorTitle, `${errores[0]} (+${errores.length - 1} error(es) más. Ver consola)`)
          } else {
            toast.error(errorTitle, errores[0])
          }
        }
        
        // Reemplazar la orden en el array (Vue detectará el cambio)
        ordenesCompraStore.ordenesCompra[ordenIndex] = ordenActualizada
        
        // Crear un nuevo array para forzar reactividad
        ordenesCompraStore.ordenesCompra = [...ordenesCompraStore.ordenesCompra]
        
        await nextTick()
        void ordenesCompraStore.fetchEstadisticas()

        if (import.meta.env.DEV) {
          console.log(
            `[handleIntegrarOC] ✅ Estado actualizado localmente: ${referenciaDespacho} → ${ordenActualizada.estado}`
          )
        }
      }
    }
    
    // Delay para que el usuario vea el cambio en la UI antes de cerrar el overlay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // ✅ Verificar si hay pedidos cerrados en la respuesta (Fase 6)
    const pedidosCerrados = response?.metadata?.pedidos_cerrados || []
    if (pedidosCerrados.length > 0) {
      toast.success(
        'Pedidos cerrados',
        `${pedidosCerrados.length} pedido(s) marcado(s) como CONFIRMADO_ENVIADO`
      )
      if (import.meta.env.DEV) console.log('📦 Pedidos cerrados después del envío:', pedidosCerrados)
    }
    
    // ⭐ Mostrar modal con resultados de integración
    const envioExitoso = detalles.length > 0 && detalles[0]?.success === true

    if (detalles.length > 0) {
      const detalle = detalles[0]
      integracionSAPDetalle.value = detalle
      // Leer ITR: puede venir en detalle, en metadata o en la raíz de la respuesta (según backend)
      integracionSAPSolicitudes.value =
        detalle.solicitudes_transferencia ??
        response?.metadata?.solicitudes_transferencia ??
        response?.solicitudes_transferencia ??
        null
      if (import.meta.env.DEV && !integracionSAPSolicitudes.value) {
        console.debug('[Integración SAP] solicitudes_transferencia no encontrado. Respuesta:', {
          enDetalle: !!detalle.solicitudes_transferencia,
          enMetadata: !!response?.metadata?.solicitudes_transferencia,
          enRaiz: !!response?.solicitudes_transferencia,
          keysDetalle: Object.keys(detalle),
          keysMetadata: response?.metadata ? Object.keys(response.metadata) : []
        })
      }

      // Determinar estado general
      const status = response?.status || (detalle.success ? 'success' : 'error')
      if (status === 'partial' || (detalle.success && integracionSAPSolicitudes.value && integracionSAPSolicitudes.value.transferencias_errores > 0)) {
        integracionSAPEstado.value = 'partial'
      } else if (status === 'error' || !detalle.success) {
        integracionSAPEstado.value = 'error'
      } else {
        integracionSAPEstado.value = 'success'
      }
      
      // Mostrar modal después de un pequeño delay para que el overlay se cierre primero
      await new Promise(resolve => setTimeout(resolve, 300))
      showIntegracionSAPModal.value = true
    }

    // Refrescar tras envío/reintento exitoso para sincronizar flags de ACCIONES (reintentar/PDF).
    if (envioExitoso) {
      await Promise.all([
        ordenesCompraStore.fetchEstadisticas(),
        cargarOrdenesCompraPendientes(),
      ])
    }
    
    // IMPORTANTE: NO limpiar sendingOcId aquí
    // El watch en OrdenCompraTable detectará automáticamente cuando el estado cambie
    // y limpiará sendingOcId solo cuando el estado sea != 'PENDIENTE'
  } catch (error: any) {
    console.error('Error al integrar ODC:', error)

    if (isTransientClientError(error)) {
      toast.warning('Tiempo de espera agotado', SAP_MAY_STILL_PROCESSING_MESSAGE)
      await Promise.all([
        ordenesCompraStore.fetchEstadisticas(),
        cargarOrdenesCompraPendientes(),
      ]).catch((err) => console.warn('[handleIntegrarOC] refresh tras timeout:', err))
      if (ordenCompraTableRef.value?.clearSendingState) {
        ordenCompraTableRef.value.clearSendingState()
      }
      return
    }
    
    // Mejorar manejo de errores con mensajes más descriptivos
    let errorTitle = 'Error al integrar'
    let errorMessage = error.message || 'No se pudo enviar la orden a SAP'
    
    // Parsear errores del backend con estructura mejorada
    if (error.response?.data) {
      const errorData = error.response.data
      
      // Si tiene campo error (string con validaciones - puede tener múltiples errores separados por ';')
      if (errorData.error) {
        errorMessage = errorData.error
        // Parsear errores múltiples si están separados por ';'
        const errores = errorMessage.split(';').map((e: string) => e.trim()).filter((e: string) => e.length > 0)
        if (errores.length > 1) {
          // Si hay múltiples errores, mostrar el primero en el toast y los demás en consola
          errorMessage = errores[0]
          console.warn('Errores adicionales:', errores.slice(1))
          // Mostrar todos los errores en un mensaje expandido
          toast.error(errorTitle, `${errores[0]} (+${errores.length - 1} error(es) más. Ver consola)`)
          return // Salir temprano para no mostrar el toast genérico
        }
      } 
      // Si tiene campo detail (FastAPI)
      else if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail)
      }
      // Si tiene campo message
      else if (errorData.message) {
        errorMessage = errorData.message
      }
      
      // Determinar título según el origen del error
      if (errorData.error_source) {
        errorTitle = errorData.error_source === 'BACKEND'
          ? 'Error de validación'
          : errorData.error_source === 'SAP_CONNECTION'
          ? 'Error de conexión con SAP'
          : errorData.error_source === 'SAP'
          ? 'Error de SAP'
          : 'Error al integrar'
      }
    }
    
    // Solo mostrar toast si no se mostró antes (por errores múltiples)
    if (!errorMessage.includes('(+')) {
      toast.error(errorTitle, errorMessage)
    }
    
    // En caso de error, SÍ limpiar el estado de envío para que el usuario pueda reintentar
    if (ordenCompraTableRef.value?.clearSendingState) {
      ordenCompraTableRef.value.clearSendingState()
    }
  } finally {
    // Asegurar que el loading se limpie
    procesoStore.loading = false
    procesoStore.currentStep = null
    procesoStore.progress = 0
  }
}

async function handleIntegrarOCMultiples(referencias: string[]) {
  // Verificar que no esté ya ejecutándose
  if (procesoStore.loading || ordenesCompraStore.loading) {
    return
  }
  
  try {
    if (referencias.length === 0) {
      toast.warning('No hay órdenes seleccionadas para enviar')
      return
    }

    // Establecer loading en procesoStore para mostrar el overlay
    procesoStore.loading = true
    procesoStore.currentStep = 'integrar-sap'
    procesoStore.progress = 0
    
    // Esperar a que Vue actualice el DOM para que el overlay aparezca
    await nextTick()

    toast.info('Enviando órdenes a SAP...', `Enviando ${referencias.length} orden(es) a SAP`)
    
    let successCount = 0
    let errorCount = 0
    const totalOrdenes = referencias.length
    const pedidosCerradosConsolidados: Set<string> = new Set()  // Para consolidar pedidos cerrados (Fase 6)
    
    // Enviar cada orden una por una y actualizar estados localmente
    for (let i = 0; i < referencias.length; i++) {
      const referencia = referencias[i]
      try {
        // Actualizar progreso antes de enviar
        procesoStore.progress = Math.round((i / totalOrdenes) * 100)
        
        // ✅ ESPERAR LA RESPUESTA COMPLETA
        // Usar almacén destino si está seleccionado, sino enviar sin almacén
        const response = await mba3ConsultasService.integrarSAP(referencia, almacenDestino.value || undefined)
        
        // ✅ ACTUALIZAR ESTADO LOCAL basándose en la respuesta
        const metadata = response?.metadata || {}
        const detalles = metadata.detalles || []
        
        // Consolidar pedidos cerrados si están en la respuesta (Fase 6)
        if (metadata.pedidos_cerrados && Array.isArray(metadata.pedidos_cerrados)) {
          metadata.pedidos_cerrados.forEach((pedido: any) => {
            if (pedido.pedido_id) {
              pedidosCerradosConsolidados.add(pedido.pedido_id)
            }
          })
        }
        
        if (detalles.length > 0) {
          const detalle = detalles[0]
          const success = detalle.success === true
          
          // Buscar y actualizar la orden en el array local
          const ordenIndex = ordenesCompraStore.ordenesCompra.findIndex(
            (oc: any) => oc.referencia_despacho === referencia
          )
          
          if (ordenIndex !== -1) {
            const ordenActualizada = { ...ordenesCompraStore.ordenesCompra[ordenIndex] }
            
            if (success) {
              ordenActualizada.estado = 'ENVIADA'
              ordenActualizada.numero_oc_sap = detalle.numero_oc_sap ?? detalle.doc_num?.toString() ?? null
              ordenActualizada.doc_entry = detalle.doc_entry || null
              ordenActualizada.doc_num = detalle.doc_num ?? null
              ordenActualizada.fecha_procesado = new Date().toISOString()
              ordenActualizada.respuesta_sap = detalle.message || 'Enviada exitosamente'
              successCount++
            } else {
              ordenActualizada.estado = 'ERROR'
              // Usar error_message si existe, sino error
              const errorMsg = detalle.error_message || detalle.error || 'Error desconocido'
              ordenActualizada.error_message = errorMsg
              ordenActualizada.error_source = detalle.error_source || 'BACKEND'
              ordenActualizada.error_code = detalle.error_code || null
              ordenActualizada.fecha_procesado = new Date().toISOString()
              ordenActualizada.respuesta_sap = errorMsg
              errorCount++
              
              // Log para debugging - parsear errores múltiples si existen
              if (errorMsg.includes(';')) {
                const errores = errorMsg.split(';').map(e => e.trim())
                console.warn(`[handleIntegrarOCMultiples] Múltiples errores para ${referencia}:`, errores)
              }
            }
            
            // Actualizar el array
            ordenesCompraStore.ordenesCompra[ordenIndex] = ordenActualizada
            ordenesCompraStore.ordenesCompra = [...ordenesCompraStore.ordenesCompra]
            
            if (import.meta.env.DEV) console.log(`[handleIntegrarOCMultiples] ✅ Estado actualizado: ${referencia} → ${ordenActualizada.estado}`)
          }
        } else {
          successCount++
        }
        
        // Actualizar progreso después de enviar
        procesoStore.progress = Math.round(((i + 1) / totalOrdenes) * 100)
        
        // Asegurar que Vue detecte los cambios
        await nextTick()
        
        // Delay mínimo entre envíos para no saturar el servidor
        if (i < referencias.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      } catch (error: any) {
        console.error(`Error al enviar orden ${referencia}:`, error)

        if (isTransientClientError(error)) {
          toast.warning(
            'Tiempo de espera',
            `${referencia}: ${SAP_MAY_STILL_PROCESSING_MESSAGE}`
          )
          procesoStore.progress = Math.round(((i + 1) / totalOrdenes) * 100)
          if (i < referencias.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200))
          }
          continue
        }

        errorCount++
        
        // Buscar y actualizar la orden en el array local para marcar como error
        const ordenIndex = ordenesCompraStore.ordenesCompra.findIndex(
          (oc: any) => oc.referencia_despacho === referencia
        )
        
        if (ordenIndex !== -1) {
          const ordenActualizada = { ...ordenesCompraStore.ordenesCompra[ordenIndex] }
          ordenActualizada.estado = 'ERROR'
          
          // Parsear error mejorado
          if (error.response?.data) {
            const errorData = error.response.data
            const errorMsg = errorData.error || errorData.detail || errorData.message || error.message
            ordenActualizada.error_message = errorMsg
            ordenActualizada.error_source = errorData.error_source || 'BACKEND'
            ordenActualizada.error_code = errorData.error_code || null
            ordenActualizada.respuesta_sap = errorMsg
            
            // Log errores múltiples si existen
            if (typeof errorMsg === 'string' && errorMsg.includes(';')) {
              const errores = errorMsg.split(';').map(e => e.trim())
              console.warn(`[handleIntegrarOCMultiples] Múltiples errores para ${referencia}:`, errores)
            }
          } else {
            ordenActualizada.error_message = error.message || 'Error desconocido'
            ordenActualizada.error_source = 'BACKEND'
            ordenActualizada.respuesta_sap = ordenActualizada.error_message
          }
          
          ordenActualizada.fecha_procesado = new Date().toISOString()
          ordenesCompraStore.ordenesCompra[ordenIndex] = ordenActualizada
          ordenesCompraStore.ordenesCompra = [...ordenesCompraStore.ordenesCompra]
        }
        
        // Actualizar progreso incluso si hay error
        procesoStore.progress = Math.round(((i + 1) / totalOrdenes) * 100)
        
        // Continuar con la siguiente orden aunque haya un error
      }
    }
    
    // Asegurar que el progreso esté al 100% al finalizar
    procesoStore.progress = 100
    
    // Asegurar que Vue haya procesado todos los cambios
    await nextTick()
    
    // Delay para que el usuario vea los cambios en la UI antes de cerrar el overlay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Mostrar resumen final
    if (successCount > 0) {
      toast.success(
        'Órdenes enviadas', 
        `${successCount} orden(es) enviada(s) exitosamente${errorCount > 0 ? `, ${errorCount} con errores` : ''}`
      )
    }
    
    if (errorCount > 0 && successCount === 0) {
      toast.error(
        'Error al enviar órdenes',
        `${errorCount} orden(es) no se pudieron enviar. Revisa los detalles.`
      )
    }
    
    // ✅ Mostrar información de pedidos cerrados si hubo alguno (Fase 6)
    if (pedidosCerradosConsolidados.size > 0) {
      toast.success(
        'Pedidos cerrados',
        `${pedidosCerradosConsolidados.size} pedido(s) marcado(s) como CONFIRMADO_ENVIADO`
      )
      if (import.meta.env.DEV) console.log('📦 Pedidos cerrados después del envío:', Array.from(pedidosCerradosConsolidados))
    }
    
    await Promise.all([
      ordenesCompraStore.fetchEstadisticas(),
      cargarOrdenesCompraPendientes(),
    ]).catch((err) => console.warn('[handleIntegrarOCMultiples] refresh:', err))
    
    // IMPORTANTE: NO limpiar sendingMultiple aquí
    // El watch en OrdenCompraTable detectará automáticamente cuando los estados cambien
    // y dejará los botones deshabilitados hasta que cambien de PENDIENTE
    
    // Limpiar la selección después de enviar exitosamente
    if (ordenCompraTableRef.value?.clearSelection) {
      ordenCompraTableRef.value.clearSelection()
    }
    
    // Mostrar resultado
    if (errorCount === 0) {
      toast.success('Órdenes enviadas', `Se han enviado ${successCount} orden(es) a SAP exitosamente`)
    } else {
      toast.warning(
        'Envío parcial', 
        `Se enviaron ${successCount} orden(es) correctamente, ${errorCount} con errores`
      )
    }
  } catch (error: any) {
    console.error('Error al integrar múltiples ODCs:', error)
    toast.error('Error al integrar', error.message || 'No se pudieron enviar todas las órdenes')
    
    // Limpiar el estado de envío múltiple incluso si hay error
    if (ordenCompraTableRef.value?.clearSendingMultipleState) {
      ordenCompraTableRef.value.clearSendingMultipleState()
    }
  } finally {
    // Asegurar que el loading se limpie
    procesoStore.loading = false
    procesoStore.currentStep = null
    procesoStore.progress = 0
  }
}

async function handleEliminarOC(ocIds: string[]) {
  try {
    if (!ocIds || ocIds.length === 0) {
      toast.warning('No hay órdenes seleccionadas para eliminar')
      return
    }

    // Confirmar eliminación
    const confirmMessage = ocIds.length === 1 
      ? '¿Estás seguro de que deseas eliminar esta orden de compra? Esta acción no se puede deshacer.'
      : `¿Estás seguro de que deseas eliminar ${ocIds.length} órdenes de compra? Esta acción no se puede deshacer.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    eliminando.value = true
    progresoEliminar.value = 0
    
    // Simular progreso durante la eliminación
    const progressInterval = setInterval(() => {
      if (progresoEliminar.value < 90) {
        progresoEliminar.value += 10
      }
    }, 200)

    toast.info('Eliminando órdenes...', `Eliminando ${ocIds.length} orden(es) de compra`)
    
    await mba3ConsultasService.deleteOrdenesCompra(ocIds.length === 1 ? ocIds[0] : ocIds)
    
    clearInterval(progressInterval)
    progresoEliminar.value = 100
    
    // Pequeño delay para mostrar el 100%
    await new Promise(resolve => setTimeout(resolve, 300))
    
    toast.success('Órdenes eliminadas', `${ocIds.length} orden(es) de compra eliminada(s) exitosamente`)
    
    // Actualizar datos
    await ordenesCompraStore.fetchEstadisticas()
    await cargarOrdenesCompraPendientes()

    // Limpiar la selección después de eliminar exitosamente
    if (ordenCompraTableRef.value?.clearSelection) {
      ordenCompraTableRef.value.clearSelection()
    }
  } catch (error: any) {
    console.error('Error al eliminar órdenes:', error)
    toast.error('Error al eliminar órdenes', error.message || 'No se pudieron eliminar las órdenes de compra')
  } finally {
    eliminando.value = false
    progresoEliminar.value = 0
  }
}

onUnmounted(() => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
    searchDebounceTimer = null
  }
  stopPolling()
  stopTimeDisplayUpdate()
})

// Cargar estadísticas al montar el componente
onMounted(async () => {
  await ordenesCompraStore.fetchEstadisticas()
  await cargarOrdenesCompraPendientes()
  await nextTick()
  
  // ⭐ NUEVO: Verificar si hay resultados pendientes de envío SAP para mostrar modal
  if (procesoStore.hasSAPResultadoPendiente && procesoStore.sapResultadoPendiente) {
    const resultado = procesoStore.sapResultadoPendiente
    integracionSAPDetalle.value = resultado.detalle
    integracionSAPSolicitudes.value = resultado.solicitudesTransferencia
    integracionSAPEstado.value = resultado.estadoGeneral
    if (resultado.ajustesDetalle?.length) {
      sapRetryContext.value = {
        numeroPedido: resultado.numeroPedido,
        ajustesDetalle: resultado.ajustesDetalle
      }
    }

    // Mostrar modal después de un pequeño delay
    await new Promise(resolve => setTimeout(resolve, 300))
    showIntegracionSAPModal.value = true

    // Limpiar el resultado pendiente
    procesoStore.clearSAPResultadoPendiente()
  }
})

// Watch para query params de navegación (ej. desde OrdenCompraTable)
watch(() => route.query, async (newQuery) => {
  if (newQuery.orden_id && ordenesCompraStore.ordenesCompra.length === 0) {
    await cargarOrdenesCompraPendientes()
  }
  if (newQuery.despacho_id) {
    initialSearchDespacho.value = newQuery.despacho_id as string
  }
  await nextTick()
}, { immediate: true })

function getStepStatus(step: string): 'pending' | 'active' | 'completed' | 'error' | 'retry' {
  if (!procesoStore.currentStep && !procesoStore.resultados) return 'pending'
  
  const stepOrder = ['migrar', 'procesar-oc']
  const currentIndex = stepOrder.indexOf(procesoStore.currentStep || '')
  const stepIndex = stepOrder.indexOf(step)
  
  if (procesoStore.error) {
    if (stepIndex === currentIndex) {
      // Si es el error específico de consulta MBA3, devolver 'retry' en lugar de 'error'
      if (isConsultaMBA3Error(procesoStore.error)) {
        return 'retry'
      }
      return 'error'
    }
    if (stepIndex < currentIndex) return 'completed'
    return 'pending'
  }
  
  if (procesoStore.resultados && !procesoStore.loading) {
    if (step === 'migrar' && procesoStore.resultados.metadata?.save_status) return 'completed'
    // La pestaña procesar-oc ahora también envía a SAP, así que verifica integrarSAP
    if (step === 'procesar-oc' && procesoStore.resultados.integrarSAP) return 'completed'
  }
  
  if (procesoStore.loading) {
    if (procesoStore.currentStep === 'integrar-sap') {
      // Si está ejecutando integración SAP, la pestaña procesar-oc debería mostrarse como activa
      if (step === 'procesar-oc') return 'active'
      if (stepIndex < currentIndex) return 'completed'
      return 'pending'
    }
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }
  
  return 'pending'
}

function getStepTitle(step: string): string {
  const titles: Record<string, string> = {
    'migrar': 'Importar despachos',
    'procesar-oc': 'Procesar ODC'
  }
  return titles[step] || step
}

function getStepDescription(step: string): string {
  const descriptions: Record<string, string> = {
    'migrar': 'Importa y almacena las prefacturas en el sistema',
    'procesar-oc': 'Envía órdenes de compra a SAP'
  }
  return descriptions[step] || ''
}

function getProcesoCardClass(step: string): string {
  const status = getStepStatus(step)
  
  const baseColors: Record<string, string> = {
    'migrar': 'border-violet-200/50 dark:border-violet-700/50 bg-gradient-to-br from-violet-50/80 dark:from-violet-900/30 to-violet-100/60 dark:to-violet-800/40',
    'procesar-oc': 'border-emerald-200/50 dark:border-emerald-700/50 bg-gradient-to-br from-emerald-50/80 dark:from-emerald-900/30 to-emerald-100/60 dark:to-emerald-800/40'
  }
  
  const baseColor = baseColors[step] || 'border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/80 dark:from-gray-800/80 to-gray-100/60 dark:to-gray-700/60'
  
  if (status === 'retry') return 'border-yellow-300/50 dark:border-yellow-700/50 bg-gradient-to-br from-yellow-50/80 dark:from-yellow-900/30 to-yellow-100/60 dark:to-yellow-800/40'
  if (status === 'error') return 'border-red-300/50 dark:border-red-700/50 bg-gradient-to-br from-red-50/80 dark:from-red-900/30 to-red-100/60 dark:to-red-800/40'
  if (status === 'active') {
    const activeColors: Record<string, string> = {
      'migrar': 'border-violet-300/60 dark:border-violet-600/60 bg-gradient-to-br from-violet-100/90 dark:from-violet-900/40 to-violet-200/70 dark:to-violet-800/50 shadow-2xl',
      'procesar-oc': 'border-emerald-300/60 dark:border-emerald-600/60 bg-gradient-to-br from-emerald-100/90 dark:from-emerald-900/40 to-emerald-200/70 dark:to-emerald-800/50 shadow-2xl'
    }
    return activeColors[step] || 'border-blue-300/60 dark:border-blue-600/60 bg-gradient-to-br from-blue-100/90 dark:from-blue-900/40 to-blue-200/70 dark:to-blue-800/50 shadow-xl'
  }
  if (status === 'completed') {
    const completedColors: Record<string, string> = {
      'migrar': 'border-violet-300/50 dark:border-violet-600/50 bg-gradient-to-br from-violet-100/80 dark:from-violet-900/30 to-violet-200/60 dark:to-violet-800/40',
      'procesar-oc': 'border-emerald-300/50 dark:border-emerald-600/50 bg-gradient-to-br from-emerald-100/80 dark:from-emerald-900/30 to-emerald-200/60 dark:to-emerald-800/40'
    }
    return completedColors[step] || 'border-green-200/50 dark:border-green-700/50 bg-gradient-to-br from-green-100/80 dark:from-green-900/30 to-green-200/60 dark:to-green-800/40'
  }
  return baseColor
}

function getProcesoIconClass(step: string): string {
  const status = getStepStatus(step)
  
  const pendingColors: Record<string, string> = {
    'migrar': 'bg-gradient-to-br from-violet-200/90 dark:from-violet-700/90 to-violet-300/80 dark:to-violet-600/80 text-violet-700 dark:text-violet-200 border-violet-300/60 dark:border-violet-600/60',
    'procesar-oc': 'bg-gradient-to-br from-emerald-200/90 dark:from-emerald-700/90 to-emerald-300/80 dark:to-emerald-600/80 text-emerald-700 dark:text-emerald-200 border-emerald-300/60 dark:border-emerald-600/60'
  }
  
  if (status === 'retry') return 'bg-gradient-to-br from-yellow-400/90 dark:from-yellow-500/90 to-yellow-500/80 dark:to-yellow-600/80 text-white border-yellow-500/60 dark:border-yellow-600/60'
  if (status === 'error') return 'bg-gradient-to-br from-red-400/90 dark:from-red-500/90 to-red-500/80 dark:to-red-600/80 text-white border-red-500/60 dark:border-red-600/60'
  if (status === 'active') {
    const activeColors: Record<string, string> = {
      'migrar': 'bg-gradient-to-br from-violet-400/90 dark:from-violet-500/90 to-violet-500/80 dark:to-violet-600/80 text-white border-violet-500/60 dark:border-violet-600/60 animate-pulse shadow-lg shadow-violet-300/50 dark:shadow-violet-900/50',
      'procesar-oc': 'bg-gradient-to-br from-emerald-400/90 dark:from-emerald-500/90 to-emerald-500/80 dark:to-emerald-600/80 text-white border-emerald-500/60 dark:border-emerald-600/60 animate-pulse shadow-lg shadow-emerald-300/50 dark:shadow-emerald-900/50'
    }
    return activeColors[step] || 'bg-gradient-to-br from-blue-400/90 dark:from-blue-500/90 to-blue-500/80 dark:to-blue-600/80 text-white border-blue-500/60 dark:border-blue-600/60 animate-pulse shadow-lg'
  }
  if (status === 'completed') {
    const completedColors: Record<string, string> = {
      'migrar': 'bg-gradient-to-br from-violet-500/90 dark:from-violet-600/90 to-violet-600/80 dark:to-violet-700/80 text-white border-violet-600/60 dark:border-violet-700/60 shadow-lg',
      'procesar-oc': 'bg-gradient-to-br from-emerald-500/90 dark:from-emerald-600/90 to-emerald-600/80 dark:to-emerald-700/80 text-white border-emerald-600/60 dark:border-emerald-700/60 shadow-lg'
    }
    return completedColors[step] || 'bg-gradient-to-br from-green-400/90 dark:from-green-500/90 to-green-500/80 dark:to-green-600/80 text-white border-green-500/60 dark:border-green-600/60 shadow-lg'
  }
  return pendingColors[step] || 'bg-gradient-to-br from-gray-200/90 dark:from-gray-700/90 to-gray-300/80 dark:to-gray-600/80 text-gray-500 dark:text-gray-400 border-gray-300/60 dark:border-gray-600/60'
}

function getProcesoOverlayClass(step: string): string {
  const status = getStepStatus(step)
  
  if (status === 'retry') {
    return 'bg-gradient-to-br from-yellow-100/30 dark:from-yellow-900/20 via-transparent to-transparent'
  }
  if (status === 'error') {
    return 'bg-gradient-to-br from-red-100/30 dark:from-red-900/20 via-transparent to-transparent'
  }
  return 'bg-gradient-to-br from-white/20 dark:from-gray-700/20 via-transparent to-transparent'
}

function getButtonClass(step: string): string {
  const status = getStepStatus(step)
  
  const pendingButtonColors: Record<string, string> = {
    'migrar': 'bg-gradient-to-r from-violet-500 to-violet-600 text-white hover:from-violet-600 hover:to-violet-700',
    'procesar-oc': 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
  }
  
  if (status === 'completed') {
    const completedColors: Record<string, string> = {
      'migrar': 'bg-gradient-to-r from-violet-200/90 dark:from-violet-700/90 to-violet-300/80 dark:to-violet-600/80 text-violet-800 dark:text-violet-200 hover:from-violet-300 dark:hover:from-violet-600 hover:to-violet-400 dark:hover:to-violet-500 border border-violet-300/50 dark:border-violet-600/50',
      'procesar-oc': 'bg-gradient-to-r from-emerald-200/90 dark:from-emerald-700/90 to-emerald-300/80 dark:to-emerald-600/80 text-emerald-800 dark:text-emerald-200 hover:from-emerald-300 dark:hover:from-emerald-600 hover:to-emerald-400 dark:hover:to-emerald-500 border border-emerald-300/50 dark:border-emerald-600/50'
    }
    return completedColors[step] || 'bg-gradient-to-r from-green-100/90 dark:from-green-700/90 to-green-200/80 dark:to-green-600/80 text-green-800 dark:text-green-200 hover:from-green-200 dark:hover:from-green-600 hover:to-green-300 dark:hover:to-green-500 border border-green-300/50 dark:border-green-600/50'
  }
  if (status === 'active') {
    const activeColors: Record<string, string> = {
      'migrar': 'bg-gradient-to-r from-violet-600 to-violet-700 text-white hover:from-violet-700 hover:to-violet-800 shadow-lg shadow-violet-500/30',
      'procesar-oc': 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-lg shadow-emerald-500/30'
    }
    return activeColors[step] || 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
  }
  if (status === 'retry') {
    return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 shadow-lg shadow-yellow-500/30'
  }
  if (status === 'error') {
    return 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30'
  }
  return pendingButtonColors[step] || 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700'
}

function getStepStatusText(step: string): string {
  const status = getStepStatus(step)
  
  if (status === 'active') return 'En ejecución...'
  if (status === 'completed') return 'Completado'
  if (status === 'error') return 'Error'
  return 'Pendiente'
}

function getStepStatusTextClass(step: string): string {
  const status = getStepStatus(step)
  
  const pendingTextColors: Record<string, string> = {
    'migrar': 'text-violet-600',
    'procesar-oc': 'text-emerald-600'
  }
  
  if (status === 'active') {
    const activeColors: Record<string, string> = {
      'migrar': 'text-violet-700',
      'procesar-oc': 'text-emerald-700'
    }
    return activeColors[step] || 'text-blue-600'
  }
  if (status === 'completed') {
    const completedColors: Record<string, string> = {
      'migrar': 'text-violet-700',
      'procesar-oc': 'text-emerald-700'
    }
    return completedColors[step] || 'text-green-600'
  }
  if (status === 'error') return 'text-red-600'
  return pendingTextColors[step] || 'text-gray-500'
}

</script>

<style scoped>
/* Estilos simplificados - efectos pesados removidos para mejor rendimiento */
</style>