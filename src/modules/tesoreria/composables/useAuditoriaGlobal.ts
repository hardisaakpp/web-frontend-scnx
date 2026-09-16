import { computed, reactive, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { extraerMensajeError, tesoreriaService } from '../services/tesoreriaService'
import { parsearErrorIntegracionSap, type SapErrorFriendly } from '../utils/tesoreriaErrorHandler'
import {
  EstadoDeposito,
  type AuditoriaGlobalDto,
  type FiltroEstadoAuditoria,
  type GetAuditoriaGlobalParams
} from '../types/tesoreria.types'

const items = ref<AuditoriaGlobalDto[]>([])
const totalCount = ref(0)
const pageNumber = ref(1)
const pageSize = ref(20)
const totalPages = ref(0)

const loading = ref(false)
const loadingCsv = ref(false)
const error = ref<string | null>(null)

/** Filtro de estado aplicado en el backend (ver GetAuditoriaGlobalQuery.Estado) — dispara refetch. */
const filtroEstado = ref<FiltroEstadoAuditoria>('TODOS')
/** Filtro rápido en memoria sobre la página actual (comprobante/responsable), sin refetch. */
const busquedaRapida = ref('')

const reintentandoIds = reactive(new Set<number>())
const anulandoIds = reactive(new Set<number>())

/** Último rechazo de SAP por depósito, ya traducido a mensaje amigable — para alerta persistente por fila. */
const erroresSapPorDeposito = reactive(new Map<number, SapErrorFriendly>())

let ultimosFiltros: GetAuditoriaGlobalParams | null = null

export function useAuditoriaGlobal() {
  const toast = useToast()

  // Métricas reactivas para la página visible
  const totalMontoPagina = computed(() =>
    items.value.reduce((acc, item) => acc + (item.montoDepositado || 0), 0)
  )

  const totalIntegradosPagina = computed(() =>
    items.value.filter(item => item.creadoSAP || item.estado === EstadoDeposito.IntegradoSAP).length
  )

  const totalPendientesPagina = computed(() =>
    items.value.filter(item => item.estado === EstadoDeposito.Pendiente).length
  )

  // ─── Filtro rápido en memoria (Búsqueda rápida) + totalizadores reactivos ────────────────────
  // El filtro de Estado ya llega aplicado desde el backend (afecta paginación/totalCount); la
  // Búsqueda rápida es puramente cliente sobre la página cargada, por eso vive aquí junto a los
  // totalizadores para que ambos se recalculen juntos sin depender de la vista.
  const itemsFiltrados = computed<AuditoriaGlobalDto[]>(() => {
    const termino = busquedaRapida.value.trim().toLowerCase()
    if (!termino) return items.value
    return items.value.filter(
      i => i.numeroComprobante.toLowerCase().includes(termino) || i.responsable.toLowerCase().includes(termino)
    )
  })

  const totalEfectivoCierre = computed(() =>
    itemsFiltrados.value.reduce((acc, item) => acc + (item.efectivoCierre || 0), 0)
  )

  const totalMontoDepositado = computed(() =>
    itemsFiltrados.value.reduce((acc, item) => acc + (item.montoDepositado || 0), 0)
  )

  const totalDiferencia = computed(() =>
    itemsFiltrados.value.reduce((acc, item) => acc + (item.diferencia || 0), 0)
  )

  async function fetchAuditoria(filtros: GetAuditoriaGlobalParams): Promise<void> {
    loading.value = true
    error.value = null
    ultimosFiltros = filtros
    try {
      const resultado = await tesoreriaService.getAuditoriaGlobal(filtros)
      items.value = resultado.items
      totalCount.value = resultado.totalCount
      pageNumber.value = resultado.pageNumber
      totalPages.value = resultado.totalPages
      if (filtros.pageSize) pageSize.value = filtros.pageSize
    } catch (err) {
      error.value = extraerMensajeError(err, 'No se pudo cargar la auditoría de depósitos.')
      items.value = []
      totalCount.value = 0
      totalPages.value = 0
    } finally {
      loading.value = false
    }
  }

  async function refrescar(): Promise<void> {
    if (ultimosFiltros) await fetchAuditoria(ultimosFiltros)
  }

  async function exportarCsv(filtros: Omit<GetAuditoriaGlobalParams, 'pageNumber' | 'pageSize'>): Promise<void> {
    loadingCsv.value = true
    try {
      await tesoreriaService.exportarAuditoriaCsv(filtros)
    } catch (err) {
      toast.error('No se pudo generar el archivo CSV', extraerMensajeError(err))
    } finally {
      loadingCsv.value = false
    }
  }

  async function reintentarSap(item: AuditoriaGlobalDto): Promise<void> {
    reintentandoIds.add(item.id)
    try {
      const actualizado = await tesoreriaService.integrarSap(item.id)
      erroresSapPorDeposito.delete(item.id)
      toast.success('Reintento exitoso', `Depósito integrado en SAP (DocEntry ${actualizado.docEntrySAP ?? '—'}).`)
      await refrescar()
    } catch (err) {
      // Traduce el rechazo de SAP (cuenta inactiva, papeleta duplicada en SAP, periodo cerrado,
      // middleware caído, etc.) a un mensaje claro y accionable, en vez de mostrar el JSON crudo.
      const amigable = parsearErrorIntegracionSap(err)
      erroresSapPorDeposito.set(item.id, amigable)
      toast.error(amigable.titulo, [amigable.mensaje, amigable.accionSugerida].filter(Boolean).join(' '))
    } finally {
      reintentandoIds.delete(item.id)
    }
  }

  async function anular(item: AuditoriaGlobalDto, motivo: string): Promise<void> {
    anulandoIds.add(item.id)
    try {
      await tesoreriaService.anularDeposito(item.id, motivo)
      toast.success('Depósito anulado', `La papeleta ${item.numeroComprobante} fue anulada. El saldo pendiente ha sido recalculado.`)
      await refrescar()
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) {
        // El backend ya lo integró a SAP (otra pestaña, un envío concurrente, etc.) — se
        // resincroniza la sábana para que la fila oculte el botón de anular y refleje el estado real.
        toast.warning('Conflicto', 'El depósito ya fue integrado en SAP Business One y no puede ser anulado.')
        await refrescar()
      } else {
        toast.error('No se pudo anular el depósito', extraerMensajeError(err))
      }
    } finally {
      anulandoIds.delete(item.id)
    }
  }

  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
    loading,
    loadingCsv,
    error,
    reintentandoIds,
    anulandoIds,
    erroresSapPorDeposito,
    filtroEstado,
    busquedaRapida,
    itemsFiltrados,
    totalMontoPagina,
    totalIntegradosPagina,
    totalPendientesPagina,
    totalEfectivoCierre,
    totalMontoDepositado,
    totalDiferencia,
    fetchAuditoria,
    refrescar,
    exportarCsv,
    reintentarSap,
    anular
  }
}

/** Alias para mantener compatibilidad */
export const useAuditoriaDepositos = useAuditoriaGlobal
