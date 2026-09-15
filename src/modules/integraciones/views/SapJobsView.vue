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

    <div class="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 px-4 py-3 text-sm text-sky-900 dark:text-sky-100">
      Aquí aparecen las peticiones a SAP que el middleware tuvo que encolar porque SAP no respondió a tiempo o estaba
      saturado. Cada job queda registrado y va cambiando de estado hasta terminar en Completado o Error, con sus
      intentos. Las que SAP atendió de inmediato no pasan por la cola: búsquelas en la pestaña Bitácora. Por defecto
      se muestran los últimos {{ DIAS_POR_DEFECTO }} días.
    </div>

    <!-- Filtros -->
    <form
      class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 px-6 py-4 grid grid-cols-1 md:grid-cols-5 gap-4"
      @submit.prevent="buscar"
    >
      <label class="block">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Estado</span>
        <select v-model="filters.status" :class="inputClass">
          <option value="">Todos</option>
          <option value="ERROR">Error</option>
          <option value="ENCOLADO">Encolado</option>
          <option value="PROCESANDO">Procesando</option>
          <option value="COMPLETADO">Completado</option>
        </select>
      </label>
      <label class="block md:col-span-2">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Endpoint contiene</span>
        <input v-model="filters.endpoint" type="search" placeholder="Ej. stock-transfers, liquidaciones" :class="inputClass" />
      </label>
      <label class="block">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Desde</span>
        <input v-model="filters.desde" type="date" :class="inputClass" />
      </label>
      <div class="flex items-end gap-2">
        <label class="block flex-1">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Hasta</span>
          <input v-model="filters.hasta" type="date" :class="inputClass" />
        </label>
        <button
          type="submit"
          :disabled="loading"
          class="px-4 py-2.5 bg-gray-800 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 text-sm"
        >
          Filtrar
        </button>
      </div>
    </form>

    <!-- Tabla -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Cola de peticiones a SAP</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ formatEntero(total) }} job(s)</p>
      </div>

      <div v-if="error" class="p-6">
        <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
        </div>
      </div>

      <div v-else-if="loading && items.length === 0" class="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando cola...
      </div>

      <div v-else-if="items.length === 0" class="p-12 text-center">
        <p class="text-gray-500 dark:text-gray-400">No hay jobs que coincidan con los filtros.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th :class="thClass">Creado</th>
              <th :class="thClass">Endpoint</th>
              <th :class="thClass">Estado</th>
              <th :class="thClass">HTTP</th>
              <th :class="thClass">Intentos</th>
              <th :class="thClass">Error</th>
              <th :class="[thClass, 'text-right']">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="job in items" :key="job.jobId" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                <div>{{ formatFechaHora(job.createdAt) }}</div>
                <div v-if="job.updatedAt" class="text-xs text-gray-400">act. {{ formatFechaHora(job.updatedAt) }}</div>
              </td>
              <td class="px-6 py-4 text-sm">
                <div class="font-mono text-xs text-gray-900 dark:text-white break-all">{{ job.endpoint }}</div>
                <div v-if="job.requestType" class="text-xs text-gray-500 dark:text-gray-400">{{ job.requestType }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <EstadoBadge :label="SAP_JOB_STATUS_LABEL[job.status] ?? job.status" :tone="toneJob(job.status)" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <EstadoBadge v-if="job.httpStatusCode" :label="String(job.httpStatusCode)" :tone="toneHttp(job.httpStatusCode)" />
                <span v-else class="text-sm text-gray-400">-</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{{ job.attempts }}</td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-md">
                <span :title="job.error ?? ''">{{ truncar(job.error, 100) }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <button
                  type="button"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  @click="verDetalle(job)"
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
          Página {{ filters.page }} de {{ totalPages }} ({{ formatEntero(total) }} jobs)
        </div>
        <QuickTablePagination
          :model-value="filters.page"
          :total-pages="totalPages"
          :disabled="loading"
          aria-label="Paginación de la cola SAP"
          @update:model-value="irAPagina"
        />
      </div>
    </div>

    <!-- Detalle -->
    <DetalleModal
      :open="detalle !== null || cargandoDetalle"
      titulo="Detalle del job"
      :subtitulo="detalle?.jobId ?? ''"
      @close="detalle = null"
    >
      <p v-if="cargandoDetalle" class="text-sm text-gray-500 dark:text-gray-400">Cargando detalle...</p>
      <template v-else-if="detalle">
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div class="sm:col-span-2">
            <dt class="text-gray-500 dark:text-gray-400">Endpoint</dt>
            <dd class="mt-0.5 font-mono text-xs text-gray-800 dark:text-gray-200 break-all">{{ detalle.endpoint }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Estado</dt>
            <dd class="mt-0.5"><EstadoBadge :label="SAP_JOB_STATUS_LABEL[detalle.status] ?? detalle.status" :tone="toneJob(detalle.status)" /></dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">HTTP / intentos</dt>
            <dd class="mt-0.5 text-gray-800 dark:text-gray-200">{{ detalle.httpStatusCode ?? '-' }} · {{ detalle.attempts }} intento(s)</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Creado</dt>
            <dd class="mt-0.5 text-gray-800 dark:text-gray-200">{{ formatFechaHora(detalle.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Última actualización</dt>
            <dd class="mt-0.5 text-gray-800 dark:text-gray-200">{{ formatFechaHora(detalle.updatedAt) }}</dd>
          </div>
        </dl>

        <div
          v-if="detalle.error"
          class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-200"
        >
          {{ detalle.error }}
        </div>

        <JsonBlock :value="detalle.request" titulo="Payload enviado a SAP" vacio="El job no guardó payload" />
        <JsonBlock :value="detalle.result" titulo="Resultado de SAP" vacio="Sin resultado todavía" />
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
import QuickTablePagination from '@/components/paginacion/QuickTablePagination.vue'
import { useToast } from '@/composables/useToast'
import IntegracionesTabs from '../components/IntegracionesTabs.vue'
import EstadoBadge from '../components/EstadoBadge.vue'
import DetalleModal from '../components/DetalleModal.vue'
import JsonBlock from '../components/JsonBlock.vue'
import { integracionesApi } from '../services/integracionesApi'
import type { SapJob, SapJobFilters } from '../types'
import {
  DIAS_POR_DEFECTO,
  SAP_JOB_STATUS_LABEL,
  formatEntero,
  formatFechaHora,
  mensajeError,
  rangoUltimosDias,
  toneHttp,
  toneJob,
  truncar,
} from '../utils/formatters'

const inputClass =
  'mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
const thClass = 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'

const toast = useToast()

const filters = reactive<SapJobFilters>({
  status: '',
  endpoint: '',
  ...rangoUltimosDias(),
  page: 1,
  pageSize: 20,
})

const items = ref<SapJob[]>([])
const total = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)
const detalle = ref<SapJob | null>(null)
const cargandoDetalle = ref(false)

async function cargar() {
  loading.value = true
  error.value = null
  try {
    const respuesta = await integracionesApi.listarJobs(filters)
    items.value = respuesta.items ?? []
    total.value = respuesta.total ?? 0
    totalPages.value = respuesta.totalPages || 1
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo consultar la cola de peticiones a SAP.')
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

async function verDetalle(job: SapJob) {
  cargandoDetalle.value = true
  try {
    detalle.value = await integracionesApi.obtenerJob(job.jobId)
  } catch (e) {
    toast.error('No se pudo cargar el detalle del job', mensajeError(e, 'Intente de nuevo.'))
    detalle.value = null
  } finally {
    cargandoDetalle.value = false
  }
}

onMounted(cargar)
</script>
