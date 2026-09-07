import { ref, computed } from '@vue/reactivity'
import { useToast } from '@/composables/useToast'
import { mba3ConsultasService } from '../services/mba3ConsultasApi'
import type { IntegracionSAPDetalle, SolicitudesTransferencia } from '../types'

interface OrdenCompraRef {
  oc_id: string | null
  numero_oc_sap: string | null
  doc_entry: number | null
}

/** Detalle mínimo para mostrar el modal cuando no hay integración SAP registrada para la ODC (404) o falla el fetch. */
function construirDetalleSapMinimo(oc: OrdenCompraRef): IntegracionSAPDetalle {
  return {
    oc_id: oc.oc_id ?? '',
    success: true,
    doc_entry: oc.doc_entry ?? null,
    doc_num: null,
    numero_oc_sap: oc.numero_oc_sap ?? null,
    message: 'Enviada exitosamente',
    error: null,
    error_message: null,
    error_code: null,
    error_source: null
  }
}

/**
 * Al hacer clic en un "Número OC SAP" de la cabecera (PedidoCabecera.vue): abre el
 * mismo modal "Integración con SAP Completada" que usa la interfaz "ODC a SAP" (ver
 * ProcesoCompletoView.vue::handleVerDetalleSAP), una ODC a la vez. Reutilizado por
 * PedidoDetalleView.vue, CargarPlantillaView.vue y MabelTradingRedistribucionView.vue
 * para no duplicar esta lógica en cada vista que embebe PedidoCabecera.vue.
 */
export function useVerDetalleSapModal() {
  const toast = useToast()

  const showIntegracionSAPModal = ref(false)
  const integracionSAPDetalle = ref<IntegracionSAPDetalle | null>(null)
  const integracionSAPSolicitudes = ref<SolicitudesTransferencia | null>(null)

  // Título/ícono del modal (IntegracionSAPModal.vue::tituloModal) exige estadoGeneral
  // explícito -- sin esto siempre cae en "❌ Error" aunque el envío haya sido exitoso.
  const integracionSAPEstadoGeneral = computed<'success' | 'partial' | 'error'>(() => {
    const detalle = integracionSAPDetalle.value
    if (!detalle?.success) return 'error'
    const st = integracionSAPSolicitudes.value
    if (st && st.transferencias_errores > 0) return 'partial'
    return 'success'
  })

  async function handleVerDetalleSap(oc: OrdenCompraRef) {
    if (!oc.oc_id) return

    try {
      const response = await mba3ConsultasService.getIntegracionSAP(oc.oc_id)
      const envio = response.envio_sap
      if (!envio) throw new Error('Respuesta sin envio_sap')

      integracionSAPDetalle.value = {
        oc_id: envio.oc_id,
        success: envio.success,
        doc_entry: envio.doc_entry ?? null,
        doc_num: envio.doc_num ?? null,
        numero_oc_sap: envio.numero_oc_sap ?? oc.numero_oc_sap ?? null,
        message: envio.message ?? 'Enviada exitosamente',
        error: envio.error ?? null,
        error_message: envio.error ?? null,
        error_code: envio.error_code ?? null,
        error_source: null
      }
      integracionSAPSolicitudes.value = response.solicitudes_transferencia ?? envio.solicitudes_transferencia ?? null
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.warn('[useVerDetalleSapModal] Error al obtener integración SAP:', err)
        toast.warning('No se pudo cargar el detalle de integración', err?.response?.data?.detail ?? err?.message ?? 'Error desconocido')
      }
      integracionSAPDetalle.value = construirDetalleSapMinimo(oc)
      integracionSAPSolicitudes.value = null
    }

    showIntegracionSAPModal.value = true
  }

  return {
    showIntegracionSAPModal,
    integracionSAPDetalle,
    integracionSAPSolicitudes,
    integracionSAPEstadoGeneral,
    handleVerDetalleSap
  }
}
