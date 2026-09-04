/**
 * ReceptionExceptionHandler.cs's { error, code } shape now carries a stable `code` alongside the
 * English `error` text (the message can be reworded any time; the code doesn't). A recognized code
 * maps to short Spanish copy here instead of showing the raw English string, per backend's own
 * recommendation. A code this map doesn't know yet (new ones ship over time) falls through to the
 * old error/message passthrough below rather than showing nothing.
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  INVALID_WAREHOUSE_CODE: 'El código de bodega no puede estar vacío.',
  INVALID_SCAN_QUANTITY: 'La cantidad escaneada no puede ser negativa.',
  SCANNED_QUANTITY_EXCEEDS_REQUESTED: 'La cantidad escaneada supera lo solicitado en la línea.',
  UNKNOWN_RECEPTION_TRANSFER_LINE: 'Esa línea no pertenece a esta transferencia.',
  RECEPTION_TRANSFER_ALREADY_CONFIRMED: 'Esta transferencia ya fue confirmada.',
  INCOMPLETE_RECEPTION_TRANSFER: 'Faltan líneas por completar y no tiene permiso para confirmar parcialmente.',
  COURIER_WAYBILL_REQUIRED: 'Debe ingresar la guía courier para esta bodega.',
  DIFFERENCE_IDENTIFIER_REQUIRED: 'Debe indicar un código de barras o una línea para registrar la diferencia.',
  FORBIDDEN: 'No tiene acceso a esta bodega o recurso.',
  ENTITY_NOT_FOUND: 'No se encontró la transferencia u otro recurso solicitado.',
}

/**
 * Two distinct backend error shapes reach here: ReceptionExceptionHandler.cs's { error, code }
 * shape (real/actionable for 400/403/404 — see ERROR_CODE_MESSAGES above; always the same
 * non-actionable "An unexpected error occurred." / UNEXPECTED_ERROR for a 500, so that case falls
 * back below regardless of code). But confirm() specifically can also return 422 with
 * ConfirmReceptionTransferResult's own shape { success, sapDocEntry, sapDocNum, message } — e.g.
 * the real SAP/middleware rejection detail (ConfirmReceptionTransferCommand ->
 * MiddlewareSapHttpClient's StockTransferResult.Message), which carries no code at all.
 *
 * Shared by inProgressStore and pickingStore (split from one store — see the pickingStore.ts SRP
 * audit note) so both keep reading the exact same backend error shapes without duplicating this.
 */
export function backendErrorMessage(err: unknown, fallback: string): string {
  const response = (err as { response?: { status?: number; data?: { error?: unknown; message?: unknown; code?: unknown } } })?.response
  if (response?.status === 500) return fallback
  const code = response?.data?.code
  if (typeof code === 'string' && code in ERROR_CODE_MESSAGES) return ERROR_CODE_MESSAGES[code]
  const message = response?.data?.error ?? response?.data?.message
  return typeof message === 'string' && message.trim() !== '' ? message : fallback
}
