<template>
  <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
    <!-- Header con búsqueda y acciones -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Título y contador -->
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900">Órdenes de Compra</h2>
          <span class="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium">
            {{ filteredOrdenes.length }} de {{ totalOrdenes }} órdenes
          </span>
          <span v-if="selectedOrdenes.length > 0" class="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">
            {{ selectedOrdenes.length }} seleccionadas
          </span>
        </div>
        
        <!-- Acciones en lote -->
        <div v-if="selectedOrdenes.length > 0" class="flex items-center gap-2">
          <button
            @click="handleIntegrarSeleccionadas"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            :disabled="loading || !hasPendientesSeleccionadas"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Enviar {{ selectedOrdenes.length }} a SAP
          </button>
          <button
            @click="clearSelection"
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Limpiar selección
          </button>
        </div>
      </div>
      
      <!-- Búsqueda y filtros -->
      <div class="mt-4 flex flex-col md:flex-row gap-3">
        <!-- Búsqueda -->
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
              placeholder="Buscar por proveedor, referencia, OC ID..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>
        
        <!-- Filtros rápidos -->
        <div class="flex items-center gap-2">
          <select
            v-model="filtroProveedor"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">Todos los proveedores</option>
            <option v-for="proveedor in proveedoresUnicos" :key="proveedor" :value="proveedor">
              {{ proveedor }}
            </option>
          </select>
          
          <button
            @click="showAdvancedFilters = !showAdvancedFilters"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </button>
        </div>
      </div>
      
      <!-- Filtros avanzados -->
      <div v-if="showAdvancedFilters" class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
            <input
              v-model="filtroFechaDesde"
              type="date"
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
            <input
              v-model="filtroFechaHasta"
              type="date"
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Número OC SAP</label>
            <input
              v-model="filtroNumeroOC"
              type="text"
              placeholder="Buscar por número OC SAP"
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            @click="limpiarFiltros"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div v-if="filteredOrdenes.length === 0" class="text-center py-12 text-gray-500">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="mt-2 text-sm">{{ searchQuery || filtroProveedor ? 'No se encontraron órdenes con los filtros aplicados' : 'No se encontraron órdenes de compra' }}</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="someSelected"
                @change="toggleSelectAll"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('oc_id')">
              <div class="flex items-center gap-1">
                OC ID
                <svg v-if="sortField === 'oc_id'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('proveedor')">
              <div class="flex items-center gap-1">
                Proveedor
                <svg v-if="sortField === 'proveedor'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('referencia_despacho')">
              <div class="flex items-center gap-1">
                Referencia Despacho
                <svg v-if="sortField === 'referencia_despacho'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('fecha_generacion')">
              <div class="flex items-center gap-1">
                Fecha Generación
                <svg v-if="sortField === 'fecha_generacion'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número OC SAP</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="oc in sortedOrdenes" 
            :key="oc.oc_id" 
            class="hover:bg-gray-50 transition-colors"
            :class="{ 'bg-indigo-50': isSelected(oc.oc_id) }"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <input
                type="checkbox"
                :checked="isSelected(oc.oc_id)"
                @change="toggleSelect(oc.oc_id)"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
              <span class="font-semibold">{{ oc.oc_id.substring(0, 8) }}...</span>
              <button
                @click="copyToClipboard(oc.oc_id)"
                class="ml-2 text-gray-400 hover:text-gray-600"
                title="Copiar ID completo"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ oc.proveedor }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ oc.referencia_despacho }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(oc.fecha_generacion) }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getEstadoClass(oc.estado)">
                {{ oc.estado }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <span v-if="oc.numero_oc_sap" class="font-mono">{{ oc.numero_oc_sap }}</span>
              <span v-else class="text-gray-400 italic">-</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <button 
                v-if="oc.estado === 'PENDIENTE'"
                @click="handleIntegrar(oc.referencia_despacho)" 
                class="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                :disabled="loading"
              >
                {{ loading ? 'Enviando...' : 'Enviar' }}
              </button>
              <span v-else class="text-gray-400 italic">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { OrdenCompra } from '../types'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  ordenesCompra: OrdenCompra[]
  loading?: boolean
  totalOrdenes?: number
}>()

const emit = defineEmits<{
  integrar: [referenciaDespacho: string]
  integrarMultiples: [referenciasDespacho: string[]]
}>()

const toast = useToast()

// Estado de selección
const selectedOrdenes = ref<string[]>([])

// Búsqueda y filtros
const searchQuery = ref('')
const filtroProveedor = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')
const filtroNumeroOC = ref('')
const showAdvancedFilters = ref(false)

// Ordenamiento
const sortField = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Computed
const proveedoresUnicos = computed(() => {
  const proveedores = new Set(props.ordenesCompra.map(oc => oc.proveedor))
  return Array.from(proveedores).sort()
})

const filteredOrdenes = computed(() => {
  let filtered = [...props.ordenesCompra]
  
  // Búsqueda por texto
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(oc => 
      oc.proveedor.toLowerCase().includes(query) ||
      oc.referencia_despacho.toLowerCase().includes(query) ||
      oc.oc_id.toLowerCase().includes(query) ||
      (oc.numero_oc_sap && oc.numero_oc_sap.toLowerCase().includes(query))
    )
  }
  
  // Filtro por proveedor
  if (filtroProveedor.value) {
    filtered = filtered.filter(oc => oc.proveedor === filtroProveedor.value)
  }
  
  // Filtro por fecha
  if (filtroFechaDesde.value) {
    const fechaDesde = new Date(filtroFechaDesde.value)
    filtered = filtered.filter(oc => new Date(oc.fecha_generacion) >= fechaDesde)
  }
  
  if (filtroFechaHasta.value) {
    const fechaHasta = new Date(filtroFechaHasta.value)
    fechaHasta.setHours(23, 59, 59, 999)
    filtered = filtered.filter(oc => new Date(oc.fecha_generacion) <= fechaHasta)
  }
  
  // Filtro por número OC SAP
  if (filtroNumeroOC.value) {
    filtered = filtered.filter(oc => 
      oc.numero_oc_sap && oc.numero_oc_sap.toLowerCase().includes(filtroNumeroOC.value.toLowerCase())
    )
  }
  
  return filtered
})

const sortedOrdenes = computed(() => {
  if (!sortField.value) return filteredOrdenes.value
  
  const sorted = [...filteredOrdenes.value]
  sorted.sort((a, b) => {
    const aValue = a[sortField.value as keyof OrdenCompra]
    const bValue = b[sortField.value as keyof OrdenCompra]
    
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
  
  return sorted
})

const allSelected = computed(() => {
  return filteredOrdenes.value.length > 0 && 
         filteredOrdenes.value.every(oc => selectedOrdenes.value.includes(oc.oc_id))
})

const someSelected = computed(() => {
  return filteredOrdenes.value.some(oc => selectedOrdenes.value.includes(oc.oc_id)) && !allSelected.value
})

const hasPendientesSeleccionadas = computed(() => {
  return selectedOrdenes.value.some(id => {
    const oc = props.ordenesCompra.find(o => o.oc_id === id)
    return oc && oc.estado === 'PENDIENTE'
  })
})

// Funciones
function isSelected(ocId: string): boolean {
  return selectedOrdenes.value.includes(ocId)
}

function toggleSelect(ocId: string) {
  const index = selectedOrdenes.value.indexOf(ocId)
  if (index > -1) {
    selectedOrdenes.value.splice(index, 1)
  } else {
    selectedOrdenes.value.push(ocId)
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    // Deseleccionar todas las visibles
    filteredOrdenes.value.forEach(oc => {
      const index = selectedOrdenes.value.indexOf(oc.oc_id)
      if (index > -1) {
        selectedOrdenes.value.splice(index, 1)
      }
    })
  } else {
    // Seleccionar todas las visibles
    filteredOrdenes.value.forEach(oc => {
      if (!selectedOrdenes.value.includes(oc.oc_id)) {
        selectedOrdenes.value.push(oc.oc_id)
      }
    })
  }
}

function clearSelection() {
  selectedOrdenes.value = []
}

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
  filtroProveedor.value = ''
  filtroFechaDesde.value = ''
  filtroFechaHasta.value = ''
  filtroNumeroOC.value = ''
  showAdvancedFilters.value = false
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('ID copiado al portapapeles')
  } catch (err) {
    toast.error('Error al copiar', 'No se pudo copiar el ID')
  }
}

function handleIntegrar(referenciaDespacho: string) {
  emit('integrar', referenciaDespacho)
}

function handleIntegrarSeleccionadas() {
  const referencias = selectedOrdenes.value
    .map(id => props.ordenesCompra.find(oc => oc.oc_id === id))
    .filter(oc => oc && oc.estado === 'PENDIENTE')
    .map(oc => oc!.referencia_despacho)
  
  if (referencias.length === 0) {
    toast.warning('No hay órdenes pendientes seleccionadas')
    return
  }
  
  emit('integrarMultiples', referencias)
}

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
  } catch {
    return dateString
  }
}

function getEstadoClass(estado: string): string {
  const classes: Record<string, string> = {
    'PENDIENTE': 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800',
    'ENVIADA': 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800',
    'ERROR': 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800',
  }
  return classes[estado] || 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'
}
</script>
