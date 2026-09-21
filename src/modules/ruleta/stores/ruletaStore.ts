import { defineStore } from 'pinia'
import { ruletaService } from '../services/ruletaApi'
import type {
  Ruleta, RuletaFilters, RuletaPagination,
  Tienda, SegmentoRuleta, IdentificacionCliente, ResultadoGiro
} from '../types'

// Comparador semántico tolerante: minúsculas, sin acentos/diacríticos, y sin ningún carácter que
// no sea letra/dígito (espacios, signos "¡!", guiones, etc.). Así "¡Sigue intentando!" y
// "Sigue Intentando" (o "sigue-intentando") se reconocen como el mismo premio de consolación sin
// que el frontend tenga que quemar un catálogo de nombres que marketing cambia por campaña.
export function normalizarTexto(txt?: string | null): string {
  return (txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Resuelve a qué gajo visual de la ruleta debe apuntar la aguja para un resultado de giro dado.
 * Función pura (sin dependencias de store/red) para poder probarla de forma aislada — ver
 * BUS-BAJA-05: el backend puede entregar el comodín de emergencia con un nombre distinto al
 * configurado en la campaña ("Sigue participando" vs "¡Suerte para la próxima!"), y una
 * comparación de igualdad estricta dejaba la aguja detenida en el índice 0 (con frecuencia el
 * Premio Mayor/Estrella), mostrando una falsa victoria visual antes de abrir el modal perdedor.
 *
 * Estrategia jerárquica, nunca cruzando la frontera "premio real" ↔ "consuelo":
 *  1. Nombre exacto, luego nombre normalizado (tolera acentos/signos/mayúsculas).
 *  2. Id del segmento visual, si el backend llega a exponer uno que coincida.
 *  3. Fallback categórico estricto: para un resultado vacío/consuelo, un gajo vacío elegido al
 *     azar entre TODOS los marcados como tal (nunca el mismo siempre); para un premio físico
 *     ganado, un gajo físico elegido al azar entre los reales. Jamás se cruza la categoría.
 */
export function resolverIndiceSegmento(
  segmentos: SegmentoRuleta[],
  premio: SegmentoRuleta,
  esGanador: boolean
): number {
  if (segmentos.length === 0) return 0

  // Paso 1: nombre exacto, y si no, nombre normalizado.
  const porNombreExacto = segmentos.findIndex(s => s.nombre === premio.nombre)
  if (porNombreExacto >= 0) return porNombreExacto

  const nombrePremioNormalizado = normalizarTexto(premio.nombre)
  if (nombrePremioNormalizado) {
    const porNombreNormalizado = segmentos.findIndex(
      s => normalizarTexto(s.nombre) === nombrePremioNormalizado
    )
    if (porNombreNormalizado >= 0) return porNombreNormalizado
  }

  // Paso 2: id del segmento, cuando el origen del premio lo exponga de forma comparable.
  const porId = segmentos.findIndex(s => s.id === premio.id)
  if (porId >= 0) return porId

  // Paso 3: fallback categórico estricto — cero falsas victorias, cero falsas derrotas.
  const esResultadoVacio = premio.es_vacio || premio.tipo === 'relleno' || !esGanador

  if (esResultadoVacio) {
    const indicesVacios = segmentos
      .map((s, i) => (s.es_vacio || s.tipo === 'relleno' ? i : -1))
      .filter(i => i >= 0)

    if (indicesVacios.length > 0) {
      // Aleatorio ÚNICAMENTE entre los gajos de consuelo: evita el sesgo monótono de anclar
      // siempre al primero cuando la ruleta tiene varios alternados.
      return indicesVacios[Math.floor(Math.random() * indicesVacios.length)] // NOSONAR – visual fallback index, not security-sensitive
    }

    // La ruleta no tiene ningún gajo configurado como vacío (config incompleta de la campaña):
    // nunca el índice 0 sin validar, que habitualmente es el Premio Mayor/Estrella.
    return segmentos.length - 1
  }

  // Premio físico ganado sin match de nombre/id: aleatorio ÚNICAMENTE entre gajos físicos reales,
  // jamás permitiendo que la aguja caiga sobre una casilla de consuelo tras una jugada ganadora.
  const indicesFisicos = segmentos
    .map((s, i) => (!s.es_vacio && s.tipo !== 'relleno' ? i : -1))
    .filter(i => i >= 0)

  if (indicesFisicos.length > 0) {
    return indicesFisicos[Math.floor(Math.random() * indicesFisicos.length)] // NOSONAR – visual fallback index, not security-sensitive
  }

  // Configuración degenerada (premio físico ganado pero la ruleta visual no tiene ningún gajo
  // físico): sin categoría segura a la que anclarse, se evita igualmente el índice 0 a ciegas.
  return segmentos.length - 1
}

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

        // Ajustar índice ganador visual con la estrategia jerárquica y categórica de
        // resolverIndiceSegmento (ver su documentación arriba).
        resultado.indice_segmento = resolverIndiceSegmento(this.segmentos, resultado.premio, resultado.es_ganador)

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
