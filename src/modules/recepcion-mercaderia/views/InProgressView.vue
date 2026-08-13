<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { usePickingStore } from '../stores/pickingStore'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import type { ReceptionTransferStatus } from '../types'
import PageJumpInput from '../components/PageJumpInput.vue'

const store = usePickingStore()
const search = ref('')

// resetInProgressAndFetch (not fetchInProgress) — the store is a Pinia singleton that outlives
// this view, so a leftover page from a previous visit must not silently re-apply on remount.
onMounted(() => {
  store.resetInProgressAndFetch()
})

// Real server-side pagination (verified InProgressTransfersController: pageNumber/pageSize
// only, NO filter query params). The search box can therefore only filter WITHIN the currently
// loaded page — it is not, and cannot be, a full-dataset search without a backend change. This
// is an honest limitation of the real endpoint, not a frontend shortcut.
const filteredTransfers = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return store.transfers
  return store.transfers.filter((t) => t.documentNumber.toLowerCase().includes(query))
})

const total = computed(() => store.totalCount)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / store.pageSize)))
const pageStart = computed(() => (total.value === 0 ? 0 : (store.page - 1) * store.pageSize + 1))
const pageEnd = computed(() => Math.min(store.page * store.pageSize, total.value))

function goToPage(newPage: number): void {
  store.setPage(newPage)
}

function changePageSize(newSize: number): void {
  store.setPageSize(newSize)
}

const STATUS_META: Record<ReceptionTransferStatus, { label: string; classes: string }> = {
  pending: { label: 'Pendiente', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  'in-progress': { label: 'En curso', classes: 'bg-blue-100 text-blue-700 border-blue-200' },
  confirmed: { label: 'Confirmada', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  error: { label: 'Error', classes: 'bg-red-100 text-red-700 border-red-200' },
}

function statusMeta(status: ReceptionTransferStatus) {
  return STATUS_META[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700 border-gray-200' }
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
          <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Transferencias en Curso</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Recepción y escaneo de mercadería.</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div class="text-sm text-gray-600 dark:text-gray-300 font-medium">
            Total encontrados: <span class="font-bold text-gray-900 dark:text-white">{{ total }}</span>
          </div>
          <input
            data-testid="search-input"
            v-model="search"
            type="text"
            placeholder="Buscar por documento..."
            class="w-full sm:w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition-all"
          />
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Documento</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Origen</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Destino</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              <template v-if="store.status === 'loading'">
                <tr v-for="i in 5" :key="i" class="animate-pulse">
                  <td v-for="j in 5" :key="j" class="px-4 py-3"><div class="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full"></div></td>
                </tr>
              </template>
              <tr v-else-if="filteredTransfers.length === 0">
                <td colspan="5" class="px-8 py-16 text-center text-gray-400 dark:text-gray-500">
                  <svg class="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="text-base font-medium">No hay transferencias en curso.</p>
                </td>
              </tr>
              <tr v-else v-for="t in filteredTransfers" :key="t.transferId" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{{ t.documentNumber }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ t.originWarehouseCode }}</td>
                <td class="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">{{ t.destinationWarehouseCode }}</td>
                <td class="px-4 py-3 text-sm">
                  <span :class="[statusMeta(t.status).classes, 'inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider']">
                    {{ statusMeta(t.status).label }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <router-link
                    :to="{ name: 'recepcion-detalle', params: { id: t.transferId } }"
                    class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors text-xs"
                  >
                    Ver detalle
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="total > 0" class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Mostrando <span class="font-medium">{{ pageStart }}</span> a <span class="font-medium">{{ pageEnd }}</span> de <span class="font-medium">{{ total }}</span>
            </span>
            <select
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
