<template>
  <!-- Overlay de bloqueo durante la carga de plantilla Excel con barra de progreso -->
  <Teleport to="body">
    <div
      v-if="uploading"
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
        <div class="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-600/5 pointer-events-none"></div>
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
        
        <div class="relative z-10 flex flex-col items-center gap-5">
          <!-- Spinner con efecto de pulso -->
          <div class="relative">
            <svg class="animate-spin h-14 w-14 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div class="absolute inset-0 border-2 border-emerald-300/30 dark:border-emerald-500/30 rounded-full animate-ping"></div>
          </div>
          
          <div class="w-full">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Cargando Plantilla Excel</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">{{ uploadMessage || 'Preparando archivo...' }}</p>
            
            <!-- Barra de progreso -->
            <div class="w-full space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400 font-medium">
                  {{ uploadFase === 'upload' ? 'Subiendo archivo' : (uploadFase === 'processing' ? 'Procesando en servidor' : 'Preparando') }}
                </span>
                <span class="text-emerald-600 dark:text-emerald-400 font-bold">{{ uploadProgress }}%</span>
              </div>
              <div class="w-full h-3 bg-gray-200/80 dark:bg-gray-700/80 rounded-full overflow-hidden shadow-inner">
                <div
                  class="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 transition-all duration-300 ease-out shadow-lg relative overflow-hidden"
                  :style="{ width: `${uploadProgress}%` }"
                >
                  <!-- Efecto shimmer sobre la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  <!-- Efecto de pulso en la barra -->
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Indicadores de fase -->
          <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'upload' || uploadFase === 'processing' || uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Subir</span>
            </div>
            <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'processing' || uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Validar</span>
            </div>
            <div class="w-4 h-px bg-gray-300 dark:bg-gray-600"></div>
            <div class="flex items-center gap-1">
              <div :class="[
                'w-2 h-2 rounded-full transition-colors duration-300',
                uploadFase === 'complete' 
                  ? 'bg-emerald-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              ]"></div>
              <span>Guardar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6" :class="{ 'pointer-events-none opacity-75': uploading }">
      <!-- Header: fila título + fila de acciones (misma lógica que PedidoHeaderActions) -->
      <div class="space-y-4">
        <OdcSapVolverButton
          v-if="odcSapVolverTarget"
          :to="odcSapVolverTarget"
          :title="odcSapVolverTitle"
          class="shrink-0 self-start"
        />
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Cargar Plantilla
              </h1>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                MABEL TRADING
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Selecciona un pedido para cargar plantilla Excel, editar o continuar el flujo
            </p>
            <!-- Contador de pedidos pendientes -->
            <div v-if="contadorPedidosPendientes > 0" class="mt-2">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span class="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  {{ contadorPedidosPendientes }} pedido{{ contadorPedidosPendientes !== 1 ? 's' : '' }} requieren acción
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex w-full flex-wrap items-center justify-end gap-3">
          <!-- Temporalmente oculto: Crear pedido -->
          <button
            v-if="false"
            @click="router.push('/mba3-consultas/pedidos/crear')"
            class="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Crear pedido
          </button>
          <button
            @click="openFileSelector"
            :disabled="uploading"
            class="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            title="Cargar plantilla Excel"
          >
            <svg v-if="!uploading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <LoadingSpinner v-else layout="inline" size="md" color="current" aria-label="Cargando plantilla Excel" />
            {{ uploading ? 'Cargando...' : 'Cargar Plantillas Excel' }}
          </button>
          <button
            @click="cargarPedidos"
            class="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            :disabled="loading"
          >
            <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <LoadingSpinner v-else layout="inline" size="md" color="current" aria-label="Cargando pedidos" />
            {{ loading ? 'Cargando...' : 'Actualizar' }}
          </button>
        </div>
      </div>

      <!-- Filtros (misma estructura que PedidosListView) -->
      <PedidosListFiltrosBar
        v-model:estado="filtros.estado"
        v-model:tipoFecha="filtros.tipo_fecha"
        v-model:fechaDesde="filtros.fecha_desde"
        v-model:fechaHasta="filtros.fecha_hasta"
        v-model:proveedorNombre="filtros.proveedor_nombre"
        v-model:filtroSoloPendientes="filtroSoloPendientes"
        v-model:numeroPedidoTexto="busquedaNumeroPedido"
        v-model:creadoPorTexto="busquedaCreadoPor"
        :estados-disponibles="estadosDisponibles"
        :show-quick-filter="true"
        :contador-pedidos-pendientes="contadorPedidosPendientes"
        numero-pedido-placeholder="Buscar por número de pedido (ej: P-12.08)"
        @aplicar="aplicarFiltros"
        @limpiar="limpiarFiltros"
        @estado-change="actualizarFiltroPendientes"
        @toggle-filtro-pendientes="aplicarFiltroPendientes"
        @numero-pedido-input="handleBusquedaNumeroPedido"
        @numero-pedido-commit="buscarNumeroPedidoInmediato"
        @numero-pedido-clear="limpiarBusquedaNumeroPedidoTexto"
        @creado-por-input="handleBusquedaCreadoPor"
        @creado-por-commit="buscarCreadoPorInmediato"
        @creado-por-clear="limpiarBusquedaCreadoPorTexto"
      />

      <!-- Tabla de Pedidos -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div
          @click="pedidosColapsados = !pedidosColapsados"
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Pedidos</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Mostrando {{ metadata.offset + 1 }} - {{ Math.min(metadata.offset + metadata.limit, metadata.total) }} de {{ metadata.total }} resultados
              </p>
            </div>
            <svg
              :class="['w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200', pedidosColapsados ? '' : 'rotate-180']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div v-show="!pedidosColapsados">
          <LoadingSpinner v-if="loading" message="Cargando pedidos..." />

          <div v-else-if="error" class="p-6">
            <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-red-900 dark:text-red-200">Error al cargar pedidos</p>
                  <p class="text-sm text-red-800 dark:text-red-300 mt-1">{{ error }}</p>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="pedidos.length === 0" class="p-12 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 text-lg font-medium">No se encontraron pedidos</p>
            <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">
              Intenta ajustar los filtros o
              <button @click="limpiarFiltros" class="text-indigo-600 hover:text-indigo-700 underline">
                limpiar los filtros
              </button>
            </p>
          </div>

          <div v-else class="overflow-x-auto">
            <div v-if="filtroSoloPendientes && pedidos.length > 0" class="px-6 py-2 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
              <p class="text-xs text-orange-700 dark:text-orange-300">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Mostrando solo pedidos que requieren acción.
                <button @click="filtroSoloPendientes = false; aplicarFiltroPendientes()" class="underline font-medium">
                  Mostrar todos
                </button>
              </p>
            </div>
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <SortableTableHead
                :columns="columnasTabla"
                :sort-column="sortColumn"
                :sort-direction="sortDirection"
                @toggle-sort="toggleSort"
              />
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="(pedido, index) in sortedPedidos"
                  :key="pedido.pedido_id"
                  :class="[
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
                    requiereAccionPedido(pedido.estado) ? 'bg-orange-50/30 dark:bg-orange-900/10 border-l-4 border-orange-500 dark:border-orange-400' : ''
                  ]"
                  @click="abrirPedido(pedido)"
                >
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400 font-medium">
                    {{ metadata.offset + index + 1 }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {{ pedido.numero_pedido }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {{ pedido.fecha_pedido ? formatDate(pedido.fecha_pedido) : '-' }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    <span
                      v-if="esProveedorElRayo(pedido.proveedor_nombre)"
                      class="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      title="Proveedor: El Rayo"
                    >
                      {{ pedido.proveedor_nombre }}
                    </span>
                    <span v-else>{{ pedido.proveedor_nombre || '-' }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <div class="flex items-center justify-center gap-2">
                      <span :class="getEstadoPedidoBadgeClassFull(pedido.estado)">{{ getEstadoPedidoLabel(pedido.estado) }}</span>
                      <span v-if="requiereAccionPedido(pedido.estado)" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" title="Requiere acción">!</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">{{ pedido.comprador_nombre || '-' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {{ pedido.creado_en ? formatDateTime(pedido.creado_en) : '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {{ pedido.modificado_fecha ? formatDateTime(pedido.modificado_fecha) : '-' }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {{ pedido.modificado_por || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="pedidos.length > 0 && !loading" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="text-sm text-gray-700 dark:text-gray-300">
                Mostrando {{ metadata.offset + 1 }} - {{ Math.min(metadata.offset + metadata.limit, metadata.total) }} de {{ metadata.total }} resultados
              </div>
              <QuickTablePagination
                v-model="currentPage"
                :total-pages="totalPages"
                :page-size="metadata.limit"
                :page-size-options="PAGE_SIZE_OPTIONS"
                :disabled="loading"
                aria-label="Paginación de pedidos (cargar plantilla)"
                @update:page-size="setPageSize"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Modal para errores de validación del archivo -->
      <UploadErrorModal
        v-model="showErrorModal"
        :upload-error-info="uploadErrorInfo"
        :show-data-protection-message="true"
        @apply-corrections="aplicarCorreccionesYContinuar"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@vue/reactivity'
import { onMounted, onUnmounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { useFileUpload } from '../composables/useFileUpload'
import type { CorreccionesPlantilla } from '../composables/useFileUpload'
import UploadErrorModal from '../components/UploadErrorModal.vue'
import OdcSapVolverButton from '@/components/OdcSapVolverButton.vue'
import QuickTablePagination from '@/components/QuickTablePagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import SortableTableHead from '../components/SortableTableHead.vue'
import PedidosListFiltrosBar from '../components/PedidosListFiltrosBar.vue'
import { useOdcSapVolver } from '../../../composables/useOdcSapVolver'
import type { PedidoResumido, PedidosListadoFiltros, PedidosListadoMetadata, PlantillasPedidosResponse, EstadoPedidoOption } from '../types'
import { formatDate, formatDateTime } from '../utils/formatters'
import { esProveedorElRayo } from '../utils/styleHelpers'
import { PAGE_SIZE_OPTIONS } from '../config/pagination'
import { useFiltroTextoConDebounce } from '../composables/useFiltroTextoConDebounce'
import { usePageSizePreference } from '../composables/usePageSizePreference'
import { getEstadoPedidoLabel, getEstadoPedidoBadgeClassFull, ESTADOS_QUE_REQUIEREN_ACCION, requiereAccionPedido } from '../utils/estadoPedido'
import { useSortableList, type SortableColumnDef } from '../composables/useSortableList'
import { useOffsetPagination } from '../composables/useOffsetPagination'
import { useListadoAutoRefresh } from '../composables/useListadoAutoRefresh'

const { target: odcSapVolverTarget, title: odcSapVolverTitle } = useOdcSapVolver()
const router = useRouter()
const toast = useToast()

// Carga de plantillas Excel (redirige a cargar-plantilla/:id tras subir). useAsyncUpload: no bloquea la app (Celery).
// onUploadSuccess: refrescar lista para que al volver desde el detalle el nuevo pedido esté visible.
const fileUploadComposable = useFileUpload({
  redirectToCargarPlantilla: true,
  useAsyncUpload: true,
  onUploadSuccess: () => { cargarPedidos() }
})
const {
  uploading,
  openFileSelector,
  showErrorModal,
  uploadErrorInfo,
  archivoOriginal: archivoOriginalDelComposable,
  reintentarConCorrecciones,
  // ⭐ NUEVO: Variables de progreso de carga
  uploadProgress,
  uploadFase,
  uploadMessage
} = fileUploadComposable

async function aplicarCorreccionesYContinuar(correcciones: CorreccionesPlantilla): Promise<void> {
  const archivo = archivoOriginalDelComposable.value
  if (!archivo) {
    toast.error('Error', 'No se encontró el archivo original. Por favor, vuelve a subir el archivo.')
    return
  }
  try {
    showErrorModal.value = false
    await reintentarConCorrecciones(archivo, correcciones)
  } catch (error: any) {
    console.error('❌ Error al aplicar correcciones:', error)
    if (uploadErrorInfo.value) showErrorModal.value = true
    toast.error('Error al aplicar correcciones', error.message || 'No se pudo procesar el archivo con las correcciones aplicadas')
  }
}

const pedidos = ref<PedidoResumido[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const estadosDisponibles = ref<EstadoPedidoOption[]>([])
const PAGE_SIZE = 10
const { pageSize: pageSizeGuardado, guardar: guardarPageSize } = usePageSizePreference('cargar-plantilla-listado', PAGE_SIZE)
const metadata = ref<PedidosListadoMetadata>({
  total: 0,
  limit: pageSizeGuardado.value,
  offset: 0,
  has_more: false
})

const pedidosColapsados = ref(false)
const filtroSoloPendientes = ref(false)

const filtros = ref<PedidosListadoFiltros>({
  estado: '',
  fecha_desde: '',
  fecha_hasta: '',
  tipo_fecha: 'pedido',
  proveedor_nombre: '',
  numero_pedido: '',
  creado_por: '',
  limit: PAGE_SIZE,
  offset: 0
})

const { totalPages, currentPage, resetToFirstPage, setPageSize } = useOffsetPagination(metadata, cargarPedidos, {
  onOffsetChange: (offset) => { filtros.value.offset = offset },
  onPageSizeChange: guardarPageSize
})

// ========== Búsqueda por Número de Pedido (con debounce, filtra en vivo) ==========
const {
  texto: busquedaNumeroPedido,
  handleInput: handleBusquedaNumeroPedido,
  commit: buscarNumeroPedidoInmediato,
  clear: limpiarBusquedaNumeroPedidoTexto,
  dispose: disposeBusquedaNumeroPedido
} = useFiltroTextoConDebounce(filtros, 'numero_pedido', aplicarFiltros)

// ========== Búsqueda por Creado Por (con debounce, filtra en vivo) ==========
const {
  texto: busquedaCreadoPor,
  handleInput: handleBusquedaCreadoPor,
  commit: buscarCreadoPorInmediato,
  clear: limpiarBusquedaCreadoPorTexto,
  dispose: disposeBusquedaCreadoPor
} = useFiltroTextoConDebounce(filtros, 'creado_por', aplicarFiltros)

const columnasTabla: SortableColumnDef[] = [
  { key: 'numero_pedido', label: 'Número de Pedido' },
  { key: 'fecha_pedido', label: 'Fecha Pedido' },
  { key: 'proveedor_nombre', label: 'Proveedor' },
  { key: 'estado', label: 'Estado', align: 'center' },
  { key: 'comprador_nombre', label: 'Comprador' },
  { key: 'creado_en', label: 'Fecha Creación' },
  { key: 'modificado_fecha', label: 'Fecha Modificación' },
  { key: 'modificado_por', label: 'Modificado Por' }
]

const { sortColumn, sortDirection, toggleSort, sortedItems: sortedPedidos } = useSortableList<PedidoResumido>({
  items: pedidos,
  dateColumns: ['fecha_pedido', 'creado_en', 'modificado_fecha']
})

const contadorPedidosPendientes = computed(() => pedidos.value.filter(p => requiereAccionPedido(p.estado)).length)

async function cargarEstados() {
  try {
    const response = await mba3ConsultasService.getEstadosPedido('cargar-plantilla')
    estadosDisponibles.value = response.data
  } catch (e: any) {
    console.error('Error al cargar estados:', e)
  }
}

async function cargarPedidos() {
  loading.value = true
  error.value = null
  try {
    // ⭐ Usar getPlantillasPedidos en lugar de getPedidosListado
    // El endpoint /api/plantillas/pedidos INCLUYE pedidos BORRADOR (no filtra por usuario)
    const response: PlantillasPedidosResponse = await mba3ConsultasService.getPlantillasPedidos({
      estado: filtros.value.estado || undefined,
      numero_pedido: filtros.value.numero_pedido || undefined,
      creado_por: filtros.value.creado_por || undefined,
      fecha_desde: filtros.value.fecha_desde || undefined,
      fecha_hasta: filtros.value.fecha_hasta || undefined,
      tipo_fecha: filtros.value.tipo_fecha,
      limit: metadata.value.limit,
      offset: metadata.value.offset,
      solo_pendientes_accion: filtroSoloPendientes.value || undefined,
    })
    pedidos.value = response.data
    metadata.value = response.metadata
  } catch (e: any) {
    console.error('Error al cargar pedidos:', e)
    error.value = e.message || 'No se pudieron cargar los pedidos'
    toast.error('Error', error.value ?? undefined)
  } finally {
    loading.value = false
  }
}

function aplicarFiltroPendientes() {
  if (filtroSoloPendientes.value) {
    const estadoAnterior = filtros.value.estado
    if (estadoAnterior && (ESTADOS_QUE_REQUIEREN_ACCION as readonly string[]).includes(estadoAnterior)) {
      filtros.value.estado = ''
    }
  }
  aplicarFiltros()
}

function actualizarFiltroPendientes() {
  const estadoActual = filtros.value.estado
  if (estadoActual && !(ESTADOS_QUE_REQUIEREN_ACCION as readonly string[]).includes(estadoActual)) {
    filtroSoloPendientes.value = false
  }
}

function aplicarFiltros() {
  resetToFirstPage()
}

function limpiarFiltros() {
  filtros.value = {
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    tipo_fecha: 'pedido',
    proveedor_nombre: '',
    numero_pedido: '',
    creado_por: '',
    limit: PAGE_SIZE,
    offset: 0
  }
  // Mantener en sync los inputs de búsqueda con debounce (Número de Pedido, Creado Por)
  busquedaNumeroPedido.value = ''
  busquedaCreadoPor.value = ''
  filtroSoloPendientes.value = false
  resetToFirstPage()
}

/** Navega a la vista Cargar Plantilla con el pedido seleccionado (sin llamar a gestionarPedido) */
function abrirPedido(pedido: PedidoResumido) {
  router.push(`/mba3-consultas/cargar-plantilla/${encodeURIComponent(pedido.numero_pedido)}`)
}

// Recargar listado automáticamente ante notificaciones SSE relevantes, reconexión tras gap, y
// recuperación de foco/visibilidad de la pestaña (ver useListadoAutoRefresh.ts).
useListadoAutoRefresh(cargarPedidos)

onMounted(() => {
  cargarEstados()
  cargarPedidos()
})

onUnmounted(() => {
  disposeBusquedaNumeroPedido()
  disposeBusquedaCreadoPor()
})
</script>
