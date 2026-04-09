import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { AjusteDetalle, ProcesoCompletoSAPResponse } from '../types'

const POLL_MS = 2000

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

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

    const processId = accepted.process_id

    for (;;) {
      const result = await mba3ConsultasService.getProcesoSAPResultado(processId)
      const data = result as Record<string, unknown>

      if (result.status === 'error') {
        const msg = (result as { message?: string }).message || 'Error en el proceso'
        const r = result as { paso_fallido?: string; error_detalle?: string }
        const detalle =
          r.paso_fallido || r.error_detalle
            ? ` (${r.paso_fallido ?? ''} ${r.error_detalle ?? ''})`.trim()
            : ''
        throw new Error(String(msg) + detalle)
      }

      const done =
        data.status === 'success' ||
        data.status === 'partial' ||
        data.status === 'completed'

      if (done) {
        return result as ProcesoCompletoSAPResponse
      }

      if (typeof data.message === 'string') onPollingUpdate?.({ message: data.message })
      if (typeof data.progress === 'number') onPollingUpdate?.({ progress: data.progress as number })

      await sleep(POLL_MS)
    }
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
    throw asyncErr
  }
}
