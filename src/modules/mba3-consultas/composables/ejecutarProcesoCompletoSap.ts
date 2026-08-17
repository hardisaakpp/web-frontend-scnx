import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { AjusteDetalle, ProcesoCompletoSAPResponse } from '../types'
import { isTransientClientError, SAP_MAY_STILL_PROCESSING_MESSAGE } from '../utils/httpErrors'
import {
  clearOdcSapProcessId,
  getOdcSapProcessId,
  saveOdcSapProcessId,
} from '../utils/odcSapProcessStorage'
import { procesoSapStreamUrl } from '../utils/asyncJobStreamUrls'
import { followAsyncJobSseOrPoll } from '../utils/followAsyncJobSseOrPoll'

const POLL_MS = 2000
const MAX_POLL_WAIT_MS = 10 * 60 * 1000 // 10 min
const WORKER_PICKUP_TIMEOUT_MS = 60_000
// Aviso si el POST inicial no resuelve rápido (posible fallback síncrono sin process_id/progreso incremental).
const SLOW_SYNC_WARNING_MS = 7_000

export type EjecutarProcesoCompletoSapOptions = {
  /**
   * Solo si el POST async falla con 503 (p. ej. celery_unavailable) y el front reintenta con POST síncrono.
   * Si el backend devuelve 200 con `fallback: "sync"` y cuerpo completo, no se llama: ya se resuelve en la primera respuesta.
   */
  onFallbackSync?: () => void
  /** Mensaje y progreso devueltos por el worker durante el polling. */
  onPollingUpdate?: (u: { message?: string; progress?: number }) => void
  /** Se reanuda un job guardado en sessionStorage (timeout cliente previo). */
  onResumePending?: () => void
  /**
   * Se dispara una única vez si, tras SLOW_SYNC_WARNING_MS desde el POST inicial, la
   * respuesta aún no ha llegado (posible fallback síncrono sin process_id/progreso
   * incremental). Se cancela automáticamente en cuanto el POST resuelve (accepted o error).
   */
  onSlowSyncLikely?: () => void
}

function isSyncImmediateResponse(accepted: unknown): boolean {
  const a = accepted as Record<string, unknown>
  return a.fallback === 'sync' || a.async === false || a.process_id == null
}

function isProcesoSapTerminalSuccess(data: Record<string, unknown>): boolean {
  return (
    data.status === 'success' ||
    data.status === 'partial' ||
    data.status === 'completed'
  )
}

async function pollProcesoSapResultado(
  processId: string,
  numeroPedido: string,
  onPollingUpdate?: EjecutarProcesoCompletoSapOptions['onPollingUpdate'],
  streamUrlFromApi?: string | null
): Promise<ProcesoCompletoSAPResponse> {
  try {
    return (await followAsyncJobSseOrPoll(procesoSapStreamUrl(processId, streamUrlFromApi), {
      pollIntervalMs: POLL_MS,
      maxWaitMs: MAX_POLL_WAIT_MS,
      maxWaitMessage: SAP_MAY_STILL_PROCESSING_MESSAGE,
      workerPickupTimeoutMs: WORKER_PICKUP_TIMEOUT_MS,
      workerNotStartedMessage:
        'El worker de Celery no tomó el proceso SAP en el tiempo esperado. Verifica Celery e intenta de nuevo.',
      poll: () => mba3ConsultasService.getProcesoSAPResultado(processId),
      isProcessing: (result) => {
        const data = result as Record<string, unknown>
        if (data.status === 'error') return false
        return !isProcesoSapTerminalSuccess(data)
      },
      hasWorkerStarted: (result) => {
        const data = result as Record<string, unknown>
        if (data.status !== 'processing') return false
        const progress = data.progress ?? 0
        const step = String(data.step ?? '')
        return (typeof progress === 'number' && progress > 0) || !!(step && step !== 'iniciando')
      },
      getTerminalError: (result) => {
        if (result.status !== 'error') return null
        const r = result as { message?: string; paso_fallido?: string; error_detalle?: string }
        const msg = r.message || 'Error en el proceso'
        const detalle =
          r.paso_fallido || r.error_detalle
            ? ` (${r.paso_fallido ?? ''} ${r.error_detalle ?? ''})`.trim()
            : ''
        return new Error(String(msg) + detalle)
      },
      onUpdate: (result) => {
        const data = result as Record<string, unknown>
        if (typeof data.message === 'string' || typeof data.progress === 'number') {
          onPollingUpdate?.({
            message: typeof data.message === 'string' ? data.message : undefined,
            progress: typeof data.progress === 'number' ? (data.progress as number) : undefined,
          })
        }
      },
    })) as ProcesoCompletoSAPResponse
  } finally {
    clearOdcSapProcessId(numeroPedido)
  }
}

function getStreamUrlFromAccepted(accepted: unknown): string | null {
  const streamUrl = (accepted as { stream_url?: string })?.stream_url
  return streamUrl ?? null
}

/** Consulta si hay un job SAP async pendiente (p. ej. tras timeout del navegador). */
export async function getPendingOdcSapProcessingState(
  numeroPedido: string
): Promise<{ processing: boolean; processId: string | null }> {
  const processId = getOdcSapProcessId(numeroPedido)
  if (!processId) return { processing: false, processId: null }

  try {
    const result = await mba3ConsultasService.getProcesoSAPResultado(processId)
    const data = result as Record<string, unknown>
    if (data.status === 'processing') {
      return { processing: true, processId }
    }
    clearOdcSapProcessId(numeroPedido)
    return { processing: false, processId: null }
  } catch {
    clearOdcSapProcessId(numeroPedido)
    return { processing: false, processId: null }
  }
}

/**
 * POST proceso-completo-sap-async:
 * - Si la respuesta es resultado inmediato (p. ej. `fallback: "sync"`, `async: false` o `process_id == null`),
 *   devuelve ese cuerpo como ProcesoCompletoSAPResponse (sin segundo POST).
 * - Si viene `accepted` + `process_id`, hace polling hasta resultado terminal.
 * - Si el POST async lanza 503 con celery/storage, reintenta con POST proceso-completo-sap síncrono (ruta defensiva;
 *   muchos backends ya entregan el sync en 200 en el primer POST async).
 */
export async function ejecutarProcesoCompletoSap(
  numeroPedido: string,
  ajustesDetalle: AjusteDetalle[],
  options: EjecutarProcesoCompletoSapOptions = {}
): Promise<ProcesoCompletoSAPResponse> {
  const { onFallbackSync, onPollingUpdate, onResumePending, onSlowSyncLikely } = options

  const pending = await getPendingOdcSapProcessingState(numeroPedido)
  if (pending.processing && pending.processId) {
    onResumePending?.()
    return pollProcesoSapResultado(pending.processId, numeroPedido, onPollingUpdate, null)
  }

  const slowSyncTimer = onSlowSyncLikely ? setTimeout(onSlowSyncLikely, SLOW_SYNC_WARNING_MS) : null

  try {
    const accepted = await mba3ConsultasService.procesoCompletoSAPAsync(numeroPedido, ajustesDetalle)

    if (isSyncImmediateResponse(accepted)) {
      clearOdcSapProcessId(numeroPedido)
      return accepted as ProcesoCompletoSAPResponse
    }

    if (accepted.status !== 'accepted' || !accepted.process_id) {
      throw new Error('No se pudo iniciar el proceso. Respuesta inesperada.')
    }

    saveOdcSapProcessId(numeroPedido, accepted.process_id)
    return pollProcesoSapResultado(
      accepted.process_id,
      numeroPedido,
      onPollingUpdate,
      getStreamUrlFromAccepted(accepted)
    )
  } catch (asyncErr: unknown) {
    const e = asyncErr as {
      response?: { status?: number; data?: { error?: string; detail?: { error?: string } } }
      message?: string
    }
    const errorCode = e?.response?.data?.error ?? e?.response?.data?.detail?.error
    const is503Unavailable =
      e?.response?.status === 503 &&
      (errorCode === 'storage_required' || errorCode === 'celery_unavailable')
    if (is503Unavailable) {
      onFallbackSync?.()
      return mba3ConsultasService.procesoCompletoSAP(numeroPedido, ajustesDetalle)
    }

    if (isTransientClientError(asyncErr)) {
      const err = new Error(SAP_MAY_STILL_PROCESSING_MESSAGE)
      ;(err as { isTransientClientError?: boolean }).isTransientClientError = true
      throw err
    }

    throw asyncErr
  } finally {
    if (slowSyncTimer) clearTimeout(slowSyncTimer)
  }
}

