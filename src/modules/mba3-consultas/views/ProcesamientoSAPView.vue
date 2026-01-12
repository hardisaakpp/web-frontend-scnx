<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header con título y botón de regreso -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Procesamiento SAP del Pedido</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Información procesada después de confirmar la redistribución
          </p>
        </div>
        <button
          @click="goBack"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Volver
        </button>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">Cargando procesamiento SAP...</p>
      </div>

      <!-- Error state -->
      <div v-if="error" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6 transition-colors duration-300">
        <div class="flex items-start gap-3">
          <svg class="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-red-900 dark:text-red-200">Error al cargar el procesamiento SAP</p>
            <p class="text-sm text-red-800 dark:text-red-300 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Contenido del procesamiento -->
      <div v-if="procesamiento && !loading">
        <!-- Información de la cabecera del pedido -->
        <PedidoCabecera
          :pedido="pedidoCompleto"
          :copy-feedback="copyFeedback"
          @copy-to-clipboard="copyToClipboard"
        />

        <!-- Estadísticas del procesamiento -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estadísticas del Procesamiento</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div class="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase">Total Productos</div>
              <div class="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                {{ formatNumber(procesamiento.estadisticas.total_productos) }}
              </div>
            </div>
            <div class="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <div class="text-sm font-medium text-green-600 dark:text-green-400 uppercase">Homologados</div>
              <div class="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                {{ formatNumber(procesamiento.estadisticas.productos_homologados) }}
              </div>
            </div>
            <div class="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div class="text-sm font-medium text-yellow-600 dark:text-yellow-400 uppercase">No Homologados</div>
              <div class="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                {{ formatNumber(procesamiento.estadisticas.productos_no_homologados) }}
              </div>
            </div>
            <div class="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 border border-red-200 dark:border-red-800">
              <div class="text-sm font-medium text-red-600 dark:text-red-400 uppercase">Con Errores</div>
              <div class="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                {{ formatNumber(procesamiento.estadisticas.productos_con_error) }}
              </div>
            </div>
          </div>

          <!-- Totales de cantidades -->
          <div class="mt-4">
            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div class="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase mb-2">Cantidades</div>
              <div class="space-y-1">
                <div class="flex justify-between">
                  <span class="text-sm text-gray-700 dark:text-gray-300">Original:</span>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ formatNumber(procesamiento.estadisticas.total_cantidad_original) }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-gray-700 dark:text-gray-300">SAP:</span>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ formatNumber(procesamiento.estadisticas.total_cantidad_sap) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Fecha de procesamiento -->
          <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-medium">Fecha de procesamiento:</span>
              <span class="ml-2">{{ formatDate(procesamiento.fecha_procesamiento) }}</span>
            </div>
          </div>
        </div>

        <!-- Tabla de productos procesados -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Productos Procesados</h2>
            <div class="flex items-center gap-2">
              <label class="text-sm text-gray-600 dark:text-gray-400">Filtrar:</label>
              <select
                v-model="filtroEstado"
                class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              >
                <option value="todos">Todos</option>
                <option value="homologados">Homologados</option>
                <option value="no-homologados">No Homologados</option>
                <option value="con-error">Con Errores</option>
              </select>
              
              <!-- Selector de columnas -->
              <div class="relative">
                <button
                  @click="showColumnSelector = !showColumnSelector"
                  class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Columnas
                </button>
                
                <!-- Dropdown de selección de columnas -->
                <div
                  v-if="showColumnSelector"
                  @click.stop
                  class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3"
                >
                  <div class="flex items-center justify-between mb-2 px-2">
                    <div class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Seleccionar columnas</div>
                    <div v-if="isSyncing" class="flex items-center gap-1">
                      <svg class="animate-spin w-3 h-3 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span class="text-xs text-indigo-600 dark:text-indigo-400">Guardando...</span>
                    </div>
                  </div>
                  <div class="space-y-1 max-h-80 overflow-y-auto">
                    <label
                      v-for="column in availableColumnsWithVisibility"
                      :key="column.key"
                      :class="[
                        'flex items-center gap-2 px-2 py-2 rounded transition-colors',
                        column.fixed 
                          ? 'cursor-not-allowed opacity-60 bg-gray-50 dark:bg-gray-900' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                      ]"
                    >
                      <input
                        type="checkbox"
                        :checked="column.visible"
                        :disabled="column.fixed"
                        @change="!column.fixed && toggleColumnVisibility(column.key)"
                        class="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <span class="text-sm text-gray-700 dark:text-gray-300">
                        {{ column.label }}
                        <span v-if="column.fixed" class="text-xs text-gray-500 dark:text-gray-500 ml-1">(fija)</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th
                    v-for="column in orderedVisibleColumns"
                    :key="column.key"
                    :class="[
                      'px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                    ]"
                  >
                    {{ column.label }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="(producto, index) in productosFiltrados"
                  :key="producto.pedido_detalle_id"
                  :class="[
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                    !producto.esta_homologado ? 'bg-yellow-50 dark:bg-yellow-900/20' : '',
                    producto.tiene_error ? 'bg-red-50 dark:bg-red-900/20' : ''
                  ]"
                >
                  <td
                    v-for="column in orderedVisibleColumns"
                    :key="column.key"
                    :class="[
                      'px-4 py-4 text-sm',
                      column.align === 'right' ? 'text-right whitespace-nowrap' : column.align === 'center' ? 'text-center' : '',
                      column.key === 'numero' ? 'text-gray-900 dark:text-white' :
                      column.key === 'codigo' ? 'font-medium text-gray-900 dark:text-white' :
                      column.key === 'producto' ? 'text-gray-700 dark:text-gray-300' :
                      'text-gray-900 dark:text-white'
                    ]"
                  >
                    <!-- Columna Número -->
                    <template v-if="column.key === 'numero'">
                      {{ index + 1 }}
                    </template>
                    
                    <!-- Columna Código -->
                    <template v-else-if="column.key === 'codigo'">
                      {{ producto.codigo_interno || 'N/A' }}
                    </template>
                    
                    <!-- Columna Producto -->
                    <template v-else-if="column.key === 'producto'">
                      {{ producto.descripcion_producto || producto.descripcion_sap || producto.descripcion_original || 'N/A' }}
                    </template>
                    
                    <!-- Columna Cantidad Original -->
                    <template v-else-if="column.key === 'cantidad_original'">
                      {{ formatNumber(producto.cantidad_original) }}
                    </template>
                    
                    <!-- Columna Precio Unitario Original -->
                    <template v-else-if="column.key === 'precio_unitario_original'">
                      {{ producto.precio_unitario_original ? formatCurrency(producto.precio_unitario_original) : 'N/A' }}
                    </template>
                    
                    <!-- Columna Subtotal Pedido -->
                    <template v-else-if="column.key === 'subtotal_pedido'">
                      {{ (producto.total_linea_original ?? producto.subtotal_original) !== null ? formatCurrency(producto.total_linea_original ?? producto.subtotal_original ?? 0) : 'N/A' }}
                    </template>
                    
                    <!-- Columna Unidad -->
                    <template v-else-if="column.key === 'unidad'">
                      <div class="flex flex-col items-center gap-1">
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ producto.unidad_original || 'N/A' }}</span>
                        <span class="text-xs">→</span>
                        <span class="text-xs font-medium">{{ producto.unidad_sap || 'N/A' }}</span>
                      </div>
                    </template>
                    
                    <!-- Columna Cantidad Pack SAP -->
                    <template v-else-if="column.key === 'cantidad_pack_sap'">
                      {{ (producto.cantidad_sap ?? producto.cantidad_pack_sap) !== null ? formatNumber(producto.cantidad_sap ?? producto.cantidad_pack_sap ?? 0) : 'N/A' }}
                    </template>
                    
                    <!-- Columna Precio Unitario SAP -->
                    <template v-else-if="column.key === 'precio_unitario_sap'">
                      {{ producto.precio_unitario_sap ? formatCurrency(producto.precio_unitario_sap) : 'N/A' }}
                    </template>
                    
                    <!-- Columna Subtotal SAP -->
                    <template v-else-if="column.key === 'subtotal_sap'">
                      {{ (producto.total_linea_sap ?? producto.subtotal_sap) !== null ? formatCurrency(producto.total_linea_sap ?? producto.subtotal_sap ?? 0) : 'N/A' }}
                    </template>
                  </td>
                </tr>
              </tbody>
              
              <!-- Fila de totales -->
              <tfoot v-if="productosFiltrados.length > 0" class="bg-gray-100 dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-600">
                <tr>
                  <td
                    v-for="column in orderedVisibleColumns"
                    :key="column.key"
                    :class="[
                      'px-4 py-3 text-sm font-semibold',
                      column.align === 'right' ? 'text-right whitespace-nowrap' : column.align === 'center' ? 'text-center' : 'text-left',
                      'text-gray-900 dark:text-white'
                    ]"
                  >
                    <!-- Columna Número -->
                    <template v-if="column.key === 'numero'">
                      TOTALES
                    </template>
                    
                    <!-- Columna Subtotal Pedido -->
                    <template v-else-if="column.key === 'subtotal_pedido'">
                      {{ formatCurrency(totalesSubtotalPedido) }}
                    </template>
                    
                    <!-- Columna Subtotal SAP -->
                    <template v-else-if="column.key === 'subtotal_sap'">
                      {{ formatCurrency(totalesSubtotalSAP) }}
                    </template>
                    
                    <!-- Todas las demás columnas vacías -->
                    <template v-else>
                      <!-- Dejar vacío -->
                    </template>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Mensaje si no hay productos filtrados -->
          <div v-if="productosFiltrados.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay productos que coincidan con el filtro seleccionado.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { ProcesamientoSAPResponse, PedidoCompleto } from '../types'
import { formatDate, formatNumber, formatCurrency, type ColumnConfig } from '../utils/formatters'
import PedidoCabecera from '../components/PedidoCabecera.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const procesamiento = ref<ProcesamientoSAPResponse | null>(null)
const pedidoCompleto = ref<PedidoCompleto | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const copyFeedback = ref(false)
const filtroEstado = ref<'todos' | 'homologados' | 'no-homologados' | 'con-error'>('todos')

// ⭐ Gestión de columnas visibles en la tabla
const showColumnSelector = ref(false)

// Definir columnas disponibles para la tabla de productos procesados
const availableColumns: ColumnConfig[] = [
  { key: 'numero', label: '#', visible: true, align: 'left', format: 'number', fixed: true },
  { key: 'codigo', label: 'Código', visible: true, align: 'left', format: 'text', fixed: true },
  { key: 'producto', label: 'Producto', visible: true, align: 'left', format: 'text', fixed: true },
  { key: 'cantidad_original', label: 'Cant. Original', visible: true, align: 'right', format: 'number' },
  { key: 'precio_unitario_original', label: 'Precio Unit.', visible: true, align: 'right', format: 'currency' },
  { key: 'subtotal_pedido', label: 'Subtotal Pedido', visible: true, align: 'right', format: 'currency' },
  { key: 'unidad', label: 'Unidad', visible: true, align: 'center', format: 'text' },
  { key: 'cantidad_pack_sap', label: 'Cant. Pack', visible: true, align: 'right', format: 'number' },
  { key: 'precio_unitario_sap', label: 'Precio Unit.', visible: true, align: 'right', format: 'currency' },
  { key: 'subtotal_sap', label: 'Subtotal', visible: true, align: 'right', format: 'currency' }
]

// Configuración de columnas usando composable
const defaultVisibleColumns = availableColumns.filter(col => col.visible || col.fixed).map(col => col.key)
const defaultColumnOrder = availableColumns.map(col => col.key)

const {
  visibleColumns,
  columnOrder,
  orderedVisibleColumns: orderedVisibleColumnKeys,
  savePreferences,
  isSyncing
} = useTablePreferences({
  tableId: 'productos-procesados',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

// Computed para obtener objetos ColumnConfig ordenados
const orderedVisibleColumns = computed(() => {
  const ordered = orderedVisibleColumnKeys.value
    .map(key => availableColumns.find(col => col.key === key))
    .filter((col): col is ColumnConfig => col !== undefined)
  
  // Separar columnas fijas y no fijas
  const fixedColumns = ordered.filter(col => col.fixed)
  const nonFixedColumns = ordered.filter(col => !col.fixed)
  
  // Asegurar que las columnas fijas estén al inicio
  return [...fixedColumns, ...nonFixedColumns]
})

// Computed para obtener todas las columnas con su estado de visibilidad
const availableColumnsWithVisibility = computed(() => {
  return availableColumns.map(col => ({
    ...col,
    visible: col.fixed ? true : visibleColumns.value.includes(col.key)
  }))
})

// Función para toggle de visibilidad de columnas
function toggleColumnVisibility(columnKey: string) {
  const column = availableColumns.find(col => col.key === columnKey)
  if (column?.fixed) {
    return
  }
  
  const currentVisible = [...visibleColumns.value]
  const index = currentVisible.indexOf(columnKey)
  
  // Validación: Asegurar que hay al menos una columna visible (excluyendo fijas)
  const visibleNonFixed = currentVisible.filter(key => {
    const col = availableColumns.find(c => c.key === key)
    return !col?.fixed
  })
  
  if (index > -1 && visibleNonFixed.length === 1) {
    console.warn('⚠️ Debe haber al menos una columna visible. Operación cancelada.')
    return
  }
  
  if (index > -1) {
    currentVisible.splice(index, 1)
  } else {
    currentVisible.push(columnKey)
  }
  
  visibleColumns.value = currentVisible
  savePreferences()
}

// Cerrar dropdown al hacer click fuera
function handleClickOutsideColumnSelector(event: MouseEvent) {
  if (!showColumnSelector.value) return
  
  const target = event.target as HTMLElement
  if (target.closest('.relative')) {
    return
  }
  
  showColumnSelector.value = false
}

// Obtener ID del pedido desde la ruta
const pedidoId = computed(() => {
  const id = route.params.id as string
  return id ? decodeURIComponent(id) : ''
})

// Filtrar productos según el estado seleccionado
const productosFiltrados = computed(() => {
  if (!procesamiento.value) return []
  
  const productos = procesamiento.value.productos
  
  switch (filtroEstado.value) {
    case 'homologados':
      return productos.filter(p => p.esta_homologado && !p.tiene_error)
    case 'no-homologados':
      return productos.filter(p => !p.esta_homologado)
    case 'con-error':
      return productos.filter(p => p.tiene_error)
    default:
      return productos
  }
})

// ⭐ Computed para calcular totales de la tabla (solo subtotales)
const totalesSubtotalPedido = computed(() => {
  return productosFiltrados.value.reduce((sum, producto) => {
    const subtotal = producto.total_linea_original ?? producto.subtotal_original ?? 0
    return sum + (subtotal || 0)
  }, 0)
})

const totalesSubtotalSAP = computed(() => {
  return productosFiltrados.value.reduce((sum, producto) => {
    const subtotal = producto.total_linea_sap ?? producto.subtotal_sap ?? 0
    return sum + (subtotal || 0)
  }, 0)
})

// Cargar procesamiento SAP
async function loadProcesamientoSAP() {
  if (!pedidoId.value) {
    error.value = 'No se proporcionó un ID de pedido válido'
    return
  }

  loading.value = true
  error.value = null

  try {
    // Cargar procesamiento SAP
    const procesamientoData = await mba3ConsultasService.getProcesamientoSAP(pedidoId.value)
    procesamiento.value = procesamientoData

    // Cargar también el pedido completo para mostrar la cabecera
    try {
      const pedido = await mba3ConsultasService.getPedido(procesamientoData.numero_pedido)
      pedidoCompleto.value = pedido
    } catch (e: any) {
      console.warn('No se pudo cargar el pedido completo:', e)
      // Si no se puede cargar el pedido, crear un objeto mínimo para la cabecera
      pedidoCompleto.value = {
        cabecera: {
          pedido_id: procesamientoData.pedido_id,
          numero_pedido: procesamientoData.numero_pedido,
          fecha_pedido: null,
          fecha_entrega: null,
          forma_pago: null,
          odc: null,
          proveedor_nombre: null,
          comprador_nombre: null,
          comprador_codigo: null,
          origen_traslado: null,
          serie: null,
          archivo_nombre: '',
          creado_por: null,
          creado_en: null,
          estado: undefined
        },
        detalles: []
      }
    }
  } catch (e: any) {
    console.error('Error al cargar procesamiento SAP:', e)
    error.value = e.message || 'No se pudo cargar el procesamiento SAP'
    toast.error('Error', error.value)
  } finally {
    loading.value = false
  }
}

// Copiar al portapapeles
function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    copyFeedback.value = true
    setTimeout(() => {
      copyFeedback.value = false
    }, 2000)
  }).catch(err => {
    console.error('Error al copiar:', err)
  })
}

// Navegación
function goBack() {
  router.back()
}

// Cargar datos al montar el componente
onMounted(() => {
  loadProcesamientoSAP()
  // Agregar listener para cerrar dropdown al hacer click fuera
  document.addEventListener('click', handleClickOutsideColumnSelector)
})

onUnmounted(() => {
  // Remover listener del dropdown
  document.removeEventListener('click', handleClickOutsideColumnSelector)
})

// Watch para recargar si cambia el parámetro de ruta
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      await loadProcesamientoSAP()
    }
  }
)
</script>
