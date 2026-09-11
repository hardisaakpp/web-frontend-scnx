import { defineStore } from 'pinia'
import { ref } from 'vue'
import recepcionApi from '../services/recepcionApi'
import { backendErrorMessage } from '../utils/apiErrorMapper'
import type {
  ConfirmTransferRequest,
  Difference,
  FlowStatus,
  ReceptionLine,
  ReceptionTransfer,
  RecordDifferenceRequest,
  SaveScanProgressRequest,
  ScanLineRequest,
} from '../types'

const SAP_ERROR_MESSAGE =
  'No se pudo integrar la transferencia a SAP. Los escaneos se guardaron; vuelva a intentarlo cuando el servicio esté disponible.'

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
 * Transfer detail: scan/confirm/differences/GLPI/report. confirm()'s SAP step goes through
 * api-middleware-sap's /stock-transfers/based-on-document — see confirm() below. The "En Curso"
 * list (fetch/paginate) used to live here too; it's now inProgressStore.ts — a distinct concern
 * consumed only by InProgressView.vue, split out per the module's SOLID/SRP audit.
 */
export const usePickingStore = defineStore('recepcionPicking', () => {
  const currentTransfer = ref<ReceptionTransfer | null>(null)
  const status = ref<FlowStatus>('ready')
  // Split by concern: fetchError covers fetchTransfer and gates the inline "couldn't load" banner;
  // actionError covers the 7 mutating actions taken on an already-loaded transfer and feeds the
  // ErrorDialog modal alongside sapErrorMessage. Kept apart so a fetch failure can never
  // accidentally pop the action-error modal (or vice versa).
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
   * A confirm request can fail client-side (timeout, dropped connection) or with a 400 "already
   * confirmed" (duplicate click/tab racing automatic reconciliation) while the backend
   * confirmation actually went through — re-check the real state before confirm() reports an
   * error, otherwise an operation that actually succeeded gets shown to the user as failed.
   * Returns the refetched state when it's really confirmed, or null when it isn't (a genuine
   * failure, left for the caller to report as such).
   */
  async function recoverIfAlreadyConfirmed(
    transferId: number
  ): Promise<{ transfer: ReceptionTransfer; differences: Difference[] } | null> {
    try {
      const refetched = await recepcionApi.getTransfer(transferId)
      return refetched.transfer.status === 'confirmed' ? refetched : null
    } catch (refetchErr) {
      console.error('confirm refetch failed', refetchErr)
      return null
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
      // A 200 response here can still carry success:false with reason 'Queued'/'StillPending'
      // (SAP confirm was queued, not an error) — not surfaced as a failure. The canonical
      // post-confirm state, including whether a SAP job is still pending, comes from re-fetching
      // (currentTransfer.pendingSapJobQueuedAtUtc), same as scan()/recordDifference().
      await recepcionApi.confirm(transferId, body)
      if (activeTransferId.value !== transferId) return
      const result = await recepcionApi.getTransfer(transferId)
      if (activeTransferId.value !== transferId) return
      currentTransfer.value = result.transfer
      differences.value = result.differences
      status.value = 'ready'
    } catch (err) {
      if (activeTransferId.value !== transferId) return
      console.error('confirm failed', err)

      const recovered = await recoverIfAlreadyConfirmed(transferId)
      if (activeTransferId.value !== transferId) return
      if (recovered) {
        currentTransfer.value = recovered.transfer
        differences.value = recovered.differences
        status.value = 'ready'
        return
      }

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

  async function recordDifferences(barcode: string, count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      await recordDifference({ barcode })
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

    const matchingLines = currentTransfer.value.lines.filter((l) => l.barcode === barcode)
    const line = matchingLines.find((l) => l.scanned < l.quantity) ?? null

    if (matchingLines.length === 0) {
      await recordDifferences(barcode, enteredQty)
      return { matchedLine: null, fillAmount: 0, excess: enteredQty }
    }

    if (!line) {
      await recordDifferences(barcode, enteredQty)
      return { matchedLine: matchingLines[0], fillAmount: 0, excess: enteredQty }
    }

    let remaining = enteredQty
    const scans: ScanLineRequest[] = []
    for (const matchingLine of matchingLines) {
      const available = Math.max(0, matchingLine.quantity - matchingLine.scanned)
      const allocated = Math.min(remaining, available)
      if (allocated > 0) {
        scans.push({ lineId: matchingLine.lineId, scannedQuantity: matchingLine.scanned + allocated })
        remaining -= allocated
      }
      if (remaining === 0) break
    }
    const fillAmount = enteredQty - remaining
    const excess = remaining

    if (scans.length > 0) {
      await scan({
        scans,
        responsibleName: options.responsibleName ?? null,
        courierWaybillNumber: options.courierWaybillNumber ?? null,
      })
    }

    await recordDifferences(barcode, excess)

    return { matchedLine: line, fillAmount, excess }
  }

  /**
   * Manual-entry counterpart to scanBarcode, for lines with no barcode. The manual quantity input
   * already holds an ABSOLUTE total (unlike scanBarcode's incremental enteredQty), so the math is
   * simpler: cap each entry at the line's requested quantity and redirect the overflow to
   * recordDifference, one call per excess unit (same "nothing silently dropped" decision as
   * scanBarcode). Batches every changed line's capped fill into one scan() POST, matching the
   * existing "Guardar escaneo" batch-save UX.
   *
   * @returns null (and does nothing) when there is no active transfer to scan against.
   */
  async function scanManual(
    entries: { lineId: number; enteredQuantity: number }[],
    options: { responsibleName?: string | null; courierWaybillNumber?: string | null } = {}
  ): Promise<void> {
    if (!currentTransfer.value) return
    const lines = currentTransfer.value.lines

    const scans: ScanLineRequest[] = []
    const excessEntries: { lineId: number; excess: number }[] = []

    for (const entry of entries) {
      const line = lines.find((l) => l.lineId === entry.lineId)
      if (!line) continue
      const fillAmount = Math.min(entry.enteredQuantity, line.quantity)
      const excess = entry.enteredQuantity - fillAmount
      if (fillAmount !== line.scanned) {
        scans.push({ lineId: line.lineId, scannedQuantity: fillAmount })
      }
      if (excess > 0) excessEntries.push({ lineId: line.lineId, excess })
    }

    if (scans.length > 0) {
      await scan({
        scans,
        responsibleName: options.responsibleName ?? null,
        courierWaybillNumber: options.courierWaybillNumber ?? null,
      })
    }

    for (const { lineId, excess } of excessEntries) {
      for (let i = 0; i < excess; i++) {
        await recordDifference({ lineId })
      }
    }
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
    currentTransfer,
    status,
    fetchError,
    actionError,
    sapErrorMessage,
    differences,
    isSubmitting,
    hasRecounted,
    lineDiferencia,
    fetchTransfer,
    scan,
    confirm,
    clearConfirmError,
    recordDifference,
    scanBarcode,
    scanManual,
    deleteDifference,
    updateGlpiTicket,
    downloadDifferencesReport,
    downloadPickingReport,
  }
})
