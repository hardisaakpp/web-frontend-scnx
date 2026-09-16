<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { usePickingStore } from '../stores/pickingStore'
import { downloadExcel } from '@/utils/exportExcel'
import LoadingSpinner from '@/components/feedback/LoadingSpinner.vue'
import ErrorModal from '@/components/modales/ErrorModal.vue'
import VolverButton from '@/components/navegacion/VolverButton.vue'
import BuscarOdcBar from '../components/BuscarOdcBar.vue'
import type { EntradaMercaderiaResponse } from '../types'
import { useDelayedFlag } from '@/composables/useDelayedFlag'

const route = useRoute()
const router = useRouter()
const ordenesCompraStore = useOrdenesCompraStore()
const pickingStore = usePickingStore()

const docNum = computed(() => Number(route.params.docNum))
const iniciandoPicking = ref(false)
const whsCodeSeleccionado = ref<string>('')
const errorPicking = ref<string | null>(null)
const mostrarEntradas = ref(false)

const whsCodesEnOrden = computed(() => {
  const codigos = ordenesCompraStore.orden?.lineas.map((l) => l.whsCode) ?? []
  return [...new Set(codigos)]
})

const puedeIniciarPicking = computed(() => ordenesCompraStore.orden?.estado === 'Pendiente')

// Mismo umbral/mensaje que BuscarOdcBar: recien despues de 10s de espera se avisa que SAP esta
// tardando, en vez de dejar "Consultando orden de compra..." fijo hasta los ~40s posibles.
const consultaTardandoMasDeLoUsual = useDelayedFlag(() => ordenesCompraStore.loading, 10000)

watch(
  whsCodesEnOrden,
  (codigos) => {
    if (codigos.length === 1) whsCodeSeleccionado.value = codigos[0]!
    else if (!codigos.includes(whsCodeSeleccionado.value)) whsCodeSeleccionado.value = ''
  },
  { immediate: true }
)

async function cargar(): Promise<void> {
  mostrarEntradas.value = false
  await ordenesCompraStore.buscarPorDocNum(docNum.value)
}

async function actualizarDesdeSap(): Promise<void> {
  await ordenesCompraStore.actualizarDesdeSap(docNum.value)
}

function descargarExcel(): void {
  const orden = ordenesCompraStore.orden
  if (!orden) return
  downloadExcel(
    `OC_${orden.docNum}.xlsx`,
    [
      { header: 'ItemCode', key: 'itemCode', text: true },
      { header: 'Descripción', key: 'dscription' },
      { header: 'Código de barras', key: 'codeBars', text: true },
      { header: 'Cantidad', key: 'quantity' },
      { header: 'Cantidad pendiente', key: 'cantidadPendiente' },
      { header: 'Almacén', key: 'whsCode' },
    ],
    orden.lineas,
    'Detalle ODC'
  )
}

function descargarExcelEntrada(entrada: EntradaMercaderiaResponse): void {
  downloadExcel(
    `Entrada_${entrada.docNum}.xlsx`,
    [
      { header: 'Línea Entrada', key: 'lineNum' },
      { header: 'ItemCode', key: 'itemCode', text: true },
      { header: 'Cantidad', key: 'quantity' },
      { header: 'OC BaseEntry', key: 'baseEntry' },
      { header: 'OC BaseLine', key: 'baseLine' },
    ],
    entrada.lineas,
    `Entrada ${entrada.docNum}`
  )
}

async function alternarEntradas(): Promise<void> {
  mostrarEntradas.value = !mostrarEntradas.value
  if (mostrarEntradas.value) {
    // Siempre se recarga al abrir (no se cachea entre toggles en el cliente): el backend ya
    // resuelve el cache-aside real (rapido si la ODC esta Cerrada), asi que no hay beneficio en
    // duplicar esa logica aqui, y se evita mostrar datos obsoletos de una ODC distinta.
    await ordenesCompraStore.cargarEntradasRelacionadas(docNum.value)
  }
}

async function iniciarPicking(): Promise<void> {
  if (!whsCodeSeleccionado.value) return
  errorPicking.value = null
  iniciandoPicking.value = true
  try {
    const sesion = await pickingStore.iniciar(docNum.value, whsCodeSeleccionado.value)
    if (!sesion) {
      errorPicking.value = pickingStore.error
      return
    }
    router.push({ name: 'recepcion-proveedores-picking', params: { sesionId: sesion.id } })
  } finally {
    iniciandoPicking.value = false
  }
}

onMounted(cargar)
watch(docNum, cargar)
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <VolverButton to="/recepcion-proveedores/buscar" title="Volver a la búsqueda" class="shrink-0 self-start mb-4" />

    <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
      <BuscarOdcBar
        :initial-doc-num="docNum"
        :loading="ordenesCompraStore.loading"
        @buscar-mismo-docnum="cargar"
      />
    </div>

    <LoadingSpinner
      v-if="ordenesCompraStore.loading"
      :message="
        consultaTardandoMasDeLoUsual
          ? 'SAP está respondiendo más lento de lo usual — seguimos esperando, esto puede tardar hasta 40 segundos.'
          : 'Consultando orden de compra...'
      "
    />

    <template v-else-if="ordenesCompraStore.orden">
      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
            ODC {{ ordenesCompraStore.orden.docNum }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ ordenesCompraStore.orden.proveedor }} · Estado: {{ ordenesCompraStore.orden.estado }}
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            :disabled="ordenesCompraStore.loading"
            class="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            @click="actualizarDesdeSap"
          >
            Actualizar desde SAP
          </button>
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            @click="descargarExcel"
          >
            Descargar Excel
          </button>
          <button
            type="button"
            :disabled="ordenesCompraStore.cargandoEntradas"
            class="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            @click="alternarEntradas"
          >
            {{ mostrarEntradas ? 'Ocultar entradas' : 'Entradas de Mercaderías Relacionadas' }}
          </button>
        </div>
      </div>

      <div v-if="mostrarEntradas" class="mb-6">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Entradas de Mercaderías Relacionadas con ODC Nº {{ ordenesCompraStore.orden.docNum }}
        </h2>
        <LoadingSpinner v-if="ordenesCompraStore.cargandoEntradas" message="Consultando entradas relacionadas..." />
        <p v-else-if="ordenesCompraStore.errorEntradas" class="text-sm text-red-600 dark:text-red-400">
          {{ ordenesCompraStore.errorEntradas }}
        </p>
        <p
          v-else-if="ordenesCompraStore.entradas.length === 0"
          class="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          No se encontraron entradas de mercadería relacionadas para esta ODC.
        </p>
        <div v-else class="flex flex-col gap-4">
          <div
            v-for="entrada in ordenesCompraStore.entradas"
            :key="entrada.docEntry"
            class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div class="px-4 py-2 flex flex-wrap items-center justify-between gap-2 bg-gray-50 dark:bg-gray-900">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Entrada DocNum {{ entrada.docNum }} | DocEntry {{ entrada.docEntry }} | Fecha {{ entrada.docDate }}
              </span>
              <button
                type="button"
                class="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                @click="descargarExcelEntrada(entrada)"
              >
                Descargar Excel
              </button>
            </div>
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Línea Entrada</th>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">ItemCode</th>
                  <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">OC BaseEntry</th>
                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">OC BaseLine</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="linea in entrada.lineas" :key="linea.lineNum">
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ linea.lineNum }}</td>
                  <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ linea.itemCode }}</td>
                  <td class="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">{{ linea.quantity }}</td>
                  <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ linea.baseEntry }}</td>
                  <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ linea.baseLine }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-if="puedeIniciarPicking" class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex flex-wrap items-end gap-3">
        <div v-if="whsCodesEnOrden.length > 1" class="flex flex-col gap-1">
          <label for="whs-select" class="text-xs font-medium text-gray-600 dark:text-gray-300">Almacén</label>
          <select
            id="whs-select"
            v-model="whsCodeSeleccionado"
            class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="" disabled>Selecciona un almacén</option>
            <option v-for="whs in whsCodesEnOrden" :key="whs" :value="whs">{{ whs }}</option>
          </select>
        </div>
        <button
          type="button"
          :disabled="!whsCodeSeleccionado || iniciandoPicking"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          @click="iniciarPicking"
        >
          <LoadingSpinner v-if="iniciandoPicking" layout="inline" size="sm" color="current" aria-label="Iniciando picking" />
          {{ iniciandoPicking ? 'Iniciando...' : 'Iniciar Picking' }}
        </button>
      </div>

      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Código</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Descripción</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Código de barras</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pendiente</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Almacén</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="linea in ordenesCompraStore.orden.lineas" :key="linea.lineNum">
              <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ linea.itemCode }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ linea.dscription }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ linea.codeBars }}</td>
              <td class="px-4 py-2 text-sm text-right text-gray-900 dark:text-white">{{ linea.quantity }}</td>
              <td class="px-4 py-2 text-sm text-right font-semibold text-gray-900 dark:text-white">{{ linea.cantidadPendiente }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ linea.whsCode }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <p v-else-if="ordenesCompraStore.error" class="text-sm text-red-600 dark:text-red-400">
      {{ ordenesCompraStore.error }}
    </p>

    <ErrorModal
      :open="!!errorPicking"
      title="No se pudo iniciar el picking"
      :message="errorPicking ?? ''"
      @close="errorPicking = null"
    />
  </div>
</template>
