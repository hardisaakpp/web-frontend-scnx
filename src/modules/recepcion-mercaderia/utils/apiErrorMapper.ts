/**
 * Two distinct backend error shapes reach here: ReceptionExceptionHandler.cs's generic unhandled-
 * exception replies { error: message } (real/actionable for 400/403/404; always the same
 * non-actionable "An unexpected error occurred." for a 500, so that case falls back below instead
 * of parroting the generic English string). But confirm() specifically can also return 422 with
 * ConfirmReceptionTransferResult's own shape { success, sapDocEntry, sapDocNum, message } — e.g.
 * the real SAP/middleware rejection detail (ConfirmReceptionTransferCommand ->
 * MiddlewareSapHttpClient's StockTransferResult.Message). Check both field names, error takes
 * precedence since the exception-handler shape is more common across this module's other actions.
 *
 * Shared by inProgressStore and pickingStore (split from one store — see the pickingStore.ts SRP
 * audit note) so both keep reading the exact same backend error shapes without duplicating this.
 */
export function backendErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { status?: number; data?: { error?: unknown; message?: unknown } } })?.response
  if (response?.status === 500) return fallback
  const message = response?.data?.error ?? response?.data?.message
  return typeof message === 'string' && message.trim() !== '' ? message : fallback
}
