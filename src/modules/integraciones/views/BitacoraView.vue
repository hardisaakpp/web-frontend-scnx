<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <IntegracionesTabs>
      <template #acciones>
        <button
          type="button"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
          @click="cargar"
        >
          <ArrowPathIcon class="w-5 h-5" :class="{ 'animate-spin': loading }" />
          {{ loading ? 'Cargando...' : 'Actualizar' }}
        </button>
      </template>
    </IntegracionesTabs>

    <!-- Filtros -->
    <form
      class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 px-6 py-4 grid grid-cols-1 md:grid-cols-6 gap-4"
      @submit.prevent="buscar"
    >
      <label class="block md:col-span-2">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Endpoint contiene</span>
        <input v-model="filters.endpoint" type="search" placeholder="Ej. liquidaciones, goods-receipts" :class="inputClass" />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Usuario</span>
        <input v-model="filters.usuario" type="search" placeholder="Ej. system" :class="inputClass" />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Código HTTP</span>
        <input v-model.number="filters.statusCode" type="number" min="100" max="599" placeholder="Ej. 400" :class="inputClass" />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Desde</span>
        <input v-model="filters.desde" type="date" :class="inputClass" />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Hasta</span>
        <input v-model="filters.hasta" type="date" :class="inputClass" />
      </label>
      <div class="md:col-span-6 flex items-center justify-between flex-wrap gap-3">
        <label class="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
          <input v-model="filters.onlyErrors" type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          Solo errores (HTTP 400 o superior)
        </label>
        <button
          type="submit"
          :disabled="loading"
          class="px-4 py-2 bg-gray-800 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 text-sm"
        >
          Filtrar
        </button>
      </div>
    </form>

    <!-- Tabla -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Bitácora de peticiones al middleware</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ formatEntero(total) }} registro(s). La hora es la de Ecuador. Los cuerpos se guardan truncados a 2000 caracteres.
        </p>
      </div>

      <div v-if="error" class="p-6">
        <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
        </div>
      </div>

      <div v-else-if="loading && items.length === 0" class="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando bitácora...
      </div>

      <div v-else-if="items.length === 0" class="p-12 text-center">
        <p class="text-gray-500 dark:text-gray-400">No hay registros que coincidan con los filtros.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th :class="thClass">Fecha</th>
              <th :class="thClass">Endpoint</th>
              <th :class="thClass">Usuario</th>
              <th :class="thClass">HTTP</th>
              <th :class="thClass">Duración</th>
              <th :class="[thClass, 'text-right']">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="entrada in items" :key="entrada.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{{ formatFechaHora(entrada.fecha) }}</td>
              <td class="px-6 py-4 text-sm font-mono text-xs text-gray-900 dark:text-white break-all">{{ entrada.endpoint }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{{ entrada.usuario }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <EstadoBadge :label="String(entrada.statusCode)" :tone="toneHttp(entrada.statusCode)" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{{ formatDuracion(entrada.duracionMs) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <button
                  type="button"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="verDetalle(entrada)"
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="totalPages > 1"
        class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-4"
      >
        <div class="text-sm text-gray-700 dark:text-gray-300">
          Página {{ filters.page }} de {{ totalPages }} ({{ formatEntero(total) }} registros)
        </div>
        <QuickTablePagination
          :model-value="filters.page"
          :total-pages="totalPages"
          :disabled="loading"
          aria-label="Paginación de la bitácora"
          @update:model-value="irAPagina"
        />
      </div>
    </div>

    <!-- Detalle -->
    <DetalleModal
      :open="detalle !== null || cargandoDetalle"
      titulo="Detalle de la petición"
      :subtitulo="detalle ? `#${detalle.id} · ${detalle.endpoint}` : ''"
      @close="detalle = null"
    >
      <p v-if="cargandoDetalle" class="text-sm text-gray-500 dark:text-gray-400">Cargando detalle...</p>
      <template v-else-if="detalle">
        <dl class="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Fecha</dt>
            <dd class="mt-0.5 text-gray-800 dark:text-gray-200">{{ formatFechaHora(detalle.fecha) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Usuario</dt>
            <dd class="mt-0.5 text-gray-800 dark:text-gray-200">{{ detalle.usuario }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">HTTP / duración</dt>
            <dd class="mt-0.5 flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <EstadoBadge :label="String(detalle.statusCode)" :tone="toneHttp(detalle.statusCode)" />
              {{ formatDuracion(detalle.duracionMs) }}
            </dd>
          </div>
        </dl>
        <JsonBlock :value="detalle.request" titulo="Request" vacio="Sin cuerpo (petición GET sin parámetros)" />
        <JsonBlock :value="detalle.response" titulo="Response" vacio="Sin cuerpo registrado (las respuestas exitosas de GET no se guardan)" />
      </template>
      <template #footer>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="detalle = null"
        >
          Cerrar
        </button>
      </template>
    </DetalleModal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import QuickTablePagination from '@/components/QuickTablePagination.vue'
import { useToast } from '@/composables/useToast'
import IntegracionesTabs from '../components/IntegracionesTabs.vue'
import EstadoBadge from '../components/EstadoBadge.vue'
import DetalleModal from '../components/DetalleModal.vue'
import JsonBlock from '../components/JsonBlock.vue'
import { integracionesApi } from '../services/integracionesApi'
import type { BitacoraEntry, BitacoraFilters } from '../types'
import { formatDuracion, formatEntero, formatFechaHora, mensajeError, toneHttp } from '../utils/formatters'

const inputClass =
  'mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
const thClass = 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'

const toast = useToast()

const filters = reactive<BitacoraFilters>({
  endpoint: '',
  usuario: '',
  statusCode: null,
  onlyErrors: false,
  desde: '',
  hasta: '',
  page: 1,
  pageSize: 20,
})

const items = ref<BitacoraEntry[]>([])
const total = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)
const detalle = ref<BitacoraEntry | null>(null)
const cargandoDetalle = ref(false)

async function cargar() {
  loading.value = true
  error.value = null
  try {
    if (typeof filters.statusCode !== 'number' || Number.isNaN(filters.statusCode)) filters.statusCode = null
    const respuesta = await integracionesApi.listarBitacora(filters)
    items.value = respuesta.items ?? []
    total.value = respuesta.total ?? 0
    totalPages.value = respuesta.totalPages || 1
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo consultar la bitácora del middleware.')
    items.value = []
    total.value = 0
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

function buscar() {
  filters.page = 1
  cargar()
}

function irAPagina(p: number) {
  filters.page = p
  cargar()
}

async function verDetalle(entrada: BitacoraEntry) {
  cargandoDetalle.value = true
  try {
    detalle.value = await integracionesApi.obtenerBitacora(entrada.id)
  } catch (e) {
    toast.error('No se pudo cargar el detalle', mensajeError(e, 'Intente de nuevo.'))
    detalle.value = null
  } finally {
    cargandoDetalle.value = false
  }
}

onMounted(cargar)
</script>
