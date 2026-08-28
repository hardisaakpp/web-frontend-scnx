import { defineStore } from 'pinia'
import { ref } from 'vue'
import recepcionApi from '../services/recepcionApi'
import type { FlowStatus, HistoryFilters, HistoryRow, PageParams, PagedResponse } from '../types'

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
/**
 * `<input type="date">` is a LOCAL calendar date. The backend's dateFrom/dateTo are DateTime
 * query params compared against MaterializedAtUtc (a UTC column) — sending a bare "YYYY-MM-DD"
 * lets ASP.NET's model binder parse it as UTC midnight, which under-includes the end-of-day
 * boundary for any timezone behind UTC (e.g. Ecuador, UTC-5). Build explicit local-day-start /
 * local-day-end ISO instants before sending, same correctness concern as the old client-side
 * toLocalDateBound, now applied to the outgoing request instead of a local filter predicate.
 */
function toLocalBoundIso(value: string, endOfDay: boolean): string {
  const match = DATE_ONLY_PATTERN.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  const d = endOfDay
    ? new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999)
    : new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0)
  return d.toISOString()
}

/**
 * Entering a transfer number takes over the search entirely and ignores the date range —
 * matches the legacy sc22 view's behavior. The backend ANDs dateFrom/dateTo/transferNumber
 * together (verified EfCoreReceptionTransferRepository.BuildFilteredQuery — no override logic
 * server-side), so to preserve this UX we simply omit the date params from the request when a
 * transfer number is present, instead of relying on the server to ignore them.
 */
function buildFilterParams(from: string | null, to: string | null, query: string): HistoryFilters {
  if (query) return { transferNumber: query }
  return {
    fromUtc: from ? toLocalBoundIso(from, false) : undefined,
    toUtc: to ? toLocalBoundIso(to, true) : undefined,
  }
}

/**
 * One "scope" (own warehouse vs. all warehouses) is identical in shape and behavior to the
 * other — only the fetch endpoint and the fetch-failure message differ. Factored out here so the
 * store below creates it twice instead of hand-duplicating rows/status/error/date range/paging/
 * GLPI-save/report-download state and actions per scope (was the source of the own/all
 * duplication this refactor collapses — see historyStore/HistoryView code-quality audit).
 */
function createHistoryScope(fetchHistoryFn: (filters: HistoryFilters, params: PageParams) => Promise<PagedResponse<HistoryRow>>, fetchErrorMessage: string) {
  const rows = ref<HistoryRow[]>([])
  const status = ref<FlowStatus>('ready')
  const error = ref<string | null>(null)
  const dateFrom = ref<string | null>(null)
  const dateTo = ref<string | null>(null)
  const transferNumberQuery = ref('')
  const page = ref(1)
  const pageSize = ref(20)
  const totalCount = ref(0)
  const isSubmitting = ref(false)

  async function fetchHistory(): Promise<void> {
    status.value = 'loading'
    error.value = null
    try {
      const result = await fetchHistoryFn(buildFilterParams(dateFrom.value, dateTo.value, transferNumberQuery.value), {
        pageNumber: page.value,
        pageSize: pageSize.value,
      })
      rows.value = result.items
      totalCount.value = result.totalCount
      status.value = 'ready'
    } catch {
      error.value = fetchErrorMessage
      status.value = 'error'
    }
  }

  /**
   * Explicitly searching by date range takes over from a leftover transfer-number query, mirroring
   * the reverse direction (typing a transfer number already overrides the date range in
   * {@link buildFilterParams}) — without this, a stale/incomplete transferNumberQuery would
   * silently keep winning over every subsequent date search until the input is manually cleared
   * back to ''.
   */
  function setDateRange(from: string | null, to: string | null): void {
    dateFrom.value = from
    dateTo.value = to
    transferNumberQuery.value = ''
    page.value = 1
    fetchHistory()
  }

  function setTransferNumberQuery(query: string): void {
    transferNumberQuery.value = query
    page.value = 1
    fetchHistory()
  }

  function setPage(newPage: number): void {
    page.value = newPage
    fetchHistory()
  }

  function setPageSize(newSize: number): void {
    pageSize.value = newSize
    page.value = 1
    fetchHistory()
  }

  async function updateGlpiTicket(transferId: number, glpiTicket: string): Promise<void> {
    error.value = null
    isSubmitting.value = true
    try {
      const updated = await recepcionApi.updateGlpiTicket(transferId, { glpiTicket })
      const idx = rows.value.findIndex((r) => r.transferId === transferId)
      if (idx !== -1) {
        rows.value[idx] = { ...rows.value[idx], glpiTicket: updated.glpiTicket }
      }
    } catch {
      error.value = 'No se pudo guardar el ticket GLPI.'
    } finally {
      isSubmitting.value = false
    }
  }

  /**
   * Per-row "Exportar Diferencias" action (legacy sc22's Acción column). One-shot, not tied to
   * any "active transfer" state — the caller passes the row's transferId directly, no guard needed.
   */
  async function downloadDifferencesReport(transferId: number): Promise<Blob | null> {
    error.value = null
    try {
      return await recepcionApi.downloadDifferencesReport(transferId)
    } catch {
      error.value = 'No se pudo descargar el reporte de diferencias.'
      return null
    }
  }

  return {
    rows,
    status,
    error,
    dateFrom,
    dateTo,
    transferNumberQuery,
    page,
    pageSize,
    totalCount,
    isSubmitting,
    fetchHistory,
    setDateRange,
    setTransferNumberQuery,
    setPage,
    setPageSize,
    updateGlpiTicket,
    downloadDifferencesReport,
  }
}

/**
 * Store-scoped history (GET history, warehouse-scoped by the backend's WarehouseAccessGuard) +
 * admin all-warehouses history (GET history/all + CSV export). Real server-side pagination AND
 * filtering as of api-recepcion-mercaderia's pagination change (verified against
 * HistoryController.cs: dateFrom/dateTo/transferNumber + pageNumber/pageSize all accepted
 * together). A new GET fires per page change AND per filter change — no client-side slicing.
 *
 * Own-warehouse and all-warehouses are two instances of the same {@link createHistoryScope} shape
 * — the public API below re-exposes each scope's state/actions under its historical name
 * (rows/allRows, setDateRange/setAllDateRange, etc.) so every existing consumer and test keeps
 * working against the exact same names, unaware the two scopes now share one implementation.
 */
export const useHistoryStore = defineStore('recepcionHistory', () => {
  const own = createHistoryScope(recepcionApi.getHistory, 'No se pudo cargar el historial.')
  const all = createHistoryScope(recepcionApi.getAllHistory, 'No se pudo cargar el historial de todos los almacenes.')

  /**
   * Admin-scope only — there is no store-scoped equivalent, so this stays outside
   * {@link createHistoryScope}. Export is deliberately unpaginated (verified:
   * ExportReceptionHistoryQuery takes no pageNumber/pageSize) — it exports everything matching the
   * current filter, not just the visible page.
   *
   * @returns the raw Blob so the caller can trigger the browser download, or null on failure so
   * the UI never presents a fake/empty download.
   */
  async function exportAllHistoryCsv(): Promise<Blob | null> {
    all.error.value = null
    try {
      return await recepcionApi.exportAllHistoryCsv(buildFilterParams(all.dateFrom.value, all.dateTo.value, all.transferNumberQuery.value))
    } catch {
      all.error.value = 'No se pudo exportar el archivo Excel.'
      return null
    }
  }

  /**
   * Own-scope export (GET history/export) — no recepcion.history.viewall required, the backend
   * scopes the file to the caller's own warehouses same as GET history. Separate from
   * exportAllHistoryCsv above for the same reason it stays outside {@link createHistoryScope}:
   * there is no store-scoped equivalent to generalize against.
   */
  async function exportHistoryCsv(): Promise<Blob | null> {
    own.error.value = null
    try {
      return await recepcionApi.exportHistoryCsv(buildFilterParams(own.dateFrom.value, own.dateTo.value, own.transferNumberQuery.value))
    } catch {
      own.error.value = 'No se pudo exportar el archivo Excel.'
      return null
    }
  }

  return {
    rows: own.rows,
    status: own.status,
    error: own.error,
    dateFrom: own.dateFrom,
    dateTo: own.dateTo,
    transferNumberQuery: own.transferNumberQuery,
    page: own.page,
    pageSize: own.pageSize,
    totalCount: own.totalCount,
    isSubmitting: own.isSubmitting,
    isSubmittingAdmin: all.isSubmitting,
    fetchHistory: own.fetchHistory,
    setDateRange: own.setDateRange,
    setTransferNumberQuery: own.setTransferNumberQuery,
    setPage: own.setPage,
    setPageSize: own.setPageSize,
    updateGlpiTicket: own.updateGlpiTicket,
    updateGlpiTicketAdmin: all.updateGlpiTicket,
    exportHistoryCsv,
    allRows: all.rows,
    allStatus: all.status,
    allError: all.error,
    allDateFrom: all.dateFrom,
    allDateTo: all.dateTo,
    allTransferNumberQuery: all.transferNumberQuery,
    allPage: all.page,
    allPageSize: all.pageSize,
    allTotalCount: all.totalCount,
    fetchAllHistory: all.fetchHistory,
    setAllDateRange: all.setDateRange,
    setAllTransferNumberQuery: all.setTransferNumberQuery,
    setAllPage: all.setPage,
    setAllPageSize: all.setPageSize,
    exportAllHistoryCsv,
    downloadDifferencesReport: own.downloadDifferencesReport,
    downloadDifferencesReportAdmin: all.downloadDifferencesReport,
  }
})
