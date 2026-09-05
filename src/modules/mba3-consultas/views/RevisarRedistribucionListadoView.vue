<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header: fila título + fila de acciones (mismo patrón que pedidos / redistribución listado) -->
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
                Revisar Redistribución
              </h1>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300">
                EL RAYO
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Selecciona un pedido para ver la distribución por tienda (solo lectura)
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <ActualizarButton class="shrink-0" :loading="loading" @click="cargarPedidos" />
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <PedidosListFiltrosBar
        :collapsed="filtrosColapsados"
        @update:collapsed="guardarFiltrosColapsados"
        v-model:tipoFecha="filtros.tipo_fecha"
        v-model:fechaDesde="filtros.fecha_desde"
        v-model:fechaHasta="filtros.fecha_hasta"
        v-model:proveedorNombre="filtros.proveedor_nombre"
        v-model:numeroPedidoTexto="busquedaNumeroPedido"
        v-model:creadoPor="filtros.creado_por"
        v-model:modificadoPor="filtros.modificado_por"
        :estados-disponibles="[]"
        :creadores-disponibles="creadoresDisponibles"
        :modificadores-disponibles="modificadoresDisponibles"
        @aplicar="aplicarFiltros"
        @limpiar="limpiarFiltros"
        @numero-pedido-input="handleBusquedaNumeroPedido"
        @numero-pedido-commit="buscarNumeroPedidoInmediato"
        @numero-pedido-clear="limpiarBusquedaNumeroPedido"
      >
        <template #estado-field>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estados incluidos</label>
            <!-- Estados incluidos: flujo de redistribución en adelante (usa flag solo_redistribucion en backend) -->
            <div class="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-600 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs leading-snug">
              Esta vista muestra pedidos del flujo de redistribución en adelante
              (incluye Confirmado, Confirmado y Enviado, Despachar y Facturar, Finalizado, etc., excluye borradores y cancelados).
            </div>
          </div>
        </template>
      </PedidosListFiltrosBar>

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
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <SortableTableHead
                :columns="pedidosColumns"
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
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  ]"
                  @click="abrirRevisar(pedido)"
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
                      class="inline-flex items-center px-1.5 py-0.5 rounded font-medium bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300"
                      title="Proveedor: El Rayo"
                    >
                      {{ pedido.proveedor_nombre }}
                    </span>
                    <span v-else>{{ pedido.proveedor_nombre || '-' }}</span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span :class="getEstadoPedidoBadgeClassFull(pedido.estado)">{{ getEstadoPedidoLabel(pedido.estado) }}</span>
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
                aria-label="Paginación de pedidos en revisión"
                @update:page-size="setPageSize"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from '@vue/reactivity'
import { onMounted, onUnmounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type {
  PedidoResumido,
  PedidosListadoFiltros,
  PedidosListadoMetadata,
  PedidoCompleto,
} from '../types'
import { formatDate, formatDateTime } from '../utils/formatters'
import { esProveedorElRayo } from '../utils/styleHelpers'
import { getEstadoPedidoLabel, getEstadoPedidoBadgeClassFull } from '../utils/estadoPedido'
import { PAGE_SIZE_OPTIONS } from '../config/pagination'
import { useDebouncedFilterInput } from '../composables/useDebouncedFilterInput'
import { usePageSizePreference } from '../composables/usePageSizePreference'
import { usePaginaPreference } from '../composables/usePaginaPreference'
import { useFiltrosColapsadosPreference } from '../composables/useFiltrosColapsadosPreference'
import {
  useSortableList,
  type SortableColumnDef,
  DESCRIPCION_COLUMNA_FECHA_PEDIDO,
  DESCRIPCION_COLUMNA_FECHA_CREACION,
  DESCRIPCION_COLUMNA_FECHA_MODIFICACION
} from '../composables/useSortableList'
import { useOffsetPagination } from '../composables/useOffsetPagination'
import { useListadoAutoRefresh } from '../composables/useListadoAutoRefresh'
import OdcSapVolverButton from '@/components/OdcSapVolverButton.vue'
import QuickTablePagination from '@/components/QuickTablePagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import ActualizarButton from '../components/ActualizarButton.vue'
import SortableTableHead from '../components/SortableTableHead.vue'
import PedidosListFiltrosBar from '../components/PedidosListFiltrosBar.vue'
import { useOdcSapVolver } from '../../../composables/useOdcSapVolver'

const router = useRouter()
const { target: odcSapVolverTarget, title: odcSapVolverTitle } = useOdcSapVolver()
const toast = useToast()

const pedidos = ref<PedidoResumido[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const creadoresDisponibles = ref<string[]>([])
const modificadoresDisponibles = ref<string[]>([])
const PAGE_SIZE = 10
const { pageSize: pageSizeGuardado, guardar: guardarPageSize } = usePageSizePreference('revisar-redistribucion-listado', PAGE_SIZE)
const { colapsado: filtrosColapsados, guardar: guardarFiltrosColapsados } = useFiltrosColapsadosPreference('revisar-redistribucion-listado')
const { offset: offsetGuardado, guardar: guardarOffset } = usePaginaPreference('revisar-redistribucion-listado')
const metadata = ref<PedidosListadoMetadata>({
  total: 0,
  limit: pageSizeGuardado.value,
  offset: offsetGuardado.value,
  has_more: false
})

const { totalPages, currentPage, setPageSize, resetToFirstPage } = useOffsetPagination(
  metadata,
  cargarPedidos,
  {
    onOffsetChange: (offset) => { filtros.value.offset = offset },
    onPageSizeChange: guardarPageSize,
  }
)

const pedidosColapsados = ref(false)

const filtros = ref<PedidosListadoFiltros>({
  estado: '',
  fecha_desde: '',
  fecha_hasta: '',
  tipo_fecha: 'pedido',
  proveedor_nombre: '',
  numero_pedido: '',
  creado_por: '',
  modificado_por: '',
  solo_redistribucion: true,
  limit: PAGE_SIZE,
  offset: offsetGuardado.value
})

// ========== Búsqueda por Número de Pedido (con debounce, filtra en vivo) ==========
const {
  texto: busquedaNumeroPedido,
  handleInput: handleBusquedaNumeroPedido,
  commit: buscarNumeroPedidoInmediato,
  clear: limpiarBusquedaNumeroPedido,
  dispose: disposeBusquedaNumeroPedido
} = useDebouncedFilterInput((valor) => {
  if (filtros.value.numero_pedido !== valor) {
    filtros.value.numero_pedido = valor
    aplicarFiltros()
  }
})

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

// Columnas ordenables de la tabla (thead genérico SortableTableHead)
const pedidosColumns: SortableColumnDef[] = [
  { key: 'numero_pedido', label: 'Número de Pedido' },
  { key: 'fecha_pedido', label: 'Fecha', description: DESCRIPCION_COLUMNA_FECHA_PEDIDO },
  { key: 'proveedor_nombre', label: 'Proveedor' },
  { key: 'estado', label: 'Estado', align: 'center' },
  { key: 'comprador_nombre', label: 'Comprador' },
  { key: 'creado_en', label: 'Fecha Creación', description: DESCRIPCION_COLUMNA_FECHA_CREACION },
  { key: 'modificado_fecha', label: 'Fecha Modificación', description: DESCRIPCION_COLUMNA_FECHA_MODIFICACION },
  { key: 'modificado_por', label: 'Modificado Por' },
]

const { sortColumn, sortDirection, toggleSort, resetSort, sortedItems: sortedPedidos } = useSortableList<PedidoResumido>({
  items: pedidos,
  dateColumns: ['fecha_pedido', 'creado_en', 'modificado_fecha'],
  storageKey: 'revisar-redistribucion-listado'
})

/** Mapea PedidoCompleto -> PedidoResumido para reutilizar la tabla actual (extraído de
 * obtenerPedidos para reducir su complejidad cognitiva). */
function mapPedidoCompletoToPedidoResumido(p: PedidoCompleto): PedidoResumido {
  const c = p.cabecera
  const root: any = p as any

  // Algunos campos (como modificado_fecha / modificado_por) no vienen en este endpoint.
  // Usar creado_en / creado_por como fallback razonable.
  const modificadoFecha =
    root.modificado_fecha ?? c.modificado_fecha ?? c.creado_en ?? null
  const modificadoPor =
    root.modificado_por ?? c.modificado_por ?? c.creado_por ?? null

  // Backend expone comprador como comprador_nombre y también como comprador (alias).
  const compradorNombre =
    c.comprador_nombre ?? (c as any).comprador ?? root.comprador_nombre ?? root.comprador ?? null

  return {
    pedido_id: c.pedido_id,
    numero_pedido: c.numero_pedido ?? '',
    fecha_pedido: c.fecha_pedido,
    fecha_entrega: c.fecha_entrega,
    forma_pago: c.forma_pago,
    mensaje: c.mensaje,
    proveedor_nombre: c.proveedor_nombre,
    comprador_nombre: compradorNombre,
    comprador_codigo: c.comprador_codigo,
    origen_traslado: c.origen_traslado,
    serie: c.serie,
    archivo_nombre: c.archivo_nombre,
    creado_por: c.creado_por,
    estado: c.estado ?? root.estado ?? '',
    creado_en: c.creado_en ?? '',
    modificado_fecha: modificadoFecha,
    modificado_por: modificadoPor,
  }
}

async function obtenerPedidos() {
  error.value = null
  try {
    // Usar listado de pedidos confirmados (>= 10 y no cancelados) del backend
    const page = Math.floor(metadata.value.offset / metadata.value.limit) + 1
    const response = await mba3ConsultasService.getPedidosConfirmados({
      page,
      pageSize: metadata.value.limit,
      fecha_desde: filtros.value.fecha_desde || undefined,
      fecha_hasta: filtros.value.fecha_hasta || undefined,
      tipo_fecha: filtros.value.tipo_fecha,
      proveedor_nombre: filtros.value.proveedor_nombre || undefined,
      numero_pedido: filtros.value.numero_pedido || undefined,
      creado_por: filtros.value.creado_por || undefined,
      modificado_por: filtros.value.modificado_por || undefined,
    })

    // Mapear PedidoCompleto → PedidoResumido para reutilizar la tabla actual
    pedidos.value = (response.data || []).map(mapPedidoCompletoToPedidoResumido)

    metadata.value = {
      total: response.total || pedidos.value.length,
      limit: response.pageSize || metadata.value.limit,
      offset: ((response.page || 1) - 1) * (response.pageSize || metadata.value.limit),
      has_more: (response.page || 1) < (response.totalPages || 1),
    }
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
    solo_redistribucion: true,
    limit: PAGE_SIZE,
    offset: 0
  }
  busquedaNumeroPedido.value = ''
  resetToFirstPage()
}

/** Navega a la vista de Redistribución del pedido en modo solo lectura */
const filaCargandoId = ref<string | null>(null)
function abrirRevisar(pedido: PedidoResumido) {
  if (filaCargandoId.value) return
  filaCargandoId.value = pedido.pedido_id
  router.push({
    name: 'mba3-consultas-pedido-redistribucion',
    params: { id: encodeURIComponent(pedido.numero_pedido) },
    query: { soloLectura: '1' }
  })
    .catch(() => {})
    .finally(() => { filaCargandoId.value = null })
}

onMounted(() => {
  cargarCreadoresYModificadores()
  cargarPedidos()
})

onUnmounted(() => {
  disposeBusquedaNumeroPedido()
})

// ⭐ Recarga la lista ante notificación SSE relevante (ej: ODC enviada a SAP, pedido
// confirmado, cancelado, etc.), reconexión SSE tras una desconexión, o recuperar foco/
// visibilidad de la pestaña. requireAccion: false -- esta vista recarga ante CUALQUIER
// notificación no nula, sin exigir metadata.accion (a diferencia de los otros 3 listados).
useListadoAutoRefresh(refrescarPedidosSilenciosamente, { requireAccion: false, debugLabel: 'RevisarRedistribucionListadoView' })
</script>
