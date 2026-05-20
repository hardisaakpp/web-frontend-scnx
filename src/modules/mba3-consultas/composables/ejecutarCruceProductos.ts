import { cruceProductosService } from '../services/domains/cruceProductos'
import type { CruceProductosData, CruceProductosResponse } from '../types'
import { isTransientClientError, SAP_MAY_STILL_PROCESSING_MESSAGE } from '../utils/httpErrors'
import { cruceProductosStreamUrl } from '../utils/asyncJobStreamUrls'
import { followAsyncJobSseOrPoll } from '../utils/followAsyncJobSseOrPoll'

const POLL_MS = 2000
const MAX_POLL_WAIT_MS = 15 * 60 * 1000
const WORKER_PICKUP_TIMEOUT_MS = 90_000

export type EjecutarCruceProductosOptions = {
  onPollingUpdate?: (update: { message?: string; progress?: number }) => void
}

type CruceProgressFields = {
  step?: string
  progress?: number
  message?: string
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
}

/** Backend poll: `estado` anidado; SSE: campos planos; legado: `data` con ProcesoEstado */
function extractCruceProgressFields(raw: Record<string, unknown>): CruceProgressFields {
  const nested = raw.estado
  if (nested && typeof nested === 'object') {
    const e = nested as Record<string, unknown>
    return {
      step: typeof e.step === 'string' ? e.step : undefined,
      progress: typeof e.progress === 'number' ? e.progress : undefined,
      message: typeof e.message === 'string' ? e.message : undefined,
    }
  }

  const inner = raw.data
  if (inner && typeof inner === 'object' && 'progress' in (inner as object)) {
    const d = inner as Record<string, unknown>
    return {
      step: typeof d.step === 'string' ? d.step : undefined,
      progress: typeof d.progress === 'number' ? d.progress : undefined,
      message: typeof d.message === 'string' ? d.message : undefined,
    }
  }

  return {
    step: typeof raw.step === 'string' ? raw.step : undefined,
    progress: typeof raw.progress === 'number' ? raw.progress : undefined,
    message: typeof raw.message === 'string' ? raw.message : undefined,
  }
}

function isCrucePollProcessing(raw: Record<string, unknown>): boolean {
  return String(raw.status ?? '').toLowerCase() === 'processing'
}

function isCrucePollSuccess(raw: Record<string, unknown>): raw is Record<string, unknown> & {
  data: CruceProductosData
} {
  return String(raw.status ?? '').toLowerCase() === 'success' && raw.data != null
}

function toCruceResponse(raw: Record<string, unknown>): CruceProductosResponse {
  const data = (raw.data ?? raw.resultado) as CruceProductosData | undefined
  if (!data) {
    throw new Error(
      typeof raw.message === 'string' ? raw.message : 'El cruce terminó sin datos de resultado'
    )
  }
  return {
    status: 'success',
    message: typeof raw.message === 'string' ? raw.message : 'Cruce completado',
    data,
  }
}

function hasWorkerStarted(fields: CruceProgressFields): boolean {
  return (fields.progress ?? 0) > 0 || !!(fields.step && fields.step !== 'iniciando')
}

function resolveIniciarCruce(body: Record<string, unknown>):
  | { mode: 'async'; processId: string }
  | { mode: 'sync'; result: CruceProductosResponse } {
  const fallbackSync = body.fallback === 'sync' || body.async === false
  const processId =
    typeof body.process_id === 'string' && body.process_id.length > 0 ? body.process_id : null

  if (fallbackSync || !processId) {
    if (body.data) {
      return { mode: 'sync', result: toCruceResponse(body) }
    }
    throw new Error('El backend devolvió cruce síncrono sin datos')
  }

  return { mode: 'async', processId }
}

function formatCruceError(err: unknown): Error {
  if (isTransientClientError(err)) {
    const transient = new Error(SAP_MAY_STILL_PROCESSING_MESSAGE)
    ;(transient as { isTransientClientError?: boolean }).isTransientClientError = true
    return transient
  }

  const e = err as { response?: { status?: number; data?: { detail?: string | unknown } } }
  if (e?.response?.status === 500) {
    const detail = e.response.data?.detail
    const msg =
      typeof detail === 'string'
        ? detail
        : detail && typeof detail === 'object' && 'message' in (detail as object)
          ? String((detail as { message?: string }).message)
          : 'Error en el cruce de productos'
    return new Error(msg)
  }

  return err instanceof Error ? err : new Error(String(err))
}

async function pollCruceResultado(
  processId: string,
  onPollingUpdate?: EjecutarCruceProductosOptions['onPollingUpdate']
): Promise<CruceProductosResponse> {
  const terminal = await followAsyncJobSseOrPoll(cruceProductosStreamUrl(processId), {
    pollIntervalMs: POLL_MS,
    maxWaitMs: MAX_POLL_WAIT_MS,
    maxWaitMessage:
      'El cruce de productos sigue en ejecución y excedió el tiempo de espera. Actualice la lista más tarde.',
    workerPickupTimeoutMs: WORKER_PICKUP_TIMEOUT_MS,
    workerNotStartedMessage:
      'El worker no inició el cruce de productos a tiempo. Verifique Celery e intente de nuevo.',
    poll: () => cruceProductosService.obtenerResultadoCruce(processId),
    isProcessing: (result) => isCrucePollProcessing(asRecord(result)),
    hasWorkerStarted: (result) => hasWorkerStarted(extractCruceProgressFields(asRecord(result))),
    getTerminalError: (result) => {
      const raw = asRecord(result)
      if (String(raw.status ?? '').toLowerCase() === 'error') {
        return new Error(
          typeof raw.error === 'string'
            ? raw.error
            : typeof raw.message === 'string'
              ? raw.message
              : 'Error en el cruce de productos'
        )
      }
      return null
    },
    onUpdate: (result) => {
      const fields = extractCruceProgressFields(asRecord(result))
      onPollingUpdate?.({
        message: fields.message,
        progress: fields.progress,
      })
    },
  })

  const raw = asRecord(terminal)
  if (isCrucePollSuccess(raw)) {
    return toCruceResponse(raw)
  }

  if (!isCrucePollProcessing(raw)) {
    return toCruceResponse(raw)
  }

  throw new Error('El cruce finalizó en estado inesperado')
}

/**
 * Inicia cruce MBA3/SAP (POST iniciar → 200 success + process_id, no 202 accepted).
 * Poll/SSE con `status: processing` + `estado: { step, progress, message }`.
 * Terminal: `{ status: success, data }`. Errores de negocio en poll: HTTP 500 + detail.
 */
export async function ejecutarCruceProductos(
  options: EjecutarCruceProductosOptions = {}
): Promise<CruceProductosResponse> {
  const { onPollingUpdate } = options

  try {
    const iniciarBody = asRecord(await cruceProductosService.iniciarCruce())
    const resolved = resolveIniciarCruce(iniciarBody)

    if (resolved.mode === 'sync') {
      onPollingUpdate?.({ message: 'Cruce completado', progress: 100 })
      return resolved.result
    }

    return await pollCruceResultado(resolved.processId, onPollingUpdate)
  } catch (err: unknown) {
    if (isTransientClientError(err) || (err as { isTransientClientError?: boolean })?.isTransientClientError) {
      throw formatCruceError(err)
    }

    const e = err as { response?: { status?: number } }
    if (e?.response?.status != null && e.response.status >= 400 && e.response.status !== 500) {
      if (import.meta.env.DEV) {
        console.warn('[ejecutarCruceProductos] Fallback a realizar-cruce síncrono:', err)
      }
      onPollingUpdate?.({ message: 'Ejecutando cruce en modo síncrono...', progress: 50 })
      try {
        const legacy = await cruceProductosService.realizarCruce()
        onPollingUpdate?.({ message: 'Cruce completado', progress: 100 })
        return legacy
      } catch (legacyErr) {
        throw formatCruceError(legacyErr)
      }
    }

    throw formatCruceError(err)
  }
}
