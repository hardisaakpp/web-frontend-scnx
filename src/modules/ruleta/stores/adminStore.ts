import { defineStore } from 'pinia'
import { ruletaService } from '../services/ruletaApi'
import { extraerMensajeError } from '../services/utils/errorHandler'
import type {
  Campana, CrearCampanaDTO, DuplicarCampanaDTO, GrupoProbabilidad, PremioAdmin,
  TiendaInventario, InventarioPremio, Tienda,
  MetricasGlobal, EfectividadTienda, SegmentacionGrupo, ConversionSemanal,
  MetricasCampana, EnroladorMetrica, StockPremio, HistorialGiroItem, GiroFilters,
  RedencionResponse, PreviewImpactoStockItem, ImpactoStock, ProbabilidadGrupo, DistribucionTiendaItem
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
  verificandoImpactoStock: boolean

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
  historialRequestSeq: number
  // Últimos filtros usados en cargarHistorialDashboard, para poder re-emitir
  // la misma consulta (misma página, mismos filtros) tras una redención sin
  // que el refresco reactivo le "borre" al usuario los filtros que tenía aplicados.
  historialFiltrosActuales: Omit<GiroFilters, 'campanaId'>

  // Redención de premios
  redimiendo: boolean

  error: string | null
  guardando: boolean

  probabilidadesEnVivo: ProbabilidadGrupo[]
  loadingProbabilidades: boolean
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
    verificandoImpactoStock: false,

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
    historialRequestSeq: 0,
    historialFiltrosActuales: {},

    redimiendo: false,

    error: null,
    guardando: false,

    probabilidadesEnVivo: [],
    loadingProbabilidades: false
  }),

  getters: {
    // Valor editado de una celda de inventario (con fallback al original)
    valorCelda: (state) => (premioId: string, tiendaId: number): number => {
      const key = `${premioId}_${tiendaId}`
      if (key in state.inventarioEditado) return state.inventarioEditado[key]
      const item = state.inventario.find(i => i.premio_id === premioId)
      return item?.por_tienda[tiendaId] ?? 0
    },

    // Total asignado por premio (con ediciones pendientes). Debe iterar sobre la UNIÓN de las
    // tiendas que ya tenían fila de inventario y las que se están editando ahora mismo: si solo
    // se recorren las primeras, una celda recién editada en una tienda que nunca tuvo stock para
    // este premio queda fuera de la suma y el total mostrado (y el guard de "excede el stock")
    // puede quedar por debajo del real, dejando pasar un guardado que sí excede el límite.
    totalAsignadoConEdits: (state) => (premioId: string): number => {
      const item = state.inventario.find(i => i.premio_id === premioId)
      if (!item) return 0

      const tiendaIds = new Set(Object.keys(item.por_tienda).map(Number))
      for (const key of Object.keys(state.inventarioEditado)) {
        const underscoreIdx = key.lastIndexOf('_')
        if (key.slice(0, underscoreIdx) === premioId) {
          tiendaIds.add(Number(key.slice(underscoreIdx + 1)))
        }
      }

      let total = 0
      for (const tiendaId of tiendaIds) {
        const key = `${premioId}_${tiendaId}`
        total += key in state.inventarioEditado
          ? state.inventarioEditado[key]
          : (item.por_tienda[tiendaId] ?? 0)
      }
      return total
    },

    hayEdicionesPendientes: (state): boolean =>
      Object.keys(state.inventarioEditado).length > 0,

    // ── Conveniencia sobre el estado de una campaña (máquina de estados Fase 1) ─────────────
    // Finalizada es un candado permanente: solo lectura, nunca regresa a Activa/Pausada/Borrador.
    esCampanaInmutable: () => (campana: Campana | null | undefined): boolean =>
      campana?.estado === 'finalizada',

    esCampanaActiva: () => (campana: Campana | null | undefined): boolean =>
      campana?.estado === 'activa',

    esCampanaPausada: () => (campana: Campana | null | undefined): boolean =>
      campana?.estado === 'pausada',

    esCampanaBorrador: () => (campana: Campana | null | undefined): boolean =>
      campana?.estado === 'borrador'
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
      if (this.guardando) return
      this.guardando = true
      try {
        const nueva = await ruletaService.crearCampana(dto)
        this.campanas.unshift(nueva)
        return nueva
      } finally {
        this.guardando = false
      }
    },

    async cargarProbabilidadesEnVivo(campanaId: string, tiendaCodigo: string) {
      this.loadingProbabilidades = true
      try {
        this.probabilidadesEnVivo = await ruletaService.getProbabilidadesEnVivo(campanaId, tiendaCodigo)
      } catch (e) {
        console.error('Error al cargar probabilidades en vivo:', e)
        this.probabilidadesEnVivo = []
      } finally {
        this.loadingProbabilidades = false
      }
    },

    async actualizarCampana(id: string, dto: CrearCampanaDTO) {
      if (this.guardando) return
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
      if (this.guardando) return
      this.guardando = true
      try {
        const actualizada = await ruletaService.cambiarEstadoCampana(id, estado)
        const index = this.campanas.findIndex(c => c.id === id)
        if (index !== -1) this.campanas[index] = actualizada
      } finally {
        this.guardando = false
      }
    },

    async eliminarCampana(id: string) {
      if (this.guardando) return
      this.guardando = true
      try {
        await ruletaService.eliminarCampana(id)
        this.campanas = this.campanas.filter(c => c.id !== id)
      } finally {
        this.guardando = false
      }
    },

    // Duplicación limpia (deep clone): la nueva campaña llega en Borrador, con todo el catálogo
    // de premios/tiendas copiado y el stock en 0 — se antepone a la lista igual que crearCampana.
    async duplicarCampana(id: string, payload: DuplicarCampanaDTO) {
      if (this.guardando) return
      this.guardando = true
      try {
        const nueva = await ruletaService.duplicarCampana(id, payload)
        this.campanas.unshift(nueva)
        return nueva
      } finally {
        this.guardando = false
      }
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

    async actualizarPremio(grupoIndex: number, premioId: string, data: Partial<PremioAdmin>, confirmarReduccionStock = false) {
      if (this.guardando) return
      const grupo = this.grupos[grupoIndex]
      if (!grupo || !this.campanaActivaId) return
      this.guardando = true
      try {
        const actualizado = await ruletaService.actualizarPremio(this.campanaActivaId, premioId, data, confirmarReduccionStock)
        const p = grupo.premios.find(x => x.id === premioId)
        // Se copia la respuesta del servidor (incluye el rowVersion nuevo) en vez de `data`,
        // para que la siguiente edición compare contra el valor real que quedó en BD.
        if (p) Object.assign(p, actualizado)
        this.recalcularEstadoGrupo(grupoIndex)
      } finally {
        this.guardando = false
      }
    },

    async agregarPremio(grupoIndex: number, data: Omit<PremioAdmin, 'id'>) {
      if (this.guardando) return
      const grupo = this.grupos[grupoIndex]
      if (!grupo || !this.campanaActivaId) return
      this.guardando = true
      try {
        const nuevo = await ruletaService.agregarPremio(this.campanaActivaId, grupo.grupo, data)
        grupo.premios.push(nuevo)
        this.recalcularEstadoGrupo(grupoIndex)
        return nuevo
      } finally {
        this.guardando = false
      }
    },

    async eliminarPremio(grupoIndex: number, premioId: string) {
      if (this.guardando) return
      const grupo = this.grupos[grupoIndex]
      if (!grupo || !this.campanaActivaId) return
      this.guardando = true
      try {
        await ruletaService.eliminarPremio(this.campanaActivaId, premioId)
        grupo.premios = grupo.premios.filter(p => p.id !== premioId)
        this.recalcularEstadoGrupo(grupoIndex)
      } finally {
        this.guardando = false
      }
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
      if (this.guardando) return
      if (!this.campanaActivaId) return
      this.guardando = true
      try {
        await ruletaService.asignarStockTienda(this.campanaActivaId, premioId, tiendaCodigo, stockTotal)
      } finally {
        this.guardando = false
      }
    },

    async subirImagen(archivo: File): Promise<string> {
      // Guarda de re-entrancia: el resultado se asigna de forma síncrona a `data.imagen_url`
      // (string, no admite undefined) en el llamador, así que aquí no se puede usar un
      // `return` sin valor como en las demás acciones — se rechaza la llamada duplicada en
      // vez de dejarla pasar en silencio.
      if (this.guardando) throw new Error('Ya hay una operación en curso. Espera a que termine.')
      this.guardando = true
      try {
        return await ruletaService.subirImagenPremio(archivo)
      } finally {
        this.guardando = false
      }
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

    // Convierte las celdas editadas (premioId_tiendaId -> nuevoValor) en los items que
    // espera el backend (premioId + código de tienda), reutilizando el mismo parseo de
    // clave que ya usa guardarDistribucion.
    construirItemsImpactoStock(): PreviewImpactoStockItem[] {
      return Object.entries(this.inventarioEditado)
        .map(([key, nuevoStockTotal]): PreviewImpactoStockItem | null => {
          const underscoreIdx = key.lastIndexOf('_')
          const premioId = key.slice(0, underscoreIdx)
          const tiendaId = Number(key.slice(underscoreIdx + 1))
          const tienda = this.tiendasInventario.find(t => t.id === tiendaId)
          return tienda ? { premioId, tiendaCodigo: tienda.codigo, nuevoStockTotal } : null
        })
        .filter((item): item is PreviewImpactoStockItem => item !== null)
    },

    // Antes de guardar, calcula si alguno de los cambios pendientes desbloquearía stock
    // de inmediato (campaña Activa). Si la lista vuelve vacía, no hay nada que advertir
    // y el llamador puede guardar directo.
    async previsualizarImpactoDistribucion(): Promise<ImpactoStock[]> {
      if (!this.campanaInventarioId || this.verificandoImpactoStock) return []
      this.verificandoImpactoStock = true
      try {
        const items = this.construirItemsImpactoStock()
        return await ruletaService.previewImpactoStock(this.campanaInventarioId, items)
      } catch (e) {
        // Si la previsualización falla (ej. red caída), no bloqueamos el guardado real —
        // el usuario simplemente no ve el aviso, pero puede seguir guardando.
        console.error('Error al previsualizar el impacto de stock:', e)
        return []
      } finally {
        this.verificandoImpactoStock = false
      }
    },

    // Agrupa las celdas editadas por premio y guarda cada premio con UNA sola llamada atómica
    // (todo-o-nada) en vez de una petición HTTP por celda. El diseño anterior disparaba N
    // peticiones en paralelo por premio editado; cada una validaba "suma de las otras tiendas +
    // esta" contra una lectura fresca por request, así que varias podían pasar la validación
    // cada una contra una foto pre-edición de las demás y comitear todas, sumando por encima del
    // stock total. Además, tras el guardado se hace SIEMPRE un refetch real desde el backend en
    // vez de un merge óptimista local — la UI nunca debe mostrar como "guardado" algo que no se
    // pudo confirmar en la base de datos (si el guardado falla, el refetch trae la verdad de la
    // BD y solo se reponen en pantalla las celdas del/los premio(s) que fallaron, para que el
    // usuario no pierda lo que estaba corrigiendo).
    async guardarDistribucion() {
      if (this.guardando) return
      if (!this.campanaInventarioId) return
      this.guardando = true
      this.errorInventario = null
      const campanaId = this.campanaInventarioId

      const porPremio = new Map<string, DistribucionTiendaItem[]>()
      for (const [key, stockTotal] of Object.entries(this.inventarioEditado)) {
        const underscoreIdx = key.lastIndexOf('_')
        const premioId = key.slice(0, underscoreIdx)
        const tiendaId = Number(key.slice(underscoreIdx + 1))
        const tienda = this.tiendasInventario.find(t => t.id === tiendaId)
        if (!tienda) continue
        const items = porPremio.get(premioId) ?? []
        items.push({ tiendaCodigo: tienda.codigo, stockTotal })
        porPremio.set(premioId, items)
      }

      const premioIds = Array.from(porPremio.keys())
      const resultados = await Promise.allSettled(
        premioIds.map(premioId => {
          const rowVersion = this.inventario.find(i => i.premio_id === premioId)?.row_version
          return ruletaService.setDistribucionTienda(campanaId, premioId, porPremio.get(premioId)!, rowVersion)
        })
      )

      const premiosConError = new Map<string, unknown>()
      resultados.forEach((r, i) => {
        if (r.status === 'rejected') premiosConError.set(premioIds[i], r.reason)
      })

      const edicionesPendientes = { ...this.inventarioEditado }
      await this.cargarInventario(campanaId)

      if (premiosConError.size > 0) {
        for (const [key, valor] of Object.entries(edicionesPendientes)) {
          const underscoreIdx = key.lastIndexOf('_')
          const premioId = key.slice(0, underscoreIdx)
          if (premiosConError.has(premioId)) this.inventarioEditado[key] = valor
        }
        const [primerError] = premiosConError.values()
        this.errorInventario = extraerMensajeError(
          primerError,
          `No se pudo guardar la distribución de ${premiosConError.size} premio(s). Revisa los valores e intenta de nuevo.`
        )
      }

      this.guardando = false
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

    async cargarHistorialDashboard(campanaId?: string, page = 1, filtros: Omit<GiroFilters, 'campanaId'> = {}) {
      // Con auto-aplicar (selects/fechas inmediatos + debounce en texto) pueden
      // quedar dos peticiones en vuelo; solo la más reciente puede escribir el estado.
      const seq = ++this.historialRequestSeq
      this.loadingHistorial = true
      this.historialFiltrosActuales = filtros
      try {
        const res = await ruletaService.getHistorialGiros({ campanaId, ...filtros }, page, 10)
        if (seq !== this.historialRequestSeq) return
        this.historialGiros          = res.items
        this.historialTotalPaginas   = res.totalPaginas
        this.historialPaginaActual   = res.paginaActual
        this.historialTotalRegistros = res.totalRegistros
      } catch (e) {
        if (seq !== this.historialRequestSeq) return
        console.error('Error al cargar historial de giros:', e)
        this.historialGiros          = []
        this.historialTotalPaginas   = 0
        this.historialPaginaActual   = 1
        this.historialTotalRegistros = 0
      } finally {
        if (seq === this.historialRequestSeq) this.loadingHistorial = false
      }
    },

    // ── Redención de premios ──────────────────────────────────────────────────
    // Sin llamadores todavía en este módulo (la redención se dispara desde otra pantalla/futuro
    // flujo) — se ensancha el tipo de retorno a `| undefined` para el caso guardado, en vez de
    // lanzar, ya que no hay ningún consumidor existente que dependa de un valor no-undefined.
    async redimirPremio(codigo: string, notas?: string): Promise<RedencionResponse | undefined> {
      if (this.redimiendo) return
      this.redimiendo = true
      try {
        const redencion = await ruletaService.redimirPremio(codigo, notas)

        // Refresco reactivo tras una redención exitosa: sin esto, los contadores
        // superiores (Premios entregados, Stock restante) y la fila del historial
        // quedan desactualizados hasta que el usuario recarga la página (F5).
        // Solo aplica si el dashboard tiene una campaña específica cargada — en
        // la vista "todas las campañas" metricasCampana no se usa.
        if (this.campanaDashboardId) {
          await Promise.all([
            this.cargarMetricasCampana(this.campanaDashboardId),
            this.cargarHistorialDashboard(
              this.campanaDashboardId,
              this.historialPaginaActual,
              this.historialFiltrosActuales
            )
          ])
        }

        return redencion
      } finally {
        this.redimiendo = false
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
