const DEFAULT_POLL_INTERVAL_MS = 2000
const DEFAULT_MAX_WAIT_MS = 10 * 60 * 1000 // 10 min

export type PollAsyncJobOptions<TPoll> = {
  poll: () => Promise<TPoll>
  pollIntervalMs?: number
  maxWaitMs?: number
  /** Sigue haciendo polling mientras devuelva true */
  isProcessing: (result: TPoll) => boolean
  /** Si devuelve error, se lanza (antes de comprobar isSuccess) */
  getTerminalError?: (result: TPoll) => Error | null
  onUpdate?: (result: TPoll) => void
  /** Si el worker no arranca en este tiempo, error explícito (opcional) */
  workerPickupTimeoutMs?: number
  hasWorkerStarted?: (result: TPoll) => boolean
  workerNotStartedMessage?: string
  maxWaitMessage?: string
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/**
 * Polling genérico para jobs async (plantilla, proceso SAP, etc.).
 */
export async function pollAsyncJob<TPoll>(
  options: PollAsyncJobOptions<TPoll>
): Promise<TPoll> {
  const {
    poll,
    pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
    maxWaitMs = DEFAULT_MAX_WAIT_MS,
    isProcessing,
    getTerminalError,
    onUpdate,
    workerPickupTimeoutMs,
    hasWorkerStarted,
    workerNotStartedMessage = 'El proceso en segundo plano no inició a tiempo. Verifica Celery e intenta de nuevo.',
    maxWaitMessage = 'El proceso sigue en ejecución y excedió el tiempo máximo de espera. Revisa el estado más tarde.',
  } = options

  const startedAt = Date.now()
  let workerStarted = false

  for (;;) {
    await sleep(pollIntervalMs)

    const elapsedMs = Date.now() - startedAt
    if (elapsedMs > maxWaitMs) {
      throw new Error(maxWaitMessage)
    }

    const result = await poll()

    const terminalError = getTerminalError?.(result)
    if (terminalError) throw terminalError

    if (!isProcessing(result)) {
      return result
    }

    if (hasWorkerStarted?.(result)) {
      workerStarted = true
    } else if (
      workerPickupTimeoutMs != null &&
      !workerStarted &&
      elapsedMs > workerPickupTimeoutMs
    ) {
      throw new Error(workerNotStartedMessage)
    }

    onUpdate?.(result)
  }
}
