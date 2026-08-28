import { defineStore } from 'pinia'
import { ref } from 'vue'
import recepcionApi from '../services/recepcionApi'
import { backendErrorMessage } from '../utils/apiErrorMapper'
import type { FlowStatus, ReceptionTransfer } from '../types'

/**
 * "En Curso" list + pagination — split out of pickingStore.ts (SOLID/SRP audit): this concern
 * (fetch/paginate the in-progress list) is unrelated to the detail/picking workflow that used to
 * live in the same store, and the two were only ever consumed by different views
 * (InProgressView.vue here vs. TransferDetailView.vue for the rest of the old pickingStore).
 */
export const useInProgressStore = defineStore('recepcionInProgress', () => {
  const transfers = ref<ReceptionTransfer[]>([])
  // Real server-side pagination (verified InProgressTransfersController: pageNumber/pageSize
  // only, NO filter query params — the view's search box can only filter the loaded page).
  const page = ref(1)
  const pageSize = ref(20)
  const totalCount = ref(0)
  const status = ref<FlowStatus>('ready')
  const fetchError = ref<string | null>(null)

  async function fetchInProgress(): Promise<void> {
    status.value = 'loading'
    fetchError.value = null
    try {
      const result = await recepcionApi.getInProgressTransfers({ pageNumber: page.value, pageSize: pageSize.value })
      transfers.value = result.items
      totalCount.value = result.totalCount
      status.value = 'ready'
    } catch (err) {
      console.error('fetchInProgress failed', err)
      fetchError.value = backendErrorMessage(err, 'No se pudo cargar la lista de transferencias en curso.')
      status.value = 'error'
    }
  }

  function setPage(newPage: number): void {
    page.value = newPage
    fetchInProgress()
  }

  function setPageSize(newSize: number): void {
    pageSize.value = newSize
    page.value = 1
    fetchInProgress()
  }

  /**
   * The store is a Pinia singleton and outlives InProgressView — without this, leaving the view
   * on e.g. page 6 and coming back would silently re-fetch page 6 again instead of starting
   * fresh, even though nothing on screen suggests the list remembers where you left it. Views
   * should call this instead of fetchInProgress() directly in onMounted.
   */
  function resetInProgressAndFetch(): void {
    page.value = 1
    fetchInProgress()
  }

  return {
    transfers,
    page,
    pageSize,
    totalCount,
    status,
    fetchError,
    fetchInProgress,
    setPage,
    setPageSize,
    resetInProgressAndFetch,
  }
})
