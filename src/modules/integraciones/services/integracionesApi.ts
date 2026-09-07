/**
 * Cliente del módulo Integraciones sobre api-middleware-sap.
 *
 * Usa `slayerHttp` (proxy `/slayer-api/*` → `{UPSTREAM_SLAYER}/api/*`), la misma instancia con la
 * que Caja Chica integra liquidaciones. El middleware no valida el JWT: el control de acceso a
 * estas pantallas es por permisos del front (ver permissions.ts).
 */
import { slayerHttp } from '@/lib/http'
import type {
  BitacoraEntry,
  BitacoraFilters,
  HitellRetryResponse,
  HitellSyncFilters,
  HitellSyncStatus,
  PagedResponse,
  SapJob,
  SapJobFilters,
} from '../types'

interface HitellSyncListResponse {
  entries: HitellSyncStatus[]
}

/** Quita los filtros vacíos para no mandar `status=` y que el middleware los tome como inválidos. */
function limpiarParams(params: Record<string, unknown>): Record<string, string | number | boolean> {
  const limpio: Record<string, string | number | boolean> = {}
  for (const [clave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === null || valor === '') continue
    if (typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean') {
      limpio[clave] = valor
    }
  }
  return limpio
}

/** El input de fecha entrega YYYY-MM-DD; el middleware compara contra DATETIME2 con extremos inclusivos. */
function inicioDelDia(fecha: string): string | undefined {
  return fecha ? `${fecha}T00:00:00` : undefined
}

function finDelDia(fecha: string): string | undefined {
  return fecha ? `${fecha}T23:59:59.999` : undefined
}

export const integracionesApi = {
  // ─── HITELL ────────────────────────────────────────────────────────────────

  async listarHitell(filters: HitellSyncFilters): Promise<HitellSyncStatus[]> {
    const { data } = await slayerHttp.get<HitellSyncListResponse>('v1/webpos/sync-status', {
      params: limpiarParams({
        status: filters.status,
        docType: filters.docType,
        rejectionType: filters.rejectionType,
        docEntry: filters.docEntry,
        top: filters.top,
      }),
    })
    return data?.entries ?? []
  },

  /**
   * Reintegra a HITELL un documento que ya existe en SAP. Nunca re-crea nada en SAP: el
   * middleware rearma el aviso desde SAP y lo reenvía. Repetible hasta quedar integrado.
   */
  async reintegrarHitell(doc: Pick<HitellSyncStatus, 'docType' | 'docEntry'>): Promise<HitellRetryResponse> {
    const recurso = doc.docType === 'GR' ? 'goods-receipts' : 'stock-transfers'
    const { data } = await slayerHttp.post<HitellRetryResponse>(`v1/webpos/${recurso}/${doc.docEntry}/retry`)
    return data
  },

  // ─── Cola SAP ──────────────────────────────────────────────────────────────

  async listarJobs(filters: SapJobFilters): Promise<PagedResponse<SapJob>> {
    const { data } = await slayerHttp.get<PagedResponse<SapJob>>('v1/jobs', {
      params: limpiarParams({
        status: filters.status,
        endpoint: filters.endpoint.trim(),
        from: inicioDelDia(filters.desde),
        to: finDelDia(filters.hasta),
        page: filters.page,
        pageSize: filters.pageSize,
      }),
    })
    return data
  },

  async obtenerJob(jobId: string): Promise<SapJob> {
    const { data } = await slayerHttp.get<SapJob>(`v1/jobs/${jobId}`)
    return data
  },

  // ─── Bitácora ──────────────────────────────────────────────────────────────

  async listarBitacora(filters: BitacoraFilters): Promise<PagedResponse<BitacoraEntry>> {
    const { data } = await slayerHttp.get<PagedResponse<BitacoraEntry>>('v1/api-logs', {
      params: limpiarParams({
        endpoint: filters.endpoint.trim(),
        usuario: filters.usuario.trim(),
        statusCode: filters.statusCode,
        onlyErrors: filters.onlyErrors ? true : undefined,
        from: inicioDelDia(filters.desde),
        to: finDelDia(filters.hasta),
        page: filters.page,
        pageSize: filters.pageSize,
      }),
    })
    return data
  },

  async obtenerBitacora(id: number): Promise<BitacoraEntry> {
    const { data } = await slayerHttp.get<BitacoraEntry>(`v1/api-logs/${id}`)
    return data
  },
}
