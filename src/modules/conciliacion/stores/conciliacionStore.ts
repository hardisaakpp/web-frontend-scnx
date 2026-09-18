import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { conciliacionService } from '../services/conciliacionApi'
import type {
  DashboardMetricas,
  Banco,
  BancoCatalogoCreate,
  BancoCatalogoUpdate,
  CargaArchivo,
  PaginacionMeta,
  ImportResult,
  AppResponse,
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

export const useConciliacionStore = defineStore('conciliacion', () => {
  // ── State ─────────────────────────────────────────────────
  const dashboard = ref<DashboardMetricas | null>(null)
  const bancos = ref<Banco[]>([])
  const catalogoBancos = ref<Banco[]>([])
  const cargas = ref<CargaArchivo[]>([])
  const cargasPaginadas = ref<CargaArchivo[]>([])
  const cargasPaginadasMeta = ref<PaginacionMeta | null>(null)
  const sincronizacionActual = ref<SincronizacionSAP | null>(null)
  const sincronizacionesSAP = ref<SincronizacionSAP[]>([])
  const sincronizacionesSAPMeta = ref<PaginacionMeta | null>(null)
  const novedades = ref<NovedadesResponse | null>(null)
  const historial = ref<ProcesoConciliacion[]>([])
  const detalleProceso = ref<DetalleProcesoResponse | null>(null)
  const partidasAbiertas = ref<ReportePartidasAbiertas | null>(null)
  const sapIncompletos = ref<SAPIncompleto[]>([])
  const reporteMaestroList = ref<MovimientoReporte[]>([])

  // Resultado de última operación (import, sync, conciliación)
  const lastImportResult = ref<AppResponse<ImportResult> | null>(null)
  const lastConciliacionResult = ref<ConciliacionResponse | null>(null)

  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Getters ───────────────────────────────────────────────
  const hasDashboard = computed(() => dashboard.value !== null)
  const hasBancos = computed(() => bancos.value.length > 0)
  const hasNovedades = computed(() => (novedades.value?.total_casos ?? 0) > 0)

  // ── Helpers ───────────────────────────────────────────────
  function clearError() {
    error.value = null
  }

  async function withLoading<T>(fn: () => Promise<T>): Promise<T> {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (e: any) {
      error.value = e.response?.data?.message || e.response?.data?.detail || e.message || 'Error inesperado'
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Actions: Dashboard ────────────────────────────────────
  async function fetchDashboard(params?: DashboardParams) {
    return withLoading(async () => {
      dashboard.value = await conciliacionService.getDashboard(params)
      return dashboard.value
    })
  }

  // ── Actions: Catálogo ─────────────────────────────────────
  async function fetchBancos() {
    return withLoading(async () => {
      bancos.value = await conciliacionService.getBancos()
      return bancos.value
    })
  }

  async function fetchCatalogoBancos() {
    return withLoading(async () => {
      catalogoBancos.value = await conciliacionService.getBancos(false)
      return catalogoBancos.value
    })
  }

  async function crearBanco(payload: BancoCatalogoCreate) {
    return withLoading(async () => {
      const result = await conciliacionService.crearBanco(payload)
      await fetchCatalogoBancos()
      return result
    })
  }

  async function actualizarBanco(idBanco: number, payload: BancoCatalogoUpdate) {
    return withLoading(async () => {
      const result = await conciliacionService.actualizarBanco(idBanco, payload)
      await fetchCatalogoBancos()
      return result
    })
  }

  async function eliminarBanco(idBanco: number) {
    return withLoading(async () => {
      const result = await conciliacionService.eliminarBanco(idBanco)
      await fetchCatalogoBancos()
      return result
    })
  }

  // ── Actions: Banca (Import) ───────────────────────────────
  async function importExcel(file: File, banco?: string, usuario?: string) {
    return withLoading(async () => {
      const result = await conciliacionService.importExcel(file, banco, usuario)
      lastImportResult.value = result
      return result
    })
  }

  async function fetchCargas() {
    return withLoading(async () => {
      cargas.value = await conciliacionService.getCargas()
      return cargas.value
    })
  }

  async function fetchCargasPaginado(pagina: number, cantidad: number) {
    return withLoading(async () => {
      const result = await conciliacionService.getCargasPaginado(pagina, cantidad)
      cargasPaginadas.value = result.data ?? []
      cargasPaginadasMeta.value = (result.meta as unknown as PaginacionMeta) ?? null
      return result
    })
  }

  // ── Actions: SAP ──────────────────────────────────────────
  /** Completa los campos que todavía no se conocen recién iniciada la sincronización (se llenan con el primer poll). */
  function completarSincronizacion(data: SincronizacionIniciada): SincronizacionSAP {
    return {
      ...data,
      fecha_fin: null,
      total_filas: null,
      procesados: null,
      insertados: null,
      actualizados: null,
      registros_incompletos: null,
      alertas_conciliados_modificados: null,
      error_mensaje: null,
    }
  }

  /** Dispara la sincronización SAP en segundo plano. Lanza si ya hay una en curso (409, error_code SYNC_EN_CURSO). */
  async function iniciarSyncSAP(fechaDesde: string, fechaHasta: string) {
    return withLoading(async () => {
      const request: SAPSyncRequest = { fecha_desde: fechaDesde, fecha_hasta: fechaHasta }
      const result = await conciliacionService.iniciarSyncSAP(request)
      if (result.data) sincronizacionActual.value = completarSincronizacion(result.data)
      return result
    })
  }

  async function fetchSincronizacionesSAP(pagina: number, cantidad: number) {
    return withLoading(async () => {
      const result = await conciliacionService.getSincronizacionesSAP(pagina, cantidad)
      sincronizacionesSAP.value = result.data ?? []
      sincronizacionesSAPMeta.value = (result.meta as unknown as PaginacionMeta) ?? null
      return result
    })
  }

  /** Última sincronización (para polling): no pasa por withLoading para no parpadear el loading global cada pocos segundos. */
  async function fetchUltimaSincronizacionSAP(): Promise<SincronizacionSAP | null> {
    const result = await conciliacionService.getSincronizacionesSAP(1, 1)
    const ultima = result.data?.[0] ?? null
    sincronizacionActual.value = ultima
    return ultima
  }

  // ── Actions: Conciliación ─────────────────────────────────
  async function conciliarAutomatica(request: ConciliacionRequest) {
    return withLoading(async () => {
      const result = await conciliacionService.conciliarAutomatica(request)
      lastConciliacionResult.value = result
      return result
    })
  }

  async function fetchNovedades(params?: NovedadesParams) {
    return withLoading(async () => {
      novedades.value = await conciliacionService.getNovedades(params)
      return novedades.value
    })
  }

  async function conciliarManual(request: ConciliacionManualRequest) {
    return withLoading(async () => {
      return await conciliacionService.conciliarManual(request)
    })
  }

  async function fetchHistorial(params?: HistorialParams) {
    return withLoading(async () => {
      historial.value = await conciliacionService.getHistorial(params)
      return historial.value
    })
  }

  async function fetchDetalleProceso(idProceso: string) {
    return withLoading(async () => {
      detalleProceso.value = await conciliacionService.getDetalleProceso(idProceso)
      return detalleProceso.value
    })
  }

  async function revertirConciliacion(idProceso: string) {
    return withLoading(async () => {
      const result = await conciliacionService.revertirConciliacion(idProceso)
      // Refrescar historial después de revertir
      await fetchHistorial()
      return result
    })
  }

  // ── Actions: Reportes ─────────────────────────────────────
  async function fetchPartidasAbiertas(params?: PartidasAbiertasParams) {
    return withLoading(async () => {
      partidasAbiertas.value = await conciliacionService.getPartidasAbiertas(params)
      return partidasAbiertas.value
    })
  }

  async function fetchSAPIncompletos() {
    return withLoading(async () => {
      sapIncompletos.value = await conciliacionService.getSAPIncompletos()
      return sapIncompletos.value
    })
  }

  async function fetchReporteMaestro(params?: ReporteMaestroParams) {
    return withLoading(async () => {
      reporteMaestroList.value = await conciliacionService.getReporteMaestro(params)
      return reporteMaestroList.value
    })
  }

  async function descargarMaestroExcel(params?: ReporteMaestroParams) {
    return withLoading(async () => {
      return await conciliacionService.descargarReporteMaestroExcel(params)
    })
  }

  return {
    // State
    dashboard,
    bancos,
    catalogoBancos,
    cargas,
    cargasPaginadas,
    cargasPaginadasMeta,
    sincronizacionActual,
    sincronizacionesSAP,
    sincronizacionesSAPMeta,
    novedades,
    historial,
    detalleProceso,
    partidasAbiertas,
    lastImportResult,
    lastConciliacionResult,
    loading,
    error,
    // Getters
    hasDashboard,
    hasBancos,
    hasNovedades,
    // Actions
    clearError,
    fetchDashboard,
    fetchBancos,
    fetchCatalogoBancos,
    crearBanco,
    actualizarBanco,
    eliminarBanco,
    importExcel,
    fetchCargas,
    fetchCargasPaginado,
    iniciarSyncSAP,
    fetchSincronizacionesSAP,
    fetchUltimaSincronizacionSAP,
    conciliarAutomatica,
    fetchNovedades,
    conciliarManual,
    fetchHistorial,
    fetchDetalleProceso,
    revertirConciliacion,
    fetchPartidasAbiertas,
    sapIncompletos,
    fetchSAPIncompletos,
    reporteMaestroList,
    fetchReporteMaestro,
    descargarMaestroExcel,
  }
})
