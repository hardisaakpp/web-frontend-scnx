<template>
  <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
    <!-- Header con búsqueda y acciones -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Título y contador -->
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900">Despachos</h2>
          <span class="px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium">
            {{ filteredDespachos.length }} de {{ totalDespachos || 0 }} despachos
          </span>
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
              placeholder="Buscar por código factura, número factura, cliente, empresa..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>
        </div>
        
        <!-- Filtros rápidos -->
        <div class="flex items-center gap-2">
          <select
            v-model="filtroEmpresa"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">Todas las empresas</option>
            <option v-for="empresa in empresasUnicas" :key="empresa" :value="empresa">
              {{ empresa }}
            </option>
          </select>

          <select
            v-model="filtroTipoDocumento"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">Todos los tipos</option>
            <option v-for="tipo in tiposDocumentoUnicos" :key="tipo" :value="tipo">
              {{ tipo }}
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
            <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              v-model="filtroEstado"
              class="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="">Todos</option>
              <option value="confirmado">Confirmados</option>
              <option value="pendiente">Pendientes</option>
              <option value="anulado">Anulados</option>
            </select>
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
    <div v-if="!loading && filteredDespachos.length === 0" class="text-center py-12 text-gray-500">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="mt-2 text-sm">{{ searchQuery || filtroEmpresa ? 'No se encontraron despachos con los filtros aplicados' : 'No se encontraron despachos' }}</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('codigo_factura')">
              <div class="flex items-center gap-1">
                Código Factura
                <svg v-if="sortField === 'codigo_factura'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('numero_factura')">
              <div class="flex items-center gap-1">
                Número Factura
                <svg v-if="sortField === 'numero_factura'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('empresa')">
              <div class="flex items-center gap-1">
                Empresa
                <svg v-if="sortField === 'empresa'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('codigo_cliente')">
              <div class="flex items-center gap-1">
                Cliente
                <svg v-if="sortField === 'codigo_cliente'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('fecha_despacho')">
              <div class="flex items-center gap-1">
                Fecha Despacho
                <svg v-if="sortField === 'fecha_despacho'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('tipo_documento')">
              <div class="flex items-center gap-1">
                Tipo Doc.
                <svg v-if="sortField === 'tipo_documento'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orden Compra</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido Sistema</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <template v-for="despacho in sortedDespachos" :key="despacho.despacho_id">
            <!-- Fila principal del despacho -->
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <button
                  @click="toggleDetalles(despacho.despacho_id)"
                  class="text-gray-400 hover:text-gray-600 transition-colors"
                  :disabled="loadingDetalles[despacho.despacho_id]"
                >
                  <svg 
                    class="w-5 h-5 transform transition-transform"
                    :class="{ 'rotate-90': detallesExpandidos.has(despacho.despacho_id) }"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                <span class="font-semibold">{{ despacho.codigo_factura }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ despacho.numero_factura || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ despacho.empresa }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{{ despacho.codigo_cliente }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatDate(despacho.fecha_despacho) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span class="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                  {{ despacho.tipo_documento }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getEstadoClass(despacho)">
                  {{ getEstadoText(despacho) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span v-if="despacho.orden_compra" class="font-mono">{{ despacho.orden_compra }}</span>
                <span v-else class="text-gray-400 italic">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <span v-if="despacho.numero_pedido_sistema">{{ despacho.numero_pedido_sistema }}</span>
                <span v-else class="text-gray-400 italic">-</span>
              </td>
            </tr>
            
            <!-- Fila expandible con detalles -->
            <tr v-if="detallesExpandidos.has(despacho.despacho_id)">
              <td colspan="10" class="px-6 py-4 bg-gray-50">
                <div v-if="loadingDetalles[despacho.despacho_id]" class="flex items-center justify-center py-4">
                  <svg class="animate-spin h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span class="ml-2 text-sm text-gray-600">Cargando detalles...</span>
                </div>
                <div v-else-if="detallesPorDespacho[despacho.despacho_id]?.length > 0" class="py-2">
                  <h4 class="text-sm font-semibold text-gray-700 mb-3">
                    Detalles del Despacho ({{ detallesPorDespacho[despacho.despacho_id]?.length }} {{ detallesPorDespacho[despacho.despacho_id]?.length === 1 ? 'ítem' : 'ítems' }})
                  </h4>
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
                      <thead class="bg-gray-100">
                        <tr>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">SKU</th>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Producto</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Cant. Docena MBA3</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Cant. Pack SAP</th>
                          <th class="px-4 py-2 text-center text-xs font-medium text-gray-600 uppercase">Unidad SAP</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Precio Unit. MBA3</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Precio Unit. SAP</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Descuento</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Subtotal SAP</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-600 uppercase">Total Línea MBA3</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200">
                        <tr v-for="(detalle, index) in detallesPorDespacho[despacho.despacho_id]" :key="detalle.detalle_id || index" class="hover:bg-gray-50">
                          <td class="px-4 py-2 text-sm font-mono text-gray-900 font-semibold">{{ detalle.sku || '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900">
                            <div class="max-w-xs">
                              <div class="font-medium">{{ detalle.nombre_producto || '-' }}</div>
                              <div class="text-xs text-gray-500 mt-1">{{ detalle.tipo_linea || '-' }}</div>
                            </div>
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-center">{{ formatNumber(detalle.cantidad_docena_mba3) }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-center">{{ detalle.cantidad_pack_sap !== null ? formatNumber(detalle.cantidad_pack_sap) : '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-center font-mono">{{ detalle.unidad_sap || '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-right">{{ formatCurrency(detalle.precio_unitario_mba3) }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-right">{{ detalle.precio_unitario_sap !== null ? formatCurrency(detalle.precio_unitario_sap) : '-' }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-right">{{ formatCurrency(detalle.descuento) }}</td>
                          <td class="px-4 py-2 text-sm text-gray-900 text-right font-medium">{{ formatCurrency(detalle.subtotal_sap) }}</td>
                          <td class="px-4 py-2 text-sm font-semibold text-gray-900 text-right">{{ formatCurrency(detalle.total_linea_mba3) }}</td>
                        </tr>
                      </tbody>
                      <tfoot v-if="detallesPorDespacho[despacho.despacho_id]?.length > 0" class="bg-gray-50 border-t-2 border-gray-300">
                        <tr>
                          <td colspan="8" class="px-4 py-2 text-sm font-semibold text-gray-700 text-right">Subtotal:</td>
                          <td class="px-4 py-2 text-sm font-bold text-gray-900 text-right border-l border-gray-300">
                            {{ formatCurrency(getTotalSubtotalSAP(despacho.despacho_id)) }}
                          </td>
                          <td class="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                            {{ formatCurrency(getTotalLineaMBA3(despacho.despacho_id)) }}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                <div v-else class="py-4 text-center text-sm text-gray-500">
                  No hay detalles disponibles para este despacho
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Despacho, DespachoDetalle } from '../types'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  despachos: Despacho[]
  loading?: boolean
  totalDespachos?: number
}>()

const toast = useToast()

// Estado para detalles expandidos
const detallesExpandidos = ref<Set<string>>(new Set())
const detallesPorDespacho = ref<Record<string, DespachoDetalle[]>>({})
const loadingDetalles = ref<Record<string, boolean>>({})

// Búsqueda y filtros
const searchQuery = ref('')
const filtroEmpresa = ref('')
const filtroTipoDocumento = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')
const filtroEstado = ref('')
const showAdvancedFilters = ref(false)

// Ordenamiento
const sortField = ref<string | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

// Computed
const empresasUnicas = computed(() => {
  const empresas = new Set(props.despachos.map(d => d.empresa))
  return Array.from(empresas).sort()
})

const tiposDocumentoUnicos = computed(() => {
  const tipos = new Set(props.despachos.map(d => d.tipo_documento))
  return Array.from(tipos).sort()
})

const filteredDespachos = computed(() => {
  let filtered = [...props.despachos]
  
  // Búsqueda por texto
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(d => 
      (d.codigo_factura && d.codigo_factura.toLowerCase().includes(query)) ||
      (d.numero_factura && String(d.numero_factura).includes(query)) ||
      (d.codigo_cliente && d.codigo_cliente.toLowerCase().includes(query)) ||
      (d.empresa && d.empresa.toLowerCase().includes(query)) ||
      (d.orden_compra && d.orden_compra.toLowerCase().includes(query)) ||
      (d.numero_pedido_sistema && String(d.numero_pedido_sistema).includes(query))
    )
  }
  
  // Filtro por empresa
  if (filtroEmpresa.value) {
    filtered = filtered.filter(d => d.empresa === filtroEmpresa.value)
  }
  
  // Filtro por tipo de documento
  if (filtroTipoDocumento.value) {
    filtered = filtered.filter(d => d.tipo_documento === filtroTipoDocumento.value)
  }
  
  // Filtro por fecha
  if (filtroFechaDesde.value) {
    const fechaDesde = new Date(filtroFechaDesde.value)
    filtered = filtered.filter(d => new Date(d.fecha_despacho) >= fechaDesde)
  }
  
  if (filtroFechaHasta.value) {
    const fechaHasta = new Date(filtroFechaHasta.value)
    fechaHasta.setHours(23, 59, 59, 999)
    filtered = filtered.filter(d => new Date(d.fecha_despacho) <= fechaHasta)
  }
  
  // Filtro por estado
  if (filtroEstado.value) {
    if (filtroEstado.value === 'anulado') {
      filtered = filtered.filter(d => d.anulada === true)
    } else if (filtroEstado.value === 'confirmado') {
      filtered = filtered.filter(d => d.confirmado === true && d.anulada === false)
    } else if (filtroEstado.value === 'pendiente') {
      filtered = filtered.filter(d => d.confirmado === false && d.anulada === false)
    }
  }
  
  return filtered
})

const sortedDespachos = computed(() => {
  if (!sortField.value) return filteredDespachos.value
  
  const sorted = [...filteredDespachos.value]
  sorted.sort((a, b) => {
    const aValue = a[sortField.value as keyof Despacho]
    const bValue = b[sortField.value as keyof Despacho]
    
    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection.value === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection.value === 'asc' 
        ? aValue - bValue
        : bValue - aValue
    }
    
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortDirection.value === 'asc' 
        ? (aValue === bValue ? 0 : aValue ? 1 : -1)
        : (aValue === bValue ? 0 : aValue ? -1 : 1)
    }
    
    return 0
  })
  
  return sorted
})

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
  filtroEmpresa.value = ''
  filtroTipoDocumento.value = ''
  filtroFechaDesde.value = ''
  filtroFechaHasta.value = ''
  filtroEstado.value = ''
  showAdvancedFilters.value = false
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

function getEstadoClass(despacho: Despacho): string {
  if (despacho.anulada) {
    return 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800'
  }
  if (despacho.confirmado) {
    return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800'
  }
  return 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800'
}

function getEstadoText(despacho: Despacho): string {
  if (despacho.anulada) {
    return 'Anulado'
  }
  if (despacho.confirmado) {
    return 'Confirmado'
  }
  return 'Pendiente'
}

// Funciones para manejar detalles
async function toggleDetalles(despachoId: string) {
  if (detallesExpandidos.value.has(despachoId)) {
    // Colapsar
    detallesExpandidos.value.delete(despachoId)
  } else {
    // Expandir y cargar detalles si no están cargados
    detallesExpandidos.value.add(despachoId)
    
    if (!detallesPorDespacho.value[despachoId]) {
      await cargarDetalles(despachoId)
    }
  }
}

async function cargarDetalles(despachoId: string) {
  loadingDetalles.value[despachoId] = true
  try {
    // Primero verificar si los detalles ya vienen en el despacho (campo despacho_detalles)
    const despacho = props.despachos.find(d => d.despacho_id === despachoId)
    if (despacho?.despacho_detalles && despacho.despacho_detalles.length > 0) {
      console.log(`✅ [cargarDetalles] Detalles encontrados en despacho ${despachoId}:`, despacho.despacho_detalles.length)
      detallesPorDespacho.value[despachoId] = despacho.despacho_detalles
      loadingDetalles.value[despachoId] = false
      return
    }
    
    // Si no hay detalles incluidos, intentar cargarlos desde el endpoint (por si acaso)
    try {
      const detalles = await mba3ConsultasService.getDespachoDetalles(despachoId)
      detallesPorDespacho.value[despachoId] = detalles
    } catch (endpointError: any) {
      // Si el endpoint no existe o falla, usar los detalles vacíos del despacho
      console.warn('No se pudieron cargar detalles desde endpoint, usando detalles incluidos (pueden estar vacíos)')
      detallesPorDespacho.value[despachoId] = despacho?.despacho_detalles || []
    }
  } catch (error: any) {
    console.error('Error al cargar detalles:', error)
    detallesPorDespacho.value[despachoId] = []
  } finally {
    loadingDetalles.value[despachoId] = false
  }
}

function getTotalSubtotalSAP(despachoId: string): number {
  const detalles = detallesPorDespacho.value[despachoId] || []
  return detalles.reduce((total, detalle) => {
    return total + (detalle.subtotal_sap || 0)
  }, 0)
}

function getTotalLineaMBA3(despachoId: string): number {
  const detalles = detallesPorDespacho.value[despachoId] || []
  return detalles.reduce((total, detalle) => {
    return total + (detalle.total_linea_mba3 || 0)
  }, 0)
}

function formatCurrency(value: number | undefined | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number | undefined | null): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
</script>
