import { defineStore } from 'pinia'
import { ref } from 'vue'
import recepcionApi from '../services/recepcionApi'
import type {
  ConfirmTransferRequest,
  Difference,
  FlowStatus,
  ReceptionLine,
  ReceptionTransfer,
  RecordDifferenceRequest,
  SaveScanProgressRequest,
} from '../types'

const SAP_ERROR_MESSAGE =
  'No se pudo integrar la transferencia a SAP. Los escaneos se guardaron; reintentá cuando el servicio esté disponible.'

/**
 * KNOWN LIMITATION: this treats ANY HTTP 500 from confirm() as the benign "SAP integration not
 * ready" case. Verified against api-recepcion-mercaderia today (ReceptionExceptionHandler.cs +
 * ConfirmReceptionTransferCommand.cs): a controlled "SAP call returned a non-success result" is
 * mapped to 422 UnprocessableEntity, not 500. A 500 only happens when the SAP call throws an
 * UNHANDLED exception (e.g. api-middleware-sap being unreachable/not-yet-built, via
 * MiddlewareSapHttpClient's EnsureSuccessStatusCode()) — and the generic exception handler maps
 * that, and literally any other unrelated unhandled exception, to the exact same
 * `{ error: "An unexpected error occurred." }` / 500 response with no distinguishing field (no
 * error code/type). There is currently no reliable signal to tell "SAP not ready" apart from a
 * genuine unrelated backend crash on confirm — this check is a deliberate approximation, not a
 * verified one. Revisit if/when the backend adds a distinguishing error code for this case.
 */
function isSapFiveHundred(err: unknown): boolean {
  return (err as { response?: { status?: number } })?.response?.status === 500
}

/**
 * Two distinct backend error shapes reach here: ReceptionExceptionHandler.cs's generic unhandled-
 * exception replies { error: message } (real/actionable for 400/403/404; always the same
 * non-actionable "An unexpected error occurred." for a 500, so that case falls back below instead
 * of parroting the generic English string). But confirm() specifically can also return 422 with
 * ConfirmReceptionTransferResult's own shape { success, sapDocEntry, sapDocNum, message } — e.g.
 * the real SAP/middleware rejection detail (ConfirmReceptionTransferCommand ->
 * MiddlewareSapHttpClient's StockTransferResult.Message). Check both field names, error takes
 * precedence since the exception-handler shape is more common across this store's other actions.
 */
function backendErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { status?: number; data?: { error?: unknown; message?: unknown } } })?.response
  if (response?.status === 500) return fallback
  const message = response?.data?.error ?? response?.data?.message
  return typeof message === 'string' && message.trim() !== '' ? message : fallback
}

/**
 * In-progress list, transfer detail/scan/confirm/differences/GLPI/report. confirm()'s SAP step
 * goes through api-middleware-sap's /stock-transfers/based-on-document — see confirm() below.
 */
export const usePickingStore = defineStore('recepcionPicking', () => {
  const transfers = ref<ReceptionTransfer[]>([])
  // Real server-side pagination (verified InProgressTransfersController: pageNumber/pageSize
  // only, NO filter query params — the view's search box can only filter the loaded page).
  const page = ref(1)
  const pageSize = ref(20)
  const totalCount = ref(0)
  const currentTransfer = ref<ReceptionTransfer | null>(null)
  const status = ref<FlowStatus>('ready')
  // Split by concern: fetchError covers the two read/load actions (fetchInProgress, fetchTransfer)
  // and gates the inline "couldn't load" banner; actionError covers the 7 mutating actions taken on
  // an already-loaded transfer and feeds the ErrorDialog modal alongside sapErrorMessage. Kept apart
  // so a fetch failure can never accidentally pop the action-error modal (or vice versa).
  const fetchError = ref<string | null>(null)
  const actionError = ref<string | null>(null)
  const sapErrorMessage = ref<string | null>(null)
  // Loaded fresh from the server on every fetchTransfer/scan/recordDifference re-fetch (GET
  // /transfers/{id} returns { transfer, differences } — there is no separate GET-differences
  // endpoint, this IS the source of truth), plus locally filtered on a successful deleteDifference.
  const differences = ref<Difference[]>([])
  // Single in-flight flag shared by all mutating actions (scan/confirm/recordDifference/
  // deleteDifference/updateGlpiTicket) so views can disable their action buttons and avoid
  // duplicate POSTs from fast double-clicks.
  const isSubmitting = ref(false)
  // Identity of the transfer the user is currently viewing/acting on. Set synchronously at the
  // START of fetchTransfer, before the request goes out. Every mutating/fetching action below
  // re-checks this AFTER each await: if the user has since navigated to a different transfer
  // (activeTransferId changed), the action's result is stale and must be discarded instead of
  // being written into currentTransfer/differences/sapErrorMessage — otherwise a late response
  // for transfer A can silently overwrite transfer B's freshly-loaded state.
  const activeTransferId = ref<number | null>(null)
  // Forced-recount gate for partial confirm (parity with legacy recP.php's crearTransferencia()):
  // the first "Confirmar parcial" attempt on a transfer with any incomplete line must block and
  // force a recount instead of confirming; only the second attempt is allowed through. Reset per
  // transfer alongside the other per-transfer state below.
  const hasRecounted = ref(false)

  /** Cantidad/Escaneados/Diferencia are computed client-side, never trusted from the API. */
  function lineDiferencia(line: ReceptionLine): number {
    return line.quantity - line.scanned
  }

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

  async function fetchTransfer(transferId: number): Promise<void> {
    // Mark this transfer as the active one BEFORE the request goes out, so a concurrent,
    // slower-resolving fetch for a previous/different transferId can detect it is stale once it
    // resolves and discard its result instead of overwriting this one.
    activeTransferId.value = transferId
    // Reset synchronously so a component reused across a route change (e.g. transfer A -> B)
    // never renders A's stale differences/SAP-error banner while B's fetch is in flight.
    currentTransfer.value = null
    differences.value = []
    sapErrorMessage.value = null
    hasRecounted.value = false
    status.value = 'loading'
    fetchError.value = null
    // A fresh transfer load must also clear any lingering action-error modal from whatever was
    // previously being viewed - otherwise a stale ErrorDialog could pop over the newly-loading page.
    actionError.value = null
    // Also reset the shared submit flag here: it's the only place activeTransferId changes, so a
    // mutation left in flight for the previous transfer (whose own guarded `finally` will no-op
    // once activeTransferId no longer matches it) would otherwise leave isSubmitting stuck at
    // true forever, permanently disabling every mutating button on the new transfer's view.
    isSubmitting.value = false
    try {
      const result = await recepcionApi.getTransfer(transferId)
      if (activeTransferId.value !== transferId) return
      currentTransfer.value = result.transfer
      differences.value = result.differences
      status.value = 'ready'
    } catch (err) {
      if (activeTransferId.value !== transferId) return
      console.error('fetchTransfer failed', err)
      fetchError.value = backendErrorMessage(err, 'No se pudo cargar el detalle de la transferencia.')
      status.value = 'error'
      currentTransfer.value = null
    }
  }

  /**
   * Real endpoint returns 204 No Content (no updated line back) — re-fetch the transfer after a
   * successful POST to pick up the new scanned totals, same discard-if-stale discipline as every
   * other mutating action here.
   */
  async function scan(body: SaveScanProgressRequest): Promise<void> {
    if (!currentTransfer.value) return
    const transferId = currentTransfer.value.transferId

    actionError.value = null
    isSubmitting.value = true
    try {
      await recepcionApi.scan(transferId, body)
      if (activeTransferId.value !== transferId) return
      const result = await recepcionApi.getTransfer(transferId)
      if (activeTransferId.value !== transferId) return
      currentTransfer.value = result.transfer
    } catch (err) {
      if (activeTransferId.value !== transferId) return
      console.error('scan failed', err)
      actionError.value = backendErrorMessage(err, 'No se pudo registrar el escaneo.')
    } finally {
      // Only clear isSubmitting if this is still the active transfer: if the user has since
      // navigated to a different transfer, that transfer's own action manages its own submit
      // state, and a stale finally here must not prematurely re-enable its buttons.
      if (activeTransferId.value === transferId) isSubmitting.value = false
    }
  }

  /**
   * Full confirm and ConfirmPartial share one endpoint distinguished by { partial } (per design's
   * resolved decision — backend exposes a single confirm route). A 500 from the SAP step is a
   * known, non-crashing failure — scans already persisted, transfer stays in its pre-confirm state
   * so retry is possible ({@link isSapFiveHundred}; see its comment for why a plain 500 is treated
   * this way instead of a more specific error code).
   */
  async function confirm(body: ConfirmTransferRequest = {}): Promise<void> {
    if (!currentTransfer.value) return
    const transferId = currentTransfer.value.transferId

    actionError.value = null
    sapErrorMessage.value = null
    isSubmitting.value = true
    try {
      const result = await recepcionApi.confirm(transferId, body)
      if (activeTransferId.value !== transferId) return
      currentTransfer.value = result
      status.value = 'ready'
    } catch (err) {
      if (activeTransferId.value !== transferId) return
      console.error('confirm failed', err)
      status.value = 'error'
      if (isSapFiveHundred(err)) {
        sapErrorMessage.value = SAP_ERROR_MESSAGE
      } else {
        actionError.value = backendErrorMessage(err, 'No se pudo confirmar la transferencia.')
      }
    } finally {
      // Only clear isSubmitting if this is still the active transfer (see scan() above).
      if (activeTransferId.value === transferId) isSubmitting.value = false
    }
  }

  /**
   * Dismisses the confirm-failure error modal without retrying — the transfer stays exactly as it
   * was (scans persisted, not confirmed), same "retryable" state confirm()'s catch block already
   * leaves it in. Scoped to confirm's own error fields only; does not touch scan/recordDifference's.
   */
  function clearConfirmError(): void {
    actionError.value = null
    sapErrorMessage.value = null
  }

  /**
   * Real endpoint only returns { id } (no product description / recognition result) — re-fetch
   * the transfer after a successful POST to pick up the real persisted difference, same
   * discard-if-stale discipline and pattern as {@link scan} above.
   */
  async function recordDifference(body: RecordDifferenceRequest): Promise<void> {
    if (!currentTransfer.value) return
    const transferId = currentTransfer.value.transferId

    actionError.value = null
    isSubmitting.value = true
    try {
      await recepcionApi.recordDifference(transferId, body)
      if (activeTransferId.value !== transferId) return
      const result = await recepcionApi.getTransfer(transferId)
      if (activeTransferId.value !== transferId) return
      currentTransfer.value = result.transfer
      differences.value = result.differences
    } catch (err) {
      if (activeTransferId.value !== transferId) return
      console.error('recordDifference failed', err)
      actionError.value = backendErrorMessage(err, 'No se pudo registrar la diferencia.')
    } finally {
      // Only clear isSubmitting if this is still the active transfer (see scan() above).
      if (activeTransferId.value === transferId) isSubmitting.value = false
    }
  }

  async function deleteDifference(differenceId: number): Promise<void> {
    const transferId = activeTransferId.value

    actionError.value = null
    isSubmitting.value = true
    try {
      await recepcionApi.deleteDifference(differenceId)
      if (activeTransferId.value !== transferId) return
      differences.value = differences.value.filter((d) => d.differenceId !== differenceId)
    } catch (err) {
      if (activeTransferId.value !== transferId) return
      console.error('deleteDifference failed', err)
      actionError.value = backendErrorMessage(err, 'No se pudo eliminar la diferencia.')
    } finally {
      // Only clear isSubmitting if this is still the active transfer (see scan() above).
      if (activeTransferId.value === transferId) isSubmitting.value = false
    }
  }

  async function updateGlpiTicket(glpiTicket: string): Promise<void> {
    if (!currentTransfer.value) return
    const transferId = currentTransfer.value.transferId

    actionError.value = null
    isSubmitting.value = true
    try {
      const result = await recepcionApi.updateGlpiTicket(transferId, { glpiTicket })
      if (activeTransferId.value !== transferId) return
      currentTransfer.value = result
    } catch (err) {
      if (activeTransferId.value !== transferId) return
      console.error('updateGlpiTicket failed', err)
      actionError.value = backendErrorMessage(err, 'No se pudo guardar el ticket GLPI.')
    } finally {
      // Only clear isSubmitting if this is still the active transfer (see scan() above).
      if (activeTransferId.value === transferId) isSubmitting.value = false
    }
  }

  /**
   * Matches legacy recP.php's procesarCodigo() mechanics (sc22, lines ~766-822): no match ->
   * unrecognized code, logged as a difference; match with room -> fill capped at the line's
   * remaining quantity; match already complete -> the whole entered quantity is excess.
   *
   * Deliberate deviation from legacy: when a bulk quantity partially fits a line with room, legacy
   * silently DROPS the leftover beyond what fits (never logs it). Here every excess unit is
   * redirected to its own recordDifference call instead — one row per individual excess unit, per
   * explicit product decision — so nothing scanned is ever silently lost.
   *
   * @returns null (and does nothing) when there is no active transfer to scan against.
   */
  async function scanBarcode(
    barcode: string,
    enteredQty: number,
    options: { responsibleName?: string | null; courierWaybillNumber?: string | null } = {}
  ): Promise<{ matchedLine: ReceptionLine | null; fillAmount: number; excess: number } | null> {
    if (!currentTransfer.value) return null

    const line = currentTransfer.value.lines.find((l) => l.barcode === barcode) ?? null

    if (!line) {
      for (let i = 0; i < enteredQty; i++) {
        await recordDifference({ barcode })
      }
      return { matchedLine: null, fillAmount: 0, excess: enteredQty }
    }

    const available = Math.max(0, line.quantity - line.scanned)
    const fillAmount = Math.min(enteredQty, available)
    const excess = enteredQty - fillAmount

    if (fillAmount > 0) {
      await scan({
        scans: [{ lineId: line.lineId, scannedQuantity: line.scanned + fillAmount }],
        responsibleName: options.responsibleName ?? null,
        courierWaybillNumber: options.courierWaybillNumber ?? null,
      })
    }

    for (let i = 0; i < excess; i++) {
      await recordDifference({ barcode })
    }

    return { matchedLine: line, fillAmount, excess }
  }

  async function downloadDifferencesReport(): Promise<Blob | null> {
    if (!currentTransfer.value) return null
    const transferId = currentTransfer.value.transferId

    actionError.value = null
    try {
      return await recepcionApi.downloadDifferencesReport(transferId)
    } catch (err) {
      if (activeTransferId.value !== transferId) return null
      console.error('downloadDifferencesReport failed', err)
      actionError.value = backendErrorMessage(err, 'No se pudo descargar el reporte de diferencias.')
      return null
    }
  }

  async function downloadPickingReport(): Promise<Blob | null> {
    if (!currentTransfer.value) return null
    const transferId = currentTransfer.value.transferId

    actionError.value = null
    try {
      return await recepcionApi.downloadPickingReport(transferId)
    } catch (err) {
      if (activeTransferId.value !== transferId) return null
      console.error('downloadPickingReport failed', err)
      actionError.value = backendErrorMessage(err, 'No se pudo descargar el reporte de picking.')
      return null
    }
  }

  return {
    transfers,
    page,
    pageSize,
    totalCount,
    currentTransfer,
    status,
    fetchError,
    actionError,
    sapErrorMessage,
    differences,
    isSubmitting,
    hasRecounted,
    lineDiferencia,
    fetchInProgress,
    resetInProgressAndFetch,
    setPage,
    setPageSize,
    fetchTransfer,
    scan,
    confirm,
    clearConfirmError,
    recordDifference,
    scanBarcode,
    deleteDifference,
    updateGlpiTicket,
    downloadDifferencesReport,
    downloadPickingReport,
  }
})
