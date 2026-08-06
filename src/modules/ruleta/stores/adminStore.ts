import { defineStore } from 'pinia'
import { ruletaService } from '../services/ruletaApi'
import type {
  Campana, CrearCampanaDTO, GrupoProbabilidad, PremioAdmin,
  TiendaInventario, InventarioPremio, Tienda,
  MetricasGlobal, EfectividadTienda, SegmentacionGrupo, ConversionSemanal,
  MetricasCampana, EnroladorMetrica, StockPremio, HistorialGiroItem
} from '../types'

interface AdminState {
  // Campañas
  campanas: Campana[]
  loadingCampanas: boolean

  // Premios
  campanaActivaId: string | null
  grupos: GrupoProbabilidad[]
  loadingPremios: boolean

  // Tiendas (para stock por tienda en detalle de campaña)
  tiendas: Tienda[]
  loadingTiendas: boolean

  // Inventario
  tiendasInventario: TiendaInventario[]
  inventario: InventarioPremio[]
  inventarioEditado: Record<string, number>
  campanaInventarioId: string | null
  loadingInventario: boolean
  errorInventario: string | null

  // Dashboard Global — KPIs + analytics mock
  campanaDashboardId: string | null
  metricas: MetricasGlobal | null
  metricasCampana: MetricasCampana | null
  loadingMetricasCampana: boolean
  efectividadTiendas: EfectividadTienda[]
  segmentacion: SegmentacionGrupo[]
  conversionSemanal: ConversionSemanal[]
  loadingDashboard: boolean

  // Dashboard Global — datos reales por campaña
  enroladores: EnroladorMetrica[]
  loadingEnroladores: boolean
  stockDashboard: StockPremio[]
  loadingStockDashboard: boolean
  historialGiros: HistorialGiroItem[]
  historialTotalPaginas: number
  historialPaginaActual: number
  historialTotalRegistros: number
  loadingHistorial: boolean

  error: string | null
  guardando: boolean
}

export const useAdminStore = defineStore('admin', {
  state: (): AdminState => ({
    campanas: [],
    loadingCampanas: false,

    campanaActivaId: null,
    grupos: [],
    loadingPremios: false,

    tiendas: [],
    loadingTiendas: false,

    tiendasInventario: [],
    inventario: [],
    inventarioEditado: {},
    campanaInventarioId: null,
    loadingInventario: false,
    errorInventario: null,

    campanaDashboardId: null,
    metricas: null,
    metricasCampana: null,
    loadingMetricasCampana: false,
    efectividadTiendas: [],
    segmentacion: [],
    conversionSemanal: [],
    loadingDashboard: false,

    enroladores: [],
    loadingEnroladores: false,
    stockDashboard: [],
    loadingStockDashboard: false,
    historialGiros: [],
    historialTotalPaginas: 0,
    historialPaginaActual: 1,
    historialTotalRegistros: 0,
    loadingHistorial: false,

    error: null,
    guardando: false
  }),

  getters: {
    // Valor editado de una celda de inventario (con fallback al original)
    valorCelda: (state) => (premioId: string, tiendaId: number): number => {
      const key = `${premioId}_${tiendaId}`
      if (key in state.inventarioEditado) return state.inventarioEditado[key]
      const item = state.inventario.find(i => i.premio_id === premioId)
      return item?.por_tienda[tiendaId] ?? 0
    },

    // Total asignado por premio (con ediciones pendientes)
    totalAsignadoConEdits: (state) => (premioId: string): number => {
      const item = state.inventario.find(i => i.premio_id === premioId)
      if (!item) return 0
      let total = 0
      for (const tiendaId of Object.keys(item.por_tienda)) {
        const key = `${premioId}_${tiendaId}`
        total += key in state.inventarioEditado
          ? state.inventarioEditado[key]
          : item.por_tienda[Number(tiendaId)]
      }
      return total
    },

    hayEdicionesPendientes: (state): boolean =>
      Object.keys(state.inventarioEditado).length > 0
  },

  actions: {
    // ── Campañas ──────────────────────────────────────────────────────────────
    async cargarCampanas() {
      this.loadingCampanas = true
      this.error = null
      try {
        this.campanas = await ruletaService.getCampanas()
      } catch (e) {
        console.error('Error al cargar campañas:', e)
        this.error = 'Error al cargar campañas.'
      } finally {
        this.loadingCampanas = false
      }
    },

    async crearCampana(dto: CrearCampanaDTO) {
      this.guardando = true
      try {
        const nueva = await ruletaService.crearCampana(dto)
        this.campanas.unshift(nueva)
        return nueva
      } finally {
        this.guardando = false
      }
    },

    async actualizarCampana(id: string, dto: CrearCampanaDTO) {
      this.guardando = true
      try {
        const actualizada = await ruletaService.actualizarCampana(id, dto)
        const index = this.campanas.findIndex(c => c.id === id)
        if (index !== -1) {
          this.campanas[index] = actualizada
        }
        return actualizada
      } finally {
        this.guardando = false
      }
    },

    async cambiarEstado(id: string, estado: Campana['estado']) {
      await ruletaService.cambiarEstadoCampana(id, estado)
      const c = this.campanas.find(x => x.id === id)
      if (c) c.estado = estado
    },

    async eliminarCampana(id: string) {
      await ruletaService.eliminarCampana(id)
      this.campanas = this.campanas.filter(c => c.id !== id)
    },

    // ── Tiendas (para stock por tienda) ───────────────────────────────────────
    async cargarTiendas() {
      if (this.tiendas.length > 0) return
      this.loadingTiendas = true
      try {
        this.tiendas = await ruletaService.getTiendas()
      } finally {
        this.loadingTiendas = false
      }
    },

    // ── Premios ───────────────────────────────────────────────────────────────
    async cargarPremios() {
      this.loadingPremios = true
      this.error = null
      try {
        const campana = await ruletaService.getCampanaActiva()
        if (campana) {
          this.campanaActivaId = campana.id
          this.grupos = await ruletaService.getGruposProbabilidad(campana.id)
        } else {
          this.campanaActivaId = null
          this.grupos = []
          this.error = 'No hay ninguna campaña activa.'
        }
      } catch (e) {
        console.error('Error al cargar premios:', e)
        this.error = 'Error al cargar premios.'
      } finally {
        this.loadingPremios = false
      }
    },

    async actualizarPremio(grupoIndex: number, premioId: string, data: Partial<PremioAdmin>) {
      const grupo = this.grupos[grupoIndex]
      if (!grupo || !this.campanaActivaId) return
      await ruletaService.actualizarPremio(this.campanaActivaId, premioId, data)
      const p = grupo.premios.find(x => x.id === premioId)
      if (p) Object.assign(p, data)
      this.recalcularEstadoGrupo(grupoIndex)
    },

    async agregarPremio(grupoIndex: number, data: Omit<PremioAdmin, 'id'>) {
      const grupo = this.grupos[grupoIndex]
      if (!grupo || !this.campanaActivaId) return
      const nuevo = await ruletaService.agregarPremio(this.campanaActivaId, grupo.grupo, data)
      grupo.premios.push(nuevo)
      this.recalcularEstadoGrupo(grupoIndex)
      return nuevo
    },

    async eliminarPremio(grupoIndex: number, premioId: string) {
      const grupo = this.grupos[grupoIndex]
      if (!grupo || !this.campanaActivaId) return
      await ruletaService.eliminarPremio(this.campanaActivaId, premioId)
      grupo.premios = grupo.premios.filter(p => p.id !== premioId)
      this.recalcularEstadoGrupo(grupoIndex)
    },

    async cargarPremiosCampana(campanaId: string) {
      this.loadingPremios = true
      this.error = null
      try {
        this.campanaActivaId = campanaId
        this.grupos = await ruletaService.getGruposProbabilidad(campanaId)
      } catch (e) {
        console.error('Error al cargar premios de campaña:', e)
        this.error = 'Error al cargar premios.'
      } finally {
        this.loadingPremios = false
      }
    },

    async asignarStockTienda(premioId: string, tiendaCodigo: string, stockTotal: number) {
      if (!this.campanaActivaId) return
      await ruletaService.asignarStockTienda(this.campanaActivaId, premioId, tiendaCodigo, stockTotal)
    },

    async subirImagen(archivo: File): Promise<string> {
      return await ruletaService.subirImagenPremio(archivo)
    },

    recalcularEstadoGrupo(grupoIndex: number) {
      const grupo = this.grupos[grupoIndex]
      if (!grupo) return
      const tieneReal = grupo.premios.some(p => !p.es_relleno)
      const tieneConsolacion = grupo.premios.some(p => p.es_relleno)
      const permiteSoloConsolacion = grupo.grupo === 'GRUPO_4' || grupo.grupo === 'GRUPO_5' || grupo.grupo === 'GRUPO_6'

      if ((tieneReal && tieneConsolacion) || (permiteSoloConsolacion && tieneConsolacion)) {
        grupo.estado = 'completo'
      } else if (tieneReal) {
        grupo.estado = 'advertencia'
      } else {
        grupo.estado = 'incompleto'
      }
    },

    // ── Inventario ────────────────────────────────────────────────────────────
    async cargarInventario(campanaId: string) {
      this.campanaInventarioId = campanaId
      this.loadingInventario = true
      this.error = null
      this.errorInventario = null
      try {
        const tiendas = await ruletaService.getTiendasInventario()
        const inventario = await ruletaService.getInventarioCampana(campanaId, tiendas)

        this.tiendasInventario = tiendas
        this.inventario = inventario
        this.inventarioEditado = {}
      } catch (e) {
        console.error('Error al cargar inventario:', e)
        this.error = 'Error al cargar inventario.'
      } finally {
        this.loadingInventario = false
      }
    },

    setCelda(premioId: string, tiendaId: number, valor: number) {
      const key = `${premioId}_${tiendaId}`
      this.inventarioEditado[key] = Math.max(0, valor)
    },

    restablecerInventario() {
      this.inventarioEditado = {}
    },

    async guardarDistribucion() {
      if (!this.campanaInventarioId) return
      this.guardando = true
      this.errorInventario = null
      const campanaId = this.campanaInventarioId
      try {
        const calls = Object.entries(this.inventarioEditado).map(([key, stockTotal]) => {
          const underscoreIdx = key.lastIndexOf('_')
          const premioId = key.slice(0, underscoreIdx)
          const tiendaId = Number(key.slice(underscoreIdx + 1))
          const tienda = this.tiendasInventario.find(t => t.id === tiendaId)
          if (!tienda) return Promise.resolve()
          return ruletaService.asignarStockTienda(campanaId, premioId, tienda.codigo, stockTotal)
        })
        await Promise.all(calls)
        // Confirmar los edits como persistidos
        for (const item of this.inventario) {
          for (const tienda of this.tiendasInventario) {
            const key = `${item.premio_id}_${tienda.id}`
            if (key in this.inventarioEditado) {
              item.por_tienda[tienda.id] = this.inventarioEditado[key]
            }
          }
          item.total_asignado = Object.values(item.por_tienda).reduce((a, b) => a + b, 0)
          item.restante_bodega = item.stock_total - item.total_asignado
        }
        this.inventarioEditado = {}
      } catch (e: any) {
        this.errorInventario = e?.response?.data?.error ?? e?.message ?? 'Error al guardar la distribución de inventario.'
      } finally {
        this.guardando = false
      }
    },

    // ── Métricas por campaña (real) ───────────────────────────────────────────
    async cargarMetricasCampana(campanaId: string) {
      this.campanaDashboardId = campanaId
      this.loadingMetricasCampana = true
      try {
        this.metricasCampana = await ruletaService.getMetricasCampana(campanaId)
      } catch (e) {
        console.error('Error al cargar métricas de campaña:', e)
        this.metricasCampana = null
      } finally {
        this.loadingMetricasCampana = false
      }
    },

    // ── Dashboard Global ──────────────────────────────────────────────────────
    // ── Dashboard real por campaña ────────────────────────────────────────────
    async cargarEnroladoresDashboard(campanaId?: string) {
      this.loadingEnroladores = true
      try {
        this.enroladores = await ruletaService.getEnroladoresMetricas(campanaId)
      } catch (e) {
        console.error('Error al cargar enroladores del dashboard:', e)
        this.enroladores = []
      } finally {
        this.loadingEnroladores = false
      }
    },

    async cargarStockDashboard(campanaId: string) {
      this.loadingStockDashboard = true
      try {
        this.stockDashboard = await ruletaService.getStockPremiosCampana(campanaId)
      } catch (e) {
        console.error('Error al cargar stock del dashboard:', e)
        this.stockDashboard = []
      } finally {
        this.loadingStockDashboard = false
      }
    },

    async cargarHistorialDashboard(campanaId?: string, page = 1) {
      this.loadingHistorial = true
      try {
        const res = await ruletaService.getHistorialGiros({ campanaId }, page, 10)
        this.historialGiros          = res.items
        this.historialTotalPaginas   = res.totalPaginas
        this.historialPaginaActual   = res.paginaActual
        this.historialTotalRegistros = res.totalRegistros
      } catch (e) {
        console.error('Error al cargar historial de giros:', e)
        this.historialGiros          = []
        this.historialTotalPaginas   = 0
        this.historialPaginaActual   = 1
        this.historialTotalRegistros = 0
      } finally {
        this.loadingHistorial = false
      }
    },

    async cargarDashboardGlobal() {
      this.loadingDashboard = true
      this.error = null
      try {
        const [metricas, efectividad, segmentacion, conversion] = await Promise.all([
          ruletaService.getMetricasGlobal(),
          ruletaService.getEfectividadTiendas(),
          ruletaService.getSegmentacion(),
          ruletaService.getConversionSemanal()
        ])
        this.metricas = metricas
        this.efectividadTiendas = efectividad
        this.segmentacion = segmentacion
        this.conversionSemanal = conversion
      } catch (e) {
        console.error('Error al cargar dashboard global:', e)
        this.error = 'Error al cargar el dashboard.'
      } finally {
        this.loadingDashboard = false
      }
    }
  }
})
