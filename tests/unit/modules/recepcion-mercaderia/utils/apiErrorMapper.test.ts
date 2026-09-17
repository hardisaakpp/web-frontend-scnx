import { describe, it, expect } from 'vitest'
import { backendErrorMessage } from '@/modules/recepcion-mercaderia/utils/apiErrorMapper'

describe('backendErrorMessage', () => {
  it('returns the fallback on a 500, ignoring any data.error/message (the generic English string is never actionable)', () => {
    const err = { response: { status: 500, data: { error: 'An unexpected error occurred.' } } }

    expect(backendErrorMessage(err, 'Fallback message.')).toBe('Fallback message.')
  })

  it('returns data.error for a non-500 status (ReceptionExceptionHandler.cs shape)', () => {
    const err = { response: { status: 403, data: { error: "User 'u1' does not have access to warehouse 'T01'." } } }

    expect(backendErrorMessage(err, 'Fallback message.')).toBe("User 'u1' does not have access to warehouse 'T01'.")
  })

  it('falls back to data.message when data.error is absent (ConfirmReceptionTransferResult 422 shape)', () => {
    const err = { response: { status: 422, data: { success: false, message: 'Target item number does not match base item number.' } } }

    expect(backendErrorMessage(err, 'Fallback message.')).toBe('Target item number does not match base item number.')
  })

  it('prefers data.error over data.message when both are present', () => {
    const err = { response: { status: 400, data: { error: 'error field', message: 'message field' } } }

    expect(backendErrorMessage(err, 'Fallback message.')).toBe('error field')
  })

  it('returns the fallback when there is no response at all (client-side failure, e.g. a network error/timeout)', () => {
    expect(backendErrorMessage(new Error('timeout of 30000ms exceeded'), 'Fallback message.')).toBe('Fallback message.')
  })

  it('returns the fallback when data.error/message is blank or whitespace-only', () => {
    const err = { response: { status: 400, data: { error: '   ' } } }

    expect(backendErrorMessage(err, 'Fallback message.')).toBe('Fallback message.')
  })

  it('returns the fallback when data.error/message is not a string', () => {
    const err = { response: { status: 400, data: { error: { nested: true } } } }

    expect(backendErrorMessage(err, 'Fallback message.')).toBe('Fallback message.')
  })

  it('returns the fallback when there is no data object at all', () => {
    const err = { response: { status: 404 } }

    expect(backendErrorMessage(err, 'Fallback message.')).toBe('Fallback message.')
  })

  // ReceptionExceptionHandler.cs now also sends a stable `code` alongside `error` (English) — a
  // known code maps to short Spanish copy instead of showing the raw English string, per backend's
  // own recommendation. Covers every code in the backend's current catalog.
  it.each([
    ['INVALID_WAREHOUSE_CODE', 'El código de bodega no puede estar vacío.'],
    ['INVALID_SCAN_QUANTITY', 'La cantidad escaneada no puede ser negativa.'],
    ['SCANNED_QUANTITY_EXCEEDS_REQUESTED', 'La cantidad escaneada supera lo solicitado en la línea.'],
    ['UNKNOWN_RECEPTION_TRANSFER_LINE', 'Esa línea no pertenece a esta transferencia.'],
    ['RECEPTION_TRANSFER_ALREADY_CONFIRMED', 'Esta transferencia ya fue confirmada.'],
    ['INCOMPLETE_RECEPTION_TRANSFER', 'Faltan líneas por completar y no tiene permiso para confirmar parcialmente.'],
    ['COURIER_WAYBILL_REQUIRED', 'Ingresa el número de guía.'],
    ['RESPONSIBLE_REQUIRED', 'Ingresa el nombre del responsable.'],
    ['DIFFERENCE_IDENTIFIER_REQUIRED', 'Debe indicar un código de barras o una línea para registrar la diferencia.'],
    ['FORBIDDEN', 'No tiene acceso a esta bodega o recurso.'],
    ['ENTITY_NOT_FOUND', 'No se encontró la transferencia u otro recurso solicitado.'],
  ])('maps code %s to its short Spanish copy, ignoring the English error field', (code, spanish) => {
    const err = { response: { status: 400, data: { error: 'some english technical message', code } } }

    expect(backendErrorMessage(err, 'Fallback message.')).toBe(spanish)
  })

  it('falls back to the raw error/message text for a code not yet in the map (future backend codes)', () => {
    const err = { response: { status: 400, data: { error: 'Some brand new validation failed.', code: 'SOME_FUTURE_CODE' } } }

    expect(backendErrorMessage(err, 'Fallback message.')).toBe('Some brand new validation failed.')
  })

  it('ignores code on a 500 — UNEXPECTED_ERROR is never actionable, always uses the fallback', () => {
    const err = { response: { status: 500, data: { error: 'An unexpected error occurred.', code: 'UNEXPECTED_ERROR' } } }

    expect(backendErrorMessage(err, 'Fallback message.')).toBe('Fallback message.')
  })

  it('still reads data.error/message when there is no code at all (ConfirmReceptionTransferResult 422 shape)', () => {
    const err = { response: { status: 422, data: { success: false, message: 'Target item number does not match base item number.' } } }

    expect(backendErrorMessage(err, 'Fallback message.')).toBe('Target item number does not match base item number.')
  })
})
