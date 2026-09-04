import { defineStore } from 'pinia'
import { ruletaService } from '../services/ruletaApi'
import type {
  Ruleta, RuletaFilters, RuletaPagination,
  Tienda, SegmentoRuleta, IdentificacionCliente, ResultadoGiro
} from '../types'

// El ERP guarda la sesión completa como JSON en 'user' (no un string plano en 'userName').
// Sin este parseo, localStorage.getItem('userName') siempre da null y todos los operadores caen
// en el mismo sufijo genérico 'u', compartiendo la tienda seleccionada en equipos compartidos y
// descontando inventario cruzado entre sucursales.
function obtenerIdentificadorUsuario(): string {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return 'u'
    const parsed = JSON.parse(raw) as { username?: string; userName?: string; id?: string | number } | null
    const identificador = parsed?.username ?? parsed?.userName ?? parsed?.id
    return identificador != null ? String(identificador) : 'u'
  } catch {
    return 'u'
  }
}

// Clave de localStorage para persistir tienda seleccionada en el día
const TIENDA_KEY = () => {
  const hoy = new Date().toISOString().slice(0, 10)
  const user = obtenerIdentificadorUsuario()
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

        // Ajustar el índice visual sobre el que debe frenar la aguja (ver calcularIndiceSegmento).
        resultado.indice_segmento = this.calcularIndiceSegmento(resultado)

        this.resultadoGiro = resultado
      } catch (err: any) {
        // Sin err.response, el request nunca llegó a completarse (timeout de campanaApi a los
        // 10s, WiFi de tienda caído, DNS, CORS): el mensaje técnico de axios no le sirve al
        // enrolador para decidir qué hacer, así que se normaliza a una instrucción accionable.
        this.errorEnrolador = err.response
          ? (err.response.data?.error
             || err.response.data?.detail
             || err.response.data?.message
             || 'Ocurrió un error al procesar el giro.')
          : 'Problema de conexión en tienda, verifica el estado antes de reintentar.'
      } finally {
        this.girando = false
      }
    },

    // Determina de forma determinista el segmento visual sobre el que debe frenar la aguja.
    // Nunca usa azar: antes, si el nombre del premio no calzaba exacto con un segmento, caía en
    // Math.random() y la aguja podía frenar sobre un premio físico real aunque el resultado del
    // backend fuera "Sigue participando" (o viceversa), rompiendo la confianza del cliente en el
    // sorteo. El backend no expone un id único de premio en la respuesta del giro (GiroDto solo
    // trae nombre/tipo/descripción), así que el único emparejamiento posible para un premio real
    // ganado es por nombre; para cualquier otro caso (sin premio, o nombre no encontrado) se
    // apunta siempre al comodín/vacío configurado, y en último caso al índice 0 fijo.
    calcularIndiceSegmento(resultado: ResultadoGiro): number {
      const esPremioReal = resultado.es_ganador && !resultado.premio.es_vacio
      if (esPremioReal) {
        const porNombre = this.segmentos.findIndex(s => s.nombre === resultado.premio.nombre)
        if (porNombre >= 0) return porNombre
      }

      const indiceComodin = this.segmentos.findIndex(s => s.es_vacio || s.tipo === 'relleno')
      return indiceComodin >= 0 ? indiceComodin : 0
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
