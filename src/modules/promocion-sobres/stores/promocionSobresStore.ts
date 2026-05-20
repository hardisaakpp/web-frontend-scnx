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

type FlowStep = 'idle' | 'beneficiario' | 'entrega_ok' | 'ya_entregado'

interface PromocionSobresState {
  identificacion: string
  codigoEscaneado: string
  beneficiario: BeneficiarioDto | null
  ultimaEntrega: EntregaRegistradaDto | null
  /** `ApiResponse.message` del GET beneficiarios (éxito). */
  mensajeConsultaExitosa: string | null
  /** `ApiResponse.message` del POST entregas (éxito). */
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

    puedeRegistrarEntrega: (state) =>
      Boolean(
        state.beneficiario?.puedeEscanear &&
          state.codigoEscaneado.trim() &&
          state.step !== 'ya_entregado'
      ),

    /** POST 409 ESCANEO_DUPLICADO: pantalla final (no usar entregado del GET). */
    mostrarYaEntregado: (state) => state.step === 'ya_entregado' && Boolean(state.beneficiario),

    /** Paso de escaneo según puedeEscanear del API; oculto en éxito o cierre por escaneo duplicado. */
    mostrarEscaneo: (state) =>
      Boolean(
        state.beneficiario?.puedeEscanear &&
          state.step === 'beneficiario'
      )
  },

  actions: {
    setIdentificacion(value: string) {
      this.identificacion = value.replace(/\D/g, '')
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
        const { beneficiario, mensajeApi } = await promocionSobresService.consultarBeneficiario(id)
        this.beneficiario = beneficiario
        this.mensajeConsultaExitosa = mensajeApi
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
      if (!this.beneficiario || !this.puedeRegistrarEntrega) return

      this.loading = true
      this.error = null

      try {
        const { entrega, mensajeApi } = await promocionSobresService.registrarEntrega({
          identificacion: this.beneficiario.identificacion,
          codigoEscaneado: this.codigoEscaneado
        })
        this.ultimaEntrega = entrega
        this.mensajeEntregaExitosa = mensajeApi
        const { entregado, puedeEscanear } = resolveEntregaFlagsFromApi(entrega, this.beneficiario)
        this.beneficiario = {
          ...this.beneficiario,
          entregado,
          puedeEscanear,
          cupoDisponible: entrega.cupoDisponible ?? this.beneficiario.cupoDisponible
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

        if (uiError.code === 'ESCANEO_DUPLICADO') {
          this.step = 'ya_entregado'
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
