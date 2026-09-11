import { computed, reactive, ref } from 'vue'
import { useToast } from '@/composables/useToast'
import { extraerMensajeError, tesoreriaService } from '../services/tesoreriaService'
import { EstadoDeposito, type AuditoriaGlobalDto, type GetAuditoriaGlobalParams } from '../types/tesoreria.types'

const items = ref<AuditoriaGlobalDto[]>([])
const totalCount = ref(0)
const pageNumber = ref(1)
const pageSize = ref(20)
const totalPages = ref(0)

const loading = ref(false)
const loadingCsv = ref(false)
const error = ref<string | null>(null)

const reintentandoIds = reactive(new Set<number>())
const anulandoIds = reactive(new Set<number>())

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
      toast.success('Reintento exitoso', `Depósito integrado en SAP (DocEntry ${actualizado.docEntrySAP ?? '—'}).`)
      await refrescar()
    } catch (err) {
      toast.error('SAP volvió a rechazar la integración', extraerMensajeError(err))
    } finally {
      reintentandoIds.delete(item.id)
    }
  }

  async function anular(item: AuditoriaGlobalDto, motivo: string): Promise<void> {
    anulandoIds.add(item.id)
    try {
      await tesoreriaService.anularDeposito(item.id, motivo)
      toast.success('Depósito anulado', `La papeleta ${item.numeroComprobante} fue anulada.`)
      await refrescar()
    } catch (err) {
      toast.error('No se pudo anular el depósito', extraerMensajeError(err))
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
    totalMontoPagina,
    totalIntegradosPagina,
    totalPendientesPagina,
    fetchAuditoria,
    refrescar,
    exportarCsv,
    reintentarSap,
    anular
  }
}

/** Alias para mantener compatibilidad */
export const useAuditoriaDepositos = useAuditoriaGlobal
