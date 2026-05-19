import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { AjusteDetalle, ProcesoCompletoSAPResponse } from '../types'
import { isTransientClientError, SAP_MAY_STILL_PROCESSING_MESSAGE } from '../utils/httpErrors'
import { pollAsyncJob } from '../utils/pollAsyncJob'

const POLL_MS = 2000
const MAX_POLL_WAIT_MS = 10 * 60 * 1000 // 10 min

export type EjecutarProcesoCompletoSapOptions = {
  /**
   * Solo si el POST async falla con 503 (p. ej. celery_unavailable) y el front reintenta con POST síncrono.
   * Si el backend devuelve 200 con `fallback: "sync"` y cuerpo completo, no se llama: ya se resuelve en la primera respuesta.
   */
  onFallbackSync?: () => void
  /** Mensaje y progreso devueltos por el worker durante el polling. */
  onPollingUpdate?: (u: { message?: string; progress?: number }) => void
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
  onPollingUpdate?: EjecutarProcesoCompletoSapOptions['onPollingUpdate']
): Promise<ProcesoCompletoSAPResponse> {
  return pollAsyncJob({
    pollIntervalMs: POLL_MS,
    maxWaitMs: MAX_POLL_WAIT_MS,
    maxWaitMessage: SAP_MAY_STILL_PROCESSING_MESSAGE,
    poll: () => mba3ConsultasService.getProcesoSAPResultado(processId),
    isProcessing: (result) => {
      const data = result as Record<string, unknown>
      if (data.status === 'error') return false
      return !isProcesoSapTerminalSuccess(data)
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
  }) as Promise<ProcesoCompletoSAPResponse>
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
  const { onFallbackSync, onPollingUpdate } = options

  try {
    const accepted = await mba3ConsultasService.procesoCompletoSAPAsync(numeroPedido, ajustesDetalle)

    if (isSyncImmediateResponse(accepted)) {
      return accepted as ProcesoCompletoSAPResponse
    }

    if (accepted.status !== 'accepted' || !accepted.process_id) {
      throw new Error('No se pudo iniciar el proceso. Respuesta inesperada.')
    }

    return pollProcesoSapResultado(accepted.process_id, onPollingUpdate)
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
  }
}
