<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Historial de Órdenes de Compra</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Consulta y visualiza el historial completo de órdenes de compra</p>
      </div>
      <div class="flex items-center gap-3">
        <select 
          v-model="estadoFilter" 
          @change="handleFilterChange"
          class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="ENVIADA">Enviadas</option>
          <option value="ERROR">Con Error</option>
        </select>
        <button 
          @click="exportData('csv')" 
          class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          :disabled="loadingTodas || todosLosLogs.length === 0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <!-- Hoja de cálculo/Excel -->
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <!-- Líneas de la cuadrícula -->
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 8h10M7 12h10M7 16h10" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 8v8M12 8v8M17 8v8" />
          </svg>
          Exportar CSV
        </button>
        <button 
          @click="refreshOrdenes" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          :disabled="loadingTodas"
        >
          <svg v-if="ordenesCompraStore.loading" class="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ ordenesCompraStore.loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>
    </div>

    <!-- Tabla de Historial -->
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Historial de Órdenes</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Total: <span class="font-semibold">{{ totalFiltradas }}</span> registros
              <span v-if="estadoFilter">
                - Filtrado por: <span class="font-medium">{{ getEstadoLabel(estadoFilter) }}</span>
              </span>
              <span v-else class="text-gray-400 dark:text-gray-500">
                ({{ todosLosLogs.length }} en total)
              </span>
            </p>
          </div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            <span class="text-indigo-600 font-medium">Nota:</span> Para realizar acciones sobre las órdenes, ve a 
            <router-link to="/mba3-consultas/proceso" class="text-indigo-600 hover:text-indigo-700 underline font-medium">
              Procesos de Integración
            </router-link>
          </div>
        </div>
      </div>
      
      <SkeletonTable v-if="loadingTodas && todosLosLogs.length === 0" />

      <div v-else-if="todosLosLogs.length === 0" class="px-6 py-12 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p class="text-gray-500 dark:text-gray-400 text-lg font-medium">No hay órdenes de compra para mostrar</p>
        <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">
          <span v-if="estadoFilter">Intenta cambiar el filtro o </span>
          <button @click="refreshOrdenes" class="text-indigo-600 hover:text-indigo-700 underline">
            actualizar los datos
          </button>
        </p>
      </div>

      <HistorialOrdenesTable 
        v-else
        ref="historialTableRef"
        :ordenes-compra="logsPaginados"
        :loading="loadingTodas"
        :total-ordenes="totalFiltradas"
      />

      <!-- Paginación -->
      <div v-if="totalPagesLocal > 1 && !loadingTodas" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {{ logsPaginados.length }} de {{ totalFiltradas }} registros
            <span v-if="estadoFilter" class="text-gray-500 dark:text-gray-400">
              ({{ todosLosLogs.length }} total)
            </span>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="prevPage"
              :disabled="currentPageLocal === 1 || loadingTodas"
              class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-800"
            >
              Anterior
            </button>
            <span class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg">
              Página {{ currentPageLocal }} de {{ totalPagesLocal }}
            </span>
            <button
              @click="nextPage"
              :disabled="currentPageLocal === totalPagesLocal || loadingTodas"
              class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-900 dark:text-gray-200 bg-white dark:bg-gray-800"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from '@vue/reactivity'
import { onMounted, nextTick } from '@vue/runtime-core'
import { useRoute, useRouter } from 'vue-router'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { useToast } from '@/composables/useToast'
import { useExport } from '../composables/useExport'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import HistorialOrdenesTable from '../components/HistorialOrdenesTable.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import type { OrdenCompraLog } from '../types'

const ordenesCompraStore = useOrdenesCompraStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { exportToCSV, exportToExcel } = useExport()
const estadoFilter = ref<string>('')
const historialTableRef = ref<InstanceType<typeof HistorialOrdenesTable> | null>(null)

// Todos los logs cargados (sin filtro)
const todosLosLogs = ref<OrdenCompraLog[]>([])
const loadingTodas = ref(false)

// Logs filtrados localmente
const logsFiltrados = computed(() => {
  if (!estadoFilter.value) {
    return todosLosLogs.value
  }
  return todosLosLogs.value.filter(log => log.estado === estadoFilter.value)
})

// Total de logs filtrados
const totalFiltradas = computed(() => logsFiltrados.value.length)

// Paginación local
const pageSize = ref(10)
const currentPageLocal = ref(1)
const totalPagesLocal = computed(() => Math.ceil(totalFiltradas.value / pageSize.value))

// Logs paginados
const logsPaginados = computed(() => {
  const start = (currentPageLocal.value - 1) * pageSize.value
  const end = start + pageSize.value
  return logsFiltrados.value.slice(start, end)
})

function getEstadoLabel(estado: string): string {
  const labels: Record<string, string> = {
    'PENDIENTE': 'Pendientes',
    'ENVIADA': 'Enviadas',
    'ERROR': 'Con Error'
  }
  return labels[estado] || estado
}

// Función para cargar todos los logs
async function cargarTodosLosLogs() {
  loadingTodas.value = true
  ordenesCompraStore.loading = true
  try {
    // Cargar logs con paginación grande para obtener todos
    const response = await mba3ConsultasService.getOrdenesCompraLogs(1, 10000)
    
    let logsData: OrdenCompraLog[] = []
    
    // Manejar diferentes formatos de respuesta
    if (Array.isArray(response)) {
      logsData = response
    } else if (response.data && Array.isArray(response.data)) {
      logsData = response.data
    } else if (typeof response === 'object' && response !== null) {
      // Intentar acceder a diferentes propiedades posibles
      const responseAny = response as any
      if (Array.isArray(responseAny.logs)) {
        logsData = responseAny.logs
      } else if (Array.isArray(responseAny.data)) {
        logsData = responseAny.data
      }
    }
    
    // Ordenar por timestamp o fecha (más recientes primero)
    logsData.sort((a, b) => {
      const fechaA = new Date(a.timestamp || a.created_at || a.fecha || '').getTime()
      const fechaB = new Date(b.timestamp || b.created_at || b.fecha || '').getTime()
      return fechaB - fechaA
    })
    
    todosLosLogs.value = logsData
    
    if (import.meta.env.DEV) console.log(`[Historial] Cargados ${logsData.length} logs`)
  } catch (error: any) {
    console.error('Error al cargar los logs:', error)
    toast.error('Error al cargar logs', error.message || 'No se pudieron cargar los logs de órdenes de compra')
  } finally {
    loadingTodas.value = false
    ordenesCompraStore.loading = false
  }
}

// Función para buscar por oc_id
async function buscarPorOcId(ocId: string) {
  // Esperar a que se carguen los logs y el componente esté listo
  await nextTick()
  
  if (historialTableRef.value && historialTableRef.value.setSearchQuery) {
    historialTableRef.value.setSearchQuery(ocId)
    toast.success('Búsqueda realizada', `Buscando orden de compra: ${ocId.substring(0, 8)}...`)
  }
}

// Watch para detectar cambios en el query parameter oc_id
watch(() => route.query.oc_id, async (newOcId) => {
  if (newOcId && typeof newOcId === 'string') {
    // Esperar a que los logs estén cargados
    if (todosLosLogs.value.length === 0) {
      await cargarTodosLosLogs()
    }
    await buscarPorOcId(newOcId)
  }
}, { immediate: true })

onMounted(async () => {
  // Verificar si hay un parámetro de estado en la URL
  const estadoFromQuery = route.query.estado as string | undefined
  if (estadoFromQuery) {
    estadoFilter.value = estadoFromQuery
  }
  
  try {
    await ordenesCompraStore.fetchEstadisticas()
    await cargarTodosLosLogs()
    
    // Si hay un oc_id en el query, buscar después de cargar los logs
    const ocIdFromQuery = route.query.oc_id as string | undefined
    if (ocIdFromQuery) {
      await buscarPorOcId(ocIdFromQuery)
    }
  } catch (error: any) {
    toast.error('Error al cargar logs', error.message || 'No se pudieron cargar los logs de órdenes de compra')
  }
})

function handleFilterChange() {
  // Resetear a página 1 cuando cambia el filtro
  currentPageLocal.value = 1
  
  // Actualizar la URL sin recargar la página
  if (estadoFilter.value) {
    router.replace({ query: { estado: estadoFilter.value } })
  } else {
    router.replace({ query: {} })
  }
}

async function refreshOrdenes() {
  try {
    await ordenesCompraStore.fetchEstadisticas()
    await cargarTodosLosLogs()
    currentPageLocal.value = 1
    toast.success('Lista actualizada', 'Los logs se han actualizado correctamente')
  } catch (error: any) {
    toast.error('Error al actualizar', error.message || 'No se pudo actualizar la lista')
  }
}

function prevPage() {
  if (currentPageLocal.value > 1) {
    currentPageLocal.value--
  }
}

function nextPage() {
  if (currentPageLocal.value < totalPagesLocal.value) {
    currentPageLocal.value++
  }
}

function exportData(format: 'csv' | 'excel') {
  try {
    const logsAExportar = logsFiltrados.value.length > 0 ? logsFiltrados.value : todosLosLogs.value
    
    if (logsAExportar.length === 0) {
      toast.warning('No hay datos', 'No hay logs para exportar')
      return
    }

    const filename = `historial-logs-ordenes-compra${estadoFilter.value ? `-${estadoFilter.value.toLowerCase()}` : ''}`
    
    if (format === 'csv') {
      exportToCSV(logsAExportar as OrdenCompraLog[], filename)
      toast.success('Exportación exitosa', `Se exportaron ${logsAExportar.length} registros en formato CSV`)
    } else {
      exportToExcel(logsAExportar as OrdenCompraLog[], filename)
      toast.success('Exportación exitosa', `Se exportaron ${logsAExportar.length} registros en formato Excel`)
    }
  } catch (error: any) {
    toast.error('Error al exportar', error.message || 'No se pudo exportar los datos')
  }
}
</script>
