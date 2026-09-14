import { computed, reactive, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { extraerMensajeError, tesoreriaService } from '../services/tesoreriaService'
import { toTimeInputValue, toTimeSpanString } from '../utils/formatters'
import type { ConfiguracionTesoreriaDto } from '../types/tesoreria.types'

// Estado a nivel de módulo (mismo patrón que useMisDepositos.ts): la vista ejecutiva (Card 1) y el
// DrawerConfiguracionPoliticas comparten esta misma instancia, así al guardar en el Drawer la
// tarjeta refleja los nuevos días/candados sin un refetch adicional.
const cargando = ref(true)
const guardando = ref(false)

// form.horaLimiteCorte se mantiene siempre en formato "HH:mm" (el que espera <input type="time">);
// la conversión a/desde el TimeSpan "HH:mm:ss" del backend ocurre solo al cargar/guardar.
const form = reactive<ConfiguracionTesoreriaDto>({
  bloqueoNuevoActivo: false,
  diasMaximoNuevo: 5,
  bloqueoDepositoActivo: false,
  diasMaximoDeposito: 5,
  horaLimiteCorte: '14:00'
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
    return null
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
      toast.success('Configuración actualizada', 'Los nuevos días de gracia, hora de corte y candados aplican inmediatamente.')
      return true
    } catch (err) {
      toast.error('No se pudo guardar la configuración', extraerMensajeError(err))
      return false
    } finally {
      guardando.value = false
    }
  }

  return {
    form,
    cargando,
    guardando,
    errorValidacion,
    cargar,
    guardar
  }
}
