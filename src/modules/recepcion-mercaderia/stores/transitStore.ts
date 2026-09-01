import { defineStore } from 'pinia'
import { ref } from 'vue'
import recepcionApi from '../services/recepcionApi'
import type { FlowStatus, TransitPendingTransfer } from '../types'

/**
 * Read-only report: pending SAP transfer requests routed through a transit warehouse. No
 * receive/materialize action here — that stays exclusive to pendingStore's own list.
 */
export const useTransitStore = defineStore('recepcionTransit', () => {
  const status = ref<FlowStatus>('ready')
  const transfers = ref<TransitPendingTransfer[]>([])
  const error = ref<string | null>(null)
  const page = ref(1)
  const pageSize = ref(20)
  const totalCount = ref(0)
  // Server-side search filter (transferencia o bodega transitoria) — added on the same backend
  // branch as this endpoint's search param, same shape as pendingStore's own searchQuery.
  const searchQuery = ref('')

  async function fetchTransit(): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      const result = await recepcionApi.getTransitTransfers({
        pageNumber: page.value,
        pageSize: pageSize.value,
        search: searchQuery.value || undefined,
      })
      transfers.value = result.items
      totalCount.value = result.totalCount
      status.value = 'ready'
    } catch {
      error.value = 'No se pudo cargar el listado de transferencias en tránsito.'
      status.value = 'error'
    }
  }

  function setPage(newPage: number): void {
    page.value = newPage
    fetchTransit()
  }

  function setPageSize(newSize: number): void {
    pageSize.value = newSize
    page.value = 1
    fetchTransit()
  }

  function setSearchQuery(query: string): void {
    searchQuery.value = query
    page.value = 1
    fetchTransit()
  }

  // The store is a Pinia singleton that outlives this view — reset the page/search before
  // fetching so a leftover filter from a previous visit doesn't silently re-apply on remount
  // (same reasoning as pendingStore's resetAndFetch).
  function resetAndFetch(): void {
    page.value = 1
    searchQuery.value = ''
    fetchTransit()
  }

  async function downloadTransitReport(): Promise<Blob | null> {
    error.value = null
    try {
      return await recepcionApi.downloadTransitReport()
    } catch {
      error.value = 'No se pudo descargar el reporte de transferencias en tránsito.'
      return null
    }
  }

  return {
    status,
    transfers,
    error,
    page,
    pageSize,
    totalCount,
    searchQuery,
    fetchTransit,
    resetAndFetch,
    setPage,
    setPageSize,
    setSearchQuery,
    downloadTransitReport,
  }
})
