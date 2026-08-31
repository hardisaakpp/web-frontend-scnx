<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header: fila título + fila de acciones (mismo orden que otros listados MBA3) -->
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
                Redistribución
              </h1>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">
                MABEL TRADING
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Selecciona un pedido para distribuir cantidades por tienda
            </p>
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

      <!-- Filtros -->
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
                  @click="abrirRedistribucion(pedido)"
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
                v-model="redistribucionListCurrentPage"
                :total-pages="redistribucionListTotalPages"
                :page-size="metadata.limit"
                :page-size-options="PAGE_SIZE_OPTIONS"
                :disabled="loading"
                aria-label="Paginación de pedidos en redistribución"
                @update:page-size="cambiarTamanoPagina"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@vue/reactivity'
import { onMounted, onUnmounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { PedidosListadoResponse, PedidoResumido, PedidosListadoFiltros, PedidosListadoMetadata, EstadoPedidoOption } from '../types'
import { formatDate, formatDateTime } from '../utils/formatters'
import { esProveedorElRayo } from '../utils/styleHelpers'
import { PAGE_SIZE_OPTIONS } from '../config/pagination'
import { useFiltroTextoConDebounce } from '../composables/useFiltroTextoConDebounce'
import { usePageSizePreference } from '../composables/usePageSizePreference'
import { getEstadoPedidoLabel, getEstadoPedidoBadgeClassFull, requiereAccionPedido } from '../utils/estadoPedido'
import { useSortableList, type SortableColumnDef } from '../composables/useSortableList'
import { useOffsetPagination } from '../composables/useOffsetPagination'
import { useListadoAutoRefresh } from '../composables/useListadoAutoRefresh'
import OdcSapVolverButton from '@/components/OdcSapVolverButton.vue'
import QuickTablePagination from '@/components/QuickTablePagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import SortableTableHead from '../components/SortableTableHead.vue'
import PedidosListFiltrosBar from '../components/PedidosListFiltrosBar.vue'
import { useOdcSapVolver } from '../../../composables/useOdcSapVolver'

const router = useRouter()
const toast = useToast()
const { target: odcSapVolverTarget, title: odcSapVolverTitle } = useOdcSapVolver()

const pedidos = ref<PedidoResumido[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const estadosDisponibles = ref<EstadoPedidoOption[]>([])
const PAGE_SIZE = 10
const { pageSize: pageSizeGuardado, guardar: guardarPageSize } = usePageSizePreference('redistribucion-listado', PAGE_SIZE)
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

const contadorPedidosPendientes = computed(() =>
  pedidos.value.filter(p => requiereAccionPedido(p.estado)).length
)

// Columnas de la tabla (ordenables vía SortableTableHead)
const columnasTabla: SortableColumnDef[] = [
  { key: 'numero_pedido', label: 'Número de Pedido' },
  { key: 'fecha_pedido', label: 'Fecha' },
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

async function cargarEstados() {
  try {
    const response = await mba3ConsultasService.getEstadosPedido('redistribucion')
    estadosDisponibles.value = response.data
  } catch (e: any) {
    console.error('Error al cargar estados:', e)
  }
}

async function cargarPedidos() {
  loading.value = true
  error.value = null
  try {
    const response: PedidosListadoResponse = await mba3ConsultasService.getPedidosListado({
      ...filtros.value,
      solo_redistribucion: true,
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

const {
  totalPages: redistribucionListTotalPages,
  currentPage: redistribucionListCurrentPage,
  setPageSize: cambiarTamanoPagina,
  resetToFirstPage
} = useOffsetPagination(metadata, cargarPedidos, {
  onOffsetChange: (offset) => { filtros.value.offset = offset },
  onPageSizeChange: guardarPageSize
})

function aplicarFiltroPendientes() {
  if (filtroSoloPendientes.value) {
    const estadoAnterior = filtros.value.estado
    const estadosPendientes = ['PENDIENTE_CONFIRMACION_PROVEEDOR', 'RESPUESTA_PROVEEDOR_CARGADA', 'CONFIRMADO_PROVEEDOR']
    if (estadoAnterior && estadosPendientes.includes(estadoAnterior)) {
      filtros.value.estado = ''
    }
  }
  aplicarFiltros()
}

function actualizarFiltroPendientes() {
  const estadoActual = filtros.value.estado
  const estadosPendientes = ['PENDIENTE_CONFIRMACION_PROVEEDOR', 'RESPUESTA_PROVEEDOR_CARGADA', 'CONFIRMADO_PROVEEDOR']
  if (estadoActual && !estadosPendientes.includes(estadoActual)) {
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
  busquedaNumeroPedido.value = ''
  busquedaCreadoPor.value = ''
  filtroSoloPendientes.value = false
  resetToFirstPage()
}

/** Navega a la vista de Redistribución del pedido seleccionado */
function abrirRedistribucion(pedido: PedidoResumido) {
  router.push({
    name: 'mba3-consultas-pedido-redistribucion',
    params: { id: encodeURIComponent(pedido.numero_pedido) }
  })
}

onMounted(() => {
  cargarEstados()
  cargarPedidos()
})

onUnmounted(() => {
  disposeBusquedaNumeroPedido()
  disposeBusquedaCreadoPor()
})

// ⭐ Refresco automático del listado (notificación SSE con metadata.accion, reconexión SSE
// tras una desconexión, y foco/visibilidad de la pestaña) -- ver useListadoAutoRefresh.ts
useListadoAutoRefresh(cargarPedidos)
</script>
