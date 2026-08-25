<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTransitStore } from '../stores/transitStore'
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/vue/24/outline'
import PageJumpInput from '../components/PageJumpInput.vue'
import { triggerBlobDownload } from '../utils/downloadBlob'

const store = useTransitStore()

onMounted(() => {
  store.resetAndFetch()
})

// Unpaginated export (2 sheets: Documentos + Detalle) — independent of the on-screen page/size.
async function handleDownloadReport(): Promise<void> {
  const blob = await store.downloadTransitReport()
  if (!blob) return
  triggerBlobDownload(blob, 'transferencias-transito.xlsx')
}

// Real server-side search (GET /pending-transfers/transit?search=...), same debounced-keystroke +
// explicit-button pattern as PendingTransfersView's own search — a keystroke schedules a
// 300ms-delayed GET, while "Buscar" applies the current input immediately.
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

// Real server-side pagination — same pattern as PendingTransfersView/InProgressView.
const totalPages = computed(() => Math.max(1, Math.ceil(store.totalCount / store.pageSize)))
const pageStart = computed(() => (store.totalCount === 0 ? 0 : (store.page - 1) * store.pageSize + 1))
const pageEnd = computed(() => Math.min(store.page * store.pageSize, store.totalCount))

function goToPage(newPage: number): void {
  store.setPage(newPage)
}

function changePageSize(newSize: number): void {
  store.setPageSize(newSize)
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Transferencias en Tránsito</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Transferencias pendientes de SAP con destino a una bodega transitoria.</p>
        </div>
      </div>

      <div
        v-if="store.status === 'error'"
        role="alert"
        class="py-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-4 border border-red-200 dark:border-red-800"
      >
        {{ store.error }}
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div class="text-sm text-gray-600 dark:text-gray-300 font-medium">
            Total encontrados: <span class="font-bold text-gray-900 dark:text-white">{{ store.totalCount }}</span>
          </div>
          <div class="flex items-center gap-2">
            <label for="transit-search-input" class="sr-only">Buscar transferencias en tránsito</label>
            <input
              id="transit-search-input"
              data-testid="search-input"
              type="text"
              placeholder="Buscar por N.° transferencia o destino..."
              class="w-full sm:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition-all"
              @input="onSearchInput(($event.target as HTMLInputElement).value)"
            />
            <button
              data-testid="search-btn"
              type="button"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium shrink-0"
              @click="applySearch"
            >
              Buscar
            </button>
            <button
              type="button"
              data-testid="download-transit-report-btn"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 transition-colors shadow-sm shrink-0"
              @click="handleDownloadReport"
            >
              <DocumentArrowDownIcon class="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th class="px-3 py-1.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">N.° Transferencia</th>
                <th class="px-3 py-1.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Destino (transitoria)</th>
                <th class="px-3 py-1.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cantidad</th>
                <th class="px-3 py-1.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              <template v-if="store.status === 'loading'">
                <tr v-for="i in 5" :key="i" class="animate-pulse">
                  <td v-for="j in 4" :key="j" class="px-3 py-1"><div class="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div></td>
                </tr>
              </template>
              <tr v-else-if="store.transfers.length === 0">
                <td colspan="4" class="px-8 py-10 text-center text-gray-400 dark:text-gray-500">
                  <svg class="w-10 h-10 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zM18 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                  </svg>
                  <p class="text-sm font-medium">No hay transferencias en tránsito.</p>
                </td>
              </tr>
              <tr
                v-else
                v-for="t in store.transfers"
                :key="t.sapTransferRequestNumber"
                data-testid="transit-row"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td class="px-3 py-1 text-sm font-medium text-gray-900 dark:text-white">{{ t.sapTransferRequestNumber }}</td>
                <td class="px-3 py-1 text-sm font-semibold text-blue-600 dark:text-blue-400">{{ t.transitWarehouseCode }}</td>
                <td class="px-3 py-1 text-sm font-semibold text-gray-900 dark:text-white">{{ t.quantity }}</td>
                <td class="px-3 py-1 text-sm text-gray-600 dark:text-gray-300">{{ t.sapDocumentDate }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="store.totalCount > 0" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span class="font-medium">{{ pageStart }}</span> a <span class="font-medium">{{ pageEnd }}</span> de <span class="font-medium">{{ store.totalCount }}</span>
            </span>
            <label for="transit-page-size" class="sr-only">Filas por página</label>
            <select
              id="transit-page-size"
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
    </div>
  </div>
</template>
