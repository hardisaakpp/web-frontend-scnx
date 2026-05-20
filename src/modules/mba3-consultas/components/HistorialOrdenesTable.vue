<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
    <!-- Header con búsqueda -->
    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Título y contador -->
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Historial de Órdenes</h2>
          <span class="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
            {{ filteredOrdenes.length }} de {{ totalOrdenes }} órdenes
          </span>
        </div>
        
        <!-- Búsqueda y controles -->
        <div class="flex flex-1 items-center gap-3 max-w-2xl">
          <div class="flex-1">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar en todas las columnas..."
                class="block w-full pl-10 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                :class="searchQuery ? 'pr-10' : 'pr-3'"
              />
              <button
                v-if="searchQuery"
                @click="searchQuery = ''"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Limpiar búsqueda"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <button
            @click="showColumnSelector = !showColumnSelector"
            class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2 relative text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-800"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Columnas
            <span v-if="visibleColumnsCount < allAvailableColumns.length" class="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full">
              {{ visibleColumnsCount }}
            </span>
          </button>
        </div>
      </div>
      
      <!-- Selector de Columnas -->
      <div v-if="showColumnSelector" class="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Seleccionar Columnas</h3>
          <div class="flex items-center gap-2">
            <button
              @click="selectAllColumns"
              class="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Mostrar todas
            </button>
            <span class="text-gray-300 dark:text-gray-600">|</span>
            <button
              @click="resetColumns"
              class="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
            >
              Restaurar predeterminadas
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <label
            v-for="column in allAvailableColumns"
            :key="column.key"
            class="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              v-model="visibleColumns"
              :value="column.key"
              class="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ column.label }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <LoadingSpinner v-if="loading" message="Cargando datos..." color="blue" />

    <div v-else-if="filteredOrdenes.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
      <svg class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="mt-2 text-sm">{{ searchQuery ? 'No se encontraron órdenes con los filtros aplicados' : 'No se encontraron órdenes de compra' }}</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th 
              v-for="column in visibleLogColumns" 
              :key="column.key"
              :draggable="true"
              @dragstart="handleDragStart($event, column.key)"
              @dragover="handleDragOver($event, column.key)"
              @dragleave="handleDragLeave"
              @drop="handleDrop($event, column.key)"
              @dragend="handleDragEnd"
              :class="[
                'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-grab',
                draggedColumn === column.key ? 'opacity-50 cursor-grabbing' : '',
                dragOverColumn === column.key && draggedColumn !== column.key ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              ]"
              @click="sortBy(column.key)"
            >
              <div class="flex items-center gap-1">
                {{ column.label }}
                <svg v-if="sortField === column.key" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr 
            v-for="log in sortedOrdenes" 
            :key="log.log_id || log.oc_id || log.timestamp || Math.random()" 
            class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            :class="getRowWarningClass(log)"
            :title="hasRowIssues(log).issues.length > 0 ? 'Problemas: ' + hasRowIssues(log).issues.join(', ') : ''"
          >
            <td 
              v-for="column in visibleLogColumns" 
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
            >
              <div v-if="column.key === 'oc_id' && log.oc_id" class="font-mono font-semibold">
                {{ log.oc_id.length > 8 ? log.oc_id.substring(0, 8) + '...' : log.oc_id }}
              </div>
              <div v-else-if="column.key === 'referencia_despacho' && log.referencia_despacho" class="font-medium">
                {{ log.referencia_despacho }}
              </div>
              <div v-else-if="column.key === 'proveedor' && log.proveedor">
                {{ log.proveedor }}
              </div>
              <div v-else-if="isDateColumn(column.key)">
                {{ formatDate(getLogValue(log, column.key)) }}
              </div>
              <div v-else-if="(column.key === 'doc_entry' || column.key === 'doc_num') && getLogValue(log, column.key)">
                {{ formatIntegerValue(getLogValue(log, column.key)) }}
              </div>
              <div v-else>
                {{ formatLogValue(log, column.key) }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import type { OrdenCompraLog } from '../types'
import { isSapError, getSapErrorMessage } from '../composables/useSapErrorMessages'
import { useTablePreferences } from '@/composables/useTablePreferences'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps<{
  ordenesCompra: OrdenCompraLog[]
  loading?: boolean
  totalOrdenes?: number
}>()

const searchQuery = ref('')
const showColumnSelector = ref(false)

// Ordenamiento
const sortField = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Columnas base comunes en logs - Ordenadas lógicamente por categorías
const baseColumns = [
  // 1. Identificadores principales
  { key: 'oc_id', label: 'ODC ID', priority: 1, default: true },
  { key: 'referencia_despacho', label: 'Referencia Despacho', priority: 2, default: true },
  
  // 2. Información de la entidad
  { key: 'proveedor', label: 'Proveedor', priority: 3, default: true },
  
  // 3. Referencias SAP
  { key: 'doc_entry', label: 'Doc Entry', priority: 5, default: false },
  { key: 'doc_num', label: 'Doc Num', priority: 6, default: false },
  
  // 4. Información de errores (orden lógico: origen -> código)
  { key: 'error_source', label: 'Fuente de Error', priority: 7, default: false },
  { key: 'error_code', label: 'Código de Error', priority: 8, default: false },
]

// Configuración de columnas usando composable híbrido
const defaultVisibleColumns = baseColumns.filter(col => col.default).map(col => col.key)
const defaultColumnOrder = baseColumns.map(col => col.key)

const {
  visibleColumns,
  columnOrder,
  orderedVisibleColumns: orderedVisibleColumnsFromComposable,
  resetPreferences: resetTablePreferences,
  selectAllColumns: selectAllTableColumns
} = useTablePreferences({
  tableId: 'historial-ordenes',
  defaultVisibleColumns,
  defaultColumnOrder,
  enableFilters: false,
  enablePageSize: false
})

// Función para formatear el nombre de la columna
function formatColumnLabel(key: string): string {
  // Convertir snake_case o camelCase a título legible
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// Extraer todas las columnas disponibles (base + dinámicas)
const allAvailableColumns = computed(() => {
  // Extraer todas las claves únicas de todos los logs
  const allKeys = new Set<string>()
  
  props.ordenesCompra.forEach((log: OrdenCompraLog) => {
    Object.keys(log).forEach((key: string) => {
      // Excluir campos que ya están en baseColumns o que son objetos complejos
      if (!baseColumns.find((col: { key: string }) => col.key === key) && 
          key !== 'metadata' && 
          typeof log[key] !== 'object') {
        allKeys.add(key)
      }
    })
  })

  // Crear columnas dinámicas para campos adicionales
  const dynamicColumns = Array.from(allKeys)
    .sort()
    .map(key => ({
      key,
      label: formatColumnLabel(key),
      priority: 100, // Prioridad baja para campos dinámicos
      default: false
    }))

  // Combinar y ordenar por prioridad
  const allColumns = [...baseColumns, ...dynamicColumns]
    .filter((col, index, self) => 
      // Filtrar duplicados
      index === self.findIndex(c => c.key === col.key)
    )
    .sort((a, b) => a.priority - b.priority)

  return allColumns.map(({ priority, ...col }) => col) // Remover priority del objeto final
})

// Watch para agregar nuevas columnas detectadas con su valor default
watch(allAvailableColumns, (newColumns: { key: string; label: string; default: boolean }[]) => {
  const currentVisible = visibleColumns.value
  const availableKeys = newColumns.map((col: { key: string }) => col.key)
  
  // Agregar nuevas columnas con default: true si no están ya visibles
  newColumns.forEach((col: { key: string; default: boolean }) => {
    if (col.default && !currentVisible.includes(col.key) && availableKeys.includes(col.key)) {
      currentVisible.push(col.key)
    }
  })
  
  // Remover columnas que ya no existen
  visibleColumns.value = currentVisible.filter((key: string) => availableKeys.includes(key))
  
  // Actualizar el orden: mantener el orden existente y agregar nuevas columnas al final
  const currentOrder = columnOrder.value.filter((key: string) => availableKeys.includes(key))
  const missingInOrder = availableKeys.filter((key: string) => !currentOrder.includes(key))
  columnOrder.value = [...currentOrder, ...missingInOrder]
}, { deep: true })

// Computed para contar columnas visibles
const visibleColumnsCount = computed(() => visibleColumns.value.length)

// Filtrar columnas mostradas según selección del usuario y orden
const visibleLogColumns = computed(() => {
  // Obtener las columnas en el orden especificado
  const orderedKeys = orderedVisibleColumnsFromComposable.value
  const columnsMap = new Map(allAvailableColumns.value.map((col: { key: string; label: string; default: boolean }) => [col.key, col]))
  
  // Retornar columnas en el orden correcto
  return orderedKeys
    .map(key => columnsMap.get(key))
    .filter((col): col is { key: string; label: string; default: boolean } => col !== undefined)
})

// Extraer columnas dinámicamente de los logs (mantener para compatibilidad si se usa en otro lugar)
const logColumns = computed(() => {
  return allAvailableColumns.value
})

// Funciones de utilidad para manejo de columnas
function selectAllColumns() {
  const allKeys = allAvailableColumns.value.map((col: { key: string }) => col.key)
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

// Función para obtener el valor de un log
// Función para detectar problemas en una fila de log de orden de compra
function hasRowIssues(log: OrdenCompraLog): { hasErrors: boolean; hasWarnings: boolean; issues: string[] } {
  const issues: string[] = []
  let hasErrors = false
  let hasWarnings = false

  // Errores críticos (rojo)
  if (log.estado === 'ERROR') {
    issues.push('Estado: ERROR')
    hasErrors = true
  }
  if (!log.oc_id || log.oc_id.trim() === '') {
    issues.push('Falta ODC ID')
    hasErrors = true
  }
  if (!log.referencia_despacho || log.referencia_despacho.trim() === '') {
    issues.push('Falta referencia de despacho')
    hasErrors = true
  }
  if (log.mensaje && (log.mensaje.toLowerCase().includes('error') || log.mensaje.toLowerCase().includes('fallo'))) {
    issues.push(`Error: ${log.mensaje}`)
    hasErrors = true
  }
  if (log.error_message) {
    issues.push(`Error: ${log.error_message}`)
    hasErrors = true
  }

  // Advertencias (amarillo/naranja)
  if (!log.proveedor || log.proveedor.trim() === '') {
    issues.push('Falta proveedor')
    hasWarnings = true
  }
  if (!log.timestamp && !log.fecha && !log.created_at) {
    issues.push('Falta fecha/timestamp')
    hasWarnings = true
  }
  if (log.estado === 'ENVIADA' && !log.numero_oc_sap && !log.doc_entry && !log.doc_num) {
    issues.push('Enviada pero sin referencia SAP')
    hasWarnings = true
  }
  if (log.error_code && !log.error_message && !log.mensaje) {
    issues.push(`Código de error: ${log.error_code}`)
    hasWarnings = true
  }
  if (log.error_source && log.estado !== 'ERROR') {
    issues.push(`Fuente de error: ${log.error_source}`)
    hasWarnings = true
  }

  return { hasErrors, hasWarnings, issues }
}

// Función para obtener clases CSS según problemas detectados
function getRowWarningClass(log: OrdenCompraLog): string {
  const { hasErrors, hasWarnings } = hasRowIssues(log)
  
  if (hasErrors) {
    // Fondo rojo claro con borde rojo para errores críticos
    return 'bg-red-50/80 dark:bg-red-900/20 border-l-4 border-red-500 hover:bg-red-100/80 dark:hover:bg-red-900/30'
  } else if (hasWarnings) {
    // Fondo amarillo/naranja claro con borde amarillo para advertencias
    return 'bg-yellow-50/80 dark:bg-yellow-900/20 border-l-4 border-yellow-500 hover:bg-yellow-100/80 dark:hover:bg-yellow-900/30'
  }
  
  return ''
}

function getLogValue(log: OrdenCompraLog, columnKey: string): any {
  return log[columnKey] ?? null
}

// Función para formatear el valor de un log
function formatLogValue(log: OrdenCompraLog, columnKey: string): string {
  const value = getLogValue(log, columnKey)
  
  if (value === null || value === undefined) {
    return '-'
  }
  
  // Si es una fecha, formatearla
  if (isDateColumn(columnKey)) {
    return formatDate(value)
  }
  
  // Si es un objeto, mostrar JSON compacto
  if (typeof value === 'object' && !Array.isArray(value)) {
    return JSON.stringify(value)
  }
  
  // Si es un array, mostrar resumen
  if (Array.isArray(value)) {
    return `${value.length} elemento(s)`
  }
  
  // Si es un número, formatearlo
  if (typeof value === 'number') {
    // Campos que no deben usar formato de miles (punto como separador)
    const camposSinFormatoMiles = ['doc_entry', 'doc_num']
    
    if (camposSinFormatoMiles.includes(columnKey)) {
      // Mostrar como entero sin separadores de miles
      return String(Math.floor(value))
    }
    
    // Otros números con formato estándar
    return value.toLocaleString('es-ES')
  }
  
  // Si es un booleano, mostrar texto
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }
  
  return String(value)
}

// Función para verificar si una columna es de tipo fecha
function isDateColumn(columnKey: string): boolean {
  const dateKeys = ['timestamp', 'created_at', 'updated_at', 'fecha', 'fecha_generacion', 'fecha_procesado']
  return dateKeys.includes(columnKey) || columnKey.toLowerCase().includes('fecha') || columnKey.toLowerCase().includes('date')
}

// Función para formatear valores enteros sin separadores de miles (para doc_entry, doc_num, etc.)
function formatIntegerValue(value: any): string {
  if (value === null || value === undefined) {
    return '-'
  }
  
  // Si es un número, mostrar como entero sin formato
  if (typeof value === 'number') {
    return String(Math.floor(value))
  }
  
  // Si es un string numérico, intentar parsearlo y mostrarlo sin formato
  if (typeof value === 'string') {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      return String(Math.floor(numValue))
    }
  }
  
  // Si no es numérico, devolver como string
  return String(value)
}

// Filtrar logs según búsqueda
const filteredOrdenes = computed(() => {
  if (!searchQuery.value) {
    return props.ordenesCompra
  }

  const query = searchQuery.value.toLowerCase()
  return props.ordenesCompra.filter((log: OrdenCompraLog) => {
    // Buscar en todos los campos del log
    for (const key in log) {
      const value = log[key]
      
      // Saltar objetos complejos y arrays
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        continue
      }
      
      // Convertir el valor a string y buscar
      const valueStr = String(value).toLowerCase()
      if (valueStr.includes(query)) {
        return true
      }
    }

    // Buscar en mensajes amigables de SAP
    if (log.estado === 'ERROR' && isSapError(log.error_source) && log.error_code) {
      const friendlyMessage = getSapErrorMessage(log.error_code, log.error_message || log.mensaje || undefined)
      if (friendlyMessage.toLowerCase().includes(query)) {
        return true
      }
    }

    return false
  })
})

// Ordenar logs
const sortedOrdenes = computed(() => {
  if (!sortField.value) return filteredOrdenes.value

  const sorted = [...filteredOrdenes.value]
  sorted.sort((a, b) => {
    const aValue = getLogValue(a, sortField.value!)
    const bValue = getLogValue(b, sortField.value!)

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    // Si es una fecha, comparar como fecha
    if (isDateColumn(sortField.value!)) {
      const aDate = new Date(aValue).getTime()
      const bDate = new Date(bValue).getTime()
      return sortDirection.value === 'asc' 
        ? aDate - bDate
        : bDate - aDate
    }

    // Si es string, comparar como string
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection.value === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    // Si es número, comparar como número
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection.value === 'asc' 
        ? aValue - bValue
        : bValue - aValue
    }

    // Comparación genérica
    return sortDirection.value === 'asc' 
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue))
  })

  return sorted
})

function sortBy(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

// Exponer método para establecer el searchQuery desde fuera
function setSearchQuery(query: string) {
  searchQuery.value = query
}

defineExpose({
  setSearchQuery
})
</script>

