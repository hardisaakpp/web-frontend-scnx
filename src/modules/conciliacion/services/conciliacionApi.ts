import { conciliacionHttp as api } from '@/lib/http'
import type {
  AppResponse,
  DashboardMetricas,
  Banco,
  BancoCatalogoCreate,
  BancoCatalogoUpdate,
  CargaArchivo,
  ImportResult,
  SAPSyncRequest,
  SincronizacionSAP,
  SincronizacionIniciada,
  ConciliacionRequest,
  ConciliacionResponse,
  ConciliacionManualRequest,
  NovedadesResponse,
  NovedadesParams,
  HistorialParams,
  ProcesoConciliacion,
  DetalleProcesoResponse,
  ReportePartidasAbiertas,
  PartidasAbiertasParams,
  DashboardParams,
  SAPIncompleto,
  MovimientoReporte,
  ReporteMaestroParams,
} from '../types'

// ── Helper: extraer .data del AppResponse ───────────────────
function unwrap<T>(response: { data: AppResponse<T> }): T {
  const body = response.data
  if (!body.success) {
    throw new Error(body.message || body.error_code || 'Error del servidor')
  }
  return body.data as T
}

// Helper: devolver el AppResponse completo (para cuando necesitamos message)
function unwrapFull<T>(response: { data: AppResponse<T> }): AppResponse<T> {
  const body = response.data
  if (!body.success) {
    throw new Error(body.message || body.error_code || 'Error del servidor')
  }
  return body
}

// ═══════════════════════════════════════════════════════════════
// Servicio de API — Conciliación Bancaria
// ═══════════════════════════════════════════════════════════════
export const conciliacionService = {

  // ── Banca ─────────────────────────────────────────────────

  /** Estado general del módulo de banca */
  async getBancaStatus(): Promise<Record<string, unknown>> {
    return unwrap(await api.get<AppResponse<Record<string, unknown>>>('/api/v1/banca/'))
  },

  /** Importar movimientos bancarios desde Excel. Si se omite `banco`, el backend lo autodetecta. */
  async importExcel(file: File, banco?: string, usuario?: string): Promise<AppResponse<ImportResult>> {
    const formData = new FormData()
    formData.append('file', file)

    const params: Record<string, string> = {}
    if (banco) params.banco = banco
    if (usuario) params.usuario = usuario

    return unwrapFull(
      await api.post<AppResponse<ImportResult>>('/api/v1/banca/import', formData, {
        params,
        timeout: 120_000, // 2 min para archivos grandes
      }),
    )
  },

  /** Historial de archivos importados (últimos, sin paginar) */
  async getCargas(): Promise<CargaArchivo[]> {
    return unwrap(await api.get<AppResponse<CargaArchivo[]>>('/api/v1/banca/cargas'))
  },

  /** Historial de archivos importados, paginado */
  async getCargasPaginado(pagina: number, cantidad: number): Promise<AppResponse<CargaArchivo[]>> {
    return unwrapFull(
      await api.get<AppResponse<CargaArchivo[]>>('/api/v1/banca/cargas', {
        params: { pagina, cantidad },
      }),
    )
  },

  // ── Catálogo ──────────────────────────────────────────────

  /** Listar bancos registrados (por defecto solo activos) */
  async getBancos(soloActivos = true): Promise<Banco[]> {
    return unwrap(
      await api.get<AppResponse<Banco[]>>('/api/v1/catalogo/bancos', {
        params: { solo_activos: soloActivos },
      }),
    )
  },

  /** Detalle de un banco, incluyendo su config_mapeo completo */
  async getBanco(idBanco: number): Promise<Banco> {
    return unwrap(await api.get<AppResponse<Banco>>(`/api/v1/catalogo/bancos/${idBanco}`))
  },

  /** Registrar un nuevo banco en el catálogo */
  async crearBanco(payload: BancoCatalogoCreate): Promise<AppResponse<Banco>> {
    return unwrapFull(await api.post<AppResponse<Banco>>('/api/v1/catalogo/bancos', payload))
  },

  /** Actualizar un banco existente (incluye reemplazar su config_mapeo) */
  async actualizarBanco(idBanco: number, payload: BancoCatalogoUpdate): Promise<AppResponse<Banco>> {
    return unwrapFull(await api.put<AppResponse<Banco>>(`/api/v1/catalogo/bancos/${idBanco}`, payload))
  },

  /** Desactivar un banco (soft-delete) */
  async eliminarBanco(idBanco: number): Promise<AppResponse<Banco>> {
    return unwrapFull(await api.delete<AppResponse<Banco>>(`/api/v1/catalogo/bancos/${idBanco}`))
  },

  // ── SAP ───────────────────────────────────────────────────

  /** Dispara la sincronización SAP en segundo plano (202). Lanza 409 (error_code SYNC_EN_CURSO) si ya hay una corriendo. */
  async iniciarSyncSAP(request: SAPSyncRequest): Promise<AppResponse<SincronizacionIniciada>> {
    return unwrapFull(await api.post<AppResponse<SincronizacionIniciada>>('/api/v1/sap/sync', request))
  },

  /** Historial de sincronizaciones SAP, paginado (más recientes primero) */
  async getSincronizacionesSAP(pagina: number, cantidad: number): Promise<AppResponse<SincronizacionSAP[]>> {
    return unwrapFull(
      await api.get<AppResponse<SincronizacionSAP[]>>('/api/v1/sap/sincronizaciones', {
        params: { pagina, cantidad },
      }),
    )
  },

  // ── Conciliación ──────────────────────────────────────────

  /** Ejecutar conciliación automática */
  async conciliarAutomatica(request: ConciliacionRequest): Promise<ConciliacionResponse> {
    return unwrap(
      await api.post<AppResponse<ConciliacionResponse>>('/api/v1/conciliacion/automatica', request),
    )
  },

  /** Obtener novedades (discrepancias para conciliación manual) */
  async getNovedades(params?: NovedadesParams): Promise<NovedadesResponse> {
    return unwrap(
      await api.get<AppResponse<NovedadesResponse>>('/api/v1/conciliacion/novedades', { params }),
    )
  },

  /** Conciliar manualmente movimientos SAP y Banco */
  async conciliarManual(request: ConciliacionManualRequest): Promise<Record<string, unknown>> {
    return unwrap(
      await api.post<AppResponse<Record<string, unknown>>>('/api/v1/conciliacion/manual', request),
    )
  },

  /** Historial de procesos de conciliación */
  async getHistorial(params?: HistorialParams): Promise<ProcesoConciliacion[]> {
    return unwrap(
      await api.get<AppResponse<ProcesoConciliacion[]>>('/api/v1/conciliacion/historial', { params }),
    )
  },

  /** Detalle de un proceso de conciliación */
  async getDetalleProceso(idProceso: string): Promise<DetalleProcesoResponse> {
    return unwrap(
      await api.get<AppResponse<DetalleProcesoResponse>>(`/api/v1/conciliacion/${idProceso}/detalle`),
    )
  },

  /** Revertir un proceso de conciliación */
  async revertirConciliacion(idProceso: string): Promise<Record<string, unknown>> {
    return unwrap(
      await api.post<AppResponse<Record<string, unknown>>>(`/api/v1/conciliacion/${idProceso}/revertir`),
    )
  },

  // ── Reportes ──────────────────────────────────────────────

  /** KPIs del dashboard */
  async getDashboard(params?: DashboardParams): Promise<DashboardMetricas> {
    return unwrap(
      await api.get<AppResponse<DashboardMetricas>>('/api/v1/reportes/dashboard', { params }),
    )
  },

  /** Reporte de partidas abiertas */
  async getPartidasAbiertas(params?: PartidasAbiertasParams): Promise<ReportePartidasAbiertas> {
    return unwrap(
      await api.get<AppResponse<ReportePartidasAbiertas>>('/api/v1/reportes/partidas-abiertas', { params }),
    )
  },

  /** Obtener datos incompletos de SAP */
  async getSAPIncompletos(): Promise<SAPIncompleto[]> {
    return unwrap(
      await api.get<AppResponse<SAPIncompleto[]>>('/api/v1/reportes/sap-incompletos'),
    )
  },

  /** Obtener reporte maestro unificado */
  async getReporteMaestro(params?: ReporteMaestroParams): Promise<MovimientoReporte[]> {
    return unwrap(
      await api.get<AppResponse<MovimientoReporte[]>>('/api/v1/reportes/reporte-maestro', { params }),
    )
  },

  /** Descargar reporte maestro en Excel */
  async descargarReporteMaestroExcel(params?: ReporteMaestroParams): Promise<Blob> {
    const response = await api.get<Blob>('/api/v1/reportes/reporte-maestro/excel', {
      params,
      responseType: 'blob', // Importante para manejar archivos
    })
    return response.data
  },
}
