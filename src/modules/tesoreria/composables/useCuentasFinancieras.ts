import { computed, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { extraerMensajeError, tesoreriaService } from '../services/tesoreriaService'
import type { ActualizarEstadoCuentaPayload, CuentaFinancieraDto } from '../types/tesoreria.types'

export type FiltroEstadoCuenta = 'todas' | 'activas' | 'paraTiendas'

// Estado a nivel de módulo (mismo patrón que useMisDepositos.ts): la vista ejecutiva (Card 2, KPIs)
// y el DrawerGestionCuentas comparten esta misma instancia, así un toggle hecho en el Drawer se
// refleja de inmediato en los KPIs de la tarjeta sin recargar ni duplicar el fetch.
const cuentas = ref<CuentaFinancieraDto[]>([])
const cargando = ref(false)
const sincronizando = ref(false)
const actualizandoIds = ref(new Set<number>())

/** Buscador + filtro rápido del Drawer de gestión (en memoria, sin refetch). */
const busqueda = ref('')
const filtroEstado = ref<FiltroEstadoCuenta>('todas')

export function useCuentasFinancieras() {
  const toast = useToast()

  const totalCuentas = computed(() => cuentas.value.length)
  const cuentasParaTiendas = computed(() => cuentas.value.filter(c => c.habilitadaParaTiendas).length)
  const cuentasActivas = computed(() => cuentas.value.filter(c => c.activa).length)

  const cuentasFiltradas = computed<CuentaFinancieraDto[]>(() => {
    const termino = busqueda.value.trim().toLowerCase()

    return cuentas.value.filter(c => {
      if (filtroEstado.value === 'activas' && !c.activa) return false
      if (filtroEstado.value === 'paraTiendas' && !c.habilitadaParaTiendas) return false
      if (!termino) return true

      return (
        c.nombreCuenta.toLowerCase().includes(termino) ||
        c.codigoCuentaSAP.toLowerCase().includes(termino) ||
        c.codigoFormateado.toLowerCase().includes(termino)
      )
    })
  })

  async function cargar(): Promise<void> {
    cargando.value = true
    try {
      cuentas.value = await tesoreriaService.getTodasCuentasFinancieras()
    } catch (err) {
      toast.error('No se pudieron cargar las cuentas financieras', extraerMensajeError(err))
    } finally {
      cargando.value = false
    }
  }

  /**
   * Dispara la sincronización manual del catálogo bancario desde SAP Business One (mismo comando
   * que el job nocturno de Hangfire) y refresca el listado del Drawer con el resultado. El backend
   * no expone `EmpresaId` en este endpoint — el comando sincroniza siempre Mabel Trading.
   */
  async function sincronizarConSap(): Promise<void> {
    if (sincronizando.value) return

    sincronizando.value = true
    try {
      const resultado = await tesoreriaService.sincronizarCuentasSap()
      await cargar()
      toast.success(
        'Sincronización con SAP completada',
        `${resultado.cuentasNuevas} cuenta(s) nueva(s) y ${resultado.cuentasActualizadas} actualizada(s), de ${resultado.cuentasFiltradasBancarias} cuenta(s) bancaria(s) recibida(s) desde SAP Business One.`
      )
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 403) {
        toast.error('Acceso denegado', extraerMensajeError(err, 'No tiene permisos para sincronizar catálogos contables.'))
      } else if (status === 502 || status === 503 || status === 504) {
        toast.error(
          'Servicio SAP no disponible',
          extraerMensajeError(err, 'No se pudo contactar con el servicio de integración SAP. Verifique que el middleware esté operativo.')
        )
      } else {
        toast.error('No se pudo sincronizar con SAP', extraerMensajeError(err, 'No fue posible sincronizar el catálogo con SAP Business One.'))
      }
    } finally {
      sincronizando.value = false
    }
  }

  async function actualizarEstado(cuenta: CuentaFinancieraDto, payload: ActualizarEstadoCuentaPayload): Promise<void> {
    // Candado por fila: un segundo toggle sobre la misma cuenta mientras la primera petición PATCH
    // sigue en vuelo se ignora en vez de disparar una segunda llamada concurrente.
    if (actualizandoIds.value.has(cuenta.id)) return

    actualizandoIds.value.add(cuenta.id)
    try {
      const actualizada = await tesoreriaService.actualizarEstadoCuenta(cuenta.id, payload)
      const idx = cuentas.value.findIndex(c => c.id === cuenta.id)
      if (idx !== -1) cuentas.value[idx] = actualizada
      toast.success('Cuenta actualizada', `${actualizada.nombreCuenta} — ${actualizada.codigoFormateado} se guardó correctamente.`)
    } catch (err) {
      toast.error('No se pudo actualizar la cuenta', extraerMensajeError(err))
    } finally {
      actualizandoIds.value.delete(cuenta.id)
    }
  }

  return {
    cuentas,
    cuentasFiltradas,
    cargando,
    sincronizando,
    actualizandoIds,
    busqueda,
    filtroEstado,
    totalCuentas,
    cuentasParaTiendas,
    cuentasActivas,
    cargar,
    sincronizarConSap,
    actualizarEstado
  }
}
