<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header: fila título + fila de acciones (mismo orden que Cargar plantilla listado) -->
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
                {{ esProduccionElRayo ? 'Listado de Pedidos - Producción EL RAYO' : 'Listado de Pedidos - EL RAYO' }}
              </h1>
              <span v-if="esModoElRayo" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                EL RAYO
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ esModoElRayo
                ? 'Seguimiento de pedidos pendientes que requieren tu acción'
                : 'Visualiza y filtra pedidos según estado, fechas, proveedor y más'
              }}
            </p>
            <RequiereAccionToggleButton
              :contador="contadorPedidosPendientes"
              :activo="filtroSoloPendientes"
              :sufijo="esModoElRayo ? 'requieren tu acción' : 'requieren acción'"
              titulo-inactivo="Filtrar para ver solo pedidos en estados: Confirmado por Producción, Confirmado y Enviado"
              @toggle="filtroSoloPendientes = !filtroSoloPendientes; aplicarFiltroPendientes()"
            />
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <ActualizarButton :loading="loading" @click="cargarPedidos" />
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <PedidosListFiltrosBar
        :collapsed="filtrosColapsados"
        @update:collapsed="guardarFiltrosColapsados"
        v-model:estado="filtros.estado"
        v-model:tipo-fecha="filtros.tipo_fecha"
        v-model:fecha-desde="filtros.fecha_desde"
        v-model:fecha-hasta="filtros.fecha_hasta"
        v-model:proveedor-nombre="filtros.proveedor_nombre"
        v-model:numero-pedido-texto="busquedaNumeroPedido"
        v-model:creado-por="filtros.creado_por"
        v-model:modificado-por="filtros.modificado_por"
        :estados-disponibles="estadosDisponibles"
        :creadores-disponibles="creadoresDisponibles"
        :modificadores-disponibles="modificadoresDisponibles"
        @aplicar="aplicarFiltros"
        @limpiar="limpiarFiltros"
        @estado-change="actualizarFiltroPendientes"
        @numero-pedido-input="handleBusquedaNumeroPedido"
        @numero-pedido-commit="buscarNumeroPedidoInmediato"
        @numero-pedido-clear="limpiarBusquedaNumeroPedidoTexto"
      />

      <!-- Tabla de Pedidos -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <!-- Header de la tabla -->
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

        <!-- Loading state -->
        <LoadingSpinner v-if="loading" message="Cargando pedidos..." />

        <!-- Error state -->
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

        <!-- Empty state -->
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

        <!-- Tabla -->
        <div v-else class="overflow-x-auto">
          <!-- Filtro adicional en frontend si está activo el filtro rápido -->
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
              :columns="columnasPedidos"
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
                  verDetalleCargandoId === pedido.pedido_id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-inset ring-indigo-400 dark:ring-indigo-500'
                    : verDetalleCargandoId
                      ? 'opacity-50 pointer-events-none'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                  requiereAccionPedidoListado(pedido.estado) && esModoElRayo ? 'bg-orange-50/30 dark:bg-orange-900/10 border-l-4 border-orange-500 dark:border-orange-400' : ''
                ]"
                @click="verDetalle(pedido.pedido_id)"
              >
                <td class="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-500 dark:text-gray-400 font-medium">
                  <LoadingSpinner v-if="verDetalleCargandoId === pedido.pedido_id" size="xs" color="indigo" layout="inline" aria-label="Abriendo pedido" />
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
                    <span :class="getEstadoPedidoBadgeClassFull(pedido.estado)">
                      {{ getEstadoPedidoLabel(pedido.estado) }}
                    </span>
                    <span v-if="requiereAccionPedidoListado(pedido.estado)" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" title="Requiere acción">
                      !
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {{ pedido.comprador_nombre || '-' }}
                </td>
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

        <!-- Paginación -->
        <div v-if="pedidos.length > 0 && !loading" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="text-sm text-gray-700 dark:text-gray-300">
              Mostrando {{ metadata.offset + 1 }} - {{ Math.min(metadata.offset + metadata.limit, metadata.total) }} de {{ metadata.total }} resultados
            </div>
            <QuickTablePagination
              v-model="pedidosListCurrentPage"
              :total-pages="pedidosListTotalPages"
              :page-size="metadata.limit"
              :page-size-options="PAGE_SIZE_OPTIONS"
              :disabled="loading"
              aria-label="Paginación de pedidos"
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
import { ref, computed, watch } from '@vue/reactivity'
import { onMounted, onUnmounted } from '@vue/runtime-core'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService, extractErrorMessage } from '../services/mba3ConsultasApi'
import type { PedidosListadoResponse, PedidoResumido, PedidosListadoFiltros, PedidosListadoMetadata, EstadoPedidoOption } from '../types'
import { formatDate, formatDateTime } from '../utils/formatters'
import { esProveedorElRayo } from '../utils/styleHelpers'
import { getEstadoPedidoLabel, getEstadoPedidoBadgeClassFull, requiereAccionPedidoListado, ESTADOS_QUE_REQUIEREN_ACCION_PEDIDOS } from '../utils/estadoPedido'
import { PAGE_SIZE_OPTIONS } from '../config/pagination'
import { useFiltroTextoConDebounce } from '../composables/useFiltroTextoConDebounce'
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
import VolverButton from '@/components/VolverButton.vue'
import QuickTablePagination from '@/components/QuickTablePagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import ActualizarButton from '../components/ActualizarButton.vue'
import SortableTableHead from '../components/SortableTableHead.vue'
import PedidosListFiltrosBar from '../components/PedidosListFiltrosBar.vue'
import RequiereAccionToggleButton from '../components/RequiereAccionToggleButton.vue'
import { useOdcSapVolver } from '../../../composables/useOdcSapVolver'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const { target: odcSapVolverTarget, title: odcSapVolverTitle } = useOdcSapVolver()

const pedidos = ref<PedidoResumido[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const estadosDisponibles = ref<EstadoPedidoOption[]>([])
const creadoresDisponibles = ref<string[]>([])
const modificadoresDisponibles = ref<string[]>([])
const PAGE_SIZE = 10
const { pageSize: pageSizeGuardado, guardar: guardarPageSize } = usePageSizePreference('pedidos-listado', PAGE_SIZE)
const { colapsado: filtrosColapsados, guardar: guardarFiltrosColapsados } = useFiltrosColapsadosPreference('pedidos-listado')
const { offset: offsetGuardado, guardar: guardarOffset } = usePaginaPreference('pedidos-listado')
const metadata = ref<PedidosListadoMetadata>({
  total: 0,
  limit: pageSizeGuardado.value,
  offset: offsetGuardado.value,
  has_more: false
})

// Estado de colapso de la sección "Pedidos" (por defecto abierto)
const pedidosColapsados = ref(false)

// Detectar si es modo El Rayo desde query params
const esModoElRayo = computed(() => {
  return route.query.usuario === 'el-rayo' || route.query.modo === 'el-rayo'
})

// Pantalla exclusiva de Producción El Rayo (req. 1.8): mismo componente que
// /mba3-consultas/pedidos, pero restringido a NUEVO_PEDIDO/GESTIONAR_PEDIDO.
// Se detecta por ruta (no por permiso) para no afectar /mba3-consultas/pedidos.
const esProduccionElRayo = computed(() => {
  return route.name === 'mba3-consultas-produccion-pedidos-listado'
})

// Filtro rápido para pedidos pendientes
const filtroSoloPendientes = ref(false)
// Oculto en Producción El Rayo (req. 1.8): esa pantalla solo gestiona pedidos en NUEVO_PEDIDO/
// GESTIONAR_PEDIDO, ninguno de los estados "requiere acción" (proveedor) aplica ahí. Detectado por
// ruta (esProduccionElRayo), no por permiso -- mismo criterio ya usado en este archivo para no
// afectar /mba3-consultas/pedidos si un rol llegara a tener ambos permisos.
const mostrarFiltroRapido = computed(() => !esProduccionElRayo.value)

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

async function obtenerPedidos() {
  error.value = null

  try {
    const response: PedidosListadoResponse = await mba3ConsultasService.getPedidosListado({
      ...filtros.value,
      limit: metadata.value.limit,
      offset: metadata.value.offset,
      solo_pendientes_accion: filtroSoloPendientes.value || undefined,
      solo_produccion_elrayo: esProduccionElRayo.value || undefined,
    })

    pedidos.value = response.data
    metadata.value = response.metadata
    guardarOffset(metadata.value.offset)
  } catch (e: any) {
    console.error('Error al cargar pedidos:', e)
    error.value = e.message || 'No se pudieron cargar los pedidos'
    toast.error('Error', error.value ?? undefined)
  }
}

// Cargar pedidos (carga inicial / filtros / paginación): activa el spinner de pantalla completa
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

// Paginación offset/limit (piezas compartidas)
const {
  totalPages: pedidosListTotalPages,
  currentPage: pedidosListCurrentPage,
  setPageSize,
  resetToFirstPage
} = useOffsetPagination(metadata, cargarPedidos, {
  onOffsetChange: (offset) => { filtros.value.offset = offset },
  onPageSizeChange: guardarPageSize
})

// Aplicar filtros: siempre vuelve a la página 1 y recarga
const aplicarFiltros = resetToFirstPage

// Ordenamiento de columnas (pieza compartida)
const { sortColumn, sortDirection, toggleSort, resetSort, sortedItems: sortedPedidos } = useSortableList<PedidoResumido>({
  items: pedidos,
  dateColumns: ['fecha_pedido', 'creado_en', 'modificado_fecha'],
  storageKey: 'pedidos-listado'
})

// Columnas ordenables del thead (para SortableTableHead)
const columnasPedidos: SortableColumnDef[] = [
  { key: 'numero_pedido', label: 'Número de Pedido' },
  { key: 'fecha_pedido', label: 'Fecha Pedido', description: DESCRIPCION_COLUMNA_FECHA_PEDIDO },
  { key: 'proveedor_nombre', label: 'Proveedor' },
  { key: 'estado', label: 'Estado', align: 'center' },
  { key: 'comprador_nombre', label: 'Comprador' },
  { key: 'creado_en', label: 'Fecha Creación', description: DESCRIPCION_COLUMNA_FECHA_CREACION },
  { key: 'modificado_fecha', label: 'Fecha Modificación', description: DESCRIPCION_COLUMNA_FECHA_MODIFICACION },
  { key: 'modificado_por', label: 'Modificado Por' }
]

// ========== Búsqueda por Número de Pedido (con debounce, filtra en vivo) ==========
const {
  texto: busquedaNumeroPedido,
  handleInput: handleBusquedaNumeroPedido,
  commit: buscarNumeroPedidoInmediato,
  clear: limpiarBusquedaNumeroPedidoTexto,
  dispose: disposeBusquedaNumeroPedido
} = useFiltroTextoConDebounce(filtros, 'numero_pedido', aplicarFiltros)

// Contador de pedidos pendientes (computado desde los pedidos cargados)
const contadorPedidosPendientes = computed(() => pedidos.value.filter(p => requiereAccionPedidoListado(p.estado)).length)

// Cargar estados disponibles para el dropdown de filtros
async function cargarEstados() {
  try {
    const response = await mba3ConsultasService.getEstadosPedido(esProduccionElRayo.value ? 'produccion' : 'pedidos')
    estadosDisponibles.value = response.data
  } catch (e: any) {
    console.error('Error al cargar estados:', e)
    // Si falla, el dropdown quedará vacío pero no bloquea la UI
  }
}

// Cargar creadores/modificadores disponibles para los <select> "Creado Por"/"Modificado Por"
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
    // Si falla, los dropdowns quedarán vacíos pero no bloquea la UI
  }
}

// Aplicar filtro de pedidos pendientes
function aplicarFiltroPendientes() {
  if (filtroSoloPendientes.value) {
    // Cuando el filtro rápido está activo, no aplicamos filtro de estado en el backend
    // para obtener todos los pedidos y luego filtrar en el frontend por los estados que requieren acción
    // Esto permite mostrar todos los pedidos pendientes independientemente de su estado específico
    const estadoAnterior = filtros.value.estado
    const estadosPendientes = ESTADOS_QUE_REQUIEREN_ACCION_PEDIDOS as readonly string[]

    // Solo limpiar el estado si estaba filtrando por uno de los estados pendientes
    if (estadoAnterior && estadosPendientes.includes(estadoAnterior)) {
      filtros.value.estado = ''
    }
  } else {
    // Si se desactiva, limpiar el filtro de estado solo si estaba activo por el filtro rápido
    const estadoActual = filtros.value.estado
    const estadosPendientes = ESTADOS_QUE_REQUIEREN_ACCION_PEDIDOS as readonly string[]

    // No limpiar si el usuario había seleccionado manualmente un estado
    // Solo limpiar si el estado actual es uno de los pendientes (probablemente activado por el filtro rápido)
    if (estadoActual && estadosPendientes.includes(estadoActual)) {
      // Verificar si fue el filtro rápido quien lo activó (no limpiar si el usuario lo seleccionó manualmente)
      // Por ahora, no limpiamos automáticamente para no perder la selección del usuario
    }
  }
  aplicarFiltros()
}

// Actualizar filtro pendientes cuando cambia el estado manualmente
function actualizarFiltroPendientes() {
  const estadoActual = filtros.value.estado
  const estadosPendientes = ESTADOS_QUE_REQUIEREN_ACCION_PEDIDOS as readonly string[]

  // Si el estado seleccionado no es uno de los pendientes, desactivar el filtro rápido
  if (estadoActual && !estadosPendientes.includes(estadoActual)) {
    filtroSoloPendientes.value = false
  }
}

// Limpiar filtros
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
  busquedaNumeroPedido.value = ''
  filtroSoloPendientes.value = false
  resetToFirstPage()
}

// Ver detalle del pedido: llama POST .../gestionar (estado GESTIONAR_PEDIDO) y navega
const verDetalleCargandoId = ref<string | null>(null)
async function verDetalle(pedidoId: string) {
  if (verDetalleCargandoId.value) return
  verDetalleCargandoId.value = pedidoId
  try {
    await mba3ConsultasService.gestionarPedido(pedidoId)
    router.push(`/mba3-consultas/pedidos/${pedidoId}`)
  } catch (e: any) {
    toast.error('Error al abrir detalle', extractErrorMessage(e))
  } finally {
    verDetalleCargandoId.value = null
  }
}

// Cargar datos al montar
onMounted(() => {
  cargarEstados()
  cargarCreadoresYModificadores()
  // Si es modo El Rayo, activar filtro de pendientes por defecto -- salvo en Producción El Rayo,
  // donde el filtro rápido está oculto (ver mostrarFiltroRapido arriba): activarlo ahí dejaría un
  // filtro aplicado sin ningún control visible para quitarlo.
  if (esModoElRayo.value && mostrarFiltroRapido.value) {
    filtroSoloPendientes.value = true
    aplicarFiltroPendientes()
  } else {
    cargarPedidos()
  }
})

onUnmounted(() => {
  disposeBusquedaNumeroPedido()
})

// Watch para detectar cambios en query params
watch(
  () => route.query.usuario,
  (newUsuario) => {
    if (newUsuario === 'el-rayo' && !filtroSoloPendientes.value) {
      filtroSoloPendientes.value = true
      aplicarFiltroPendientes()
    }
  }
)

// Auto-refresh del listado (SSE relevante, reconexión SSE, foco/visibilidad) -- pieza compartida
useListadoAutoRefresh(refrescarPedidosSilenciosamente, { debugLabel: 'PedidosListView' })
</script>
