<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOdcFragmentadasStore } from '../stores/odcFragmentadasStore'
import { usePickingStore } from '../stores/pickingStore'
import SkeletonTable from '@/components/feedback/SkeletonTable.vue'
import ErrorModal from '@/components/modales/ErrorModal.vue'
import VolverButton from '@/components/navegacion/VolverButton.vue'

const store = useOdcFragmentadasStore()
const pickingStore = usePickingStore()
const router = useRouter()

const docNumInput = ref<number | null>(null)
const whsCodeInput = ref('')
const continuando = ref<string | null>(null)
const errorContinuar = ref<string | null>(null)

function claveFila(docNum: number, whsCode: string): string {
  return `${docNum}-${whsCode}`
}

async function buscar(): Promise<void> {
  await store.buscar({ docNum: docNumInput.value, whsCode: whsCodeInput.value.trim() || null })
}

function limpiar(): void {
  docNumInput.value = null
  whsCodeInput.value = ''
  buscar()
}

async function continuar(docNum: number, whsCode: string): Promise<void> {
  const clave = claveFila(docNum, whsCode)
  continuando.value = clave
  try {
    const sesion = await pickingStore.iniciar(docNum, whsCode)
    if (!sesion) {
      errorContinuar.value = pickingStore.error
      await buscar()
      return
    }
    router.push({ name: 'recepcion-proveedores-picking', params: { sesionId: sesion.id } })
  } finally {
    continuando.value = null
  }
}

onMounted(buscar)
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <VolverButton to="/recepcion-proveedores" title="Volver" class="shrink-0 self-start mb-4" />

    <h1 class="text-xl font-semibold text-gray-900 dark:text-white mb-1">En Curso/Picking</h1>
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
      Órdenes de compra con picking parcial ya integrado a SAP, pendientes de completar en tus almacenes.
    </p>

    <form class="flex flex-wrap items-end gap-3 mb-6" @submit.prevent="buscar">
      <div>
        <label for="fragmentadas-docnum-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">DocNum (opcional)</label>
        <input
          id="fragmentadas-docnum-input"
          v-model.number="docNumInput"
          type="number"
          placeholder="Nro ODC"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label for="fragmentadas-whscode-input" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Almacén (opcional)</label>
        <input
          id="fragmentadas-whscode-input"
          v-model="whsCodeInput"
          type="text"
          placeholder="Cód. almacén"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
        />
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
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">DocNum</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Proveedor</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Almacén</th>
            <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pendiente</th>
            <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Última integración</th>
            <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-for="fila in store.fragmentadas" :key="claveFila(fila.docNum, fila.whsCode)">
            <td class="px-4 py-2 text-sm">
              <RouterLink
                :to="{ name: 'recepcion-proveedores-detalle', params: { docNum: fila.docNum } }"
                class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {{ fila.docNum }}
              </RouterLink>
            </td>
            <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ fila.cardName ?? '—' }}</td>
            <td class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{{ fila.whsCode }}</td>
            <td class="px-4 py-2 text-sm text-right font-semibold text-gray-900 dark:text-white">{{ fila.openQtyRestante }}</td>
            <td class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{{ new Date(fila.ultimaIntegracion).toLocaleString() }}</td>
            <td class="px-4 py-2 text-right">
              <button
                type="button"
                :disabled="continuando === claveFila(fila.docNum, fila.whsCode)"
                class="px-3 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                @click="continuar(fila.docNum, fila.whsCode)"
              >
                {{ continuando === claveFila(fila.docNum, fila.whsCode) ? 'Continuando...' : 'Continuar' }}
              </button>
            </td>
          </tr>
          <tr v-if="store.fragmentadas.length === 0">
            <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay órdenes de compra con recepción parcial pendiente.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ErrorModal :open="!!store.error" title="No se pudo cargar el listado" :message="store.error ?? ''" @close="store.limpiarError()" />
    <ErrorModal :open="!!errorContinuar" title="No se pudo continuar el picking" :message="errorContinuar ?? ''" @close="errorContinuar = null" />
  </div>
</template>
