import { defineStore } from 'pinia'
import { ref } from 'vue'
import recepcionApi from '../services/recepcionApi'
import { featureReadiness } from '../config/featureReadiness'
import type { FlowStatus, PendingTransferLine } from '../types'

/**
 * Pending-transfers list + receive. Live against api-middleware-sap today
 * (featureReadiness.pendingTransfersReady: true — confirmed working, see featureReadiness.ts).
 * The 'degraded' status/guard clauses below are a kill switch, not dead code: flipping that flag
 * back to false starts the flow 'degraded' and makes fetchPending/receive no-op instead of
 * issuing a live call (see design.md "Error / Degraded-State Handling").
 */
export const usePendingStore = defineStore('recepcionPending', () => {
  const status = ref<FlowStatus>(featureReadiness.pendingTransfersReady ? 'ready' : 'degraded')
  const transfers = ref<PendingTransferLine[]>([])
  const error = ref<string | null>(null)
  // In-flight flag for receive, so the view can disable the button and avoid duplicate
  // receive POSTs from fast double-clicks.
  const isSubmitting = ref(false)
  // Real server-side pagination (verified ListPendingTransferRequestsQuery: pageNumber/pageSize,
  // same PagedResponse envelope/clamping as in-progress/history).
  const page = ref(1)
  const pageSize = ref(20)
  const totalCount = ref(0)
  // Server-side search filter (document number / item code / description, case-insensitive —
  // see ListPendingTransferRequestsQuery). Same shape as historyStore's transferNumberQuery.
  const searchQuery = ref('')

  async function fetchPending(): Promise<void> {
    if (status.value === 'degraded') return

    status.value = 'loading'
    error.value = null
    try {
      const result = await recepcionApi.getPendingTransfers({
        pageNumber: page.value,
        pageSize: pageSize.value,
        search: searchQuery.value || undefined,
      })
      transfers.value = result.items
      totalCount.value = result.totalCount
      status.value = 'ready'
    } catch {
      error.value = 'No se pudo cargar la lista de transferencias pendientes.'
      status.value = 'error'
    }
  }

  function setPage(newPage: number): void {
    page.value = newPage
    fetchPending()
  }

  function setPageSize(newSize: number): void {
    pageSize.value = newSize
    page.value = 1
    fetchPending()
  }

  function setSearchQuery(value: string): void {
    searchQuery.value = value
    page.value = 1
    fetchPending()
  }

  /**
   * The store outlives the view (Pinia singleton), so a leftover search/page from a previous
   * visit would otherwise silently apply again on the next mount — e.g. a search for a
   * nonexistent code, or a page far into the list, both surviving a trip to another route and
   * back even though the visible input/page control look reset. Views should call this instead
   * of fetchPending() directly in onMounted.
   */
  function resetAndFetch(): void {
    page.value = 1
    searchQuery.value = ''
    fetchPending()
  }

  /**
   * Pending lines have no numeric id — keyed by (sapTransferRequestNumber, itemCode). Receive
   * needs the SAP request number + the destination warehouse to materialize into.
   */
  async function receive(sapTransferRequestNumber: string, warehouseCode: string): Promise<number | undefined> {
    if (status.value === 'degraded') return undefined

    isSubmitting.value = true
    try {
      const transferId = await recepcionApi.materializePendingTransfer(sapTransferRequestNumber, warehouseCode)
      // Re-fetch the current page from the server instead of splicing the local array: a
      // transfer can have several item lines, each its own row, so removing them client-side
      // left totalCount stale and, if every row on the current page belonged to that transfer,
      // the page rendered empty instead of being replenished from the server's real next batch.
      await fetchPending()
      // The page just received could have been the last one and is now empty (e.g. every
      // row on it belonged to this transfer) — step back instead of stranding the user on a
      // blank page while real data still exists earlier in the list.
      if (transfers.value.length === 0 && page.value > 1) {
        page.value -= 1
        await fetchPending()
      }
      return transferId
    } catch {
      error.value = 'No se pudo recibir la transferencia.'
      status.value = 'error'
      return undefined
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    status,
    transfers,
    error,
    isSubmitting,
    page,
    pageSize,
    totalCount,
    searchQuery,
    fetchPending,
    resetAndFetch,
    setPage,
    setPageSize,
    setSearchQuery,
    receive,
  }
})
