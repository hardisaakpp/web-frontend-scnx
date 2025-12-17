<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Homologaciones de SKU</h1>
        <p class="mt-1 text-sm text-gray-500">
          Administra las homologaciones de SKU que no coinciden entre MBA3 y SAP
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="sincronizarHomologaciones"
          :disabled="store.loading"
          class="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
        >
          <svg v-if="store.loading" class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sincronizar
        </button>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total</p>
            <p class="text-2xl font-bold text-gray-900">{{ store.total }}</p>
          </div>
          <svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Pendientes</p>
            <p class="text-2xl font-bold text-gray-900">{{ store.estadisticas.total_pendientes }}</p>
          </div>
          <svg class="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Homologados</p>
            <p class="text-2xl font-bold text-gray-900">{{ store.estadisticas.total_homologados }}</p>
          </div>
          <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Errores</p>
            <p class="text-2xl font-bold text-gray-900">{{ store.estadisticas.total_errores }}</p>
          </div>
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Búsqueda por SKU -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Buscar SKU</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="skuSearch"
              type="text"
              placeholder="Buscar por SKU..."
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
              @input="handleSkuSearch"
            />
          </div>
        </div>

        <!-- Filtro por estado -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            v-model="estadoFilter"
            @change="handleEstadoFilter"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
          >
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="HOMOLOGADO">Homologado</option>
            <option value="ERROR">Error</option>
          </select>
        </div>

        <!-- Filtro por diferencias -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tiene Diferencias</label>
          <select
            v-model="tieneDiferenciasFilter"
            @change="handleTieneDiferenciasFilter"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
          >
            <option :value="null">Todos</option>
            <option :value="true">Sí</option>
            <option :value="false">No</option>
          </select>
        </div>

        <!-- Filtro por datos SAP -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tiene Datos SAP</label>
          <select
            v-model="tieneDatosSapFilter"
            @change="handleTieneDatosSapFilter"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
          >
            <option :value="null">Todos</option>
            <option :value="true">Sí</option>
            <option :value="false">No</option>
          </select>
        </div>
      </div>

      <!-- Opciones adicionales -->
      <div class="mt-4 flex items-center justify-between">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="mostrarHomologados"
            type="checkbox"
            @change="handleMostrarHomologados"
            class="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
          />
          <span class="text-sm text-gray-700">Mostrar homologados</span>
        </label>
        <button
          @click="limpiarFiltros"
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- Tabla de homologaciones -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div v-if="store.loading" class="text-center py-12">
        <svg class="animate-spin h-8 w-8 text-violet-600 mx-auto" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-gray-500">Cargando homologaciones...</p>
      </div>

      <div v-else-if="store.error" class="text-center py-12">
        <p class="text-red-600">{{ store.error }}</p>
        <button @click="cargarHomologaciones" class="mt-4 text-violet-600 hover:underline">Reintentar</button>
      </div>

      <div v-else-if="store.filteredHomologaciones.length === 0" class="text-center py-12">
        <svg class="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-4 text-gray-500">No se encontraron homologaciones</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div class="flex items-center gap-2">
                  <span class="text-blue-600">MBA3</span>
                  <span class="text-gray-400">vs</span>
                  <span class="text-green-600">SAP</span>
                </div>
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="homologacion in paginatedHomologaciones"
              :key="homologacion.homologacion_id || homologacion.sku_mba3"
              class="hover:bg-gray-50"
              :class="{
                'bg-yellow-50': homologacion.estado === 'PENDIENTE',
                'bg-green-50': homologacion.estado === 'HOMOLOGADO',
                'bg-red-50': homologacion.estado === 'ERROR',
              }"
            >
              <!-- SKU -->
              <td class="px-4 py-4 whitespace-nowrap">
                <div class="text-sm font-mono font-medium text-gray-900">
                  {{ homologacion.sku_mba3 }}
                </div>
                <div v-if="homologacion.sku_sap && homologacion.sku_sap !== homologacion.sku_mba3" class="text-xs text-gray-500 mt-1">
                  SAP: {{ homologacion.sku_sap }}
                </div>
              </td>

              <!-- Producto -->
              <td class="px-4 py-4">
                <div class="text-sm text-gray-900">
                  {{ homologacion.nombre_producto_mba3 }}
                </div>
                <div v-if="homologacion.nombre_producto_sap && homologacion.nombre_producto_sap !== homologacion.nombre_producto_mba3" class="text-xs text-gray-500 mt-1">
                  SAP: {{ homologacion.nombre_producto_sap }}
                </div>
              </td>

              <!-- Comparación MBA3 vs SAP -->
              <td class="px-4 py-4">
                <div class="space-y-2">
                  <!-- Precio Unitario -->
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500 w-24">Precio:</span>
                    <span class="text-xs font-medium text-blue-600">
                      {{ formatCurrency(homologacion.precio_unitario_mba3) }}
                    </span>
                    <span class="text-xs text-gray-400">→</span>
                    <span
                      class="text-xs font-medium"
                      :class="getComparisonClass(homologacion.precio_unitario_mba3, homologacion.precio_unitario_sap)"
                    >
                      {{ formatCurrency(homologacion.precio_unitario_sap) }}
                    </span>
                  </div>

                  <!-- Cantidad -->
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500 w-24">Cantidad:</span>
                    <span class="text-xs font-medium text-blue-600">
                      {{ homologacion.cantidad_docena_mba3 }} doc
                    </span>
                    <span class="text-xs text-gray-400">→</span>
                    <span
                      class="text-xs font-medium"
                      :class="getComparisonClass(homologacion.cantidad_docena_mba3, homologacion.cantidad_pack_sap)"
                    >
                      {{ homologacion.cantidad_pack_sap || '-' }} {{ homologacion.unidad_sap || '' }}
                    </span>
                  </div>

                  <!-- Total -->
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500 w-24">Total:</span>
                    <span class="text-xs font-medium text-blue-600">
                      {{ formatCurrency(homologacion.total_linea_mba3) }}
                    </span>
                    <span class="text-xs text-gray-400">→</span>
                    <span
                      class="text-xs font-medium"
                      :class="getComparisonClass(homologacion.total_linea_mba3, homologacion.subtotal_sap)"
                    >
                      {{ formatCurrency(homologacion.subtotal_sap) }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Estado -->
              <td class="px-4 py-4 whitespace-nowrap">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="getEstadoClass(homologacion.estado)"
                >
                  {{ getEstadoLabel(homologacion.estado) }}
                </span>
                <div v-if="homologacion.tiene_diferencias" class="mt-1">
                  <span class="text-xs text-orange-600">⚠ Diferencias</span>
                </div>
                <div v-if="!homologacion.tiene_datos_sap" class="mt-1">
                  <span class="text-xs text-red-600">⚠ Sin datos SAP</span>
                </div>
              </td>

              <!-- Acciones -->
              <td class="px-4 py-4 whitespace-nowrap text-sm">
                <button
                  @click="abrirModalEdicion(homologacion)"
                  class="text-violet-600 hover:text-violet-900 hover:underline font-medium"
                >
                  Editar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="store.totalPages > 1" class="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="cambiarPagina(store.currentPage - 1)"
            :disabled="store.currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            @click="cambiarPagina(store.currentPage + 1)"
            :disabled="store.currentPage >= store.totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Mostrando
              <span class="font-medium">{{ (store.currentPage - 1) * store.pageSize + 1 }}</span>
              a
              <span class="font-medium">{{ Math.min(store.currentPage * store.pageSize, store.total) }}</span>
              de
              <span class="font-medium">{{ store.total }}</span>
              resultados
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                @click="cambiarPagina(store.currentPage - 1)"
                :disabled="store.currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Anterior</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              <span
                v-for="page in visiblePages"
                :key="page"
                @click="cambiarPagina(page)"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium cursor-pointer"
                :class="page === store.currentPage
                  ? 'z-10 bg-violet-50 border-violet-500 text-violet-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50'"
              >
                {{ page }}
              </span>
              <button
                @click="cambiarPagina(store.currentPage + 1)"
                :disabled="store.currentPage >= store.totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Siguiente</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de edición -->
    <HomologacionModal
      :is-open="modalAbierto"
      :homologacion="homologacionSeleccionada"
      :loading="guardando"
      @close="cerrarModal"
      @submit="guardarHomologacion"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useHomologacionesStore } from '../stores/homologacionesStore'
import { useToast } from '@/composables/useToast'
import HomologacionModal from '../components/HomologacionModal.vue'
import type { SkuHomologacion, SkuHomologacionUpdateRequest } from '../types'

const route = useRoute()
const store = useHomologacionesStore()
const toast = useToast()

// Estado local
const skuSearch = ref('')
const estadoFilter = ref('')
const tieneDiferenciasFilter = ref<boolean | null>(null)
const tieneDatosSapFilter = ref<boolean | null>(null)
const mostrarHomologados = ref(false) // Por defecto no mostrar homologados
const modalAbierto = ref(false)
const homologacionSeleccionada = ref<SkuHomologacion | null>(null)
const guardando = ref(false)

// Computed - Los datos ya vienen paginados del servidor, pero filtramos localmente los homologados
const paginatedHomologaciones = computed(() => {
  // Si hay un filtro de estado específico seleccionado, respetarlo (el backend ya filtró)
  if (estadoFilter.value) {
    return store.homologaciones
  }
  
  // Si no hay filtro de estado y el checkbox está desmarcado, excluir homologados
  if (!mostrarHomologados.value) {
    return store.homologaciones.filter(h => h.estado !== 'HOMOLOGADO')
  }
  
  // Si el checkbox está marcado, mostrar todos
  return store.homologaciones
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = store.totalPages
  const current = store.currentPage
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push(-1) // Separador
      pages.push(total)
    } else if (current >= total - 2) {
      pages.push(1)
      pages.push(-1) // Separador
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      pages.push(-1) // Separador
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push(-1) // Separador
      pages.push(total)
    }
  }
  
  return pages.filter(p => p !== -1)
})

// Métodos
async function cargarHomologaciones() {
  try {
    await store.fetchHomologaciones(store.currentPage)
  } catch (error: any) {
    toast.error('Error al cargar homologaciones', error.message)
  }
}

function handleSkuSearch() {
  store.setSkuSearchFilter(skuSearch.value)
  store.currentPage = 1
  cargarHomologaciones()
}

function handleEstadoFilter() {
  // Si el filtro de estado está vacío y no queremos mostrar homologados, excluirlos
  aplicarFiltroEstado()
  store.currentPage = 1
  cargarHomologaciones()
}

function handleMostrarHomologados() {
  // Cuando cambia el checkbox, aplicar el filtro de estado
  aplicarFiltroEstado()
  store.currentPage = 1
  cargarHomologaciones()
}

function aplicarFiltroEstado() {
  // Si el usuario seleccionó un estado específico en el dropdown, usar ese
  if (estadoFilter.value) {
    store.setEstadoFilter(estadoFilter.value)
  } else {
    // Si no hay filtro específico, dejar vacío (el filtrado local se encargará)
    store.setEstadoFilter('')
  }
}

function handleTieneDiferenciasFilter() {
  store.setTieneDiferenciasFilter(tieneDiferenciasFilter.value)
  store.currentPage = 1
  cargarHomologaciones()
}

function handleTieneDatosSapFilter() {
  store.setTieneDatosSapFilter(tieneDatosSapFilter.value)
  store.currentPage = 1
  cargarHomologaciones()
}

function limpiarFiltros() {
  skuSearch.value = ''
  estadoFilter.value = ''
  tieneDiferenciasFilter.value = null
  tieneDatosSapFilter.value = null
  mostrarHomologados.value = false // Resetear a no mostrar homologados
  store.clearFilters()
  aplicarFiltroEstado()
  store.currentPage = 1
  cargarHomologaciones()
}

function cambiarPagina(page: number) {
  if (page >= 1 && page <= store.totalPages) {
    store.currentPage = page
    cargarHomologaciones()
  }
}

function abrirModalEdicion(homologacion: SkuHomologacion) {
  homologacionSeleccionada.value = homologacion
  modalAbierto.value = true
}

function cerrarModal() {
  modalAbierto.value = false
  homologacionSeleccionada.value = null
}

async function guardarHomologacion(data: SkuHomologacionUpdateRequest) {
  if (!homologacionSeleccionada.value?.homologacion_id) {
    toast.error('Error', 'No se pudo identificar la homologación')
    return
  }

  guardando.value = true
  try {
    await store.updateHomologacion(homologacionSeleccionada.value.homologacion_id, data)
    toast.success('Homologación actualizada', 'Los cambios se han guardado correctamente')
    cerrarModal()
  } catch (error: any) {
    toast.error('Error al guardar', error.message)
  } finally {
    guardando.value = false
  }
}

async function sincronizarHomologaciones() {
  try {
    toast.info('Sincronizando...', 'Buscando SKUs no coincidentes')
    await store.sincronizarHomologaciones()
    toast.success('Sincronización completada', 'Las homologaciones se han actualizado')
  } catch (error: any) {
    toast.error('Error al sincronizar', error.message)
  }
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(value)
}

function getComparisonClass(mba3Value: number | null | undefined, sapValue: number | null | undefined): string {
  if (sapValue === null || sapValue === undefined) return 'text-red-600'
  if (mba3Value === null || mba3Value === undefined) return 'text-green-600'
  if (Math.abs(mba3Value - sapValue) < 0.01) return 'text-green-600'
  return 'text-orange-600'
}

function getEstadoClass(estado: string): string {
  switch (estado) {
    case 'PENDIENTE':
      return 'bg-yellow-100 text-yellow-800'
    case 'HOMOLOGADO':
      return 'bg-green-100 text-green-800'
    case 'ERROR':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getEstadoLabel(estado: string): string {
  switch (estado) {
    case 'PENDIENTE':
      return 'Pendiente'
    case 'HOMOLOGADO':
      return 'Homologado'
    case 'ERROR':
      return 'Error'
    default:
      return estado
  }
}

// Cargar datos al montar
onMounted(() => {
  // Verificar si hay parámetros de query (sku o despacho_id) para aplicar filtros automáticamente
  const querySku = route.query.sku as string | undefined
  const queryDespachoId = route.query.despacho_id as string | undefined
  
  if (querySku) {
    // Si hay un SKU en los query params, aplicarlo al filtro de búsqueda
    skuSearch.value = querySku
    store.setSkuSearchFilter(querySku)
    toast.info('Filtro aplicado', `Mostrando homologaciones para SKU: ${querySku}`)
  }
  
  if (queryDespachoId) {
    // Si hay un despacho_id, podríamos filtrar por él (aunque el backend no lo soporta aún)
    // Por ahora solo mostramos un mensaje informativo
    toast.info('Despacho seleccionado', `Despacho ID: ${queryDespachoId}`)
  }
  
  aplicarFiltroEstado()
  cargarHomologaciones()
})
</script>

