<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Procesamiento SAP
            </h1>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              MABEL TRADING
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Selecciona un pedido para ver su procesamiento SAP
          </p>
        </div>
        <button
          @click="cargarPedidos"
          :disabled="loading"
          class="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          <svg v-if="!loading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <LoadingSpinner v-else layout="inline" size="md" color="current" aria-label="Cargando pedidos" />
          {{ loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </div>

      <!-- Buscador -->
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <input
          id="search-procesamiento-sap"
          v-model.trim="searchTerm"
          type="search"
          placeholder="Buscar por número de pedido, proveedor o estado..."
          class="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:ring-purple-400 dark:focus:border-purple-400 transition-colors"
        />
      </div>

      <!-- Tabla de Pedidos -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Pedidos con redistribución confirmada</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ total }} pedido(s)
          </p>
        </div>

        <LoadingSpinner v-if="loading && pedidos.length === 0" message="Cargando pedidos..." color="purple" />

        <div v-else-if="error" class="p-6">
          <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
          </div>
        </div>

        <div v-else-if="filteredPedidos.length === 0" class="p-12 text-center">
          <p class="text-gray-500 dark:text-gray-400">
            {{ searchTerm ? 'Ningún pedido coincide con la búsqueda.' : 'No hay pedidos confirmados disponibles.' }}
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Número Pedido</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proveedor</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Pedido</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="pedido in filteredPedidos"
                :key="pedido.cabecera.pedido_id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                @click="irAProcesamientoSAP(pedido)"
              >
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ pedido.cabecera.numero_pedido }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ pedido.cabecera.proveedor_nombre }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ pedido.cabecera.fecha_pedido ? formatDate(pedido.cabecera.fecha_pedido) : '-' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {{ pedido.cabecera.estado || 'CONFIRMADO' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div v-if="totalPages > 1 && !loading" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-4">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Página {{ page }} de {{ totalPages }} ({{ total }} pedidos)
          </div>
          <QuickTablePagination
            :model-value="page"
            :total-pages="totalPages"
            :disabled="loading"
            aria-label="Paginación de pedidos confirmados"
            @update:model-value="setProcesamientoSapPage"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from '@vue/reactivity'
import { onMounted } from '@vue/runtime-core'
import { useRouter } from 'vue-router'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import QuickTablePagination from '../components/QuickTablePagination.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import type { PedidoCompleto } from '../types'
import { formatDate } from '../utils/formatters'

const router = useRouter()

const pedidos = ref<PedidoCompleto[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)
const searchTerm = ref('')
const page = ref(1)
const pageSize = 10

const totalPages = computed(() => Math.ceil(total.value / pageSize) || 1)

const filteredPedidos = computed(() => {
  const term = searchTerm.value.toLowerCase().trim()
  if (!term) return pedidos.value
  return pedidos.value.filter((p) => {
    const cab = p.cabecera
    const numero = (cab?.numero_pedido ?? '').toString().toLowerCase()
    const proveedor = (cab?.proveedor_nombre ?? '').toLowerCase()
    const estado = (cab?.estado ?? '').toLowerCase()
    return numero.includes(term) || proveedor.includes(term) || estado.includes(term)
  })
})

function irAProcesamientoSAP(pedido: PedidoCompleto) {
  const numero = pedido.cabecera?.numero_pedido ?? ''
  if (!numero) return
  router.push({
    name: 'mba3-consultas-pedido-procesamiento-sap',
    params: { id: encodeURIComponent(numero) }
  })
}

function setProcesamientoSapPage(p: number) {
  page.value = p
  cargarPedidos()
}

async function cargarPedidos() {
  loading.value = true
  error.value = null
  try {
    const response = await mba3ConsultasService.getPedidosConfirmados({
      page: page.value,
      pageSize
    })
    pedidos.value = response.data || []
    total.value = response.total || 0
  } catch (e: any) {
    console.error('Error al cargar pedidos para Procesamiento SAP:', e)
    error.value = e.message || 'No se pudieron cargar los pedidos'
    pedidos.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  cargarPedidos()
})
</script>
