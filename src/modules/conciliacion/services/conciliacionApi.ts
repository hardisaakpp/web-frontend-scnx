import axios from 'axios'
import { attachUnauthorizedRedirect } from '@/services/sessionGuard'
import type {
  AppResponse,
  DashboardMetricas,
  Banco,
  CargaArchivo,
  ImportResult,
  SAPSyncRequest,
  SAPSyncResponse,
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

// ── Instancia Axios ─────────────────────────────────────────
const API_BASE = import.meta.env.VITE_CONCILIACION_API_URL || '/conciliacion-api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 60_000, // 60s — import y sync pueden tardar
})

// Interceptor: agregar JWT si existe
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token && token !== 'undefined' && token !== 'null' && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  if (import.meta.env.DEV) {
    console.debug(`🚀 [Conciliacion API] Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
  }

  return config
})

// Interceptor: manejo de errores
api.interceptors.response.use(
  response => {
    if (import.meta.env.DEV) {
      console.debug(`✅ [Conciliacion API] Response: ${response.status} from ${response.config.url}`)
    }
    return response
  },
  error => {
    if (import.meta.env.DEV) {
      console.error(`❌ [Conciliacion API] Error:`, error.message, error.response?.data)
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push({ name: 'login' })
    }
    return Promise.reject(error)
  },
)

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

  /** Importar movimientos bancarios desde Excel */
  async importExcel(file: File, banco: string, usuario?: string): Promise<AppResponse<ImportResult>> {
    const formData = new FormData()
    formData.append('file', file)

    const params: Record<string, string> = { banco }
    if (usuario) params.usuario = usuario

    return unwrapFull(
      await api.post<AppResponse<ImportResult>>('/api/v1/banca/import', formData, {
        params,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120_000, // 2 min para archivos grandes
      }),
    )
  },

  /** Historial de archivos importados */
  async getCargas(): Promise<CargaArchivo[]> {
    return unwrap(await api.get<AppResponse<CargaArchivo[]>>('/api/v1/banca/cargas'))
  },

  // ── Catálogo ──────────────────────────────────────────────

  /** Listar bancos registrados */
  async getBancos(): Promise<Banco[]> {
    return unwrap(await api.get<AppResponse<Banco[]>>('/api/v1/catalogo/bancos'))
  },

  // ── SAP ───────────────────────────────────────────────────

  /** Sincronizar movimientos desde SAP HANA */
  async syncSAP(request?: SAPSyncRequest): Promise<SAPSyncResponse> {
    const response = await api.post<SAPSyncResponse>('/api/v1/sap/sync', request || { dias_atras: 14 })
    return response.data
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
