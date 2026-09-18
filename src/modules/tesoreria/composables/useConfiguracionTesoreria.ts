import { computed, reactive, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { extraerMensajeError, tesoreriaService } from '../services/tesoreriaService'
import { formatDateOnly, toTimeInputValue, toTimeSpanString } from '../utils/formatters'
import type { ConfiguracionTesoreriaDto } from '../types/tesoreria.types'

// Estado a nivel de módulo (mismo patrón que useMisDepositos.ts): la vista ejecutiva (Card 1) y el
// DrawerConfiguracionPoliticas comparten esta misma instancia, así al guardar en el Drawer la
// tarjeta refleja los nuevos días/candados sin un refetch adicional.
const cargando = ref(true)
const guardando = ref(false)
const enviandoPrueba = ref(false)

// form.horaLimiteCorte se mantiene siempre en formato "HH:mm" (el que espera <input type="time">);
// la conversión a/desde el TimeSpan "HH:mm:ss" del backend ocurre solo al cargar/guardar.
// horaLimiteCorte ya no es editable desde la UI (estándar corporativo fijo 14:00): se mantiene en
// el form solo para viajar de ida y vuelta con el backend sin romper UpdateConfiguracionValidator.
const form = reactive<ConfiguracionTesoreriaDto>({
  bloqueoNuevoActivo: false,
  diasMaximoNuevo: 10,
  bloqueoDepositoActivo: false,
  diasMaximoDeposito: 10,
  horaLimiteCorte: '14:00',
  // Motor de notificaciones: completamente independiente de los candados de tienda de arriba.
  notificacionesActivas: true,
  usarRangoCalendarioNotificacion: false,
  diasVentanaNotificacion: 10,
  fechaInicioNotificacion: null,
  fechaFinNotificacion: null
})

const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/

export function useConfiguracionTesoreria() {
  const toast = useToast()

  const errorValidacion = computed(() => {
    if (form.bloqueoNuevoActivo && (form.diasMaximoNuevo < 1 || form.diasMaximoNuevo > 90)) {
      return 'Los días de gracia para nuevos depósitos deben estar entre 1 y 90.'
    }
    if (form.bloqueoDepositoActivo && (form.diasMaximoDeposito < 1 || form.diasMaximoDeposito > 90)) {
      return 'Los días de gracia para el envío a SAP deben estar entre 1 y 90.'
    }
    if (!HORA_VALIDA.test(form.horaLimiteCorte)) {
      return 'La hora límite de corte no es válida.'
    }
    if (form.diasVentanaNotificacion < 1 || form.diasVentanaNotificacion > 90) {
      return 'La ventana de notificaciones debe estar entre 1 y 90 días.'
    }
    if (form.usarRangoCalendarioNotificacion) {
      if (!form.fechaInicioNotificacion || !form.fechaFinNotificacion) {
        return 'Debe indicar la fecha de inicio y de fin del rango calendario de notificaciones.'
      }
      if (form.fechaInicioNotificacion > form.fechaFinNotificacion) {
        return 'La fecha de inicio del rango de notificaciones no puede ser posterior a la fecha de fin.'
      }
    }
    return null
  })

  /** Texto de resumen para la tarjeta del Hub: "Últimos 10 días (Ventana móvil)" o "01/09/2026 al 16/09/2026 (Rango calendario)". */
  const resumenRangoNotificaciones = computed(() => {
    if (!form.notificacionesActivas) return 'Correos desactivados'
    if (form.usarRangoCalendarioNotificacion) {
      if (!form.fechaInicioNotificacion || !form.fechaFinNotificacion) return 'Rango calendario sin definir'
      return `${formatDateOnly(form.fechaInicioNotificacion)} al ${formatDateOnly(form.fechaFinNotificacion)} (Rango calendario)`
    }
    return `Últimos ${form.diasVentanaNotificacion} día${form.diasVentanaNotificacion === 1 ? '' : 's'} (Ventana móvil)`
  })

  async function cargar(): Promise<void> {
    cargando.value = true
    try {
      const data = await tesoreriaService.getConfiguracion()
      Object.assign(form, data, { horaLimiteCorte: toTimeInputValue(data.horaLimiteCorte) })
    } catch (err) {
      toast.error('No se pudo cargar la configuración', extraerMensajeError(err))
    } finally {
      cargando.value = false
    }
  }

  async function guardar(): Promise<boolean> {
    if (errorValidacion.value) return false
    guardando.value = true
    try {
      const actualizada = await tesoreriaService.updateConfiguracion({
        ...form,
        horaLimiteCorte: toTimeSpanString(form.horaLimiteCorte)
      })
      Object.assign(form, actualizada, { horaLimiteCorte: toTimeInputValue(actualizada.horaLimiteCorte) })
      toast.success('Configuración actualizada', 'Los candados de tienda y el rango de alertas por correo aplican inmediatamente.')
      return true
    } catch (err) {
      toast.error('No se pudo guardar la configuración', extraerMensajeError(err))
      return false
    } finally {
      guardando.value = false
    }
  }

  async function enviarPruebaInmediata(): Promise<void> {
    enviandoPrueba.value = true
    try {
      const resultado = await tesoreriaService.ejecutarCorteNotificaciones()
      if (resultado.correosEnviados === 0) {
        toast.warning(
          'Sin correos enviados',
          `${resultado.tiendasEvaluadas} tienda(s) evaluada(s), ${resultado.tiendasOmitidas} al día o ya notificada(s) hoy.`
        )
        return
      }
      toast.success(
        'Notificación inmediata enviada',
        `${resultado.correosEnviados} correo(s) enviado(s) de ${resultado.tiendasEvaluadas} tienda(s) evaluada(s).` +
          (resultado.errores > 0 ? ` ${resultado.errores} con error.` : '')
      )
    } catch (err) {
      toast.error('No se pudo ejecutar la notificación inmediata', extraerMensajeError(err))
    } finally {
      enviandoPrueba.value = false
    }
  }

  return {
    form,
    cargando,
    guardando,
    enviandoPrueba,
    errorValidacion,
    resumenRangoNotificaciones,
    cargar,
    guardar,
    enviarPruebaInmediata
  }
}
