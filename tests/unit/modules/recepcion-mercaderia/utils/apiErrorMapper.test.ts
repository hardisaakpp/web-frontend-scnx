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
})
