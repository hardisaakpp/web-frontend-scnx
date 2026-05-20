/**
 * Lee un endpoint SSE (fetch + text/event-stream) y emite eventos JSON del campo `data:`.
 */
export type FollowSseStreamOptions<TEvent extends Record<string, unknown>> = {
  url: string
  maxWaitMs?: number
  abortSignal?: AbortSignal
  onEvent?: (data: TEvent) => void
  isTerminal: (data: TEvent) => boolean
  isError?: (data: TEvent) => Error | null
  maxWaitMessage?: string
}

const DEFAULT_MAX_WAIT_MS = 10 * 60 * 1000

function mergeAbortSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController()
  for (const signal of signals) {
    if (!signal) continue
    if (signal.aborted) {
      controller.abort(signal.reason)
      return controller.signal
    }
    signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true })
  }
  return controller.signal
}

export async function followSseStream<TEvent extends Record<string, unknown>>(
  options: FollowSseStreamOptions<TEvent>
): Promise<TEvent> {
  const {
    url,
    maxWaitMs = DEFAULT_MAX_WAIT_MS,
    abortSignal,
    onEvent,
    isTerminal,
    isError,
    maxWaitMessage = 'El proceso excedió el tiempo máximo de espera.',
  } = options

  const token = localStorage.getItem('token')
  if (!token) {
    throw new Error('No hay token de autenticación')
  }

  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), maxWaitMs)

  const combinedSignal = mergeAbortSignals(abortSignal, timeoutController.signal)

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal: combinedSignal,
    })

    if (!response.ok) {
      throw new Error(`Error al conectar al stream: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No se pudo leer el stream SSE')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let lastEvent: TEvent | null = null

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6).trim()
          if (!jsonStr) continue

          let data: TEvent
          try {
            data = JSON.parse(jsonStr) as TEvent
          } catch {
            if (import.meta.env.DEV) {
              console.warn('[followSseStream] JSON inválido:', jsonStr)
            }
            continue
          }

          lastEvent = data
          onEvent?.(data)

          const terminalError = isError?.(data)
          if (terminalError) throw terminalError

          if (isTerminal(data)) {
            await reader.cancel()
            return data
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        if (timeoutController.signal.aborted && !abortSignal?.aborted) {
          throw new Error(maxWaitMessage)
        }
        throw err
      }
      throw err
    } finally {
      try {
        await reader.cancel()
      } catch {
        /* ignore */
      }
    }

    if (lastEvent && isTerminal(lastEvent)) {
      return lastEvent
    }

    throw new Error('El stream SSE terminó sin un estado final')
  } finally {
    clearTimeout(timeoutId)
  }
}
