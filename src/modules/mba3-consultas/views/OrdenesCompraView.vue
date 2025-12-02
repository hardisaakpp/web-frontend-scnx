<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Órdenes de Compra</h1>
        <p class="mt-1 text-sm text-gray-500">Gestiona y envía órdenes de compra a SAP</p>
      </div>
      <div class="flex items-center gap-3">
        <select 
          v-model="estadoFilter" 
          @change="handleFilterChange"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="ENVIADA">Enviadas</option>
          <option value="ERROR">Con Error</option>
        </select>
        <button 
          @click="refreshOrdenes" 
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          :disabled="ordenesCompraStore.loading"
        >
          <svg v-if="ordenesCompraStore.loading" class="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ ordenesCompraStore.loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>
    </div>

    <SkeletonTable v-if="ordenesCompraStore.loading && ordenesCompraStore.ordenesCompra.length === 0" />

    <OrdenCompraTable 
      v-else
      :ordenes-compra="ordenesCompraStore.ordenesCompra"
      :loading="ordenesCompraStore.loading"
      :total-ordenes="ordenesCompraStore.total"
      @integrar="handleIntegrar"
      @integrar-multiples="handleIntegrarMultiples"
    />

    <!-- Paginación -->
    <div v-if="ordenesCompraStore.totalPages > 1 && !ordenesCompraStore.loading" class="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="text-sm text-gray-700">
          Mostrando {{ ordenesCompraStore.ordenesCompra.length }} de {{ ordenesCompraStore.total }} órdenes
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="prevPage"
            :disabled="ordenesCompraStore.currentPage === 1 || ordenesCompraStore.loading"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Anterior
          </button>
          <span class="px-4 py-2 text-sm text-gray-700">
            Página {{ ordenesCompraStore.currentPage }} de {{ ordenesCompraStore.totalPages }}
          </span>
          <button
            @click="nextPage"
            :disabled="ordenesCompraStore.currentPage === ordenesCompraStore.totalPages || ordenesCompraStore.loading"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { useToast } from '@/composables/useToast'
import OrdenCompraTable from '../components/OrdenCompraTable.vue'
import SkeletonTable from '../components/SkeletonTable.vue'

const ordenesCompraStore = useOrdenesCompraStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()
const estadoFilter = ref<string>('')

onMounted(async () => {
  // Verificar si hay un parámetro de estado en la URL
  const estadoFromQuery = route.query.estado as string | undefined
  if (estadoFromQuery) {
    estadoFilter.value = estadoFromQuery
  }
  
  try {
    await ordenesCompraStore.fetchEstadisticas()
    
    // Si el valor está vacío, pasar undefined explícitamente para obtener todos los estados
    const estado = estadoFilter.value === '' ? undefined : estadoFilter.value
    await ordenesCompraStore.fetchOrdenesCompra(estado, 1)
  } catch (error: any) {
    toast.error('Error al cargar órdenes', error.message || 'No se pudieron cargar las órdenes de compra')
  }
})

function handleFilterChange() {
  // Resetear a página 1 cuando cambia el filtro
  ordenesCompraStore.setPage(1)
  // Si el valor está vacío, pasar undefined explícitamente para obtener todos los estados
  const estado = estadoFilter.value === '' ? undefined : estadoFilter.value
  
  // Actualizar la URL sin recargar la página
  if (estado) {
    router.replace({ query: { estado } })
  } else {
    router.replace({ query: {} })
  }
  
  ordenesCompraStore.fetchOrdenesCompra(estado, 1)
}

async function refreshOrdenes() {
  try {
    // Mantener la página actual al refrescar
    // Si el valor está vacío, pasar undefined explícitamente para obtener todos los estados
    const estado = estadoFilter.value === '' ? undefined : estadoFilter.value
    await ordenesCompraStore.fetchOrdenesCompra(estado, ordenesCompraStore.currentPage)
    toast.success('Lista actualizada', 'Las órdenes de compra se han actualizado correctamente')
  } catch (error: any) {
    toast.error('Error al actualizar', error.message || 'No se pudo actualizar la lista')
  }
}

function prevPage() {
  if (ordenesCompraStore.currentPage > 1) {
    const newPage = ordenesCompraStore.currentPage - 1
    ordenesCompraStore.setPage(newPage)
    const estado = estadoFilter.value === '' ? undefined : estadoFilter.value
    ordenesCompraStore.fetchOrdenesCompra(estado, newPage)
  }
}

function nextPage() {
  if (ordenesCompraStore.currentPage < ordenesCompraStore.totalPages) {
    const newPage = ordenesCompraStore.currentPage + 1
    ordenesCompraStore.setPage(newPage)
    const estado = estadoFilter.value === '' ? undefined : estadoFilter.value
    ordenesCompraStore.fetchOrdenesCompra(estado, newPage)
  }
}

async function handleIntegrar(referenciaDespacho: string) {
  try {
    toast.info('Enviando orden a SAP...', 'Por favor espere')
    const result = await ordenesCompraStore.integrarSAP(referenciaDespacho)
    
    toast.success(
      'Orden enviada exitosamente',
      result.message || `La orden ${referenciaDespacho} se ha enviado correctamente a SAP`
    )
    
    // Actualizar estadísticas después de integrar
    await ordenesCompraStore.fetchEstadisticas()
    
    // Refrescar la lista actual
    const estado = estadoFilter.value === '' ? undefined : estadoFilter.value
    await ordenesCompraStore.fetchOrdenesCompra(estado, ordenesCompraStore.currentPage)
  } catch (error: any) {
    toast.error(
      'Error al enviar orden',
      error.message || `No se pudo enviar la orden ${referenciaDespacho} a SAP`
    )
  }
}

async function handleIntegrarMultiples(referenciasDespacho: string[]) {
  if (referenciasDespacho.length === 0) {
    toast.warning('No hay órdenes seleccionadas', 'Selecciona al menos una orden pendiente')
    return
  }
  
  if (!confirm(`¿Estás seguro de enviar ${referenciasDespacho.length} orden(es) a SAP?`)) {
    return
  }
  
  try {
    toast.info(`Enviando ${referenciasDespacho.length} órdenes...`, 'Este proceso puede tardar unos momentos')
    
    // Enviar órdenes una por una (el backend podría tener un endpoint para múltiples)
    let successCount = 0
    let errorCount = 0
    
    for (const referencia of referenciasDespacho) {
      try {
        await ordenesCompraStore.integrarSAP(referencia)
        successCount++
      } catch (error) {
        errorCount++
        console.error(`Error al enviar ${referencia}:`, error)
      }
    }
    
    // Actualizar estadísticas
    await ordenesCompraStore.fetchEstadisticas()
    
    // Refrescar la lista
    const estado = estadoFilter.value === '' ? undefined : estadoFilter.value
    await ordenesCompraStore.fetchOrdenesCompra(estado, ordenesCompraStore.currentPage)
    
    if (errorCount === 0) {
      toast.success(
        'Todas las órdenes enviadas',
        `${successCount} orden(es) se enviaron exitosamente a SAP`
      )
    } else {
      toast.warning(
        'Proceso completado con errores',
        `${successCount} exitosas, ${errorCount} con error`
      )
    }
  } catch (error: any) {
    toast.error('Error en el proceso', error.message || 'Ocurrió un error al enviar las órdenes')
  }
}
</script>
