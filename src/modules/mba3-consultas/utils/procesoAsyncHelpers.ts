import { isTransientClientError, SAP_MAY_STILL_PROCESSING_MESSAGE } from './httpErrors'

export function isProcesoTransientError(error: unknown): boolean {
  return (
    isTransientClientError(error) ||
    (error as { isTransientClientError?: boolean })?.isTransientClientError === true
  )
}

/** Re-lanza con flag transient para que las vistas muestren warning en lugar de error fatal. */
export function rethrowIfTransient(error: unknown): never {
  if (isProcesoTransientError(error)) {
    const err = new Error(SAP_MAY_STILL_PROCESSING_MESSAGE)
    ;(err as { isTransientClientError?: boolean }).isTransientClientError = true
    throw err
  }
  throw error
}
