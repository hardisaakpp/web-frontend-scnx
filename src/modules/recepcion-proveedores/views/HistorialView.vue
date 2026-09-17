<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHistorialStore } from '../stores/historialStore'
import { pickingApi } from '../services/pickingApi'
import { daysAgoLocalDateString, todayLocalDateString } from '../utils/dateRange'
import { downloadExcel } from '@/utils/exportExcel'
import { mapApiError } from '@/utils/apiErrorMapper'
import { useAuthStore } from '@/stores/auth'
import SkeletonTable from '@/components/feedback/SkeletonTable.vue'
import ErrorModal from '@/components/modales/ErrorModal.vue'
import VolverButton from '@/components/navegacion/VolverButton.vue'

const store = useHistorialStore()
const authStore = useAuthStore()
const esSupervisor = authStore.hasPermission('recepcionproveedores.view')
const esTienda = authStore.hasPermission('recepcionproveedores.tienda')

interface HistorialDetalleFila {
  docNum: number
  whsCode: string
  fechaRecepcion: string
  estado: string
  itemCode: string
  itemDescription: string | null
  cantidadPedida: number
  cantidadPickeada: number
  cantidadSobrante: number
}

const exportando = ref(false)
const errorExportar = ref<string | null>(null)

// Codigos de dbo.OrdenPickingSesion.Estado (ver EstadoPickingSesion.cs en el backend) con su
// etiqueta en español, misma traduccion que EstadoPickingSesionMapper.ATextoPantalla.
const ESTADOS: { value: string; label: string }[] = [
  { value: 'EnProceso', label: 'En Proceso' },
  { value: 'Finalizada', label: 'Finalizada' },
  { value: 'EnviandoSap', label: 'Enviando a SAP' },
  { value: 'IntegradaSap', label: 'Recepción Completada' },
  { value: 'ErrorSap', label: 'Error SAP' },
]

const ESTADO_POR_DEFECTO = 'IntegradaSap'

const desdeInput = ref(daysAgoLocalDateString(30))
const hastaInput = ref(todayLocalDateString())
const docNumInput = ref<number | null>(null)
const whsCodeInput = ref('')
const estadoInput = ref(ESTADO_POR_DEFECTO)

function buscar(): void {
  store.buscar({
    desde: desdeInput.value,
    hasta: hastaInput.value,
    docNum: docNumInput.value,
    whsCode: whsCodeInput.value.trim() || null,
    estado: estadoInput.value || null,
  })
}

function limpiar(): void {
  desdeInput.value = daysAgoLocalDateString(30)
  hastaInput.value = todayLocalDateString()
  docNumInput.value = null
  whsCodeInput.value = ''
  estadoInput.value = ESTADO_POR_DEFECTO
  buscar()
}

/**
 * Excel de detalle por ODC y producto: junta las lineas de cada sesion de picking del historial
 * ya filtrado (N llamadas, una por fila) porque el historial en si es a nivel de sesion, sin
 * detalle de producto — mismo dato que ya expone /picking/{sesionId}.
 */
async function descargarExcel(): Promise<void> {
  exportando.value = true
  errorExportar.value = null
  try {
    const filas: HistorialDetalleFila[] = []
    for (const fila of store.historial) {
      const sesion = await pickingApi.obtenerSesion(fila.id)
      for (const linea of sesion.lineas) {
        filas.push({
          docNum: fila.docNum,
          whsCode: fila.whsCode,
          fechaRecepcion: fila.fechaRecepcion,
          estado: fila.estadoTexto,
          itemCode: linea.itemCode,
          itemDescription: linea.itemDescription,
          cantidadPedida: linea.cantidadPedida,
          cantidadPickeada: linea.cantidadPickeada,
          cantidadSobrante: linea.cantidadSobrante,
        })
      }
    }
    downloadExcel(
      `Historial_Recepciones_${todayLocalDateString()}.xlsx`,
      [
        { header: 'DocNum', key: 'docNum' },
        { header: 'Almacén', key: 'whsCode', text: true },
        { header: 'Fecha de recepción', key: (r) => new Date(r.fechaRecepcion).toLocaleString() },
        { header: 'Estado', key: 'estado' },
        { header: 'ItemCode', key: 'itemCode', text: true },
        { header: 'Descripción', key: 'itemDescription' },
        { header: 'Cantidad pedida', key: 'cantidadPedida' },
        { header: 'Cantidad recibida', key: 'cantidadPickeada' },
        { header: 'Sobrante', key: 'cantidadSobrante' },
      ],
      filas,
      'Historial detalle'
    )
  } catch (err: unknown) {
    errorExportar.value = mapApiError(err, 'No se pudo generar el Excel del historial.').message
  } finally {
    exportando.value = false
  }
}

onMounted(buscar)
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <VolverButton to="/recepcion-proveedores" title="Volver" class="shrink-0 self-start mb-4" />

    <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">Historial de Recepciones</h1>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
      Órdenes de compra recibidas o en proceso de recepción en tus almacenes, dentro del rango de fechas.
    </p>

    <form class="flex flex-wrap items-end gap-3 mb-6" @submit.prevent="buscar">
      <div>
        <label for="historial-desde-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Desde</label>
        <input
          id="historial-desde-input"
          v-model="desdeInput"
          type="date"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="historial-hasta-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Hasta</label>
        <input
          id="historial-hasta-input"
          v-model="hastaInput"
          type="date"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="historial-docnum-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">DocNum (opcional)</label>
        <input
          id="historial-docnum-input"
          v-model.number="docNumInput"
          type="number"
          placeholder="Nro ODC"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="historial-whscode-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Almacén (opcional)</label>
        <input
          id="historial-whscode-input"
          v-model="whsCodeInput"
          type="text"
          placeholder="Cód. almacén"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="historial-estado-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Estado (opcional)</label>
        <select
          id="historial-estado-input"
          v-model="estadoInput"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          @change="buscar"
        >
          <option value="">Todos</option>
          <option v-for="opcion in ESTADOS" :key="opcion.value" :value="opcion.value">{{ opcion.label }}</option>
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
      <button
        v-if="esSupervisor || esTienda"
        type="button"
        :disabled="exportando || store.historial.length === 0"
        class="px-4 py-2 border border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        @click="descargarExcel"
      >
        {{ exportando ? 'Generando Excel...' : 'Descargar Excel (detalle por producto)' }}
      </button>
    </form>

    <SkeletonTable v-if="store.loading" :columns="5" />

    <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Fecha de recepción</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">DocNum</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Almacén</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Observaciones</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="fila in store.historial" :key="fila.id">
            <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{{ new Date(fila.fechaRecepcion).toLocaleString() }}</td>
            <td class="px-4 py-2 text-sm">
              <RouterLink
                :to="{ name: 'recepcion-proveedores-detalle', params: { docNum: fila.docNum } }"
                class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {{ fila.docNum }}
              </RouterLink>
            </td>
            <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ fila.whsCode }}</td>
            <td class="px-4 py-2 text-sm">
              <span
                class="px-2 py-0.5 rounded-full text-xs font-semibold"
                :class="{
                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300': fila.estado === 'EnProceso' || fila.estado === 'Finalizada',
                  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300': fila.estado === 'EnviandoSap',
                  'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300': fila.estado === 'IntegradaSap',
                  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300': fila.estado === 'ErrorSap',
                }"
              >
                {{ fila.estadoTexto }}
              </span>
            </td>
            <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ fila.observaciones ?? '—' }}</td>
          </tr>
          <tr v-if="store.historial.length === 0">
            <td colspan="5" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay recepciones registradas en ese rango de fechas.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ErrorModal
      :open="!!store.error"
      title="No se pudo cargar el historial"
      :message="store.error ?? ''"
      @close="store.limpiarError()"
    />
    <ErrorModal
      :open="!!errorExportar"
      title="No se pudo generar el Excel"
      :message="errorExportar ?? ''"
      @close="errorExportar = null"
    />
  </div>
</template>
