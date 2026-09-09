<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdenesCompraStore } from '../stores/ordenesCompraStore'
import { usePickingStore } from '../stores/pickingStore'
import { downloadExcel } from '@/utils/exportExcel'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ErrorModal from '@/components/ErrorModal.vue'
import BuscarOdcBar from '../components/BuscarOdcBar.vue'

const route = useRoute()
const router = useRouter()
const ordenesCompraStore = useOrdenesCompraStore()
const pickingStore = usePickingStore()

const docNum = computed(() => Number(route.params.docNum))
const iniciandoPicking = ref(false)
const whsCodeSeleccionado = ref<string>('')
const errorPicking = ref<string | null>(null)

const whsCodesEnOrden = computed(() => {
  const codigos = ordenesCompraStore.orden?.lineas.map((l) => l.whsCode) ?? []
  return [...new Set(codigos)]
})

const puedeIniciarPicking = computed(() => ordenesCompraStore.orden?.estado === 'Pendiente')

watch(
  whsCodesEnOrden,
  (codigos) => {
    if (codigos.length === 1) whsCodeSeleccionado.value = codigos[0]!
    else if (!codigos.includes(whsCodeSeleccionado.value)) whsCodeSeleccionado.value = ''
  },
  { immediate: true }
)

async function cargar(): Promise<void> {
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
  <div class="max-w-4xl mx-auto py-8 px-4">
    <div class="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
      <BuscarOdcBar />
    </div>

    <LoadingSpinner v-if="ordenesCompraStore.loading" message="Consultando orden de compra..." />

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
            class="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="descargarExcel"
          >
            Descargar Excel
          </button>
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
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          @click="iniciarPicking"
        >
          Iniciar Picking
        </button>
      </div>

      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Código</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Descripción</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cantidad</th>
              <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pendiente</th>
              <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Almacén</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="linea in ordenesCompraStore.orden.lineas" :key="linea.lineNum">
              <td class="px-4 py-2 text-sm text-gray-900 dark:text-white">{{ linea.itemCode }}</td>
              <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ linea.dscription }}</td>
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
