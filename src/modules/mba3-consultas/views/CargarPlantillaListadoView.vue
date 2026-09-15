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
        <VolverButton
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
            <RequiereAccionToggleButton
              :contador="contadorPedidosPendientes"
              :activo="filtroSoloPendientes"
              titulo-inactivo="Filtrar para ver solo pedidos en estados: Producción Pospuesta, Despachar y Facturar"
              @toggle="filtroSoloPendientes = !filtroSoloPendientes; aplicarFiltroPendientes()"
            />
          </div>
          <div class="flex flex-wrap items-center gap-3">
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
            <ActualizarButton :loading="loading" @click="cargarPedidos" />
          </div>
        </div>
      </div>

      <!-- Filtros (misma estructura que PedidosListView) -->
      <PedidosListFiltrosBar
        :collapsed="filtrosColapsados"
        @update:collapsed="guardarFiltrosColapsados"
        v-model:estado="filtros.estado"
        v-model:tipoFecha="filtros.tipo_fecha"
        v-model:fechaDesde="filtros.fecha_desde"
        v-model:fechaHasta="filtros.fecha_hasta"
        v-model:proveedorNombre="filtros.proveedor_nombre"
        v-model:numeroPedidoTexto="busquedaNumeroPedido"
        v-model:creadoPor="filtros.creado_por"
        v-model:modificadoPor="filtros.modificado_por"
        :estados-disponibles="estadosDisponibles"
        :creadores-disponibles="creadoresDisponibles"
        :modificadores-disponibles="modificadoresDisponibles"
        numero-pedido-placeholder="Buscar por número de pedido (ej: P-12.08)"
        @aplicar="aplicarFiltros"
        @limpiar="limpiarFiltros"
        @estado-change="actualizarFiltroPendientes"
        @numero-pedido-input="handleBusquedaNumeroPedido"
        @numero-pedido-commit="buscarNumeroPedidoInmediato"
        @numero-pedido-clear="limpiarBusquedaNumeroPedidoTexto"
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
                @reset-sort="resetSort"
              />
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="(pedido, index) in sortedPedidos"
                  :key="pedido.pedido_id"
                  :class="[
                    'transition-colors cursor-pointer',
                    filaCargandoId === pedido.pedido_id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-400 dark:ring-indigo-500'
                      : filaCargandoId
                        ? 'opacity-50 pointer-events-none'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                    requiereAccionPedidoCargarPlantilla(pedido.estado) ? 'bg-orange-50/30 dark:bg-orange-900/10 border-l-4 border-orange-500 dark:border-orange-400' : ''
                  ]"
                  @click="abrirPedido(pedido)"
                >
                  <td class="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400 font-medium">
                    <LoadingSpinner v-if="filaCargandoId === pedido.pedido_id" size="xs" color="indigo" layout="inline" aria-label="Abriendo pedido" />
                    <span v-else>{{ metadata.offset + index + 1 }}</span>
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
                      <span v-if="requiereAccionPedidoCargarPlantilla(pedido.estado)" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" title="Requiere acción">!</span>
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
import { ref } from '@vue/reactivity'
import { onMounted, onUnmounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { useFileUpload } from '../composables/useFileUpload'
import type { CorreccionesPlantilla } from '../composables/useFileUpload'
import UploadErrorModal from '../components/UploadErrorModal.vue'
import VolverButton from '@/components/navegacion/VolverButton.vue'
import QuickTablePagination from '@/components/paginacion/QuickTablePagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import ActualizarButton from '../components/ActualizarButton.vue'
import SortableTableHead from '../components/SortableTableHead.vue'
import PedidosListFiltrosBar from '../components/PedidosListFiltrosBar.vue'
import RequiereAccionToggleButton from '../components/RequiereAccionToggleButton.vue'
import { useOdcSapVolver } from '../../../composables/useOdcSapVolver'
import type { PedidoResumido, PedidosListadoFiltros, PedidosListadoMetadata, EstadoPedidoOption } from '../types'
import { formatDate, formatDateTime } from '../utils/formatters'
import { esProveedorElRayo } from '../utils/styleHelpers'
import { PAGE_SIZE_OPTIONS } from '../config/pagination'
import { useFiltroTextoConDebounce } from '../composables/useFiltroTextoConDebounce'
import { usePageSizePreference } from '../composables/usePageSizePreference'
import { usePaginaPreference } from '../composables/usePaginaPreference'
import { useFiltrosColapsadosPreference } from '../composables/useFiltrosColapsadosPreference'
import { getEstadoPedidoLabel, getEstadoPedidoBadgeClassFull, ESTADOS_QUE_REQUIEREN_ACCION_CARGAR_PLANTILLA, requiereAccionPedidoCargarPlantilla } from '../utils/estadoPedido'
import {
  useSortableList,
  type SortableColumnDef,
  DESCRIPCION_COLUMNA_FECHA_PEDIDO,
  DESCRIPCION_COLUMNA_FECHA_CREACION,
  DESCRIPCION_COLUMNA_FECHA_MODIFICACION
} from '../composables/useSortableList'
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
const creadoresDisponibles = ref<string[]>([])
const modificadoresDisponibles = ref<string[]>([])
const PAGE_SIZE = 10
const { pageSize: pageSizeGuardado, guardar: guardarPageSize } = usePageSizePreference('cargar-plantilla-listado', PAGE_SIZE)
const { colapsado: filtrosColapsados, guardar: guardarFiltrosColapsados } = useFiltrosColapsadosPreference('cargar-plantilla-listado')
const { offset: offsetGuardado, guardar: guardarOffset } = usePaginaPreference('cargar-plantilla-listado')
const metadata = ref<PedidosListadoMetadata>({
  total: 0,
  limit: pageSizeGuardado.value,
  offset: offsetGuardado.value,
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
  modificado_por: '',
  limit: PAGE_SIZE,
  offset: offsetGuardado.value
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

const columnasTabla: SortableColumnDef[] = [
  { key: 'numero_pedido', label: 'Número de Pedido' },
  { key: 'fecha_pedido', label: 'Fecha Pedido', description: DESCRIPCION_COLUMNA_FECHA_PEDIDO },
  { key: 'proveedor_nombre', label: 'Proveedor' },
  { key: 'estado', label: 'Estado', align: 'center' },
  { key: 'comprador_nombre', label: 'Comprador' },
  { key: 'creado_en', label: 'Fecha Creación', description: DESCRIPCION_COLUMNA_FECHA_CREACION },
  { key: 'modificado_fecha', label: 'Fecha Modificación', description: DESCRIPCION_COLUMNA_FECHA_MODIFICACION },
  { key: 'modificado_por', label: 'Modificado Por' }
]

const { sortColumn, sortDirection, toggleSort, resetSort, sortedItems: sortedPedidos } = useSortableList<PedidoResumido>({
  items: pedidos,
  dateColumns: ['fecha_pedido', 'creado_en', 'modificado_fecha'],
  storageKey: 'cargar-plantilla-listado'
})

// Contador global de pedidos pendientes (total real del servidor, no depende de la página/tamaño
// de página cargados -- antes se calculaba filtrando `pedidos.value`, así que un pedido pendiente
// fuera de la página visible no se contaba y el botón podía incluso desaparecer).
const contadorPedidosPendientes = ref(0)
async function actualizarContadorPendientes() {
  try {
    const response = await mba3ConsultasService.getPlantillasPedidos({ solo_pendientes_accion: true, limit: 1 })
    contadorPedidosPendientes.value = response.metadata?.total ?? 0
  } catch (e) {
    console.error('Error al cargar el contador global de pedidos pendientes:', e)
  }
}

async function cargarEstados() {
  try {
    const response = await mba3ConsultasService.getEstadosPedido('cargar-plantilla')
    estadosDisponibles.value = response.data
  } catch (e: any) {
    console.error('Error al cargar estados:', e)
  }
}

async function cargarCreadoresYModificadores() {
  try {
    const [creadores, modificadores] = await Promise.all([
      mba3ConsultasService.getCreadoresPedido(),
      mba3ConsultasService.getModificadoresPedido()
    ])
    creadoresDisponibles.value = creadores.data
    modificadoresDisponibles.value = modificadores.data
  } catch (e: any) {
    console.error('Error al cargar creadores/modificadores:', e)
  }
}

async function obtenerPedidos() {
  error.value = null
  try {
    // ⭐ Usar getPlantillasPedidos en lugar de getPedidosListado
    // El endpoint /api/plantillas/pedidos INCLUYE pedidos BORRADOR (no filtra por usuario)
    const [response] = await Promise.all([
      mba3ConsultasService.getPlantillasPedidos({
        estado: filtros.value.estado || undefined,
        numero_pedido: filtros.value.numero_pedido || undefined,
        creado_por: filtros.value.creado_por || undefined,
        modificado_por: filtros.value.modificado_por || undefined,
        fecha_desde: filtros.value.fecha_desde || undefined,
        fecha_hasta: filtros.value.fecha_hasta || undefined,
        tipo_fecha: filtros.value.tipo_fecha,
        limit: metadata.value.limit,
        offset: metadata.value.offset,
        solo_pendientes_accion: filtroSoloPendientes.value || undefined,
      }),
      actualizarContadorPendientes(),
    ])
    pedidos.value = response.data
    metadata.value = response.metadata
    guardarOffset(metadata.value.offset)
  } catch (e: any) {
    console.error('Error al cargar pedidos:', e)
    error.value = e.message || 'No se pudieron cargar los pedidos'
    toast.error('Error', error.value ?? undefined)
  }
}

// Carga inicial / filtros / paginación: activa el spinner de pantalla completa
async function cargarPedidos() {
  loading.value = true
  try {
    await obtenerPedidos()
  } finally {
    loading.value = false
  }
}

/** Refresco en segundo plano (foco/SSE): no toca `loading`, para no desmontar la tabla mientras
 * el usuario hace clic en una fila (ver useRefetchOnFocus.ts). */
async function refrescarPedidosSilenciosamente() {
  await obtenerPedidos()
}

function aplicarFiltroPendientes() {
  if (filtroSoloPendientes.value) {
    const estadoAnterior = filtros.value.estado
    if (estadoAnterior && (ESTADOS_QUE_REQUIEREN_ACCION_CARGAR_PLANTILLA as readonly string[]).includes(estadoAnterior)) {
      filtros.value.estado = ''
    }
  }
  aplicarFiltros()
}

function actualizarFiltroPendientes() {
  const estadoActual = filtros.value.estado
  if (estadoActual && !(ESTADOS_QUE_REQUIEREN_ACCION_CARGAR_PLANTILLA as readonly string[]).includes(estadoActual)) {
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
    modificado_por: '',
    limit: PAGE_SIZE,
    offset: 0
  }
  // Mantener en sync el input de búsqueda con debounce (Número de Pedido)
  busquedaNumeroPedido.value = ''
  filtroSoloPendientes.value = false
  resetToFirstPage()
}

/** Navega a la vista Cargar Plantilla con el pedido seleccionado (sin llamar a gestionarPedido) */
const filaCargandoId = ref<string | null>(null)
function abrirPedido(pedido: PedidoResumido) {
  if (filaCargandoId.value) return
  filaCargandoId.value = pedido.pedido_id
  router.push(`/mba3-consultas/cargar-plantilla/${encodeURIComponent(pedido.numero_pedido)}`)
    .catch(() => {})
    .finally(() => { filaCargandoId.value = null })
}

// Recargar listado automáticamente ante notificaciones SSE relevantes, reconexión tras gap, y
// recuperación de foco/visibilidad de la pestaña (ver useListadoAutoRefresh.ts).
useListadoAutoRefresh(refrescarPedidosSilenciosamente)

onMounted(() => {
  cargarEstados()
  cargarCreadoresYModificadores()
  cargarPedidos()
})

onUnmounted(() => {
  disposeBusquedaNumeroPedido()
})
</script>
