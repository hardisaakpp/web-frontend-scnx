import { followSseStream } from './followSseStream'
import { pollAsyncJob, type PollAsyncJobOptions } from './pollAsyncJob'

/**
 * Sigue un job async por SSE si hay URL; si falla o no hay stream, usa `pollAsyncJob`.
 * Tras SSE terminal hace un GET final vía `poll()` para obtener el cuerpo autoritativo del backend.
 */
export async function followAsyncJobSseOrPoll<TPoll>(
  streamUrl: string | null | undefined,
  pollOptions: PollAsyncJobOptions<TPoll>
): Promise<TPoll> {
  if (streamUrl) {
    try {
      const startedAt = Date.now()
      let workerStarted = false

      await followSseStream<Record<string, unknown>>({
        url: streamUrl,
        maxWaitMs: pollOptions.maxWaitMs,
        maxWaitMessage: pollOptions.maxWaitMessage,
        onEvent: (data) => {
          const asPoll = data as TPoll
          pollOptions.onUpdate?.(asPoll)
          if (pollOptions.hasWorkerStarted?.(asPoll)) {
            workerStarted = true
          }
          const elapsedMs = Date.now() - startedAt
          if (
            pollOptions.workerPickupTimeoutMs != null &&
            !workerStarted &&
            elapsedMs > pollOptions.workerPickupTimeoutMs
          ) {
            throw new Error(
              pollOptions.workerNotStartedMessage ??
                'El proceso en segundo plano no inició a tiempo.'
            )
          }
        },
        isTerminal: (data) => !pollOptions.isProcessing(data as TPoll),
        isError: (data) => pollOptions.getTerminalError?.(data as TPoll) ?? null,
      })

      const final = await pollOptions.poll()
      const terminalError = pollOptions.getTerminalError?.(final)
      if (terminalError) throw terminalError
      if (pollOptions.isProcessing(final)) {
        return pollAsyncJob(pollOptions)
      }
      return final
    } catch (sseErr) {
      if (import.meta.env.DEV) {
        console.warn('[followAsyncJobSseOrPoll] SSE no disponible; fallback a polling:', sseErr)
      }
    }
  }

  return pollAsyncJob(pollOptions)
}
