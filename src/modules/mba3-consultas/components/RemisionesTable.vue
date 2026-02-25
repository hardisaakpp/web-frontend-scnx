<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-none overflow-hidden border border-gray-200 dark:border-gray-700">
    <!-- Header con búsqueda y acciones -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Título y contador -->
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Documentos de Remisión</h2>
          <span class="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
            {{ (props.currentPage !== undefined && props.pageSize !== undefined && props.currentPage > 0 && props.pageSize > 0)
              ? `${sortedRemisiones.length} de ${filteredRemisiones.length} (${totalRemisiones || 0} total)` 
              : `${filteredRemisiones.length} de ${totalRemisiones || 0} remisiones` }}
          </span>
        </div>
      </div>
      
      <!-- Búsqueda y filtros -->
      <div class="mt-4 flex flex-col md:flex-row gap-3">
        <!-- Búsqueda -->
        <div class="flex-1">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar en todos los campos..."
              class="block w-full pl-10 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
              :class="searchQuery ? 'pr-10' : 'pr-3'"
            />
            <button
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Limpiar búsqueda"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Filtros rápidos -->
        <div class="flex items-center gap-2">
          <button
            @click="showAdvancedFilters = !showAdvancedFilters"
            class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium flex items-center gap-2 dark:text-gray-200"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </button>
          
          <button
            @click="showColumnSelector = !showColumnSelector"
            class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium flex items-center gap-2 relative dark:text-gray-200"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Columnas
            <span v-if="visibleColumnsCount < availableColumns.length" class="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
              {{ visibleColumnsCount }}
            </span>
          </button>
        </div>
      </div>
      
      <!-- Selector de Columnas -->
      <div v-if="showColumnSelector" class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">Seleccionar Columnas</h3>
          <div class="flex items-center gap-2">
            <button
              @click="selectAllColumns"
              class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Mostrar todas
            </button>
            <span class="text-gray-300 dark:text-gray-600">|</span>
            <button
              @click="resetColumns"
              class="text-xs text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200 font-medium"
            >
              Restaurar predeterminadas
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <label
            v-for="column in availableColumns"
            :key="column.key"
            class="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              v-model="visibleColumns"
              :value="column.key"
              class="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 dark:bg-gray-900"
            />
            <span class="text-sm text-gray-700 dark:text-gray-200">{{ column.label }}</span>
          </label>
        </div>
      </div>
      
      <!-- Filtros avanzados -->
      <div v-if="showAdvancedFilters" class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fecha desde</label>
            <input
              v-model="filtroFechaDesde"
              type="date"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fecha hasta</label>
            <input
              v-model="filtroFechaHasta"
              type="date"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Empresa</label>
            <input
              v-model="filtroEmpresa"
              type="text"
              placeholder="Buscar por empresa"
              class="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            @click="limpiarFiltros"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div v-if="filteredRemisiones.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
      <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="mt-2 text-sm">{{ searchQuery ? 'No se encontraron remisiones con los filtros aplicados' : 'No se encontraron documentos de remisión' }}</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              v-for="columnKey in orderedVisibleColumns"
              :key="columnKey"
              :draggable="true"
              @dragstart="handleDragStart($event, columnKey)"
              @dragover="handleDragOver($event, columnKey)"
              @dragleave="handleDragLeave"
              @drop="handleDrop($event, columnKey)"
              @dragend="handleDragEnd"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-grab',
                isColumnSortable(columnKey) ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800',
                draggedColumn === columnKey ? 'opacity-50 cursor-grabbing' : '',
                dragOverColumn === columnKey && draggedColumn !== columnKey ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500' : ''
              ]"
              @click="isColumnSortable(columnKey) && sortBy(columnKey)"
            >
              <div class="flex items-center gap-1">
                <span>{{ getColumnLabel(columnKey) }}</span>
                <svg v-if="isColumnSortable(columnKey) && sortField === columnKey" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
                <svg v-else class="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24" title="Arrastra para reordenar">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                </svg>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr 
            v-for="remision in sortedRemisiones" 
            :key="getFieldValue(remision, 'codigo_factura', 'CODIGO_FACTURA') || Math.random()" 
            class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <template v-for="columnKey in orderedVisibleColumns" :key="columnKey">
              <!-- Código Factura -->
              <td v-if="columnKey === 'codigo_factura'" class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-gray-100">
                <span class="font-semibold">{{ getFieldValue(remision, 'codigo_factura', 'CODIGO_FACTURA') }}</span>
              </td>
              <!-- Empresa -->
              <td v-else-if="columnKey === 'empresa'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ getFieldValue(remision, 'empresa', 'EMPRESA') }}
              </td>
              <!-- Código Cliente -->
              <td v-else-if="columnKey === 'codigo_cliente'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ getFieldValue(remision, 'codigo_cliente', 'CODIGO_CLIENTE') }}
              </td>
              <!-- Fecha Factura -->
              <td v-else-if="columnKey === 'fecha_factura'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <div>{{ formatDate(getFieldValue(remision, 'fecha_factura', 'FECHA_FACTURA')) }}</div>
              </td>
              <!-- Número Factura -->
              <td v-else-if="columnKey === 'numero_factura'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <span v-if="getFieldValue(remision, 'numero_factura', 'NUMERO_FACTURA')" class="font-mono">{{ getFieldValue(remision, 'numero_factura', 'NUMERO_FACTURA') }}</span>
                <span v-else class="text-gray-400 dark:text-gray-500 italic">-</span>
              </td>
              <!-- Número Pedido Sistema -->
              <td v-else-if="columnKey === 'numero_pedido_sistema'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <span v-if="getFieldValue(remision, 'numero_pedido_sistema', 'NUMERO_PEDIDO_SISTEMA')" class="font-mono">{{ getFieldValue(remision, 'numero_pedido_sistema', 'NUMERO_PEDIDO_SISTEMA') }}</span>
                <span v-else class="text-gray-400 dark:text-gray-500 italic">-</span>
              </td>
              <!-- Número Orden -->
              <td v-else-if="columnKey === 'numero_orden'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <span v-if="getFieldValue(remision, 'numero_orden', 'NUMERO_ORDEN')" class="font-mono">{{ getFieldValue(remision, 'numero_orden', 'NUMERO_ORDEN') }}</span>
                <span v-else class="text-gray-400 dark:text-gray-500 italic">-</span>
              </td>
              <!-- Orden Compra -->
              <td v-else-if="columnKey === 'orden_compra'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <span v-if="getFieldValue(remision, 'orden_compra', 'ORDEN_COMPRA')" class="font-mono">{{ getFieldValue(remision, 'orden_compra', 'ORDEN_COMPRA') }}</span>
                <span v-else class="text-gray-400 dark:text-gray-500 italic">-</span>
              </td>
              <!-- Orden Compra Cliente -->
              <td v-else-if="columnKey === 'orden_compra_cliente'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <span v-if="getFieldValue(remision, 'orden_compra_cliente', 'ORDEN_COMPRA_CLIENTE')" class="font-mono">{{ getFieldValue(remision, 'orden_compra_cliente', 'ORDEN_COMPRA_CLIENTE') }}</span>
                <span v-else class="text-gray-400 dark:text-gray-500 italic">-</span>
              </td>
              <!-- Tipo Documento -->
              <td v-else-if="columnKey === 'tipo_documento'" class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {{ getFieldValue(remision, 'tipo_documento', 'TIPO_DOCUMENTO') }}
                </span>
              </td>
              <!-- Anulada -->
              <td v-else-if="columnKey === 'anulada'" class="px-6 py-4 whitespace-nowrap">
                <span :class="getBooleanValue(remision, 'anulada', 'ANULADA') ? 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'">
                  {{ getBooleanValue(remision, 'anulada', 'ANULADA') ? 'Sí' : 'No' }}
                </span>
              </td>
              <!-- Factura Impresa -->
              <td v-else-if="columnKey === 'factura_impresa'" class="px-6 py-4 whitespace-nowrap">
                <span :class="getBooleanValue(remision, 'factura_impresa', 'FACTURA_IMPRESA') ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300'">
                  {{ getBooleanValue(remision, 'factura_impresa', 'FACTURA_IMPRESA') ? 'Sí' : 'No' }}
                </span>
              </td>
              <!-- Remisión Facturada -->
              <td v-else-if="columnKey === 'remision_facturada'" class="px-6 py-4 whitespace-nowrap">
                <span :class="getBooleanValue(remision, 'remision_facturada', 'Remision_Facturada') ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'">
                  {{ getBooleanValue(remision, 'remision_facturada', 'Remision_Facturada') ? 'Sí' : 'No' }}
                </span>
              </td>
              <!-- Confirmado -->
              <td v-else-if="columnKey === 'confirmado'" class="px-6 py-4 whitespace-nowrap">
                <span :class="getBooleanValue(remision, 'confirmado', 'CONFIRMADO') ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'">
                  {{ getBooleanValue(remision, 'confirmado', 'CONFIRMADO') ? 'Sí' : 'No' }}
                </span>
              </td>
              <!-- Obj Datos Factura -->
              <td v-else-if="columnKey === 'obj_datos_factura'" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <span v-if="getFieldValue(remision, 'obj_datos_factura', 'ObjDatosFactura')" class="text-gray-400 dark:text-gray-500 italic">Presente</span>
                <span v-else class="text-gray-400 dark:text-gray-500 italic">-</span>
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import type { Remision } from '../types'
import { useTablePreferences } from '@/composables/useTablePreferences'
import { formatDate } from '../utils/formatters'

const props = defineProps<{
  remisiones: Remision[]
  loading?: boolean
  totalRemisiones?: number
  currentPage?: number
  pageSize?: number
}>()

const emit = defineEmits<{
  'filtered-count-changed': [count: number]
}>()

// Búsqueda y filtros
const searchQuery = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')
const filtroEmpresa = ref('')
const showAdvancedFilters = ref(false)
const showColumnSelector = ref(false)

// Columnas disponibles
const availableColumns = [
  { key: 'codigo_factura', label: 'Código Factura', default: true },
  { key: 'empresa', label: 'Empresa', default: true },
  { key: 'codigo_cliente', label: 'Código Cliente', default: true },
  { key: 'fecha_factura', label: 'Fecha Factura', default: true },
  { key: 'numero_factura', label: 'Número Factura', default: true },
  { key: 'numero_pedido_sistema', label: 'Número Pedido Sistema', default: false },
  { key: 'numero_orden', label: 'Número Orden', default: false },
  { key: 'orden_compra', label: 'Orden Compra', default: false },
  { key: 'orden_compra_cliente', label: 'Orden Compra Cliente', default: false },
  { key: 'tipo_documento', label: 'Tipo Documento', default: true },
  { key: 'anulada', label: 'Anulada', default: true },
  { key: 'factura_impresa', label: 'Factura Impresa', default: false },
  { key: 'remision_facturada', label: 'Remisión Facturada', default: true },
  { key: 'confirmado', label: 'Confirmado', default: true },
  { key: 'obj_datos_factura', label: 'Obj Datos Factura', default: false },
]

// Configuración de columnas usando composable híbrido
const defaultVisibleColumns = availableColumns.filter(col => col.default).map(col => col.key)
const defaultColumnOrder = availableColumns.map(col => col.key)

const {
  visibleColumns,
  columnOrder,
  orderedVisibleColumns,
  resetPreferences: resetTablePreferences,
  selectAllColumns: selectAllTableColumns
} = useTablePreferences({
  tableId: 'remisiones',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

// Watch para actualizar el orden cuando se agregan nuevas columnas visibles
watch(visibleColumns, () => {
  const availableKeys = availableColumns.map(col => col.key)
  const currentOrder = columnOrder.value.filter(key => availableKeys.includes(key))
  const missingInOrder = visibleColumns.value.filter(key => 
    availableKeys.includes(key) && !currentOrder.includes(key)
  )
  if (missingInOrder.length > 0) {
    columnOrder.value = [...currentOrder, ...missingInOrder]
  }
}, { deep: true })

// Computed para contar columnas visibles
const visibleColumnsCount = computed(() => visibleColumns.value.length)

// Funciones de utilidad
function getColumnLabel(key: string): string {
  const column = availableColumns.find(col => col.key === key)
  return column?.label || key
}

function isColumnSortable(key: string): boolean {
  return !['anulada', 'factura_impresa', 'remision_facturada', 'confirmado', 'obj_datos_factura'].includes(key)
}

function selectAllColumns() {
  const allKeys = availableColumns.map(col => col.key)
  visibleColumns.value = [...allKeys]
  columnOrder.value = [...allKeys]
}

function resetColumns() {
  resetTablePreferences()
}

// Funciones para drag and drop
const draggedColumn = ref<string | null>(null)
const dragOverColumn = ref<string | null>(null)

function handleDragStart(event: DragEvent, columnKey: string) {
  draggedColumn.value = columnKey
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', columnKey)
  }
}

function handleDragOver(event: DragEvent, columnKey: string) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverColumn.value = columnKey
}

function handleDragLeave() {
  dragOverColumn.value = null
}

function handleDrop(event: DragEvent, targetColumnKey: string) {
  event.preventDefault()
  
  if (!draggedColumn.value || draggedColumn.value === targetColumnKey) {
    draggedColumn.value = null
    dragOverColumn.value = null
    return
  }
  
  // Reordenar columnas
  const currentOrder = [...columnOrder.value]
  const draggedIndex = currentOrder.indexOf(draggedColumn.value)
  const targetIndex = currentOrder.indexOf(targetColumnKey)
  
  if (draggedIndex !== -1 && targetIndex !== -1) {
    // Remover la columna arrastrada
    currentOrder.splice(draggedIndex, 1)
    // Insertar en la nueva posición
    currentOrder.splice(targetIndex, 0, draggedColumn.value)
    columnOrder.value = currentOrder
  }
  
  draggedColumn.value = null
  dragOverColumn.value = null
}

function handleDragEnd() {
  draggedColumn.value = null
  dragOverColumn.value = null
}

// Ordenamiento
const sortField = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Computed
const filteredRemisiones = computed(() => {
  if (!props.remisiones || !Array.isArray(props.remisiones)) {
    return []
  }
  let filtered = [...props.remisiones]
  
  // Búsqueda por texto en todos los campos
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(remision => {
      const searchInField = (value: any): boolean => {
        if (value === null || value === undefined) return false
        return String(value).toLowerCase().includes(query)
      }
      
      const searchInDate = (dateString: string | null | undefined): boolean => {
        if (!dateString) return false
        try {
          const date = new Date(dateString)
          const formattedDate = formatDate(dateString).toLowerCase()
          return formattedDate.includes(query) || dateString.toLowerCase().includes(query)
        } catch {
          return dateString.toLowerCase().includes(query)
        }
      }
      
      return (
        searchInField(getFieldValue(remision, 'codigo_factura', 'CODIGO_FACTURA')) ||
        searchInField(getFieldValue(remision, 'empresa', 'EMPRESA')) ||
        searchInField(getFieldValue(remision, 'codigo_cliente', 'CODIGO_CLIENTE')) ||
        searchInField(getFieldValue(remision, 'numero_factura', 'NUMERO_FACTURA')) ||
        searchInField(getFieldValue(remision, 'numero_pedido_sistema', 'NUMERO_PEDIDO_SISTEMA')) ||
        searchInField(getFieldValue(remision, 'numero_orden', 'NUMERO_ORDEN')) ||
        searchInField(getFieldValue(remision, 'orden_compra', 'ORDEN_COMPRA')) ||
        searchInField(getFieldValue(remision, 'orden_compra_cliente', 'ORDEN_COMPRA_CLIENTE')) ||
        searchInField(getFieldValue(remision, 'tipo_documento', 'TIPO_DOCUMENTO')) ||
        searchInDate(getFieldValue(remision, 'fecha_factura', 'FECHA_FACTURA'))
      )
    })
  }
  
  // Filtro por fecha
  if (filtroFechaDesde.value) {
    const fechaDesde = new Date(filtroFechaDesde.value)
    filtered = filtered.filter(remision => {
      const fecha = getFieldValue(remision, 'fecha_factura', 'FECHA_FACTURA')
      return fecha && new Date(fecha) >= fechaDesde
    })
  }
  
  if (filtroFechaHasta.value) {
    const fechaHasta = new Date(filtroFechaHasta.value)
    fechaHasta.setHours(23, 59, 59, 999)
    filtered = filtered.filter(remision => {
      const fecha = getFieldValue(remision, 'fecha_factura', 'FECHA_FACTURA')
      return fecha && new Date(fecha) <= fechaHasta
    })
  }
  
  // Filtro por empresa
  if (filtroEmpresa.value) {
    filtered = filtered.filter(remision => {
      const empresa = getFieldValue(remision, 'empresa', 'EMPRESA')
      return empresa && String(empresa).toLowerCase().includes(filtroEmpresa.value.toLowerCase())
    })
  }
  
  return filtered
})

const sortedRemisiones = computed(() => {
  let sorted: Remision[]
  
  if (!sortField.value) {
    sorted = [...filteredRemisiones.value]
  } else {
    sorted = [...filteredRemisiones.value]
    sorted.sort((a, b) => {
      const aValue = a[sortField.value as keyof Remision]
      const bValue = b[sortField.value as keyof Remision]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection.value === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return sortDirection.value === 'asc' 
        ? (aValue as any) - (bValue as any)
        : (bValue as any) - (aValue as any)
    })
  }
  
  // Aplicar paginación si se proporcionan los parámetros
  if (props.currentPage !== undefined && props.pageSize !== undefined && props.currentPage > 0 && props.pageSize > 0) {
    const start = (props.currentPage - 1) * props.pageSize
    const end = start + props.pageSize
    return sorted.slice(start, end)
  }
  
  return sorted
})

// Watch para emitir el conteo de remisiones filtradas cuando cambie
watch(() => filteredRemisiones.value, (newFiltered) => {
  try {
    if (newFiltered && Array.isArray(newFiltered)) {
      emit('filtered-count-changed', newFiltered.length)
    } else {
      emit('filtered-count-changed', 0)
    }
  } catch (error) {
    console.warn('Error al emitir conteo de remisiones filtradas:', error)
  }
}, { immediate: true })

// Funciones
function sortBy(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

function limpiarFiltros() {
  searchQuery.value = ''
  filtroFechaDesde.value = ''
  filtroFechaHasta.value = ''
  filtroEmpresa.value = ''
  showAdvancedFilters.value = false
}

// formatDate ahora importada desde utils/formatters.ts

// Helper function para obtener valores de campos que pueden venir en diferentes formatos
function getFieldValue(remision: Remision, snakeCaseKey: string, upperCaseKey: string): any {
  return remision[snakeCaseKey] ?? remision[upperCaseKey] ?? remision[snakeCaseKey.toLowerCase()] ?? remision[upperCaseKey.toLowerCase()] ?? null
}

// Helper function para obtener valores booleanos
function getBooleanValue(remision: Remision, snakeCaseKey: string, upperCaseKey: string): boolean {
  const value = getFieldValue(remision, snakeCaseKey, upperCaseKey)
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.toLowerCase()
    return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'sí'
  }
  return false
}
</script>

