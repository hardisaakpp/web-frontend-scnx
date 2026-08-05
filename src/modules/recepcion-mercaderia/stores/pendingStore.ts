import { defineStore } from 'pinia'
import { ref } from 'vue'
import recepcionApi from '../services/recepcionApi'
import { featureReadiness } from '../config/featureReadiness'
import type { FlowStatus, PendingTransferLine } from '../types'

/**
 * Pending-transfers list + materialize. Live against api-middleware-sap today
 * (featureReadiness.pendingTransfersReady: true — confirmed working, see featureReadiness.ts).
 * The 'degraded' status/guard clauses below are a kill switch, not dead code: flipping that flag
 * back to false starts the flow 'degraded' and makes fetchPending/materialize no-op instead of
 * issuing a live call (see design.md "Error / Degraded-State Handling").
 */
export const usePendingStore = defineStore('recepcionPending', () => {
  const status = ref<FlowStatus>(featureReadiness.pendingTransfersReady ? 'ready' : 'degraded')
  const transfers = ref<PendingTransferLine[]>([])
  const error = ref<string | null>(null)
  // In-flight flag for materialize, so the view can disable the button and avoid duplicate
  // materialize POSTs from fast double-clicks.
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
   * Pending lines have no numeric id — keyed by (sapTransferRequestNumber, itemCode). Materialize
   * needs the SAP request number + the destination warehouse to materialize into.
   */
  async function materialize(sapTransferRequestNumber: string, warehouseCode: string): Promise<void> {
    if (status.value === 'degraded') return

    isSubmitting.value = true
    try {
      await recepcionApi.materializePendingTransfer(sapTransferRequestNumber, warehouseCode)
      transfers.value = transfers.value.filter((t) => t.sapTransferRequestNumber !== sapTransferRequestNumber)
    } catch {
      error.value = 'No se pudo materializar la transferencia.'
      status.value = 'error'
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
    setPage,
    setPageSize,
    setSearchQuery,
    materialize,
  }
})
