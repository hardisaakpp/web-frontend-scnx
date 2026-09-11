import { computed, reactive, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { extraerMensajeError, tesoreriaService } from '../services/tesoreriaService'
import type { ConfiguracionTesoreriaDto } from '../types/tesoreria.types'

// Estado a nivel de módulo (mismo patrón que useMisDepositos.ts): la vista ejecutiva (Card 1) y el
// DrawerConfiguracionPoliticas comparten esta misma instancia, así al guardar en el Drawer la
// tarjeta refleja los nuevos días/candados sin un refetch adicional.
const cargando = ref(true)
const guardando = ref(false)

const form = reactive<ConfiguracionTesoreriaDto>({
  bloqueoNuevoActivo: false,
  diasMaximoNuevo: 5,
  bloqueoDepositoActivo: false,
  diasMaximoDeposito: 5
})

export function useConfiguracionTesoreria() {
  const toast = useToast()

  const errorValidacion = computed(() => {
    if (form.bloqueoNuevoActivo && (form.diasMaximoNuevo < 1 || form.diasMaximoNuevo > 90)) {
      return 'Los días de gracia para nuevos depósitos deben estar entre 1 y 90.'
    }
    if (form.bloqueoDepositoActivo && (form.diasMaximoDeposito < 1 || form.diasMaximoDeposito > 90)) {
      return 'Los días de gracia para el envío a SAP deben estar entre 1 y 90.'
    }
    return null
  })

  async function cargar(): Promise<void> {
    cargando.value = true
    try {
      const data = await tesoreriaService.getConfiguracion()
      Object.assign(form, data)
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
      const actualizada = await tesoreriaService.updateConfiguracion({ ...form })
      Object.assign(form, actualizada)
      toast.success('Configuración actualizada', 'Los nuevos días de gracia y candados aplican inmediatamente.')
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
