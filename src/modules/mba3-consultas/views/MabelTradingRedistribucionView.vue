<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Modal de bloqueo al convertir a unidades SAP (sincronizado con backend hasta que termina) -->
    <Teleport to="body">
      <div
        v-if="redistribucion.confirmandoRedistribucion.value"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
        @click.prevent
        @mousedown.prevent
        @mouseup.prevent
        @touchstart.prevent
        @touchmove.prevent
        @touchend.prevent
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-md mx-4 text-center">
          <div class="flex flex-col items-center gap-4">
            <svg class="animate-spin h-12 w-12 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Convirtiendo a Unidades SAP</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300">Procesando redistribución y calculando conversiones. No cierre esta ventana.</p>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal de bloqueo al enviar ODC a SAP con barra de progreso -->
    <Teleport to="body">
      <div
        v-if="enviandoOdcSap"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
        @click.prevent
        @mousedown.prevent
        @mouseup.prevent
        @touchstart.prevent
        @touchmove.prevent
        @touchend.prevent
      >
        <div class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center transition-all duration-300 border border-white/30 dark:border-gray-600/30 relative overflow-hidden">
          <!-- Efecto de fondo animado -->
          <div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-600/5 pointer-events-none"></div>
          <div class="absolute inset-0 overflow-hidden pointer-events-none">
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
          </div>
          
          <div class="relative z-10 flex flex-col items-center gap-5">
            <!-- Spinner con efecto de pulso -->
            <div class="relative">
              <svg class="animate-spin h-14 w-14 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div class="absolute inset-0 border-2 border-blue-300/30 dark:border-blue-500/30 rounded-full animate-ping"></div>
            </div>
            
            <div class="w-full">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Enviando ODC a SAP</h3>
              <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">{{ sapMessage || 'Preparando proceso...' }}</p>
              <p
                v-if="sapAvisoEsperaLarga"
                class="text-xs text-amber-600 dark:text-amber-400 mb-2 transition-colors duration-300"
              >
                {{ SAP_SLOW_SYNC_LIKELY_MESSAGE }}
              </p>

              <!-- Barra de progreso -->
              <div class="w-full space-y-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400 font-medium">Progreso del proceso</span>
                  <span class="text-blue-600 dark:text-blue-400 font-bold">{{ sapProgress }}%</span>
                </div>
                <div class="w-full h-3 bg-gray-200/80 dark:bg-gray-700/80 rounded-full overflow-hidden shadow-inner">
                  <div
                    class="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                    :style="{ width: `${sapProgress}%` }"
                  >
                    <!-- Efecto shimmer sobre la barra -->
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                    <!-- Efecto de pulso en la barra -->
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Indicadores de fase (3 pasos) -->
            <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-1">
                <div :class="[
                  'w-2 h-2 rounded-full transition-colors duration-300',
                  sapFase === 'redistribucion' || sapFase === 'generando' || sapFase === 'enviando' || sapFase === 'complete' 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                ]"></div>
                <span>Redistribuir</span>
              </div>
              <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
              <div class="flex items-center gap-1">
                <div :class="[
                  'w-2 h-2 rounded-full transition-colors duration-300',
                  sapFase === 'generando' || sapFase === 'enviando' || sapFase === 'complete' 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                ]"></div>
                <span>Generar ODC</span>
              </div>
              <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
              <div class="flex items-center gap-1">
                <div :class="[
                  'w-2 h-2 rounded-full transition-colors duration-300',
                  sapFase === 'enviando' || sapFase === 'complete' 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
                ]"></div>
                <span>Enviar SAP</span>
              </div>
            </div>
            
            <p class="text-xs text-gray-500 dark:text-gray-400">No cierre esta ventana. Este proceso puede tomar hasta 3 minutos.</p>
          </div>
        </div>
      </div>
    </Teleport>

    <div
      class="space-y-6"
      :class="{ 'pointer-events-none opacity-75': redistribucion.confirmandoRedistribucion.value || enviandoOdcSap }"
    >
      <!-- Header (misma estructura que listados MBA3: fila título + fila de acciones) -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div class="space-y-4">
          <div v-if="odcSapVolverTarget || !soloLectura" class="flex items-center flex-wrap gap-4">
            <OdcSapVolverButton
              v-if="odcSapVolverTarget"
              :to="odcSapVolverTarget"
              :title="odcSapVolverTitle"
              class="shrink-0"
            />
            <div v-if="!soloLectura" class="relative shrink-0 ml-auto">
              <input
                v-model="pedidoIdInput"
                @keyup.enter="goToPedido"
                type="text"
                placeholder="Buscar por N° de pedido"
                class="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
              />
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ soloLectura ? 'Ver distribución de Productos - EL RAYO' : 'Redistribución de Productos - MABEL TRADING' }}
              </h1>
              <p v-if="pedido" class="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                Pedido: <span class="font-medium text-gray-900 dark:text-white">{{ pedido.cabecera.numero_pedido }}</span>
                <button
                  type="button"
                  @click="copyToClipboard(pedido.cabecera.numero_pedido ?? '')"
                  class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  :title="copyFeedback ? 'Copiado' : 'Copiar número de pedido'"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </p>
            </div>
            <div class="flex flex-wrap items-center justify-end gap-3 shrink-0">
              <button
                v-if="pedido && tieneDistribucionConfirmada && pedidoConfirmadoYEnviado"
                type="button"
                @click="handleExportarTrasladosExcel"
                :disabled="exportandoTraslados"
                class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 dark:bg-teal-500 rounded-lg shadow-sm hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Exportar solicitudes de traslado a Excel"
              >
                <svg v-if="!exportandoTraslados" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <LoadingSpinner v-else layout="inline" size="md" color="current" aria-label="Exportando traslados" />
                {{ exportandoTraslados ? 'Exportando...' : 'Exportar a Excel' }}
              </button>
              <button
                v-if="!soloLectura && pedido"
                type="button"
                @click="handleCancelar"
                :disabled="cancelando || (pedido != null && pedido.puede_cancelar_pedido === false)"
                class="shrink-0 px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg v-if="!cancelando" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <LoadingSpinner v-else layout="inline" size="md" color="current" aria-label="Cancelando pedido" />
                {{ cancelando ? 'Cancelando...' : 'Cancelar Pedido' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Estado de carga al montar /redistribucion sin id: GET /api/pedidos/ultimo-redistribucion -->
      <div v-if="(loading || cargandoUltimoConfirmado) && !pedido" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <LoadingSpinner :message="cargandoUltimoConfirmado ? 'Buscando último pedido...' : 'Cargando pedido...'" />
      </div>

      <!-- Error state -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 transition-colors duration-300">
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-red-900 dark:text-red-200">Error al cargar el pedido</p>
            <p class="text-sm text-red-800 dark:text-red-300 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Información básica del pedido (opcional, solo si hay pedido) -->
      <PedidoCabecera
        v-if="pedido"
        :pedido="pedido"
        :copy-feedback="copyFeedback"
        :default-expanded="soloLectura"
        @copy-to-clipboard="copyToClipboard"
        @ver-detalle-sap="handleVerDetalleSap"
      />

      <div
        v-if="odcSapProcesoEnServidor && !enviandoOdcSap && pedido"
        class="mb-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/25 px-4 py-3 text-sm text-blue-900 dark:text-blue-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        role="status"
      >
        <p class="flex-1">
          Hay un envío a SAP en proceso en el servidor. Puede seguir el progreso sin iniciar otro envío.
        </p>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium whitespace-nowrap shrink-0"
          @click="handleEnviarOdcSap"
        >
          Seguir progreso
        </button>
      </div>

      <!-- Sección de Redistribución (siempre visible si hay pedido) -->
      <RedistribucionTiendas
        v-if="pedido"
        :pedido="pedido"
        :es-modo-mabel-trading="true"
        :solo-lectura="soloLectura"
        :productos-redistribucion="redistribucion.productosRedistribucion"
        :productos-expandidos="redistribucion.productosExpandidos"
        :guardando-redistribucion="redistribucion.guardandoRedistribucion"
        :confirmando-redistribucion="redistribucion.confirmandoRedistribucion"
        :confirmar-deshabilitado-por-estado="confirmarDeshabilitadoPorEstado"
        :guardar-borrador-deshabilitado-por-estado="guardarBorradorDeshabilitadoPorEstado"
        :columnas-modificadas="columnasModificadas as unknown as Ref<Set<string>>"
        :roles-modificacion="rolesModificacion as unknown as Ref<Map<string, string | null>>"
        :show-enviar-odc-sap="showEnviarOdcSap"
        :enviando-odc-sap="enviandoOdcSap"
        @toggle-expandir-producto="toggleExpandirProducto"
        @actualizar-cantidad-tienda="actualizarCantidadTienda"
        @validar-y-corregir-cantidad="validarYCorregirCantidad"
        @agregar-tienda="agregarTienda"
        @distribuir-proporcionalmente="distribuirProporcionalmente"
        @copiar-distribucion-original="copiarDistribucionOriginal"
        @resetear-distribucion="resetearDistribucion"
        @guardar-borrador="guardarBorradorRedistribucion"
        @confirmar-redistribucion="confirmarRedistribucion"
        @enviar-odc-sap="handleEnviarOdcSap"
      />

      <!-- Sin pedido: solo búsqueda manual por número -->
      <div v-if="!pedido && !loading && !cargandoUltimoConfirmado && !error" class="space-y-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Ingrese un número de pedido</h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Use el campo de búsqueda arriba para buscar un pedido y comenzar la redistribución.
          </p>
        </div>
      </div>
    </div>

    <!-- Modal de integración SAP: al hacer clic en un "Número OC SAP" de la cabecera -->
    <IntegracionSAPModal
      :is-open="showIntegracionSAPModal"
      :detalle="integracionSAPDetalle"
      :solicitudes-transferencia="integracionSAPSolicitudes"
      :estado-general="integracionSAPEstadoGeneral"
      @close="showIntegracionSAPModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type Ref } from '@vue/reactivity'
import { onMounted, onUnmounted, nextTick } from '@vue/runtime-core'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService, extractErrorMessage } from '../services/mba3ConsultasApi'
import type { AjusteDetalle, PedidoCompleto, IntegracionSAPDetalle, ProcesoCompletoSAPResponse, SolicitudesTransferencia } from '../types'
import type { ProductoRedistribucion, DistribucionTiendaEditada } from '../utils/redistribucionHelpers'
import { usePedidoDetalle } from '../composables/usePedidoDetalle'
import { useRedistribucion } from '../composables/useRedistribucion'
import { useVerDetalleSapModal } from '../composables/useVerDetalleSapModal'
import { useProcesoStore } from '../stores/procesoStore'
import PedidoCabecera from '../components/PedidoCabecera.vue'
import RedistribucionTiendas from '../components/RedistribucionTiendas.vue'
import IntegracionSAPModal from '../components/IntegracionSAPModal.vue'
import OdcSapVolverButton from '@/components/OdcSapVolverButton.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useOdcSapVolver } from '../../../composables/useOdcSapVolver'
import {
  ejecutarProcesoCompletoSap,
  getPendingOdcSapProcessingState,
} from '../composables/ejecutarProcesoCompletoSap'
import { useSapProcessProgress } from '../composables/useSapProcessProgress'
import {
  isTransientClientError,
  SAP_MAY_STILL_PROCESSING_MESSAGE,
  SAP_SLOW_SYNC_LIKELY_MESSAGE,
} from '../utils/httpErrors'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { target: odcSapVolverTarget, title: odcSapVolverTitle } = useOdcSapVolver()
const procesoStore = useProcesoStore()

const pedido = ref<PedidoCompleto | null>(null)
const pedidoIdInput = ref('')
const exportandoTraslados = ref(false)
const enviandoOdcSap = ref(false)

const odcSapProcesoEnServidor = ref(false)

const {
  sapProgress,
  sapFase,
  sapMessage,
  sapAvisoEsperaLarga,
  resetSapProgress,
  startSapProgressSimulation,
  applySapPollingUpdate,
  marcarPosibleEsperaLarga,
  completeSapProgress,
  stopSimulation: stopSapProgressSimulation,
} = useSapProcessProgress()

async function refreshPendingOdcSapState() {
  if (!numeroPedido.value) {
    odcSapProcesoEnServidor.value = false
    return
  }
  const state = await getPendingOdcSapProcessingState(numeroPedido.value)
  odcSapProcesoEnServidor.value = state.processing
}

// ⭐ Set para rastrear columnas modificadas (para resaltado en redistribución)
const columnasModificadas: Ref<Set<string>> = ref<Set<string>>(new Set())
// ⭐ Rol (ODCSAP/PRODUCCION_ELRAYO) de quien hizo cada modificación, para pintar el
// resaltado heredado con el mismo color de marca que Cargar Plantilla / Detalle del Pedido.
const rolesModificacion: Ref<Map<string, string | null>> = ref(new Map())

const numeroPedido = computed(() => {
  const id = route.params.id as string
  return id ? decodeURIComponent(id) : ''
})

/** Modo solo lectura: EL RAYO revisa distribución sin poder editar (query soloLectura=1) */
const soloLectura = computed(() => route.query.soloLectura === '1')

const esModoMabelTrading = computed(() => true) // Siempre true en esta vista

// ⭐ Función para cargar columnas modificadas desde storage
const cargarColumnasModificadasDesdeStorage = () => {
  if (!numeroPedido.value) return
  try {
    const storageKey = `pedido_columnas_modificadas_${numeroPedido.value}`
    const stored = sessionStorage.getItem(storageKey)
    if (stored) {
      const columnasArray = JSON.parse(stored) as string[]
      columnasModificadas.value = new Set(columnasArray)
      if (import.meta.env.DEV) console.log(`📦 [MabelTradingRedistribucionView] Cargadas ${columnasArray.length} columnas modificadas desde sessionStorage para ${numeroPedido.value}`)
      if (import.meta.env.DEV) console.log(`   Columnas: ${Array.from(columnasModificadas.value).join(', ')}`)
    } else {
      if (import.meta.env.DEV) console.log(`📦 [MabelTradingRedistribucionView] No hay columnas modificadas en sessionStorage para ${numeroPedido.value}`)
    }
  } catch (e) {
    console.warn('Error al cargar columnas modificadas desde sessionStorage:', e)
  }
}

// Inicializar composable de pedido detalle
const pedidoDetalle = usePedidoDetalle({
  pedido,
  numeroPedido,
  esModoMabelTrading,
  columnasModificadas,
  rolesModificacion,
  reporteDiferencias: ref(null),
  limpiarColumnasModificadasEnStorage: () => {
    if (!numeroPedido.value) return
    try {
      const storageKey = `pedido_columnas_modificadas_${numeroPedido.value}`
      sessionStorage.removeItem(storageKey)
      columnasModificadas.value.clear()
      rolesModificacion.value.clear()
    } catch (e) {
      console.warn('Error al limpiar columnas modificadas en sessionStorage:', e)
    }
  },
  cargarColumnasModificadasDesdeStorage
})

const {
  loading,
  error,
  loadPedido,
  copyFeedback,
  copyToClipboard
} = pedidoDetalle

// Inicializar composable de redistribución
const redistribucion = useRedistribucion({
  pedido,
  numeroPedido,
  esModoMabelTrading,
  getReporteDiferencias: () => pedidoDetalle.reporteDiferencias,
  loadPedido: () => pedidoDetalle.loadPedido(),
  loadReporteDiferencias: () => pedidoDetalle.loadReporteDiferencias()
})

// Modal de integración SAP: al hacer clic en un "Número OC SAP" de la cabecera
// (pedidos con más de una ODC muestran un botón por cada una, ver PedidoCabecera.vue).
const {
  showIntegracionSAPModal,
  integracionSAPDetalle,
  integracionSAPSolicitudes,
  integracionSAPEstadoGeneral,
  handleVerDetalleSap
} = useVerDetalleSapModal()

// Computed para validar si se puede confirmar
const puedeConfirmarRedistribucion = computed(() => {
  const productos = redistribucion.productosRedistribucion.value
  if (productos.length === 0) return false
  
  const total_confirmado = productos.reduce((sum, p) => sum + p.cantidad_confirmada, 0)
  const total_distribuido = productos.reduce((sum, p) => sum + p.cantidad_distribuida, 0)
  const diferencia_pendiente = total_confirmado - total_distribuido
  
  return diferencia_pendiente === 0 &&
         productos.every(p => p.diferencia === 0) &&
         productos.every(p => !p.error)
})

// Deshabilitar "Confirmar Redistribución" usando el flag del backend (incluye CANCELADO y estados ya confirmados)
const confirmarDeshabilitadoPorEstado = computed(() =>
  pedido.value?.puede_confirmar_redistribucion === false
)

// ⭐ Deshabilitar "Guardar Borrador" si el estado NO permite trabajar la redistribución.
// Habilitado en estado 4 (CONFIRMADO POR EL RAYO) y en estado 25 (LISTO PARA
// REDISTRIBUCION: pedido "hijo" aceptado por el botón "Aceptar", que entra directo a la
// cola de redistribución sin pasar por "Confirmado por El Rayo" -- ver
// ESTADOS_PUEDE_ACEPTAR_PRODUCCION_POSPUESTA en el backend).
// Una vez que se confirma la redistribución (estado 10) o se envía a SAP (estado 12), el botón se deshabilita.
const guardarBorradorDeshabilitadoPorEstado = computed(() => {
  const estadoId = pedido.value?.cabecera?.estado_id
  return estadoId !== 4 && estadoId !== 25
})

// El botón/bandeja de reintento se habilita/deshabilita usando SOLO el flag backend.
// La visibilidad depende de la vista (pedido/respuesta_proveedor); el "disabled" lo maneja el componente.
const showEnviarOdcSap = computed(() => true)

// Funciones de redistribución
function toggleExpandirProducto(codigoProducto: string) {
  redistribucion.toggleExpandirProducto(codigoProducto)
}

function actualizarCantidadTienda(codigoProducto: string, tiendaCodigo: string, event: Event) {
  redistribucion.actualizarCantidadTienda(codigoProducto, tiendaCodigo, event)
}

function validarYCorregirCantidad(producto: ProductoRedistribucion, tienda: DistribucionTiendaEditada) {
  redistribucion.validarYCorregirCantidad(producto, tienda)
}

function agregarTienda(tienda: { codigo: string; nombre: string }) {
  redistribucion.agregarTiendaATodosLosProductos(tienda.codigo, tienda.nombre)
}

function distribuirProporcionalmente(codigoProducto: string) {
  redistribucion.distribuirProporcionalmente(codigoProducto)
}

function copiarDistribucionOriginal(codigoProducto: string) {
  redistribucion.copiarDistribucionOriginal(codigoProducto)
}

function resetearDistribucion(codigoProducto: string) {
  redistribucion.resetearDistribucion(codigoProducto)
}

async function guardarBorradorRedistribucion() {
  await redistribucion.guardarBorradorRedistribucion()
}

async function confirmarRedistribucion() {
  await redistribucion.confirmarRedistribucion(puedeConfirmarRedistribucion)
}

/** Mismo payload que `handleEnviarOdcSap` envía a proceso-completo-sap (para reintento desde Proceso completo). */
function buildAjustesDetalleParaProcesoCompletoSAP(): AjusteDetalle[] {
  return redistribucion.productosRedistribucion.value.map(producto => ({
    codigo_producto: producto.codigo_producto,
    descripcion: producto.descripcion,
    cantidad_solicitada: producto.cantidad_solicitada,
    cantidad_confirmada: producto.cantidad_confirmada,
    cantidad_ajustada: producto.cantidad_distribuida,
    distribucion_tiendas: producto.distribucion_tiendas.map(t => ({
      tienda_codigo: t.tienda_codigo,
      tienda_nombre: t.tienda_nombre,
      cantidad: t.cantidad_asignada
    })),
    costo_original: producto.costo_unitario,
    costo_ajustado: producto.costo_unitario,
    cambio_precio: false
  }))
}

/** Construye solicitudesTransferencia desde envio_sap, raíz o envio_sap.resultado (formato alternativo). */
function getSolicitudesTransferencia(response: ProcesoCompletoSAPResponse): SolicitudesTransferencia | null {
  const fromEnvio = response.envio_sap?.solicitudes_transferencia
  if (fromEnvio) return fromEnvio
  const fromRoot = response.solicitudes_transferencia
  if (fromRoot) return fromRoot
  const resultado = (response.envio_sap as any)?.resultado
  if (resultado && Array.isArray(resultado.resultados) && resultado.resultados.length > 0) {
    return {
      success: resultado.success === true,
      pedido_id: (response as any).pedido_id ?? '',
      total_tiendas: resultado.total_tiendas ?? resultado.resultados.length,
      transferencias_creadas: resultado.transferencias_creadas ?? resultado.resultados.filter((r: any) => r.success).length,
      transferencias_errores: resultado.transferencias_errores ?? 0,
      resultados: resultado.resultados
    }
  }
  return null
}

/**
 * ODC adicionales del pedido (todas menos la primera, ya cubierta por envio_sap/detalle
 * principal). Un pedido mixto (tiendas de más de una marca en el mismo Excel) genera 2
 * ODC -- una por bodega -- que se envían ambas a SAP; sin esto el modal en /proceso solo
 * mostraba la primera aunque ambas se hubieran enviado.
 */
function getDetallesAdicionales(
  response: ProcesoCompletoSAPResponse
): { detalle: IntegracionSAPDetalle; solicitudesTransferencia: SolicitudesTransferencia | null }[] {
  const envios = response.envios_sap
  if (!envios || envios.length <= 1) return []
  return envios.slice(1).map((envio) => ({
    detalle: {
      success: envio.success,
      oc_id: envio.oc_id ?? '',
      doc_num: envio.doc_num,
      doc_entry: envio.doc_entry,
      numero_oc_sap: envio.numero_oc_sap ?? null,
      message: envio.message ?? null,
      error: envio.error ?? null,
      error_message: envio.error ?? null,
      error_code: envio.error_code ?? null,
      error_source: null,
      retry_recommended: envio.retry_recommended ?? null
    } as IntegracionSAPDetalle,
    solicitudesTransferencia: envio.solicitudes_transferencia ?? null
  }))
}

/** Determina el estado interno del resultado SAP a partir de la respuesta del backend. */
function determineInnerStatus(response: ProcesoCompletoSAPResponse): 'success' | 'partial' | 'error' {
  if ((response as any).status === 'success' || (response as any).status === 'partial' || (response as any).status === 'error') {
    return (response as any).status
  } else if (response.envio_sap?.doc_num != null) {
    return 'success'
  } else if (response.error_detalle) {
    return 'partial'
  } else {
    return 'error'
  }
}

/** Rama de applySAPResponse para innerStatus === 'success'. */
async function handleSAPResponseSuccess(
  response: ProcesoCompletoSAPResponse,
  solicitudesTransferencia: SolicitudesTransferencia | null
) {
  try {
    await loadPedido()
  } catch (e) {
    console.warn('[applySAPResponse] loadPedido tras éxito SAP:', e)
    const cabecera = pedido.value?.cabecera
    if (cabecera) {
      cabecera.estado_id = 12
      cabecera.estado = 'CONFIRMADO_ENVIADO'
    }
  }
  procesoStore.setSAPResultadoPendiente({
    detalle: response.envio_sap ? {
      success: true,
      oc_id: response.envio_sap.oc_id ?? '',
      doc_num: response.envio_sap.doc_num,
      doc_entry: response.envio_sap.doc_entry,
      numero_oc_sap: (response.envio_sap as any).numero_oc_sap ?? null,
      message: response.message,
      error: null,
      error_message: null,
      error_code: null,
      error_source: null,
      retry_recommended: response.envio_sap.retry_recommended ?? null
    } as IntegracionSAPDetalle : null,
    solicitudesTransferencia: solicitudesTransferencia || null,
    detallesAdicionales: getDetallesAdicionales(response),
    estadoGeneral: 'success',
    numeroPedido: numeroPedido.value,
    ajustesDetalle: buildAjustesDetalleParaProcesoCompletoSAP()
  })
  router.push({ name: 'mba3-consultas-proceso' })
}

/** Rama de applySAPResponse para innerStatus === 'partial'. */
async function handleSAPResponsePartial(
  response: ProcesoCompletoSAPResponse,
  solicitudesTransferencia: SolicitudesTransferencia | null
) {
  try {
    await loadPedido()
  } catch (e) {
    console.warn('[applySAPResponse] loadPedido tras partial SAP:', e)
    if (response.redistribucion && pedido.value?.cabecera) {
      pedido.value.cabecera.estado_id = 10
      pedido.value.cabecera.estado = 'CONFIRMADO REDISTRIBUCION'
    }
  }
  const errorMsg = response.error_detalle ?? 'Error desconocido'
  const retryFlag = response.envio_sap?.retry_recommended ?? null
  procesoStore.setSAPResultadoPendiente({
    // Prioriza el error de ESTA ODC (envio_sap.error) sobre el resumen del pedido
    // completo (errorMsg / error_detalle), que en un pedido mixto concatena el
    // error de las 2 ODC ("RG-CD: ...; RL-CD: ...") -- el mensaje de la ODC puntual
    // es más preciso para esta sección del modal.
    detalle: response.envio_sap ? {
      success: !!response.envio_sap.doc_num,
      oc_id: response.envio_sap.oc_id ?? '',
      doc_num: response.envio_sap.doc_num,
      doc_entry: response.envio_sap.doc_entry,
      numero_oc_sap: (response.envio_sap as any).numero_oc_sap ?? null,
      message: null,
      error: response.envio_sap.error ?? errorMsg,
      error_message: response.envio_sap.error ?? errorMsg,
      error_code: response.envio_sap.error_code ?? null,
      error_source: null,
      retry_recommended: retryFlag
    } as IntegracionSAPDetalle : {
      success: false,
      oc_id: '',
      doc_num: null,
      doc_entry: null,
      message: null,
      error: errorMsg,
      error_message: errorMsg,
      error_code: null,
      error_source: null,
      retry_recommended: retryFlag
    } as IntegracionSAPDetalle,
    solicitudesTransferencia: solicitudesTransferencia || null,
    detallesAdicionales: getDetallesAdicionales(response),
    estadoGeneral: 'partial',
    numeroPedido: numeroPedido.value,
    ajustesDetalle: buildAjustesDetalleParaProcesoCompletoSAP()
  })
  router.push({ name: 'mba3-consultas-proceso' })
}

/** Rama de applySAPResponse para innerStatus === 'error'. */
async function handleSAPResponseError(response: ProcesoCompletoSAPResponse) {
  toast.error('Error en proceso SAP', response.message || 'Ocurrió un error inesperado')
  // Refresco adicional para sincronizar el flag backend.
  try {
    await loadPedido()
  } catch (e) {
    console.warn('[applySAPResponse] loadPedido tras error SAP:', e)
  }
}

/** Aplica el resultado del proceso SAP (compartido entre flujo async y fallback sync). */
async function applySAPResponse(response: ProcesoCompletoSAPResponse) {
  const innerStatus = determineInnerStatus(response)
  const solicitudesTransferencia = getSolicitudesTransferencia(response)

  if (innerStatus === 'success') {
    await handleSAPResponseSuccess(response, solicitudesTransferencia)
  } else if (innerStatus === 'partial') {
    await handleSAPResponsePartial(response, solicitudesTransferencia)
  } else {
    await handleSAPResponseError(response)
  }
}

/**
 * ⭐ Proceso completo: Redistribución + Generar ODC + Enviar a SAP
 * Intenta async (Celery); si backend responde 503 (Redis/Celery no disponible), fallback a sync.
 */
async function handleEnviarOdcSap() {
  if (!puedeConfirmarRedistribucion.value) {
    toast.warning('Validación requerida', 'Debe completar la redistribución correctamente antes de enviar a SAP')
    return
  }

  if (!pedido.value || !numeroPedido.value) {
    toast.error('Error', 'No hay pedido cargado')
    return
  }

  // Confirmación del usuario
  const confirmar = confirm(
    '¿Está seguro de enviar la ODC a SAP?\n\n' +
    'Este proceso ejecutará los siguientes pasos:\n' +
    '1. Confirmar la redistribución\n' +
    '2. Generar la Orden de Compra\n' +
    '3. Enviar la ODC a SAP Service Layer\n\n' +
    'Este proceso no se puede deshacer.'
  )
  
  if (!confirmar) return

  enviandoOdcSap.value = true
  startSapProgressSimulation()
  toast.info('Procesando...', 'Proceso SAP en segundo plano. No cierre la ventana.')

  const ajustes_detalle = redistribucion.productosRedistribucion.value.map(producto => ({
    codigo_producto: producto.codigo_producto,
    descripcion: producto.descripcion,
    cantidad_solicitada: producto.cantidad_solicitada,
    cantidad_confirmada: producto.cantidad_confirmada,
    cantidad_ajustada: producto.cantidad_distribuida,
    distribucion_tiendas: producto.distribucion_tiendas.map(t => ({
      tienda_codigo: t.tienda_codigo,
      tienda_nombre: t.tienda_nombre,
      cantidad: t.cantidad_asignada
    })),
    costo_original: producto.costo_unitario,
    costo_ajustado: producto.costo_unitario,
    cambio_precio: false
  }))

  try {
    const response = await ejecutarProcesoCompletoSap(numeroPedido.value, ajustes_detalle, {
      onFallbackSync: () => {
        if (import.meta.env.DEV) console.warn('[handleEnviarOdcSap] Async no disponible (503), usando proceso SAP síncrono')
        toast.info('Proceso en segundo plano no disponible', 'Se ejecutará en modo síncrono. No cierre la ventana.')
        sapMessage.value = 'Ejecutando proceso en modo síncrono...'
      },
      onResumePending: () => {
        toast.info('Proceso en curso', 'Retomando el envío SAP iniciado anteriormente...')
        odcSapProcesoEnServidor.value = false
      },
      onPollingUpdate: applySapPollingUpdate,
      onSlowSyncLikely: marcarPosibleEsperaLarga,
    })
    completeSapProgress()
    odcSapProcesoEnServidor.value = false
    await new Promise(r => setTimeout(r, 400))
    await applySAPResponse(response)
  } catch (e: any) {
    console.error('Error al iniciar proceso completo SAP:', e)
    const isTransient = isTransientClientError(e) || e?.isTransientClientError === true
    const message = isTransient
      ? SAP_MAY_STILL_PROCESSING_MESSAGE
      : e?.response?.data?.message || e?.message || 'No se pudo iniciar el proceso'
    if (isTransient) {
      toast.warning('Tiempo de espera agotado', message)
      await refreshPendingOdcSapState()
    } else {
      toast.error('Error al enviar a SAP', message || 'No se pudo completar el proceso')
    }
    try {
      await loadPedido()
    } catch (loadErr) {
      console.warn('[handleEnviarOdcSap] loadPedido tras error SAP:', loadErr)
    }
  } finally {
    enviandoOdcSap.value = false
    setTimeout(() => {
      resetSapProgress()
    }, 500)
  }
}

// Verificar si tiene distribución confirmada
const tieneDistribucionConfirmada = computed(() => {
  if (!pedido.value) return false
  // Verificar si hay productos de redistribución cargados
  return redistribucion.productosRedistribucion.value.length > 0
})

// Descarga/exportación a Excel solo aplica desde CONFIRMADO_ENVIADO (estado_id 12) en adelante:
// antes de enviar la OC a SAP no existen Solicitudes de Traslado (ITR) que exportar
const pedidoConfirmadoYEnviado = computed(() => {
  const estadoId = pedido.value?.cabecera?.estado_id
  return estadoId != null && estadoId >= 12
})

// Exportar Solicitudes de Traslado en formato Excel (req. 1.9)
async function handleExportarTrasladosExcel() {
  const pedidoId = pedido.value?.cabecera?.pedido_id
  if (!pedidoId) {
    toast.error('Error', 'No hay pedido para exportar')
    return
  }

  if (exportandoTraslados.value) return

  exportandoTraslados.value = true
  toast.info('Generando archivo Excel...', 'Por favor espera')

  try {
    const blob = await mba3ConsultasService.exportarTrasladosExcel(pedidoId)

    // Crear nombre de archivo con timestamp
    const numeroPedidoDisplay = pedido.value?.cabecera?.numero_pedido ?? 'pedido'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const nombreArchivo = `traslados_${numeroPedidoDisplay.replace(/[^a-zA-Z0-9.-]/g, '_')}_${timestamp}.xlsx`

    // Crear URL del blob y descargar
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Exportación completada', 'El archivo de solicitudes de traslado se ha descargado correctamente')
  } catch (e: any) {
    console.error('Error al exportar traslados a Excel:', e)

    if (e.response?.status === 404) {
      toast.error('Sin traslados', 'Este pedido no tiene distribución confirmada para exportar')
    } else {
      // Con responseType: 'blob' el cuerpo del error llega como Blob, no como JSON:
      // extractErrorMessage no puede leerlo. El envelope real de error es
      // {"error": {"error": "...", "message": "..."}, "type": "http_exception"}
      // (ver src/middleware/exception_handlers.py del backend), así que se lee
      // error.message y no error directamente.
      let message: string | null = null
      if (e.response?.data instanceof Blob) {
        try {
          const json = JSON.parse(await e.response.data.text())
          message = json?.error?.message ?? null
        } catch {
          message = null
        }
      }
      toast.error('Error al exportar', message || 'Ocurrió un error al exportar las solicitudes de traslado')
    }
  } finally {
    exportandoTraslados.value = false
  }
}

// Cancelar (descartar) pedido: misma lógica que Descartar en Cargar Plantilla. Elimina el pedido y notifica a EL RAYO.
const cancelando = ref(false)
async function handleCancelar() {
  const pedidoId = pedido.value?.cabecera?.pedido_id
  if (!pedidoId) {
    toast.warning('Sin pedido', 'No hay pedido para cancelar')
    return
  }
  if (!confirm('¿Cancelar este pedido? El pedido cambiará su estado a CANCELADO y permanecerá en el sistema. Se notificará a EL RAYO.')) {
    return
  }
  cancelando.value = true
  try {
    const pedidoActualizado = await mba3ConsultasService.cancelarPedido(pedidoId)
    // Actualizar el pedido en la vista con el nuevo estado CANCELADO
    if (pedido.value) {
      pedido.value.cabecera.estado = pedidoActualizado.cabecera.estado
      pedido.value.cabecera.estado_id = pedidoActualizado.cabecera.estado_id
      pedido.value.puede_cancelar_pedido = pedidoActualizado.puede_cancelar_pedido
    }
    toast.success('Pedido cancelado', 'El pedido se ha cancelado correctamente. EL RAYO ha sido notificado.')
    
    // Redirigir según el número de pedidos disponibles para redistribución
    try {
      const response = await mba3ConsultasService.getPedidosListado({
        solo_redistribucion: true,
        limit: 1,
        offset: 0
      })
      
      if (response.metadata.total >= 1) {
        // Hay pedidos disponibles: ir al listado de redistribución
        router.push('/mba3-consultas/redistribucion')
      } else {
        // No hay pedidos: ir al dashboard de mba3-consultas
        router.push('/mba3-consultas')
      }
    } catch (redirectError) {
      // Si falla la verificación, redirigir al dashboard por defecto
      console.warn('Error al verificar pedidos para redirección:', redirectError)
      router.push('/mba3-consultas')
    }
  } catch (e: any) {
    toast.error('Error al cancelar pedido', extractErrorMessage(e))
  } finally {
    cancelando.value = false
  }
}

// Navegación
function goToPedido() {
  if (!pedidoIdInput.value.trim()) return

  router.push({
    name: 'mba3-consultas-pedido-redistribucion',
    params: { id: encodeURIComponent(pedidoIdInput.value.trim()) }
  })
}

// Watch para inicializar redistribución cuando cambie el pedido
watch(
  () => pedido.value,
  async (newPedido) => {
    if (!newPedido) {
      redistribucion.productosRedistribucion.value = []
      redistribucion.productosExpandidos.value.clear()
      return
    }
    
    // Las columnas modificadas y sus roles (ODCSAP/PRODUCCION_ELRAYO) ya se cargaron desde el
    // backend en loadPedido() (usePedidoDetalle -> cargarModificacionesConFallback), que solo cae a
    // sessionStorage si el backend no tiene datos. No repetir esa carga aquí: sessionStorage no
    // incluye rol_modificador, y si el navegador tiene una copia vieja de una visita anterior a este
    // mismo pedido, pisaba el Set correcto recién cargado (bug: el resaltado por rol en
    // Redistribución caía siempre a ámbar aunque la última edición fuera de odcsap.view).
    const columnasAntes = columnasModificadas.value.size
    if (import.meta.env.DEV) console.log(`🎨 [MabelTradingRedistribucionView] Columnas modificadas ANTES de inicializar: ${columnasAntes}`)
    
    // Vista solo lectura (soloLectura=1): cargar última redistribución confirmada vía GET .../redistribucion/inicial?solo_lectura=1
    if (soloLectura.value) {
      await redistribucion.cargarRedistribucionSoloLectura()
      await nextTick()
      if (columnasModificadas.value.size === 0 && columnasAntes > 0) cargarColumnasModificadasDesdeStorage()
      if (import.meta.env.DEV) console.log(`🎨 [MabelTradingRedistribucionView] Solo lectura: datos cargados desde .../inicial?solo_lectura=1`)
      return
    }
    // Solo inicializar redistribución si ya existe respuesta_proveedor.
    // NO llamar a crear-respuesta-desde-pedido aquí: esa acción es exclusiva del clic en "Confirmar"
    // en Cargar Plantilla o Detalle del Pedido (EL RAYO). Llamarla al cargar esta vista disparaba
    // confirmación y envío de email en el backend sin intervención del usuario.
    if (newPedido.respuesta_proveedor) {
      await redistribucion.cargarYInicializarRedistribucion()
      
      // ⭐ CRÍTICO: Asegurar que las columnas modificadas se mantengan después de inicializar
      await nextTick()
      
      if (columnasModificadas.value.size === 0 && columnasAntes > 0) {
        console.warn(`⚠️ [MabelTradingRedistribucionView] Columnas modificadas se perdieron después de inicializar, recargando...`)
        cargarColumnasModificadasDesdeStorage()
      }
      if (import.meta.env.DEV) console.log(`🎨 [MabelTradingRedistribucionView] Columnas modificadas DESPUÉS de inicializar: ${columnasModificadas.value.size}`)
    }
    // Si no hay respuesta_proveedor: no crear automáticamente. El usuario debe confirmar desde
    // Cargar Plantilla o Detalle del Pedido (EL RAYO) para que exista la respuesta.
  },
  { immediate: true }
)

// Watch para reaccionar a cambios en el parámetro de ruta
watch(
  () => route.params.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await loadPedido()
      pedidoIdInput.value = ''
    }
    // Solo cargar último pedido cuando seguimos en la ruta de redistribución de pedido sin id.
    // No ejecutar al navegar fuera (dashboard, etc.): comprobar path para evitar toast/redirect indebidos.
    const sigueEnRedistribucionPedido = route.path.startsWith('/mba3-consultas/pedidos/') && route.path.includes('/redistribucion')
    if (!newId && oldId !== undefined && sigueEnRedistribucionPedido) {
      pedido.value = null
      await cargarRedistribucionSinPedido()
    }
  }
)

// ⭐ Cargando último pedido (RESPUESTA_PROVEEDOR_CARGADA) al entrar desde dashboard (ruta sin id)
const cargandoUltimoConfirmado = ref(false)

// Lógica para /redistribucion sin id: último pedido RESPUESTA_PROVEEDOR_CARGADA (GET /api/pedidos/ultimo-redistribucion)
async function cargarRedistribucionSinPedido() {
  cargandoUltimoConfirmado.value = true
  try {
    const ultimo = await mba3ConsultasService.getUltimoPedidoRedistribucion(true)
    const num = ultimo?.numero_pedido
    if (num) {
      toast.info('Último pedido', `Cargando pedido ${num}`)
      await router.replace({
        name: 'mba3-consultas-pedido-redistribucion',
        params: { id: encodeURIComponent(num) }
      })
    }
  } catch {
    // Si falla, se queda en /redistribucion con el input de búsqueda
  } finally {
    cargandoUltimoConfirmado.value = false
  }
}

onMounted(async () => {
  if (numeroPedido.value) {
    await loadPedido()
    await refreshPendingOdcSapState()
    if (import.meta.env.DEV) console.log(`🎨 [MabelTradingRedistribucionView] Estado final de columnas modificadas: ${columnasModificadas.value.size} modificaciones`)
    if (columnasModificadas.value.size > 0) {
      if (import.meta.env.DEV) console.log(`   Columnas modificadas: ${Array.from(columnasModificadas.value).join(', ')}`)
    }
    return
  }
  // Solo cargar último pedido si realmente estamos en la ruta sin id (ruta con :id debería tener id)
  if (route.name === 'mba3-consultas-pedido-redistribucion') {
    await cargarRedistribucionSinPedido()
  }
})

// ⭐ Cleanup al desmontar componente
onUnmounted(() => {
  stopSapProgressSimulation()
})
</script>
