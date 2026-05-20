import { defineStore } from 'pinia'
import {
  extractEntregaEstadoPatchFromAxiosError,
  mapPromocionSobresApiError,
  promocionSobresService,
  resolveEntregaFlagsFromApi
} from '../services/promocionSobresApi'
import type { BeneficiarioDto, EntregaRegistradaDto, UiError } from '../types'

/** Alineado con IdentificacionNormalizer del API (solo dígitos, 10–13). */
const IDENT_MIN = 10
const IDENT_MAX = 13

/** Pasos de UI; el estado de entrega lo define siempre el API (lectura de BD). */
type FlowStep = 'idle' | 'beneficiario' | 'entrega_ok'

interface PromocionSobresState {
  identificacion: string
  codigoEscaneado: string
  /** Snapshot del beneficiario devuelto por el API (fuente de verdad = BD). */
  beneficiario: BeneficiarioDto | null
  /** Respuesta del último POST /entregas exitoso. */
  ultimaEntrega: EntregaRegistradaDto | null
  /** `ApiResponse.message` del GET beneficiarios. */
  mensajeConsultaExitosa: string | null
  /** `ApiResponse.message` del POST /entregas (éxito) o mensaje del API en cierre de flujo. */
  mensajeEntregaExitosa: string | null
  loading: boolean
  error: UiError | null
  step: FlowStep
}

function extractUiError(error: unknown): UiError {
  const withUi = error as { uiError?: UiError }
  if (withUi.uiError) return withUi.uiError
  return mapPromocionSobresApiError(error)
}

function entregaConfirmadaPorApi(entrega: EntregaRegistradaDto): boolean {
  const { entregado } = resolveEntregaFlagsFromApi(entrega)
  return entregado
}

export const usePromocionSobresStore = defineStore('promocionSobres', {
  state: (): PromocionSobresState => ({
    identificacion: '',
    codigoEscaneado: '',
    beneficiario: null,
    ultimaEntrega: null,
    mensajeConsultaExitosa: null,
    mensajeEntregaExitosa: null,
    loading: false,
    error: null,
    step: 'idle'
  }),

  getters: {
    identificacionValidaParaConsulta: (state) => {
      const len = state.identificacion.trim().length
      return len >= IDENT_MIN && len <= IDENT_MAX
    },

    /** `Entregado` según el último GET/POST/details del API (BD). */
    entregadoSegunApi: (state) => Boolean(state.beneficiario?.entregado),

    /**
     * Obsequio ya entregado en BD: se muestra cierre de flujo, no escaneo ni éxito nuevo.
     * Tras un POST 200 reciente se prioriza el banner de entrega_ok.
     */
    mostrarYaEntregado: (state) =>
      Boolean(state.beneficiario?.entregado && state.step !== 'entrega_ok'),

    puedeRegistrarEntrega: (state) =>
      Boolean(
        state.beneficiario?.puedeEscanear &&
          !state.beneficiario.entregado &&
          state.codigoEscaneado.trim() &&
          state.step === 'beneficiario'
      ),

    /** Solo si el API indica pendiente (`entregado=false`). */
    mostrarEscaneo: (state) =>
      Boolean(
        state.beneficiario?.puedeEscanear &&
          !state.beneficiario.entregado &&
          state.step === 'beneficiario'
      ),

    /** Mensaje de cierre cuando BD ya tiene entregado=true (GET o POST 409). Solo texto del API. */
    mensajeFlujoCerrado: (state) => {
      if (!state.beneficiario?.entregado || state.step === 'entrega_ok') return null
      const post = state.mensajeEntregaExitosa?.trim()
      const get = state.mensajeConsultaExitosa?.trim()
      return post || get || null
    }
  },

  actions: {
    setIdentificacion(value: string) {
      const next = value.replace(/\D/g, '')
      if (next !== this.identificacion) {
        this.clearConsultaEnCurso()
      }
      this.identificacion = next
    },

    /** Limpia resultado previo al editar la cédula (sin borrar el input). */
    clearConsultaEnCurso() {
      this.codigoEscaneado = ''
      this.beneficiario = null
      this.ultimaEntrega = null
      this.mensajeConsultaExitosa = null
      this.mensajeEntregaExitosa = null
      this.error = null
      this.step = 'idle'
    },

    setCodigoEscaneado(value: string) {
      this.codigoEscaneado = value.trim()
    },

    resetError() {
      this.error = null
    },

    resetFlujo() {
      this.identificacion = ''
      this.codigoEscaneado = ''
      this.beneficiario = null
      this.ultimaEntrega = null
      this.mensajeConsultaExitosa = null
      this.mensajeEntregaExitosa = null
      this.error = null
      this.step = 'idle'
    },

    /** Relee GET /beneficiarios — snapshot actual de la BD. */
    async cargarBeneficiarioDesdeApi(identificacion: string) {
      const { beneficiario, mensajeApi } = await promocionSobresService.consultarBeneficiario(identificacion)
      this.beneficiario = beneficiario
      this.mensajeConsultaExitosa = mensajeApi
      return beneficiario
    },

    async consultarBeneficiario() {
      const id = this.identificacion.trim()
      if (!id) return

      if (!this.identificacionValidaParaConsulta) {
        this.error = {
          code: 'IDENTIFICACION_INVALIDA',
          message: `Ingresa una cédula de ${IDENT_MIN} a ${IDENT_MAX} dígitos (solo números).`
        }
        return
      }

      this.loading = true
      this.error = null
      this.beneficiario = null
      this.ultimaEntrega = null
      this.mensajeConsultaExitosa = null
      this.mensajeEntregaExitosa = null
      this.codigoEscaneado = ''
      this.step = 'idle'

      try {
        await this.cargarBeneficiarioDesdeApi(id)
        this.step = 'beneficiario'
      } catch (error) {
        this.error = extractUiError(error)
        this.beneficiario = null
        this.mensajeConsultaExitosa = null
      } finally {
        this.loading = false
      }
    },

    async registrarEntrega() {
      if (!this.beneficiario || !this.codigoEscaneado.trim()) return
      if (this.step !== 'beneficiario') return

      const codigo = this.codigoEscaneado
      const identificacion = this.beneficiario.identificacion

      this.loading = true
      this.error = null

      try {
        // Releer BD antes de POST: la fuente de verdad puede haber cambiado.
        await this.cargarBeneficiarioDesdeApi(identificacion)

        if (this.beneficiario?.entregado) {
          this.codigoEscaneado = ''
          this.step = 'beneficiario'
          return
        }

        if (!this.beneficiario?.puedeEscanear) {
          this.codigoEscaneado = ''
          return
        }

        const { entrega, mensajeApi } = await promocionSobresService.registrarEntrega({
          identificacion,
          codigoEscaneado: codigo
        })

        if (!entregaConfirmadaPorApi(entrega)) {
          this.error = {
            code: 'UNKNOWN',
            message: mensajeApi || 'El API no confirmó la entrega.'
          }
          return
        }

        const { entregado, puedeEscanear } = resolveEntregaFlagsFromApi(entrega)
        this.ultimaEntrega = entrega
        this.mensajeEntregaExitosa = mensajeApi
        this.beneficiario = {
          ...this.beneficiario!,
          entregado,
          puedeEscanear,
          cupoDisponible: entrega.cupoDisponible ?? this.beneficiario!.cupoDisponible
        }
        this.codigoEscaneado = ''
        this.step = 'entrega_ok'
      } catch (error) {
        const uiError = extractUiError(error)
        const estadoPatch = extractEntregaEstadoPatchFromAxiosError(error)
        if (estadoPatch && this.beneficiario) {
          this.beneficiario = { ...this.beneficiario, ...estadoPatch }
        }
        this.codigoEscaneado = ''

        if (uiError.code === 'ESCANEO_DUPLICADO' || this.beneficiario?.entregado) {
          this.step = 'beneficiario'
          this.error = null
          this.mensajeEntregaExitosa = uiError.message
          return
        }

        this.error = uiError
      } finally {
        this.loading = false
      }
    }
  }
})
