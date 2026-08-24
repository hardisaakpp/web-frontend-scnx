<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePendingStore } from '../stores/pendingStore'
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import PageJumpInput from '../components/PageJumpInput.vue'

const store = usePendingStore()
const router = useRouter()

// resetAndFetch (not fetchPending) — the store is a Pinia singleton that outlives this view, so
// a leftover search/page from a previous visit must not silently re-apply on remount.
onMounted(() => {
  store.resetAndFetch()
})

// Receiving is a real, irreversible-from-the-UI mutating action (creates a ReceptionTransfer,
// consumes the pending SAP request) — legacy (recL.php) required a confirm() before the POST for
// the same reason. Route the click through a dialog instead of firing the mutation directly.
const receiveTarget = ref<{ sapTransferRequestNumber: string; warehouseCode: string; documentNumber: string } | null>(null)

const handleReceive = (sapTransferRequestNumber: string, warehouseCode: string, documentNumber: string) => {
  if (store.status === 'degraded') return
  receiveTarget.value = { sapTransferRequestNumber, warehouseCode, documentNumber }
}

async function confirmReceive(): Promise<void> {
  if (!receiveTarget.value) return
  const { sapTransferRequestNumber, warehouseCode } = receiveTarget.value
  receiveTarget.value = null
  const transferId = await store.receive(sapTransferRequestNumber, warehouseCode)
  if (transferId !== undefined) {
    router.push({ name: 'recepcion-detalle', params: { id: transferId } })
  }
}

function cancelReceive(): void {
  receiveTarget.value = null
}

// Real server-side pagination — same pattern as InProgressView/HistoryView.
const totalPages = computed(() => Math.max(1, Math.ceil(store.totalCount / store.pageSize)))
const pageStart = computed(() => (store.totalCount === 0 ? 0 : (store.page - 1) * store.pageSize + 1))
const pageEnd = computed(() => Math.min(store.page * store.pageSize, store.totalCount))

function goToPage(newPage: number): void {
  store.setPage(newPage)
}

function changePageSize(newSize: number): void {
  store.setPageSize(newSize)
}

// Debounced search box (mirrors HistoryView's transfer-number debounce): a keystroke schedules
// a 300ms-delayed server-side GET, while the explicit "Buscar" button applies the current input
// value immediately (e.g. right after pasting a document number).
const searchInput = ref('')
let searchDebounce: ReturnType<typeof setTimeout> | undefined

function onSearchInput(value: string): void {
  searchInput.value = value
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    store.setSearchQuery(value)
  }, 300)
}

function applySearch(): void {
  if (searchDebounce) clearTimeout(searchDebounce)
  store.setSearchQuery(searchInput.value)
}
</script>

<template>
  <div class="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="space-y-4">
      <div class="flex items-center gap-4">
        <RouterLink
          data-testid="back-btn"
          to="/recepcion-mercaderia"
          class="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0"
          aria-label="Volver a Recepción Mercadería"
        >
          <ArrowLeftIcon class="w-5 h-5" />
        </RouterLink>
        <div>
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Transferencias Pendientes</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Recepción de traslados pendientes desde SAP.</p>
        </div>
      </div>

      <!-- Kill-switch banner: only reachable if featureReadiness.pendingTransfersReady is flipped back
           to false (currently true, so this branch doesn't render today) — see pendingStore.ts. -->
      <template v-if="store.status === 'degraded'">
        <div class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-6 flex items-start gap-4">
          <ExclamationTriangleIcon class="w-8 h-8 text-amber-500 dark:text-amber-400 shrink-0" />
          <div>
            <h2 class="text-lg font-bold text-amber-800 dark:text-amber-400">Próximamente</h2>
            <p class="text-sm text-amber-700 dark:text-amber-500 mt-1">
              Esta función está bloqueada por la integración con SAP. Estará disponible próximamente.
            </p>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div class="text-sm text-gray-600 dark:text-gray-300 font-medium">
            Total encontrados: <span class="font-bold text-gray-900 dark:text-white">{{ store.totalCount }}</span>
          </div>
          <div class="flex items-center gap-2">
            <label for="pending-search-input" class="sr-only">Buscar transferencias pendientes</label>
            <input
              id="pending-search-input"
              data-testid="pending-search-input"
              type="text"
              placeholder="Buscar por documento, artículo o descripción"
              class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none"
              @input="onSearchInput(($event.target as HTMLInputElement).value)"
            />
            <button
              data-testid="pending-search-btn"
              type="button"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
              @click="applySearch"
            >
              Buscar
            </button>
          </div>
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Documento</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Artículo</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Origen</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Destino</th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cant.</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              <template v-if="store.status === 'loading'">
                <tr v-for="i in 5" :key="i" class="animate-pulse">
                  <td v-for="j in 7" :key="j" class="px-4 py-3"><div class="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div></td>
                </tr>
              </template>
              <tr v-else-if="store.transfers.length === 0">
                <td colspan="7" class="px-8 py-16 text-center text-gray-400 dark:text-gray-500">
                  <svg class="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                  </svg>
                  <p class="text-base font-medium">No hay transferencias pendientes.</p>
                </td>
              </tr>
              <tr
                v-else
                v-for="t in store.transfers"
                :key="`${t.sapTransferRequestNumber}-${t.itemCode}`"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ t.sapTransferRequestNumber }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ t.sapDocumentDate }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ t.itemCode }} — {{ t.description }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ t.originWarehouseCode }}</td>
                <td class="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{{ t.destinationWarehouseCode }}</td>
                <td class="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">{{ t.openQuantity }}</td>
                <td class="px-4 py-3 text-right">
                  <button
                    type="button"
                    data-testid="materialize-btn"
                    class="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="store.isSubmitting"
                    @click="handleReceive(t.sapTransferRequestNumber, t.destinationWarehouseCode, t.sapTransferRequestNumber)"
                  >
                    Recibir
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="store.totalCount > 0" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span class="font-medium">{{ pageStart }}</span> a <span class="font-medium">{{ pageEnd }}</span> de <span class="font-medium">{{ store.totalCount }}</span>
            </span>
            <label for="pending-page-size" class="sr-only">Filas por página</label>
            <select
              id="pending-page-size"
              data-testid="pagination-page-size"
              :value="store.pageSize"
              class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition-all cursor-pointer"
              @change="changePageSize(Number(($event.target as HTMLSelectElement).value))"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              data-testid="pagination-prev"
              class="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              :disabled="store.page === 1"
              @click="goToPage(store.page - 1)"
            >
              Anterior
            </button>
            <PageJumpInput :page="store.page" :total-pages="totalPages" @go="goToPage" />
            <button
              type="button"
              data-testid="pagination-next"
              class="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              :disabled="store.page >= totalPages"
              @click="goToPage(store.page + 1)"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
      </template>
    </div>

    <ConfirmDialog
      :open="receiveTarget !== null"
      title="Recibir transferencia"
      :message="receiveTarget ? `¿Desea proceder a recibir la transferencia número ${receiveTarget.documentNumber}?` : ''"
      confirm-label="Recibir"
      @confirm="confirmReceive"
      @cancel="cancelReceive"
    />
  </div>
</template>
