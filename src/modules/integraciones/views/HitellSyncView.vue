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
      Cada transferencia de stock o entrada de mercadería que SAP confirma se avisa a HITELL (WEBPOS). Aquí quedan
      tanto las que se integraron como las que HITELL rechazó; estas últimas se pueden reintegrar una vez corregida
      la causa en HITELL. Por defecto se muestran los últimos {{ DIAS_POR_DEFECTO }} días.
    </div>

    <!-- Filtros -->
    <form
      class="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 px-6 py-4 grid grid-cols-1 md:grid-cols-6 gap-4"
      @submit.prevent="buscar"
    >
      <label class="block">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Resultado</span>
        <select v-model="filters.status" :class="inputClass">
          <option value="">Todos</option>
          <option value="REJECTED">Rechazados</option>
          <option value="SYNCED">Integrados</option>
          <option value="SKIPPED_NOT_POS">No corresponde</option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Tipo de documento</span>
        <select v-model="filters.docType" :class="inputClass">
          <option value="">Todos</option>
          <option value="ST">Transferencia de stock</option>
          <option value="GR">Entrada de mercadería</option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Tipo de rechazo</span>
        <select v-model="filters.rejectionType" :class="inputClass">
          <option value="">Cualquiera</option>
          <option value="PRODUCTO_NO_EXISTE">Producto no existe en HITELL</option>
          <option value="OTRO">Otro rechazo</option>
        </select>
      </label>
      <label class="block">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-300">N.º documento SAP</span>
        <input v-model.number="filters.docNum" type="number" min="1" placeholder="DocNum" :class="inputClass" />
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
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Documentos notificados a HITELL</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ formatEntero(total) }} documento(s)</p>
      </div>

      <div v-if="error" class="p-6">
        <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
        </div>
      </div>

      <div v-else-if="loading && entries.length === 0" class="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
        Cargando estados de integración...
      </div>

      <div v-else-if="entries.length === 0" class="p-12 text-center">
        <p class="text-gray-500 dark:text-gray-400">No hay documentos que coincidan con los filtros.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th :class="thClass">Documento SAP</th>
              <th :class="thClass">Almacenes</th>
              <th :class="thClass">Resultado</th>
              <th :class="thClass">Motivo</th>
              <th :class="thClass">Intentos</th>
              <th :class="thClass">Última actualización</th>
              <th :class="[thClass, 'text-right']">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="doc in entries"
              :key="claveDoc(doc)"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ doc.docNum != null ? `N.º ${formatEntero(doc.docNum)}` : 'N.º no registrado' }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {{ HITELL_DOC_TYPE_LABEL[doc.docType] }} · DocEntry {{ formatEntero(doc.docEntry) }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm">
                <div v-if="doc.warehouses?.length" class="flex flex-col gap-0.5">
                  <span
                    v-for="w in doc.warehouses"
                    :key="w.code"
                    class="whitespace-nowrap"
                    :class="w.codBusiness ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 dark:text-gray-500'"
                    :title="etiquetaAlmacen(w)"
                  >
                    {{ w.code }}<span v-if="w.codBusiness" class="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">neg. {{ w.codBusiness }}</span>
                  </span>
                </div>
                <span v-else class="text-xs text-gray-400 dark:text-gray-500">Sin registrar</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <EstadoBadge :label="HITELL_RESULT_LABEL[doc.result]" :tone="toneHitell(doc.result)" />
                <div v-if="doc.rejection" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ HITELL_REJECTION_LABEL[doc.rejection.type] }}
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-md">
                <span :title="doc.rejection?.description ?? doc.reason ?? ''">
                  {{ truncar(doc.rejection?.description ?? doc.reason, 110) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{{ doc.attempts }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                {{ formatFechaHora(doc.updatedAt ?? doc.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <div class="flex justify-end gap-2">
                  <button
                    type="button"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    @click="detalle = doc"
                  >
                    Ver detalle
                  </button>
                  <button
                    v-if="doc.result === 'RECHAZADO' && puedeReintegrar"
                    type="button"
                    :disabled="reintegrando.has(claveDoc(doc))"
                    class="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="confirmar = doc"
                  >
                    {{ reintegrando.has(claveDoc(doc)) ? 'Reintegrando...' : 'Reintegrar' }}
                  </button>
                </div>
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
          Página {{ filters.page }} de {{ totalPages }} ({{ formatEntero(total) }} documentos)
        </div>
        <QuickTablePagination
          :model-value="filters.page"
          :total-pages="totalPages"
          :disabled="loading"
          aria-label="Paginación de documentos HITELL"
          @update:model-value="irAPagina"
        />
      </div>
    </div>

    <!-- Detalle -->
    <DetalleModal
      :open="detalle !== null"
      :titulo="detalle ? tituloDoc(detalle) : ''"
      :subtitulo="detalle ? `${HITELL_DOC_TYPE_LABEL[detalle.docType]} · DocEntry ${formatEntero(detalle.docEntry)}` : ''"
      @close="detalle = null"
    >
      <template v-if="detalle">
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Resultado</dt>
            <dd class="mt-0.5"><EstadoBadge :label="HITELL_RESULT_LABEL[detalle.result]" :tone="toneHitell(detalle.result)" /></dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Estado interno</dt>
            <dd class="mt-0.5 font-mono text-gray-800 dark:text-gray-200">{{ detalle.status }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Intentos</dt>
            <dd class="mt-0.5 text-gray-800 dark:text-gray-200">{{ detalle.attempts }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Primer intento</dt>
            <dd class="mt-0.5 text-gray-800 dark:text-gray-200">{{ formatFechaHora(detalle.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-gray-500 dark:text-gray-400">Última actualización</dt>
            <dd class="mt-0.5 text-gray-800 dark:text-gray-200">{{ formatFechaHora(detalle.updatedAt) }}</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-gray-500 dark:text-gray-400">Almacenes del documento</dt>
            <dd v-if="detalle.warehouses?.length" class="mt-1 flex flex-col gap-1">
              <div
                v-for="w in detalle.warehouses"
                :key="w.code"
                class="flex flex-wrap items-center gap-2"
                :class="w.codBusiness ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'"
              >
                <span class="font-mono font-semibold">{{ w.code }}</span>
                <span>{{ nombresAlmacen[w.code] ?? '' }}</span>
                <EstadoBadge v-if="w.codBusiness" :label="`WEBPOS · negocio ${w.codBusiness}`" tone="info" />
                <EstadoBadge v-else label="Fuera de WEBPOS" tone="neutral" />
              </div>
              <p v-if="detalle.result === 'RECHAZADO'" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                El producto debe crearse en HITELL para las tiendas marcadas WEBPOS cuyo negocio coincide con el del rechazo.
              </p>
            </dd>
            <dd v-else class="mt-0.5 text-gray-400 dark:text-gray-500 italic">
              Sin registrar: este documento lo notificó una versión anterior del middleware. Al reintegrarlo quedan guardados.
            </dd>
          </div>
        </dl>

        <div
          v-if="detalle.rejection"
          class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 space-y-3"
        >
          <p class="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {{ HITELL_REJECTION_LABEL[detalle.rejection.type] }}
          </p>
          <p class="text-sm text-amber-900 dark:text-amber-100">{{ detalle.rejection.description }}</p>
          <table v-if="detalle.rejection.items.length" class="min-w-full text-xs">
            <thead>
              <tr class="text-left text-amber-800 dark:text-amber-300">
                <th class="py-1 pr-4 font-medium">Artículo</th>
                <th class="py-1 pr-4 font-medium">Negocio</th>
                <th class="py-1 font-medium">Mensaje de HITELL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in detalle.rejection.items" :key="idx" class="text-amber-900 dark:text-amber-100">
                <td class="py-1 pr-4 font-mono">{{ item.itemCode ?? '-' }}</td>
                <td class="py-1 pr-4">{{ item.codBusiness ?? '-' }}</td>
                <td class="py-1">{{ item.message }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <JsonBlock :value="detalle.reason" titulo="Respuesta cruda de HITELL" vacio="Sin mensaje de HITELL" />
      </template>

      <template #footer>
        <button
          v-if="detalle?.result === 'RECHAZADO' && puedeReintegrar"
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
          @click="confirmar = detalle"
        >
          Reintegrar
        </button>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="detalle = null"
        >
          Cerrar
        </button>
      </template>
    </DetalleModal>

    <!-- Confirmación de reintegración -->
    <DetalleModal
      :open="confirmar !== null"
      titulo="Reintegrar a HITELL"
      :subtitulo="confirmar ? tituloDoc(confirmar) : ''"
      @close="confirmar = null"
    >
      <p class="text-sm text-gray-700 dark:text-gray-200">
        Se volverá a enviar a HITELL el movimiento de stock de este documento, leyéndolo otra vez desde SAP.
        No se crea ni modifica nada en SAP.
      </p>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Úselo después de corregir la causa del rechazo en HITELL (por ejemplo, crear el producto en la tienda).
        Si la causa sigue, HITELL lo rechazará de nuevo y quedará registrado el intento.
      </p>
      <template #footer>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="confirmar = null"
        >
          Cancelar
        </button>
        <button
          type="button"
          :disabled="confirmar !== null && reintegrando.has(claveDoc(confirmar))"
          class="px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
          @click="reintegrar"
        >
          Sí, reintegrar
        </button>
      </template>
    </DetalleModal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ArrowPathIcon } from '@heroicons/vue/24/outline'
import QuickTablePagination from '@/components/QuickTablePagination.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import IntegracionesTabs from '../components/IntegracionesTabs.vue'
import EstadoBadge from '../components/EstadoBadge.vue'
import DetalleModal from '../components/DetalleModal.vue'
import JsonBlock from '../components/JsonBlock.vue'
import { integracionesApi } from '../services/integracionesApi'
import { INTEGRACIONES_PERMISSIONS } from '../permissions'
import type { HitellSyncFilters, HitellSyncStatus, HitellSyncWarehouse } from '../types'
import {
  DIAS_POR_DEFECTO,
  HITELL_DOC_TYPE_LABEL,
  HITELL_REJECTION_LABEL,
  HITELL_RESULT_LABEL,
  HITELL_RETRY_FEEDBACK,
  formatEntero,
  formatFechaHora,
  mensajeError,
  rangoUltimosDias,
  toneHitell,
  truncar,
} from '../utils/formatters'

const inputClass =
  'mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
const thClass = 'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'

const authStore = useAuthStore()
const toast = useToast()

const puedeReintegrar = computed(
  () => authStore.userRoles?.includes('Admin') || authStore.hasPermission(INTEGRACIONES_PERMISSIONS.hitellRetry),
)

const filters = reactive<HitellSyncFilters>({
  status: '',
  docType: '',
  rejectionType: '',
  docNum: null,
  ...rangoUltimosDias(),
  page: 1,
  pageSize: 20,
})

const entries = ref<HitellSyncStatus[]>([])
const total = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const error = ref<string | null>(null)
const detalle = ref<HitellSyncStatus | null>(null)
const confirmar = ref<HitellSyncStatus | null>(null)
const reintegrando = ref(new Set<string>())

/** Nombres de almacén de SAP (código → nombre) para que soporte vea la tienda y no solo el código. Si SAP no responde, se muestran solo códigos. */
const nombresAlmacen = ref<Record<string, string>>({})

async function cargarAlmacenes() {
  try {
    nombresAlmacen.value = await integracionesApi.listarAlmacenes()
  } catch {
    nombresAlmacen.value = {}
  }
}

function etiquetaAlmacen(w: HitellSyncWarehouse): string {
  const nombre = nombresAlmacen.value[w.code]
  const base = nombre ? `${w.code} · ${nombre}` : w.code
  return w.codBusiness ? `${base} (WEBPOS, negocio ${w.codBusiness})` : `${base} (fuera de WEBPOS)`
}

function claveDoc(doc: Pick<HitellSyncStatus, 'docType' | 'docEntry'>): string {
  return `${doc.docType}-${doc.docEntry}`
}

function tituloDoc(doc: HitellSyncStatus): string {
  return doc.docNum != null
    ? `Documento SAP N.º ${formatEntero(doc.docNum)}`
    : `${doc.docType} · DocEntry ${formatEntero(doc.docEntry)}`
}

async function cargar() {
  loading.value = true
  error.value = null
  try {
    // Un tipo de rechazo solo tiene sentido sobre rechazados: el middleware lo fuerza igual.
    if (filters.rejectionType && filters.status !== 'REJECTED') filters.status = 'REJECTED'
    if (typeof filters.docNum !== 'number' || Number.isNaN(filters.docNum)) filters.docNum = null
    const respuesta = await integracionesApi.listarHitell(filters)
    entries.value = respuesta.entries ?? []
    total.value = respuesta.total ?? entries.value.length
    totalPages.value = respuesta.totalPages || 1
  } catch (e) {
    error.value = mensajeError(e, 'No se pudo consultar el estado de integración con HITELL.')
    entries.value = []
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

async function reintegrar() {
  const doc = confirmar.value
  if (!doc) return
  const clave = claveDoc(doc)
  reintegrando.value.add(clave)
  try {
    const resultado = await integracionesApi.reintegrarHitell(doc)
    const feedback = HITELL_RETRY_FEEDBACK[resultado.status] ?? HITELL_RETRY_FEEDBACK.Error
    const detalleMsg = [resultado.reason, resultado.jobId ? `Job ${resultado.jobId}` : null].filter(Boolean).join(' · ')
    const titulo = `${tituloDoc(doc)}: ${feedback.titulo}`
    if (feedback.tone === 'success') toast.success(titulo, detalleMsg || undefined)
    else if (feedback.tone === 'danger') toast.error(titulo, detalleMsg || undefined)
    else if (feedback.tone === 'warning') toast.warning(titulo, detalleMsg || undefined)
    else toast.info(titulo, detalleMsg || undefined)
    confirmar.value = null
    detalle.value = null
    await cargar()
  } catch (e) {
    toast.error(`No se pudo reintegrar ${tituloDoc(doc)}`, mensajeError(e, 'El middleware no aceptó el reintento.'))
  } finally {
    reintegrando.value.delete(clave)
  }
}

watch(
  () => filters.rejectionType,
  (tipo) => {
    if (tipo) filters.status = 'REJECTED'
  },
)

onMounted(() => {
  void cargar()
  void cargarAlmacenes()
})
</script>
