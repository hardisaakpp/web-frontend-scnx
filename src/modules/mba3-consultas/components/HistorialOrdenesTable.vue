<template>
  <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
    <!-- Header con búsqueda -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Título y contador -->
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900">Historial de Órdenes</h2>
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
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
          
          <button
            @click="showColumnSelector = !showColumnSelector"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2 relative"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Columnas
            <span v-if="visibleColumnsCount < allAvailableColumns.length" class="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {{ visibleColumnsCount }}
            </span>
          </button>
        </div>
      </div>
      
      <!-- Selector de Columnas -->
      <div v-if="showColumnSelector" class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700">Seleccionar Columnas</h3>
          <div class="flex items-center gap-2">
            <button
              @click="selectAllColumns"
              class="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Mostrar todas
            </button>
            <span class="text-gray-300">|</span>
            <button
              @click="resetColumns"
              class="text-xs text-gray-600 hover:text-gray-700 font-medium"
            >
              Restaurar predeterminadas
            </button>
          </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <label
            v-for="column in allAvailableColumns"
            :key="column.key"
            class="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              v-model="visibleColumns"
              :value="column.key"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700">{{ column.label }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div v-if="loading" class="text-center py-12 text-gray-500">
      <svg class="animate-spin h-8 w-8 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <p class="mt-2">Cargando datos...</p>
    </div>

    <div v-else-if="filteredOrdenes.length === 0" class="text-center py-12 text-gray-500">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="mt-2 text-sm">{{ searchQuery ? 'No se encontraron órdenes con los filtros aplicados' : 'No se encontraron órdenes de compra' }}</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th 
              v-for="column in visibleLogColumns" 
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="log in sortedOrdenes" 
            :key="log.log_id || log.oc_id || log.timestamp || Math.random()" 
            class="hover:bg-gray-50 transition-colors"
          >
            <td 
              v-for="column in visibleLogColumns" 
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
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
import { ref, computed, watch } from 'vue'
import type { OrdenCompraLog } from '../types'
import { isSapError, getSapErrorMessage } from '../composables/useSapErrorMessages'

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

// Configuración de columnas
const STORAGE_KEY = 'historial-ordenes-table-columns'

// Columnas base comunes en logs - Ordenadas lógicamente por categorías
const baseColumns = [
  // 1. Identificadores principales
  { key: 'oc_id', label: 'OC ID', priority: 1, default: true },
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
  
  props.ordenesCompra.forEach(log => {
    Object.keys(log).forEach(key => {
      // Excluir campos que ya están en baseColumns o que son objetos complejos
      if (!baseColumns.find(col => col.key === key) && 
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

// Cargar columnas visibles desde localStorage o usar valores por defecto
function loadVisibleColumns(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validar que todas las columnas guardadas existen en las columnas disponibles
        const availableKeys = allAvailableColumns.value.map(col => col.key)
        return parsed.filter((key: string) => availableKeys.includes(key))
      }
    }
  } catch (error) {
    console.error('Error al cargar preferencias de columnas:', error)
  }
  
  // Retornar columnas con default: true
  return baseColumns.filter(col => col.default).map(col => col.key)
}

const visibleColumns = ref<string[]>(loadVisibleColumns())

// Guardar preferencias cuando cambian
function saveVisibleColumns() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibleColumns.value))
  } catch (error) {
    console.error('Error al guardar preferencias de columnas:', error)
  }
}

// Watch para guardar cuando cambian las columnas o cuando se detectan nuevas columnas disponibles
watch(visibleColumns, () => {
  saveVisibleColumns()
}, { deep: true })

// Watch para agregar nuevas columnas detectadas con su valor default
watch(allAvailableColumns, (newColumns) => {
  const currentVisible = visibleColumns.value
  const availableKeys = newColumns.map(col => col.key)
  
  // Agregar nuevas columnas con default: true si no están ya visibles
  newColumns.forEach(col => {
    if (col.default && !currentVisible.includes(col.key) && availableKeys.includes(col.key)) {
      currentVisible.push(col.key)
    }
  })
  
  // Remover columnas que ya no existen
  visibleColumns.value = currentVisible.filter(key => availableKeys.includes(key))
}, { deep: true })

// Computed para contar columnas visibles
const visibleColumnsCount = computed(() => visibleColumns.value.length)

// Filtrar columnas mostradas según selección del usuario
const visibleLogColumns = computed(() => {
  return allAvailableColumns.value.filter(col => visibleColumns.value.includes(col.key))
})

// Extraer columnas dinámicamente de los logs (mantener para compatibilidad si se usa en otro lugar)
const logColumns = computed(() => {
  return allAvailableColumns.value
})

// Funciones de utilidad para manejo de columnas
function selectAllColumns() {
  visibleColumns.value = allAvailableColumns.value.map(col => col.key)
}

function resetColumns() {
  visibleColumns.value = baseColumns.filter(col => col.default).map(col => col.key)
}

// Función para obtener el valor de un log
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
  return props.ordenesCompra.filter(log => {
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
      const friendlyMessage = getSapErrorMessage(log.error_code, log.error_message || log.mensaje || null)
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

