import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { conciliacionService } from '../services/conciliacionApi'
import type {
  DashboardMetricas,
  Banco,
  CargaArchivo,
  ImportResult,
  AppResponse,
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
} from '../types'

export const useConciliacionStore = defineStore('conciliacion', () => {
  // ── State ─────────────────────────────────────────────────
  const dashboard = ref<DashboardMetricas | null>(null)
  const bancos = ref<Banco[]>([])
  const cargas = ref<CargaArchivo[]>([])
  const novedades = ref<NovedadesResponse | null>(null)
  const historial = ref<ProcesoConciliacion[]>([])
  const detalleProceso = ref<DetalleProcesoResponse | null>(null)
  const partidasAbiertas = ref<ReportePartidasAbiertas | null>(null)

  // Resultado de última operación (import, sync, conciliación)
  const lastImportResult = ref<AppResponse<ImportResult> | null>(null)
  const lastSyncResult = ref<SAPSyncResponse | null>(null)
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
      error.value = e.response?.data?.message || e.message || 'Error inesperado'
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

  // ── Actions: Banca (Import) ───────────────────────────────
  async function importExcel(file: File, banco: string, usuario?: string) {
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

  // ── Actions: SAP ──────────────────────────────────────────
  async function syncSAP(diasAtras?: number) {
    return withLoading(async () => {
      const result = await conciliacionService.syncSAP(
        diasAtras ? { dias_atras: diasAtras } : undefined,
      )
      lastSyncResult.value = result
      return result
    })
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

  return {
    // State
    dashboard,
    bancos,
    cargas,
    novedades,
    historial,
    detalleProceso,
    partidasAbiertas,
    lastImportResult,
    lastSyncResult,
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
    importExcel,
    fetchCargas,
    syncSAP,
    conciliarAutomatica,
    fetchNovedades,
    conciliarManual,
    fetchHistorial,
    fetchDetalleProceso,
    revertirConciliacion,
    fetchPartidasAbiertas,
  }
})
