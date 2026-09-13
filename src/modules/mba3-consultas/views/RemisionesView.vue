<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Documentos de Remisión</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Consulta y visualiza los documentos de remisión disponibles</p>
      </div>
      <div class="flex items-center flex-wrap gap-3">
        <button
          @click="consultarDesdeMBA3"
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          :disabled="consultandoMBA3 || loading"
        >
          <LoadingSpinner v-if="consultandoMBA3" layout="inline" size="sm" color="current" aria-label="Consultando MBA3" />
          <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ consultandoMBA3 ? 'Consultando...' : 'Consultar desde MBA3' }}
        </button>
        <button 
          @click="cargarRemisiones" 
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          :disabled="loading"
        >
          <LoadingSpinner v-if="loading" layout="inline" size="sm" color="current" aria-label="Cargando remisiones" />
          {{ loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>
    </div>

    <!-- Tabla de Remisiones -->
    <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-2xl dark:shadow-none p-6 border border-white/30 dark:border-gray-700 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none dark:hidden"></div>
      
      <div v-if="loading && remisiones.length === 0" class="space-y-4">
        <LoadingSpinner message="Cargando remisiones..." color="blue" />
        <SkeletonTable />
      </div>

      <RemisionesTable 
        v-else
        :remisiones="remisiones"
        :loading="loading"
        :total-remisiones="totalRemisiones"
        :current-page="currentPage"
        :page-size="pageSize"
        @filtered-count-changed="handleFilteredCountChanged"
      />

      <!-- Paginación -->
      <div v-if="totalPages > 1 && !loading" class="mt-4 flex items-center justify-between flex-wrap gap-4">
        <div class="text-sm text-gray-700 dark:text-gray-300">
          Mostrando página {{ currentPage }} de {{ totalPages }}
          ({{ filteredRemisionesCount > 0 ? filteredRemisionesCount : totalRemisiones }} remisiones{{ filteredRemisionesCount > 0 && filteredRemisionesCount !== totalRemisiones ? ' filtradas' : '' }})
        </div>
        <QuickTablePagination
          :model-value="currentPage"
          :total-pages="totalPages"
          :disabled="loading"
          aria-label="Paginación de remisiones"
          @update:model-value="setRemisionesPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import RemisionesTable from '../components/RemisionesTable.vue'
import SkeletonTable from '../components/SkeletonTable.vue'
import QuickTablePagination from '@/components/paginacion/QuickTablePagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import type { Remision } from '../types'

const toast = useToast()

// Estados
const remisiones = ref<Remision[]>([])
const loading = ref(false)
const consultandoMBA3 = ref(false)
const totalRemisiones = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const filteredRemisionesCount = ref(0)
// Utilidad: normalizar errores HTTP para logging/UX
function parseHttpError(err: any) {
  const status = err?.response?.status ?? err?.status ?? null
  const data = err?.response?.data ?? err?.data ?? null
  const message = data?.message ?? data?.detail ?? err?.message ?? 'Error desconocido'
  return {
    status,
    data,
    message,
    is4xx: typeof status === 'number' && status >= 400 && status < 500,
    is5xx: typeof status === 'number' && status >= 500,
  }
}


// Computed para total de páginas
const totalPages = computed(() => {
  const count = filteredRemisionesCount.value > 0 ? filteredRemisionesCount.value : totalRemisiones.value
  return Math.ceil(count / pageSize.value)
})

// Función para manejar el cambio en el conteo de remisiones filtradas
function handleFilteredCountChanged(count: number) {
  filteredRemisionesCount.value = count
  // Resetear a la primera página si estamos en una página que ya no existe
  const totalPagesCalc = Math.ceil(count / pageSize.value)
  if (currentPage.value > totalPagesCalc && totalPagesCalc > 0) {
    currentPage.value = 1
  }
}

function setRemisionesPage(page: number) {
  currentPage.value = page
  cargarRemisiones()
}

// Función para cargar remisiones
async function cargarRemisiones() {
  loading.value = true
  try {
    const response = await mba3ConsultasService.getRemisiones(currentPage.value, pageSize.value)
    remisiones.value = response.data || []
    totalRemisiones.value = response.total || response.metadata?.count || remisiones.value.length
    filteredRemisionesCount.value = 0
  } catch (error: any) {
    const { status, message, is4xx, data } = parseHttpError(error)
    if (is4xx) {
      console.warn('Validación al cargar remisiones (4xx):', status, message, data)
      toast.warning('Error al cargar remisiones', message || 'Solicitud inválida')
    } else {
      console.error('Error al cargar remisiones (sistema):', status, message, error)
      toast.error('Error al cargar remisiones', message || 'Error interno. Intenta más tarde.')
    }
    remisiones.value = []
    filteredRemisionesCount.value = 0
  } finally {
    loading.value = false
  }
}

// Función para consultar remisiones desde MBA3
async function consultarDesdeMBA3() {
  consultandoMBA3.value = true
  try {
    toast.info('Consultando desde MBA3...', 'Obteniendo remisiones desde MBA3 y guardándolas en la base de datos')
    
    const response = await mba3ConsultasService.consultarRemisionesDesdeMBA3()
    
    // Mostrar resultado
    if (response.metadata?.save_status) {
      const status = response.metadata.save_status
      toast.success(
        'Consulta completada',
        `${status.facturas_guardadas || 0} guardadas, ${status.facturas_actualizadas || 0} actualizadas`
      )
    } else {
      toast.success('Consulta completada', 'Las remisiones se han consultado exitosamente desde MBA3')
    }
    
    // Recargar la lista para mostrar los nuevos datos
    currentPage.value = 1
    await cargarRemisiones()
  } catch (error: any) {
    const { status, message, is4xx, data } = parseHttpError(error)
    if (is4xx) {
      console.warn('Validación al consultar desde MBA3 (4xx):', status, message, data)
      toast.warning('Error al consultar desde MBA3', message || 'Solicitud inválida')
    } else {
      console.error('Error al consultar remisiones desde MBA3 (sistema):', status, message, error)
      toast.error('Error al consultar desde MBA3', message || 'Error interno. Intenta más tarde.')
    }
  } finally {
    consultandoMBA3.value = false
  }
}

// Cargar remisiones al montar el componente
onMounted(() => {
  cargarRemisiones()
})
</script>

