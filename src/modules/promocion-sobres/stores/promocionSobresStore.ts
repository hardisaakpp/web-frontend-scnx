import { defineStore } from 'pinia'
import { mapPromocionSobresApiError, promocionSobresService } from '../services/promocionSobresApi'
import type { BeneficiarioDto, EntregaRegistradaDto, UiError } from '../types'

/** Alineado con IdentificacionNormalizer del API (solo dígitos, 10–13). */
const IDENT_MIN = 10
const IDENT_MAX = 13

type FlowStep = 'idle' | 'beneficiario' | 'entrega_ok'

interface PromocionSobresState {
  identificacion: string
  codigoEscaneado: string
  beneficiario: BeneficiarioDto | null
  ultimaEntrega: EntregaRegistradaDto | null
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
      Boolean(state.beneficiario?.puedeEscanear && !state.beneficiario?.entregado && state.codigoEscaneado.trim())
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
      this.codigoEscaneado = ''
      this.step = 'idle'

      try {
        const data = await promocionSobresService.consultarBeneficiario(id)
        this.beneficiario = data
        this.step = 'beneficiario'
      } catch (error) {
        this.error = extractUiError(error)
        this.beneficiario = null
      } finally {
        this.loading = false
      }
    },

    async registrarEntrega() {
      if (!this.beneficiario || !this.puedeRegistrarEntrega) return

      this.loading = true
      this.error = null

      try {
        const entrega = await promocionSobresService.registrarEntrega({
          identificacion: this.beneficiario.identificacion,
          codigoEscaneado: this.codigoEscaneado
        })
        this.ultimaEntrega = entrega
        this.beneficiario = {
          ...this.beneficiario,
          entregado: true,
          puedeEscanear: false,
          cupoDisponible: entrega.cupoDisponible ?? this.beneficiario.cupoDisponible
        }
        this.codigoEscaneado = ''
        this.step = 'entrega_ok'
      } catch (error) {
        this.error = extractUiError(error)
      } finally {
        this.loading = false
      }
    }
  }
})
