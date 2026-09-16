import { computed, reactive, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { extraerErroresCampo, extraerMensajeError, tesoreriaService } from '../services/tesoreriaService'
import { parsearErrorIntegracionSap, type SapErrorFriendly } from '../utils/tesoreriaErrorHandler'
import type {
  CrearDepositoPayload,
  CuentaFinancieraDto,
  DepositoDto,
  DetalleDiarioDto,
  ResumenComparativoDto,
  TipoFiltroKpi
} from '../types/tesoreria.types'

// Estado a nivel de módulo para mantener sincronizados el listado y el detalle expandido
const resumen = ref<ResumenComparativoDto[]>([])
const detalleActual = ref<DetalleDiarioDto | null>(null)
const cuentas = ref<CuentaFinancieraDto[]>([])

/** Filtro rápido de las tarjetas KPI — filtra `resumen` en memoria, sin volver a pedirlo al backend. */
const filtroKpiActivo = ref<TipoFiltroKpi>('todos')

const loadingResumen = ref(false)
const loadingDetalle = ref(false)
const loadingCuentas = ref(false)
const creandoDeposito = ref(false)

/** IDs de depósito con una acción (integrar/anular) en curso — para spinner por fila */
const enviandoSapIds = reactive(new Set<number>())
const anulandoIds = reactive(new Set<number>())

/** Último rechazo de SAP por depósito, ya traducido a mensaje amigable — para alerta persistente por fila. */
const erroresSapPorDeposito = reactive(new Map<number, SapErrorFriendly>())

const errorResumen = ref<string | null>(null)
const errorDetalle = ref<string | null>(null)
/** Errores de validación del backend (400/409) al crear un depósito, por nombre de campo. */
const erroresCampoDeposito = ref<Record<string, string> | null>(null)

export function useMisDepositos() {
  const toast = useToast()

  // ─── Métricas reactivas KPI para el período consultado ───────────────────────
  const totalEfectivoPeriodo = computed(() =>
    resumen.value.reduce((acc, fila) => acc + (fila.totalEfectivo || 0), 0)
  )

  const totalDepositadoPeriodo = computed(() =>
    resumen.value.reduce((acc, fila) => acc + (fila.totalDepositado || 0), 0)
  )

  const diferenciaPeriodo = computed(() =>
    Math.round((totalEfectivoPeriodo.value - totalDepositadoPeriodo.value) * 100) / 100
  )

  const totalPendientesSap = computed(() =>
    resumen.value.reduce((acc, fila) => acc + (fila.pendientesSAP || 0), 0)
  )

  const totalDias = computed(() => resumen.value.length)

  const diasCuadrados = computed(() =>
    resumen.value.filter(r => Math.abs(r.diferencia) < 0.01).length
  )

  // ─── Filtro rápido KPI (en memoria, sin refetch) ─────────────────────────
  const resumenFiltrado = computed<ResumenComparativoDto[]>(() => {
    if (!Array.isArray(resumen.value)) return []

    switch (filtroKpiActivo.value) {
      case 'pendientesSap':
        return resumen.value.filter(item => (item.pendientesSAP ?? 0) > 0)
      case 'conDiferencia':
        // > 0.009 (no >= 0.01) para no tratar como "cuadrado" un centavo que redondeó de más.
        return resumen.value.filter(item => Math.abs(item.diferencia ?? 0) > 0.009)
      case 'cuadrados':
        return resumen.value.filter(item => Math.abs(item.diferencia ?? 0) <= 0.009)
      default:
        return resumen.value
    }
  })

  function toggleFiltroKpi(tipo: TipoFiltroKpi): void {
    filtroKpiActivo.value = filtroKpiActivo.value === tipo ? 'todos' : tipo
  }

  function limpiarFiltroKpi(): void {
    filtroKpiActivo.value = 'todos'
  }

  // ─── Acciones ─────────────────────────────────────────────────────────────
  async function fetchResumen(codigoAlmacen: string, fechaDesde: string, fechaHasta: string): Promise<void> {
    loadingResumen.value = true
    errorResumen.value = null
    filtroKpiActivo.value = 'todos' // evita quedar filtrando sobre datos de otro almacén/rango
    try {
      resumen.value = await tesoreriaService.getResumen({ codigoAlmacen, fechaDesde, fechaHasta })
    } catch (err) {
      errorResumen.value = extraerMensajeError(err, 'No se pudo cargar el resumen de depósitos.')
      resumen.value = []
    } finally {
      loadingResumen.value = false
    }
  }

  async function fetchDetalle(codigoAlmacen: string, fechaCierre: string): Promise<void> {
    loadingDetalle.value = true
    errorDetalle.value = null
    try {
      detalleActual.value = await tesoreriaService.getDetalle(codigoAlmacen, fechaCierre)
    } catch (err) {
      errorDetalle.value = extraerMensajeError(err, 'No se pudo cargar el detalle del día seleccionado.')
      detalleActual.value = null
    } finally {
      loadingDetalle.value = false
    }
  }

  async function fetchCuentas(): Promise<void> {
    if (cuentas.value.length > 0) return
    loadingCuentas.value = true
    try {
      cuentas.value = await tesoreriaService.getCuentasFinancieras()
    } catch (err) {
      toast.error('No se pudieron cargar las cuentas bancarias', extraerMensajeError(err))
    } finally {
      loadingCuentas.value = false
    }
  }

  async function crearDeposito(
    payload: CrearDepositoPayload,
    contexto: { fechaDesde: string; fechaHasta: string }
  ): Promise<DepositoDto | null> {
    creandoDeposito.value = true
    erroresCampoDeposito.value = null
    try {
      const creado = await tesoreriaService.crearDeposito(payload)
      toast.success('Depósito registrado', `Papeleta ${creado.numeroComprobante} guardada correctamente.`)
      await Promise.all([
        fetchDetalle(payload.codigoAlmacen, payload.fechaCierreCaja),
        fetchResumen(payload.codigoAlmacen, contexto.fechaDesde, contexto.fechaHasta)
      ])
      return creado
    } catch (err) {
      toast.error('No se pudo registrar el depósito', extraerMensajeError(err))
      erroresCampoDeposito.value = extraerErroresCampo(err)
      return null
    } finally {
      creandoDeposito.value = false
    }
  }

  async function integrarSap(
    deposito: DepositoDto,
    contexto: { fechaDesde: string; fechaHasta: string }
  ): Promise<boolean> {
    // Candado de re-entrada: el :disabled del botón depende de un re-render reactivo de Vue, que
    // no es instantáneo. Este guard corta un segundo click/invocación que llegue antes de ese
    // re-render, sin depender solo de la UI.
    if (enviandoSapIds.has(deposito.id)) return false

    enviandoSapIds.add(deposito.id)
    try {
      const actualizado = await tesoreriaService.integrarSap(deposito.id)
      erroresSapPorDeposito.delete(deposito.id)
      toast.success('Depósito integrado en SAP', `DocEntry ${actualizado.docEntrySAP ?? '—'} generado correctamente.`)
      await Promise.all([
        fetchDetalle(deposito.codigoAlmacen, deposito.fechaCierreCaja),
        fetchResumen(deposito.codigoAlmacen, contexto.fechaDesde, contexto.fechaHasta)
      ])
      return true
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) {
        // El backend ya lo integró (otra pestaña, un reintento anterior, etc.) — no es un error
        // real del usuario. Se resincroniza la lista para que la fila refleje el estado real
        // (oculta el botón "Enviar a SAP" y muestra el badge de integrado) en vez de quedar stale.
        erroresSapPorDeposito.delete(deposito.id)
        toast.warning('Depósito ya integrado', 'Este depósito ya fue integrado en SAP. Se actualizó la lista con su estado actual.')
        await Promise.all([
          fetchDetalle(deposito.codigoAlmacen, deposito.fechaCierreCaja),
          fetchResumen(deposito.codigoAlmacen, contexto.fechaDesde, contexto.fechaHasta)
        ])
      } else {
        // Traduce el rechazo de SAP (cuenta inactiva, papeleta duplicada en SAP, periodo cerrado,
        // middleware caído, etc.) a un mensaje claro y accionable, en vez de mostrar el JSON crudo.
        const amigable = parsearErrorIntegracionSap(err)
        erroresSapPorDeposito.set(deposito.id, amigable)
        toast.error(amigable.titulo, [amigable.mensaje, amigable.accionSugerida].filter(Boolean).join(' '))
      }
      return false
    } finally {
      enviandoSapIds.delete(deposito.id)
    }
  }

  async function anularDeposito(
    deposito: DepositoDto,
    motivo: string,
    contexto: { fechaDesde: string; fechaHasta: string }
  ): Promise<boolean> {
    anulandoIds.add(deposito.id)
    try {
      await tesoreriaService.anularDeposito(deposito.id, motivo)
      toast.success('Depósito anulado', `La papeleta ${deposito.numeroComprobante} fue anulada. El saldo pendiente ha sido recalculado.`)
      await Promise.all([
        fetchDetalle(deposito.codigoAlmacen, deposito.fechaCierreCaja),
        fetchResumen(deposito.codigoAlmacen, contexto.fechaDesde, contexto.fechaHasta)
      ])
      return true
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) {
        // El backend ya lo integró a SAP (otra pestaña, un envío concurrente, etc.) — se
        // resincroniza la lista para que la fila oculte el botón de anular y refleje el estado real.
        toast.warning('Conflicto', 'El depósito ya fue integrado en SAP Business One y no puede ser anulado.')
        await Promise.all([
          fetchDetalle(deposito.codigoAlmacen, deposito.fechaCierreCaja),
          fetchResumen(deposito.codigoAlmacen, contexto.fechaDesde, contexto.fechaHasta)
        ])
      } else {
        toast.error('No se pudo anular el depósito', extraerMensajeError(err))
      }
      return false
    } finally {
      anulandoIds.delete(deposito.id)
    }
  }

  return {
    resumen,
    resumenFiltrado,
    filtroKpiActivo,
    detalleActual,
    cuentas,
    loadingResumen,
    loadingDetalle,
    loadingCuentas,
    creandoDeposito,
    enviandoSapIds,
    anulandoIds,
    erroresSapPorDeposito,
    errorResumen,
    errorDetalle,
    erroresCampoDeposito,
    // Métricas KPI
    totalEfectivoPeriodo,
    totalDepositadoPeriodo,
    diferenciaPeriodo,
    totalPendientesSap,
    totalDias,
    diasCuadrados,
    // Métodos
    fetchResumen,
    fetchDetalle,
    fetchCuentas,
    crearDeposito,
    integrarSap,
    anularDeposito,
    toggleFiltroKpi,
    limpiarFiltroKpi
  }
}

/** Alias para mantener compatibilidad */
export const useTesoreriaDepositos = useMisDepositos
