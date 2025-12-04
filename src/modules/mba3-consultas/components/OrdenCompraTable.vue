<template>
  <div class="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
    <!-- Header con búsqueda y acciones -->
    <div class="px-6 py-4 border-b border-gray-200">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <!-- Título y contador -->
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-gray-900">Órdenes de Compra</h2>
          <span class="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-medium">
            {{ filteredOrdenes.length }} de {{ totalOrdenes }} órdenes
          </span>
          <span v-if="selectedOrdenes.length > 0" class="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-medium">
            {{ selectedOrdenes.length }} seleccionadas
          </span>
        </div>
        
        <!-- Acciones en lote -->
        <div v-if="selectedOrdenes.length > 0 && !readOnly" class="flex items-center gap-2">
          <button
            @click="handleIntegrarSeleccionadas"
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            :disabled="props.loading || sendingMultiple || !hasPendientesSeleccionadas"
          >
            <svg v-if="sendingMultiple" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ sendingMultiple ? `Enviando ${selectedOrdenes.length}...` : `Enviar ${selectedOrdenes.length} a SAP` }}
          </button>
          <button
            v-if="allowDelete"
            @click="handleEliminarSeleccionadas"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            :disabled="loading || deleting"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {{ deleting ? 'Eliminando...' : `Eliminar ${selectedOrdenes.length}` }}
          </button>
          <button
            @click="clearSelection"
            class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Limpiar selección
          </button>
        </div>
        <div v-else-if="selectedOrdenes.length > 0 && readOnly" class="flex items-center gap-2">
          <span class="text-sm text-gray-500">{{ selectedOrdenes.length }} seleccionada(s)</span>
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
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
          </div>
        </div>
        
        <!-- Filtros rápidos -->
        <div class="flex items-center gap-2">
          <select
            v-model="filtroProveedor"
            class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
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
          
          <button
            @click="showColumnSelector = !showColumnSelector"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2 relative"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Columnas
            <span v-if="visibleColumnsCount < availableColumns.length" class="ml-1 px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
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
              class="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
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
            v-for="column in availableColumns"
            :key="column.key"
            class="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              v-model="visibleColumns"
              :value="column.key"
              class="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <span class="text-sm text-gray-700">{{ column.label }}</span>
          </label>
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
                class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </th>
            <th v-if="isColumnVisible('oc_id')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('oc_id')">
              <div class="flex items-center gap-1">
                OC ID
                <svg v-if="sortField === 'oc_id'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('proveedor')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('proveedor')">
              <div class="flex items-center gap-1">
                Proveedor
                <svg v-if="sortField === 'proveedor'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('referencia_despacho')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('referencia_despacho')">
              <div class="flex items-center gap-1">
                Referencia Despacho
                <svg v-if="sortField === 'referencia_despacho'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('fecha_generacion')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('fecha_generacion')">
              <div class="flex items-center gap-1">
                Fecha Generación
                <svg v-if="sortField === 'fecha_generacion'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('created_at')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('created_at')">
              <div class="flex items-center gap-1">
                Fecha Creación
                <svg v-if="sortField === 'created_at'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('fecha_procesado')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="sortBy('fecha_procesado')">
              <div class="flex items-center gap-1">
                Fecha Procesado
                <svg v-if="sortField === 'fecha_procesado'" class="w-4 h-4" :class="sortDirection === 'asc' ? 'rotate-180' : ''" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </th>
            <th v-if="isColumnVisible('estado')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th v-if="isColumnVisible('numero_oc_sap')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número OC SAP</th>
            <th v-if="isColumnVisible('respuesta_sap')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Respuesta SAP</th>
            <th v-if="!readOnly" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr 
            v-for="oc in sortedOrdenes" 
            :key="oc.oc_id" 
            class="hover:bg-gray-50 transition-colors"
            :class="{ 'bg-emerald-50': isSelected(oc.oc_id) }"
          >
            <td class="px-6 py-4 whitespace-nowrap">
              <input
                type="checkbox"
                :checked="isSelected(oc.oc_id)"
                @change="toggleSelect(oc.oc_id)"
                class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
            </td>
            <td v-if="isColumnVisible('oc_id')" class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
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
            <td v-if="isColumnVisible('proveedor')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ oc.proveedor }}</td>
            <td v-if="isColumnVisible('referencia_despacho')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ oc.referencia_despacho }}</td>
            <td v-if="isColumnVisible('fecha_generacion')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <div>{{ formatDate(oc.fecha_generacion) }}</div>
            </td>
            <td v-if="isColumnVisible('created_at')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <div v-if="oc.created_at" class="space-y-0.5">
                <div>{{ formatDate(oc.created_at) }}</div>
                <div class="text-xs text-gray-500">{{ getTimeAgo(oc.created_at) }}</div>
              </div>
              <span v-else class="text-gray-400 italic">-</span>
            </td>
            <td v-if="isColumnVisible('fecha_procesado')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <div v-if="oc.fecha_procesado" class="space-y-0.5">
                <div>{{ formatDate(oc.fecha_procesado) }}</div>
                <div class="text-xs text-gray-500">{{ getTimeAgo(oc.fecha_procesado) }}</div>
              </div>
              <span v-else class="text-gray-400 italic">-</span>
            </td>
            <td v-if="isColumnVisible('estado')" class="px-6 py-4 whitespace-nowrap">
              <div class="relative group inline-block">
                <span :class="getEstadoClass(oc.estado)" class="cursor-help transition-all duration-200 hover:scale-105">
                {{ oc.estado }}
              </span>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out pointer-events-none whitespace-nowrap z-[9999]">
                  {{ getEstadoTooltip(oc) }}
                  <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div class="border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            </td>
            <td v-if="isColumnVisible('numero_oc_sap')" class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <span v-if="oc.numero_oc_sap" class="font-mono">{{ oc.numero_oc_sap }}</span>
              <span v-else class="text-gray-400 italic">-</span>
            </td>
            <td v-if="isColumnVisible('respuesta_sap')" class="px-6 py-4 text-sm text-gray-900">
              <div v-if="oc.respuesta_sap" class="max-w-xs">
                <div class="flex items-start gap-2">
                  <div class="flex-1">
                    <div class="text-xs font-medium text-gray-700 break-words">{{ oc.respuesta_sap }}</div>
                  </div>
                  <button
                    @click="copyToClipboard(oc.respuesta_sap || '')"
                    class="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    title="Copiar respuesta"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <span v-else class="text-gray-400 italic">-</span>
            </td>
            <td v-if="!readOnly" class="px-6 py-4 whitespace-nowrap text-sm">
              <button 
                v-if="oc.estado === 'PENDIENTE'"
                @click="handleIntegrar(oc.referencia_despacho, oc.oc_id)" 
                class="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                :disabled="loading || sendingOcId === oc.oc_id"
              >
                {{ sendingOcId === oc.oc_id ? 'Enviando...' : 'Enviar' }}
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
import { ref, computed, watch } from 'vue'
import type { OrdenCompra } from '../types'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  ordenesCompra: OrdenCompra[]
  loading?: boolean
  totalOrdenes?: number
  allowDelete?: boolean // Permite mostrar el botón de eliminar
  readOnly?: boolean // Modo solo lectura (oculta acciones de integración)
}>()

const emit = defineEmits<{
  integrar: [referenciaDespacho: string]
  integrarMultiples: [referenciasDespacho: string[]]
  eliminar: [ocIds: string[]]
}>()

const toast = useToast()

// Estado de selección
const selectedOrdenes = ref<string[]>([])
const deleting = ref(false)

// Estado para rastrear qué ODC individual se está enviando
const sendingOcId = ref<string | null>(null)

// Estado para rastrear cuando se están enviando múltiples ODC
const sendingMultiple = ref(false)

// Búsqueda y filtros
const searchQuery = ref('')
const filtroProveedor = ref('')
const filtroFechaDesde = ref('')
const filtroFechaHasta = ref('')
const filtroNumeroOC = ref('')
const showAdvancedFilters = ref(false)
const showColumnSelector = ref(false)

// Configuración de columnas
const STORAGE_KEY = 'ordenes-compra-table-columns'

// Columnas disponibles
const availableColumns = [
  { key: 'oc_id', label: 'OC ID', default: true },
  { key: 'proveedor', label: 'Proveedor', default: true },
  { key: 'referencia_despacho', label: 'Referencia Despacho', default: true },
  { key: 'fecha_generacion', label: 'Fecha Generación', default: true },
  { key: 'created_at', label: 'Fecha Creación', default: props.readOnly || false },
  { key: 'fecha_procesado', label: 'Fecha Procesado', default: props.readOnly || false },
  { key: 'estado', label: 'Estado', default: true },
  { key: 'numero_oc_sap', label: 'Número OC SAP', default: false },
  { key: 'respuesta_sap', label: 'Respuesta SAP', default: props.readOnly || false },
]

// Cargar columnas visibles desde localStorage o usar valores por defecto
function loadVisibleColumns(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (error) {
    console.error('Error al cargar preferencias de columnas:', error)
  }
  
  // Retornar columnas con default: true
  return availableColumns.filter(col => col.default).map(col => col.key)
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

// Watch para guardar cuando cambian las columnas
watch(visibleColumns, () => {
  saveVisibleColumns()
}, { deep: true })

// Computed para contar columnas visibles
const visibleColumnsCount = computed(() => visibleColumns.value.length)

// Funciones de utilidad
function isColumnVisible(key: string): boolean {
  return visibleColumns.value.includes(key)
}

function selectAllColumns() {
  visibleColumns.value = availableColumns.map(col => col.key)
}

function resetColumns() {
  visibleColumns.value = availableColumns.filter(col => col.default).map(col => col.key)
}

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
      (oc.numero_oc_sap && oc.numero_oc_sap.toLowerCase().includes(query)) ||
      (oc.respuesta_sap && oc.respuesta_sap.toLowerCase().includes(query))
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

async function handleIntegrar(referenciaDespacho: string, ocId: string) {
  // Prevenir múltiples clics
  if (sendingOcId.value === ocId || props.loading) {
    return
  }
  
  try {
    sendingOcId.value = ocId
    emit('integrar', referenciaDespacho)
    // El estado se limpiará cuando el componente padre termine la operación
    // Pero como no podemos saber cuándo termina directamente, lo hacemos después de un pequeño delay
    // El componente padre debería manejar la actualización del estado
  } catch (error) {
    sendingOcId.value = null
  }
}

function handleIntegrarSeleccionadas() {
  if (sendingMultiple.value || props.loading) {
    return
  }
  
  const referencias = selectedOrdenes.value
    .map(id => props.ordenesCompra.find(oc => oc.oc_id === id))
    .filter(oc => oc && oc.estado === 'PENDIENTE')
    .map(oc => oc!.referencia_despacho)
  
  if (referencias.length === 0) {
    toast.warning('No hay órdenes pendientes seleccionadas')
    return
  }
  
  sendingMultiple.value = true
  emit('integrarMultiples', referencias)
}

function handleEliminarSeleccionadas() {
  if (selectedOrdenes.value.length === 0) {
    toast.warning('No hay órdenes seleccionadas')
    return
  }
  
  emit('eliminar', [...selectedOrdenes.value])
}

function formatDate(dateString: string): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return dateString
    }
    
    // Obtener componentes de fecha en la zona horaria local (sin hora)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

function getTimeAgo(dateString: string): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Hace menos de un minuto'
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
    if (diffDays < 30) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
    
    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths < 12) return `Hace ${diffMonths} mes${diffMonths > 1 ? 'es' : ''}`
    
    const diffYears = Math.floor(diffDays / 365)
    return `Hace ${diffYears} año${diffYears > 1 ? 's' : ''}`
  } catch {
    return ''
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

function getEstadoTooltip(oc: OrdenCompra): string {
  if (oc.estado === 'PENDIENTE') {
    return 'Lista para enviar a SAP'
  }
  if (oc.estado === 'ENVIADA') {
    return 'Enviada exitosamente a SAP'
  }
  if (oc.estado === 'ERROR') {
    if (oc.error_source?.toUpperCase() === 'SAP' && oc.error_code) {
      // Mensaje específico para errores de SAP
      const errorMessages: Record<string, string> = {
        '401': 'Error de autenticación',
        '403': 'Sin permisos',
        'VALIDATION_ERROR': 'Error de validación',
        'INVALID_CARDCODE': 'Proveedor no existe',
        'INVALID_ITEMCODE': 'Artículo no existe',
        'CONNECTION_ERROR': 'Error de conexión',
        'TIMEOUT': 'Tiempo de espera agotado',
      }
      const friendlyMessage = errorMessages[oc.error_code.toUpperCase()] || `Error ${oc.error_code}`
      return friendlyMessage
    }
    return oc.error_message || 'Error al enviar a SAP'
  }
  return 'Estado desconocido'
}

// Exponer función para limpiar el estado de envío (llamada por el componente padre después de completar)
function clearSendingState() {
  sendingOcId.value = null
}

// Función para limpiar el estado de envío múltiple (llamada por el componente padre después de completar)
function clearSendingMultipleState() {
  sendingMultiple.value = false
}

// Exponer funciones para que el componente padre pueda llamarlas
defineExpose({
  clearSendingState,
  clearSelection,
  clearSendingMultipleState
})
</script>
