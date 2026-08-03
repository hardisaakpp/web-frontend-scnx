import { ref, computed, type ComputedRef } from 'vue'
import { cajaChicaApi } from '@/lib/http'
import { createBuildAdjuntoUrl } from '@/modules/caja-chica/utils/buildAdjuntoUrl'
import { extractItemsArray } from '@/modules/caja-chica/utils/apiPayload'
import { normalizeAdjuntoItem } from '@/modules/caja-chica/utils/normalizeAdjuntoItem'
import type { AdjuntoItem } from '@/modules/caja-chica/types/aprobaciones'

/**
 * Carga y cachea los adjuntos de un detalle bajo demanda, y expone el adjunto
 * actualmente seleccionado dentro del panel de detalle. Extraído de la lógica
 * duplicada entre las vistas de Aprobaciones (contabilidad/pendientes/historial).
 */
export function useAdjuntosByDetalle(selectedDetalleId: ComputedRef<number | undefined>) {
  const adjuntosListByDetalle = ref<Record<number, AdjuntoItem[]>>({})
  const loadingAdjuntosMap = ref<Record<number, boolean>>({})
  const selectedAdjuntoId = ref<number | null>(null)

  const selectedAdjunto = computed(() => {
    const detalleId = selectedDetalleId.value
    if (detalleId === undefined) return null
    const list = adjuntosListByDetalle.value[detalleId] || []
    if (!list.length) return null
    const found = list.find(a => a.idAdjunto === selectedAdjuntoId.value)
    return found || list[0]
  })

  async function loadAdjuntosForDetalle(idDetalle: number) {
    if (!idDetalle) return
    if (adjuntosListByDetalle.value[idDetalle]) return
    if (loadingAdjuntosMap.value[idDetalle]) return
    loadingAdjuntosMap.value = { ...loadingAdjuntosMap.value, [idDetalle]: true }
    try {
      const response = await cajaChicaApi.get(`/Adjuntos/por-detalle/${idDetalle}`)
      const items = extractItemsArray(response.data)
      adjuntosListByDetalle.value = {
        ...adjuntosListByDetalle.value,
        [idDetalle]: items.map((item: any) => normalizeAdjuntoItem(item, idDetalle))
      }
    } catch {
      adjuntosListByDetalle.value = { ...adjuntosListByDetalle.value, [idDetalle]: [] }
    } finally {
      loadingAdjuntosMap.value = { ...loadingAdjuntosMap.value, [idDetalle]: false }
    }
  }

  const buildAdjuntoUrl = createBuildAdjuntoUrl()

  const formatAdjuntoName = (ruta: string) => {
    if (!ruta) return ''
    const parts = ruta.split('/')
    return parts[parts.length - 1]
  }

  const isImageFile = (ruta: string) => /\.(png|jpe?g|gif|webp)$/i.test(ruta)
  const isPdfFile = (ruta: string) => /\.pdf$/i.test(ruta)

  return {
    adjuntosListByDetalle,
    loadingAdjuntosMap,
    selectedAdjuntoId,
    selectedAdjunto,
    loadAdjuntosForDetalle,
    buildAdjuntoUrl,
    formatAdjuntoName,
    isImageFile,
    isPdfFile
  }
}
