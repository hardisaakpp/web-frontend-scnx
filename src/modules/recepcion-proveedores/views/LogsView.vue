<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarIcon } from '@heroicons/vue/24/outline'
import { useLogsStore } from '../stores/logsStore'
import { daysAgoLocalDateString, todayLocalDateString } from '../utils/dateRange'
import BuscarOdcBar from '../components/BuscarOdcBar.vue'
import SkeletonTable from '@/components/SkeletonTable.vue'
import ErrorModal from '@/components/ErrorModal.vue'
import VolverButton from '@/components/VolverButton.vue'

const store = useLogsStore()
const route = useRoute()

// Si se llego aqui desde el detalle de una ODC (ver BuscarOdcBar), "Volver" regresa ahi en vez
// de a la busqueda generica.
const docNumOrigen = computed(() => {
  const docNum = route.query.volverA
  return typeof docNum === 'string' && docNum ? docNum : null
})
const volverA = computed(() =>
  docNumOrigen.value != null ? `/recepcion-proveedores/ordenes-compra/${docNumOrigen.value}` : '/recepcion-proveedores'
)
const volverATitulo = computed(() => (docNumOrigen.value != null ? `Volver a la ODC ${docNumOrigen.value}` : 'Volver a la búsqueda'))

// Codigos de dbo.OrdenPickingLog.Evento (ver EventosPickingLog.cs en el backend) con su etiqueta
// en español para el filtro y la columna Evento de la tabla.
const EVENTOS: { value: string; label: string }[] = [
  { value: 'INICIO_SESION', label: 'Inicio de sesión' },
  { value: 'SCAN', label: 'Escaneo' },
  { value: 'SCAN_ELIMINADO', label: 'Escaneo eliminado' },
  { value: 'CIERRE', label: 'Cierre de picking' },
  { value: 'INTEGRACION_SAP_INICIADA', label: 'Integración SAP iniciada' },
  { value: 'INTEGRACION_SAP_ENCOLADA', label: 'Integración SAP encolada' },
  { value: 'INTEGRACION_SAP_COMPLETADA', label: 'Integración SAP completada' },
  { value: 'INTEGRACION_SAP_ERROR', label: 'Error de integración SAP' },
  { value: 'PICKING_ELIMINADO', label: 'Picking eliminado' },
]

function eventoLabel(evento: string): string {
  return EVENTOS.find((e) => e.value === evento)?.label ?? evento
}

const desdeInput = ref(daysAgoLocalDateString(4))
const hastaInput = ref(todayLocalDateString())
const docNumInput = ref('')
const eventoInput = ref('')

function buscar(): void {
  const docNum = docNumInput.value ? Number(docNumInput.value) : null
  store.buscar({ desde: desdeInput.value, hasta: hastaInput.value, docNum, evento: eventoInput.value || null })
}

function limpiar(): void {
  desdeInput.value = daysAgoLocalDateString(4)
  hastaInput.value = todayLocalDateString()
  docNumInput.value = ''
  eventoInput.value = ''
  buscar()
}

onMounted(buscar)
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <VolverButton :to="volverA" :title="volverATitulo" class="shrink-0 self-start mb-4" />

    <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
      <BuscarOdcBar />
    </div>

    <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Logs de Picking</h1>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
      Registro de eventos (iniciar, escanear, eliminar scan, cerrar) de todas las órdenes de compra de tus almacenes.
    </p>

    <form class="flex flex-wrap items-end gap-3 mb-6" @submit.prevent="buscar">
      <div>
        <label for="logs-desde-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Desde</label>
        <div class="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
          <CalendarIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            id="logs-desde-input"
            v-model="desdeInput"
            type="date"
            class="border-none outline-none focus:ring-0 p-0 text-sm bg-transparent text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label for="logs-hasta-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Hasta</label>
        <div class="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500">
          <CalendarIcon class="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            id="logs-hasta-input"
            v-model="hastaInput"
            type="date"
            class="border-none outline-none focus:ring-0 p-0 text-sm bg-transparent text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label for="logs-docnum-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">DocNum (opcional)</label>
        <input
          id="logs-docnum-input"
          v-model="docNumInput"
          type="number"
          placeholder="Nro ODC"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="logs-evento-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Evento (opcional)</label>
        <select
          id="logs-evento-input"
          v-model="eventoInput"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          @change="buscar"
        >
          <option value="">Todos</option>
          <option v-for="opcion in EVENTOS" :key="opcion.value" :value="opcion.value">{{ opcion.label }}</option>
        </select>
      </div>
      <button
        type="submit"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        Buscar
      </button>
      <button
        type="button"
        class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
        @click="limpiar"
      >
        Limpiar
      </button>
    </form>

    <SkeletonTable v-if="store.loading" :columns="6" />

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Fecha/Hora</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">DocNum</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Almacén</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Evento</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Detalle</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="log in store.logs" :key="log.id">
            <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{{ new Date(log.fechaHora).toLocaleString() }}</td>
            <td class="px-4 py-2 text-sm">
              <RouterLink
                :to="{ name: 'recepcion-proveedores-detalle', params: { docNum: log.docNum } }"
                class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {{ log.docNum }}
              </RouterLink>
            </td>
            <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ log.whsCode }}</td>
            <td class="px-4 py-2 text-sm">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-semibold"
                :class="{
                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300': log.nivel === 'Info',
                  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300': log.nivel === 'Warn',
                  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300': log.nivel === 'Error',
                }"
              >
                {{ eventoLabel(log.evento) }}
              </span>
            </td>
            <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ log.detalle ?? '—' }}</td>
            <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{{ log.usuarioNombre ?? log.usuarioId ?? '—' }}</td>
          </tr>
          <tr v-if="store.logs.length === 0">
            <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay eventos para el rango de fechas seleccionado.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ErrorModal
      :open="!!store.error"
      title="No se pudo cargar el registro de eventos"
      :message="store.error ?? ''"
      @close="store.limpiarError()"
    />
  </div>
</template>
