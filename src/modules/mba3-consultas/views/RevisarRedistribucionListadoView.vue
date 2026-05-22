<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header: fila título + fila de acciones (mismo patrón que pedidos / redistribución listado) -->
      <div class="space-y-4">
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
        </div>
        <div class="flex w-full flex-wrap items-center justify-end gap-3">
          <button
            @click="cargarPedidos"
            class="shrink-0 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            :disabled="loading"
          >
            <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <LoadingSpinner v-else layout="inline" size="md" color="current" aria-label="Cargando pedidos" />
            {{ loading ? 'Cargando...' : 'Actualizar' }}
          </button>
          <OdcSapVolverButton
            v-if="odcSapVolverTarget"
            :to="odcSapVolverTarget"
            :title="odcSapVolverTitle"
            class="shrink-0"
          />
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div
          @click="filtrosColapsados = !filtrosColapsados"
          class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Filtros de Búsqueda</h2>
            <svg
              :class="['w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200', filtrosColapsados ? '' : 'rotate-180']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div v-show="!filtrosColapsados" class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estados incluidos</label>
              <!-- Estados incluidos: flujo de redistribución en adelante (usa flag solo_redistribucion en backend) -->
              <div class="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-600 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs leading-snug">
                Esta vista muestra pedidos del flujo de redistribución en adelante
                (incluye Confirmado, Confirmado y Enviado, Despachar y Facturar, Finalizado, etc., excluye borradores y cancelados).
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha Desde</label>
              <input
                type="date"
                v-model="filtros.fecha_desde"
                @keyup.enter="aplicarFiltros"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha Hasta</label>
              <input
                type="date"
                v-model="filtros.fecha_hasta"
                @keyup.enter="aplicarFiltros"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proveedor</label>
              <input
                type="text"
                v-model="filtros.proveedor_nombre"
                @keyup.enter="aplicarFiltros"
                placeholder="Buscar por nombre de proveedor..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Número de Pedido</label>
              <input
                type="text"
                v-model="filtros.numero_pedido"
                @keyup.enter="aplicarFiltros"
                placeholder="Buscar por número de pedido..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Creado Por</label>
              <input
                type="text"
                v-model="filtros.creado_por"
                @keyup.enter="aplicarFiltros"
                placeholder="Buscar por usuario creador..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 text-sm"
              />
            </div>
            <div class="flex items-end gap-2">
              <button
                @click="aplicarFiltros"
                class="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-medium"
              >
                Buscar
              </button>
              <button
                @click="limpiarFiltros"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 text-sm font-medium"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

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
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">#</th>
                  <th @click="toggleSort('numero_pedido')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Número de Pedido
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'numero_pedido' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'numero_pedido' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('fecha_pedido')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Fecha
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'fecha_pedido' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'fecha_pedido' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('proveedor_nombre')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Proveedor
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'proveedor_nombre' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'proveedor_nombre' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('estado')" class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center justify-center gap-1">Estado
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'estado' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'estado' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('comprador_nombre')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Comprador
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'comprador_nombre' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'comprador_nombre' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('creado_en')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Fecha Creación
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'creado_en' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'creado_en' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('modificado_fecha')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Fecha Modificación
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'modificado_fecha' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'modificado_fecha' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                  <th @click="toggleSort('modificado_por')" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <div class="flex items-center gap-1">Modificado Por
                      <span class="inline-flex flex-col leading-none text-gray-400 dark:text-gray-500">
                        <svg :class="['w-3 h-3 -mb-0.5', sortColumn === 'modificado_por' && sortDirection === 'asc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14l5-5 5 5z"/></svg>
                        <svg :class="['w-3 h-3 -mt-0.5', sortColumn === 'modificado_por' && sortDirection === 'desc' ? 'text-indigo-600 dark:text-indigo-400' : '']" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="(pedido, index) in sortedPedidos"
                  :key="pedido.pedido_id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                  @click="abrirRevisar(pedido)"
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
                    <div class="flex items-center gap-2">
                      <span>{{ pedido.proveedor_nombre || '-' }}</span>
                      <span v-if="esProveedorElRayo(pedido.proveedor_nombre)" class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" title="Proveedor: El Rayo">
                        EL RAYO
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span :class="getEstadoBadgeClass(pedido.estado)">{{ getEstadoLabel(pedido.estado) }}</span>
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
                v-model="redistListCurrentPage"
                :total-pages="redistListTotalPages"
                :disabled="loading"
                aria-label="Paginación de pedidos en revisión"
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
import { onMounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { lastNotification } from '@/composables/useNotificaciones'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type {
  PedidoResumido,
  PedidosListadoFiltros,
  PedidosListadoMetadata,
  PedidoCompleto,
} from '../types'
import { formatDate, formatDateTime } from '../utils/formatters'
import OdcSapVolverButton from '../components/OdcSapVolverButton.vue'
import QuickTablePagination from '../components/QuickTablePagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useOdcSapVolver } from '../../../composables/useOdcSapVolver'

const router = useRouter()
const { target: odcSapVolverTarget, title: odcSapVolverTitle } = useOdcSapVolver()
const toast = useToast()

const pedidos = ref<PedidoResumido[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const PAGE_SIZE = 10
const metadata = ref<PedidosListadoMetadata>({
  total: 0,
  limit: PAGE_SIZE,
  offset: 0,
  has_more: false
})

const redistListTotalPages = computed(() =>
  metadata.value.total > 0 ? Math.max(1, Math.ceil(metadata.value.total / metadata.value.limit)) : 1
)

const redistListCurrentPage = computed({
  get() {
    if (metadata.value.limit <= 0) return 1
    return Math.floor(metadata.value.offset / metadata.value.limit) + 1
  },
  set(p: number) {
    const limit = metadata.value.limit
    const max = redistListTotalPages.value
    const n = Math.min(max, Math.max(1, Math.round(p)))
    cambiarPagina((n - 1) * limit)
  }
})

const filtrosColapsados = ref(true)
const pedidosColapsados = ref(false)

// Ordenamiento de columnas
type SortDirection = 'asc' | 'desc' | null
const sortColumn = ref<string | null>(null)
const sortDirection = ref<SortDirection>(null)

const filtros = ref<PedidosListadoFiltros>({
  estado: '',
  fecha_desde: '',
  fecha_hasta: '',
  proveedor_nombre: '',
  numero_pedido: '',
  creado_por: '',
  solo_redistribucion: true,
  limit: PAGE_SIZE,
  offset: 0
})

function getEstadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    'BORRADOR': 'Borrador',
    'NUEVO PEDIDO': 'Nuevo Pedido',
    'NUEVO_PEDIDO': 'Nuevo Pedido',
    'GESTIONAR PEDIDO': 'Gestionar Pedido',
    'GESTIONAR_PEDIDO': 'Gestionar Pedido',
    'REDISTRIBUCION': 'Redistribución',
    'PENDIENTE_CONFIRMACION_PROVEEDOR': 'Pendiente Confirmación',
    'RESPUESTA_PROVEEDOR_CARGADA': 'Respuesta Cargada',
    'CONFIRMADO_PROVEEDOR': 'Confirmado Proveedor',
    'CONFIRMADO': 'Confirmado',
    'CONFIRMADO REDISTRIBUCION': 'Confirmado redistribución',
    'PEDIDO_CONFIRMADO': 'Pedido Confirmado',
    'PROCESADO_SAP': 'Procesado SAP',
    'ORDEN_COMPRA_CREADA': 'OC Creada',
    'ENVIADA_SAP': 'Enviada SAP',
    'CONFIRMADO_ENVIADO': 'Confirmado y Enviado',
    'CONFIRMADO Y ENVIADO': 'Confirmado y Enviado',
    'CONFIRMADO_Y_ENVIADO': 'Confirmado y Enviado',
    'ENVIADA': 'Confirmado y Enviado',
    'DESPACHAR Y FACTURAR': 'Despachar y Facturar',
    'DESPACHAR_Y_FACTURAR': 'Despachar y Facturar',
    'FINALIZADO': 'Finalizado',
    'CERRADO': 'Cerrado',
    'CANCELADO': 'Cancelado',
    'CANCELADO POR EL RAYO': 'Cancelado por El Rayo',
    'CANCELADO_POR_EL_RAYO': 'Cancelado por El Rayo',
    'CONFIRMADO POR EL RAYO': 'Confirmado por El Rayo',
    'CONFIRMADO_POR_EL_RAYO': 'Confirmado por El Rayo'
  }
  return labels[estado] || estado
}

function getEstadoBadgeClass(estado: string): string {
  const baseClasses = 'px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300'
  const darkClasses = 'dark:bg-opacity-30'
  const classes: Record<string, string> = {
    'BORRADOR': `bg-slate-100 text-slate-800 ${darkClasses} dark:bg-slate-700 dark:text-slate-200`,
    'NUEVO PEDIDO': `bg-sky-100 text-sky-800 ${darkClasses} dark:bg-sky-900/50 dark:text-sky-200`,
    'NUEVO_PEDIDO': `bg-sky-100 text-sky-800 ${darkClasses} dark:bg-sky-900/50 dark:text-sky-200`,
    'GESTIONAR PEDIDO': `bg-amber-100 text-amber-800 ${darkClasses} dark:bg-amber-900/50 dark:text-amber-200`,
    'GESTIONAR_PEDIDO': `bg-amber-100 text-amber-800 ${darkClasses} dark:bg-amber-900/50 dark:text-amber-200`,
    'REDISTRIBUCION': `bg-violet-100 text-violet-800 ${darkClasses} dark:bg-violet-900/50 dark:text-violet-200`,
    'PENDIENTE_CONFIRMACION_PROVEEDOR': `bg-yellow-100 text-yellow-800 ${darkClasses} dark:bg-yellow-900/50 dark:text-yellow-200`,
    'RESPUESTA_PROVEEDOR_CARGADA': `bg-blue-100 text-blue-800 ${darkClasses} dark:bg-blue-900/50 dark:text-blue-200`,
    'CONFIRMADO_PROVEEDOR': `bg-green-100 text-green-800 ${darkClasses} dark:bg-green-900/50 dark:text-green-200`,
    'CONFIRMADO': `bg-green-100 text-green-800 ${darkClasses} dark:bg-green-900/50 dark:text-green-200`,
    'CONFIRMADO REDISTRIBUCION': `bg-teal-100 text-teal-800 ${darkClasses} dark:bg-teal-900/50 dark:text-teal-200`,
    'PEDIDO_CONFIRMADO': `bg-cyan-100 text-cyan-800 ${darkClasses} dark:bg-cyan-900/50 dark:text-cyan-200`,
    'PROCESADO_SAP': `bg-indigo-100 text-indigo-800 ${darkClasses} dark:bg-indigo-900/50 dark:text-indigo-200`,
    'ORDEN_COMPRA_CREADA': `bg-fuchsia-100 text-fuchsia-800 ${darkClasses} dark:bg-fuchsia-900/50 dark:text-fuchsia-200`,
    'ENVIADA_SAP': `bg-purple-100 text-purple-800 ${darkClasses} dark:bg-purple-900/50 dark:text-purple-200`,
    'CONFIRMADO_ENVIADO': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'CONFIRMADO Y ENVIADO': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'CONFIRMADO_Y_ENVIADO': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'Confirmado y Enviado': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'ENVIADA': `bg-emerald-100 text-emerald-800 ${darkClasses} dark:bg-emerald-900/50 dark:text-emerald-200`,
    'DESPACHAR Y FACTURAR': `bg-orange-100 text-orange-800 ${darkClasses} dark:bg-orange-900/50 dark:text-orange-200`,
    'DESPACHAR_Y_FACTURAR': `bg-orange-100 text-orange-800 ${darkClasses} dark:bg-orange-900/50 dark:text-orange-200`,
    'FINALIZADO': `bg-lime-100 text-lime-800 ${darkClasses} dark:bg-lime-900/50 dark:text-lime-200`,
    'CERRADO': `bg-stone-100 text-stone-700 ${darkClasses} dark:bg-stone-600 dark:text-stone-200`,
    'CANCELADO': `bg-rose-100 text-rose-800 ${darkClasses} dark:bg-rose-900/50 dark:text-rose-200`,
    'CANCELADO POR EL RAYO': `bg-rose-100 text-rose-800 ${darkClasses} dark:bg-rose-900/50 dark:text-rose-200`,
    'CANCELADO_POR_EL_RAYO': `bg-rose-100 text-rose-800 ${darkClasses} dark:bg-rose-900/50 dark:text-rose-200`,
    'CONFIRMADO POR EL RAYO': `bg-pink-100 text-pink-800 ${darkClasses} dark:bg-pink-900/50 dark:text-pink-200`,
    'CONFIRMADO_POR_EL_RAYO': `bg-pink-100 text-pink-800 ${darkClasses} dark:bg-pink-900/50 dark:text-pink-200`
  }
  return `${baseClasses} ${classes[estado] || `bg-gray-100 text-gray-800 ${darkClasses} dark:bg-gray-700 dark:text-gray-200`}`
}

function esProveedorElRayo(proveedorNombre: string | null | undefined): boolean {
  if (!proveedorNombre) return false
  const nombreUpper = proveedorNombre.toUpperCase()
  return nombreUpper.includes('EL RAYO') || nombreUpper.includes('RAYO')
}

// Función para alternar el ordenamiento de una columna
function toggleSort(column: string) {
  if (sortColumn.value === column) {
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else if (sortDirection.value === 'desc') {
      sortColumn.value = null
      sortDirection.value = null
    }
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

// Columnas de tipo fecha para ordenar correctamente
const dateColumns = ['fecha_pedido', 'creado_en', 'modificado_fecha']

// Pedidos ordenados (computed)
const sortedPedidos = computed(() => {
  if (!sortColumn.value || !sortDirection.value) {
    return pedidos.value
  }

  const col = sortColumn.value
  const dir = sortDirection.value
  const isDate = dateColumns.includes(col)

  return [...pedidos.value].sort((a: any, b: any) => {
    let valA = a[col]
    let valB = b[col]

    if (valA == null && valB == null) return 0
    if (valA == null) return dir === 'asc' ? 1 : -1
    if (valB == null) return dir === 'asc' ? -1 : 1

    if (isDate) {
      const dateA = new Date(valA).getTime()
      const dateB = new Date(valB).getTime()
      return dir === 'asc' ? dateA - dateB : dateB - dateA
    }

    const strA = String(valA).toLowerCase()
    const strB = String(valB).toLowerCase()
    if (strA < strB) return dir === 'asc' ? -1 : 1
    if (strA > strB) return dir === 'asc' ? 1 : -1
    return 0
  })
})

async function cargarPedidos() {
  loading.value = true
  error.value = null
  try {
    // Usar listado de pedidos confirmados (>= 10 y no cancelados) del backend
    const page = Math.floor(metadata.value.offset / metadata.value.limit) + 1
    const response = await mba3ConsultasService.getPedidosConfirmados({
      page,
      pageSize: metadata.value.limit,
      fecha_desde: filtros.value.fecha_desde || undefined,
      fecha_hasta: filtros.value.fecha_hasta || undefined,
      proveedor_nombre: filtros.value.proveedor_nombre || undefined,
      numero_pedido: filtros.value.numero_pedido || undefined,
      creado_por: filtros.value.creado_por || undefined,
    })

    // Mapear PedidoCompleto → PedidoResumido para reutilizar la tabla actual
    pedidos.value = (response.data || []).map((p: PedidoCompleto): PedidoResumido => {
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
    })

    metadata.value = {
      total: response.total || pedidos.value.length,
      limit: response.pageSize || metadata.value.limit,
      offset: ((response.page || 1) - 1) * (response.pageSize || metadata.value.limit),
      has_more: (response.page || 1) < (response.totalPages || 1),
    }
  } catch (e: any) {
    console.error('Error al cargar pedidos:', e)
    error.value = e.message || 'No se pudieron cargar los pedidos'
    toast.error('Error', error.value ?? undefined)
  } finally {
    loading.value = false
  }
}

function aplicarFiltros() {
  metadata.value.offset = 0
  filtros.value.offset = 0
  cargarPedidos()
}

function limpiarFiltros() {
  filtros.value = {
    estado: '',
    fecha_desde: '',
    fecha_hasta: '',
    proveedor_nombre: '',
    numero_pedido: '',
    creado_por: '',
    solo_redistribucion: true,
    limit: PAGE_SIZE,
    offset: 0
  }
  metadata.value.offset = 0
  cargarPedidos()
}

function cambiarPagina(nuevoOffset: number) {
  metadata.value.offset = nuevoOffset
  filtros.value.offset = nuevoOffset
  cargarPedidos()
}

/** Navega a la vista de Redistribución del pedido en modo solo lectura */
function abrirRevisar(pedido: PedidoResumido) {
  router.push({
    name: 'mba3-consultas-pedido-redistribucion',
    params: { id: encodeURIComponent(pedido.numero_pedido) },
    query: { soloLectura: '1' }
  })
}

onMounted(() => {
  cargarPedidos()
})

// ⭐ Watch para recargar lista cuando llega una notificación SSE relevante
// (ej: ODC enviada a SAP, pedido confirmado, cancelado, etc.)
watch(lastNotification, (notification) => {
  if (!notification) return
  if (import.meta.env.DEV) {
    console.log('🔄 [RevisarRedistribucionListadoView] Notificación SSE recibida, recargando lista...', notification.metadata?.accion)
  }
  cargarPedidos()
})
</script>
