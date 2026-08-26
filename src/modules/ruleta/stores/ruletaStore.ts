import { defineStore } from 'pinia'
import { ruletaService } from '../services/ruletaApi'
import type {
  Ruleta, RuletaFilters, RuletaPagination,
  Tienda, SegmentoRuleta, IdentificacionCliente, ResultadoGiro
} from '../types'

// Clave de localStorage para persistir tienda seleccionada en el día
const TIENDA_KEY = () => {
  const hoy = new Date().toISOString().slice(0, 10)
  const user = localStorage.getItem('userName') ?? 'u'
  return `ruleta.tienda.${hoy}.${user}`
}

interface RuletaState {
  // ─── Listado (admin) ──────────────────────────────────────────────────────
  ruletas: Ruleta[]
  selectedRuleta: Ruleta | null
  pagination: RuletaPagination
  loading: boolean
  error: string | null
  filters: RuletaFilters

  // ─── Enrolador ────────────────────────────────────────────────────────────
  tiendas: Tienda[]
  tiendaSeleccionada: Tienda | null
  campanaActivaId: string | null
  segmentos: SegmentoRuleta[]
  clienteIdentificado: IdentificacionCliente | null
  girando: boolean
  resultadoGiro: ResultadoGiro | null
  errorEnrolador: string | null
  cargandoTiendas: boolean
}

export const useRuletaStore = defineStore('ruleta', {
  state: (): RuletaState => ({
    ruletas: [],
    selectedRuleta: null,
    pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 },
    loading: false,
    error: null,
    filters: { search: '', page: 1, pageSize: 10 },

    tiendas: [],
    tiendaSeleccionada: null,
    campanaActivaId: null,
    segmentos: [],
    clienteIdentificado: null,
    girando: false,
    resultadoGiro: null,
    errorEnrolador: null,
    cargandoTiendas: false
  }),

  actions: {
    // ─── Listado (admin) ────────────────────────────────────────────────────
    async fetchRuletas() {
      this.loading = true
      this.error = null
      try {
        const response = await ruletaService.getRuletas(this.filters)
        this.ruletas = response.data
        this.pagination = response.pagination
      } catch (err: any) {
        this.error = err.response?.data?.detail || 'Error al cargar datos'
      } finally {
        this.loading = false
      }
    },

    setSearchFilter(search: string) {
      this.filters.search = search
      this.filters.page = 1
      this.fetchRuletas()
    },

    setPage(page: number) {
      this.filters.page = page
      this.fetchRuletas()
    },

    // ─── Tiendas ────────────────────────────────────────────────────────────
    async cargarTiendas() {
      this.cargandoTiendas = true
      try {
        this.tiendas = await ruletaService.getTiendas()
      } finally {
        this.cargandoTiendas = false
      }
    },

    seleccionarTienda(tienda: Tienda) {
      this.tiendaSeleccionada = tienda
      // Persistir por el día para no preguntar de nuevo si recarga
      localStorage.setItem(TIENDA_KEY(), JSON.stringify(tienda))
    },

    // Restaurar tienda del localStorage al montar la vista
    restaurarTiendaDelDia() {
      const raw = localStorage.getItem(TIENDA_KEY())
      if (raw) {
        try { this.tiendaSeleccionada = JSON.parse(raw) } catch { /* ignorar */ }
      }
    },

    // ─── Segmentos de la campaña activa ─────────────────────────────────────
    async cargarSegmentos() {
      this.errorEnrolador = null
      try {
        const disponibilidad = await ruletaService.getDisponibilidadCampana()
        if (!disponibilidad.disponible || !disponibilidad.campana) {
          this.campanaActivaId = null
          this.segmentos = []
          this.errorEnrolador = disponibilidad.motivo ?? 'No hay ninguna campaña disponible en este momento.'
          return
        }
        const campana = disponibilidad.campana
        this.campanaActivaId = campana.id
        this.segmentos = await ruletaService.getSegmentosCampanaActiva(campana.id)
      } catch (err: any) {
        this.errorEnrolador = 'Error al cargar los premios de la campaña.'
        console.error(err)
      }
    },

    // ─── Giro ────────────────────────────────────────────────────────────────
    async ejecutarGiro(cedula: string, enroladorId?: number) {
      // Guarda síncrona: un doble clic/doble tap antes de que ':disabled' reaccione no debe
      // disparar un segundo POST /api/giros concurrente para el mismo cliente.
      if (this.girando) return
      if (!this.tiendaSeleccionada) return
      if (!this.campanaActivaId) {
        this.errorEnrolador = 'No hay campaña activa para jugar.'
        return
      }

      this.girando = true
      this.errorEnrolador = null
      this.resultadoGiro = null
      this.clienteIdentificado = null

      try {
        // 1. Identificar cliente (valida lista negra, segmento, cooldown en backend)
        const cliente = await ruletaService.identificarCliente(cedula)
        this.clienteIdentificado = cliente

        if (cliente.en_lista_negra) {
          this.errorEnrolador = 'No puede participar porque es trabajador de la empresa.'
          return
        }

        // 2. Ejecutar giro
        const resultado = await ruletaService.ejecutarGiro(
          cedula,
          this.tiendaSeleccionada.codigo,
          enroladorId,
          this.campanaActivaId
        )
        
        // Propagar el segmento identificado al resultado para que PremioModal pueda evaluarlo
        resultado.cliente.segmento = cliente.segmento

        // Ajustar índice ganador visual buscando en nuestros segmentos el id devuelto
        const indexEncontrado = this.segmentos.findIndex(s => s.nombre === resultado.premio.nombre)
        if (indexEncontrado >= 0) {
          resultado.indice_segmento = indexEncontrado
        } else {
          resultado.indice_segmento = Math.floor(Math.random() * this.segmentos.length) // NOSONAR – visual fallback index, not security-sensitive
        }

        this.resultadoGiro = resultado
      } catch (err: any) {
                const raw = err.response?.data?.error
                           || err.response?.data?.detail
                           || err.response?.data?.message
                           || err.message
                           || 'Ocurrió un error al procesar el giro.'
                this.errorEnrolador = raw
      } finally {
        this.girando = false
      }
    },

    async enviarNotificacion(correo: string) {
      if (!this.resultadoGiro) return
      await ruletaService.enviarNotificacion(this.resultadoGiro.giro_id, correo)
    },

    cambiarTienda() {
      this.tiendaSeleccionada = null
      localStorage.removeItem(TIENDA_KEY())
    },

    limpiarGiro() {
      this.resultadoGiro = null
      this.clienteIdentificado = null
      this.errorEnrolador = null
    },

    clearError() {
      this.error = null
      this.errorEnrolador = null
    }
  }
})
