import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import pickingDistribucionApi from '../services/pickingDistribucionApi'
import type {
  DistribucionScanBatchItemDto, DistribucionScanItemOutcome, PickingSessionDto, SolicitudPickingDetailDto,
} from '../types'

const AUTO_SYNC_MS = 5000

function storageKey(sessionId: string) {
  return `cedi-distribucion-picking-queue-${sessionId}`
}

function loadQueue(sessionId: string): DistribucionScanBatchItemDto[] {
  try {
    const raw = localStorage.getItem(storageKey(sessionId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(sessionId: string, queue: DistribucionScanBatchItemDto[]) {
  localStorage.setItem(storageKey(sessionId), JSON.stringify(queue))
}

/**
 * Picking transversal de Distribución (P-009 — cediPickArt.php): mismo patrón de
 * localStorage + autosync 5s que odcPickingStore.ts. La diferencia es que acá el escaneo es
 * por ItemCode transversal a TODAS las solicitudes del grupo — el reparto entre solicitudes
 * lo decide el backend (SaveScanBatchAsync), no el frontend.
 */
export const usePickingDistribucionStore = defineStore('cediPickingDistribucion', () => {
  const session = ref<PickingSessionDto | null>(null)
  const loadingSession = ref(false)
  const error = ref<string | null>(null)

  const pendingQueue = ref<DistribucionScanBatchItemDto[]>([])
  const syncing = ref(false)
  const lastResult = ref<{ aceptados: DistribucionScanItemOutcome[]; rechazados: DistribucionScanItemOutcome[] } | null>(null)
  const pendingRejections = ref<DistribucionScanItemOutcome[]>([])

  const closing = ref(false)

  // ── Picking por Documento (P-010) — detalle/escaneo de UNA solicitud puntual ──────────
  const solicitudDetalle = ref<SolicitudPickingDetailDto | null>(null)
  const loadingSolicitud = ref(false)
  const scanningSolicitud = ref(false)
  const completandoSolicitud = ref(false)

  let autoSyncTimer: ReturnType<typeof setInterval> | null = null

  const cantidadEnCola = computed(() =>
    pendingQueue.value.reduce((acc, item) => acc + item.cantidad, 0))

  /** Cuánto queda por escanear de un ítem transversal, descontando lo ya en cola sin sincronizar. */
  function pendienteDeArticulo(itemCode: string): number {
    const articulo = session.value?.articulos.find(a => a.itemCode === itemCode)
    if (!articulo) return 0
    const enCola = pendingQueue.value.filter(i => i.itemCode === itemCode).reduce((a, i) => a + i.cantidad, 0)
    return articulo.cantidadTotal - articulo.cantidadEscaneada - enCola
  }

  async function loadSession(sessionId: string) {
    loadingSession.value = true
    error.value = null
    try {
      session.value = await pickingDistribucionApi.getSession(sessionId)
      pendingQueue.value = loadQueue(sessionId)
      startAutoSync()
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo cargar la sesión de picking'
      throw e
    } finally {
      loadingSession.value = false
    }
  }

  function addScan(itemCode: string, cantidad: number) {
    if (!session.value) return
    const existente = pendingQueue.value.find(i => i.itemCode === itemCode)
    if (existente) existente.cantidad += cantidad
    else pendingQueue.value.push({ itemCode, cantidad })
    saveQueue(session.value.id, pendingQueue.value)
  }

  async function syncNow() {
    if (!session.value || syncing.value || pendingQueue.value.length === 0) return

    const enVuelo = pendingQueue.value.splice(0, pendingQueue.value.length)
    syncing.value = true
    try {
      const result = await pickingDistribucionApi.saveScanBatch(session.value.id, enVuelo)
      session.value = result.sesion
      lastResult.value = { aceptados: result.aceptados, rechazados: result.rechazados }
      saveQueue(session.value.id, pendingQueue.value)

      if (result.rechazados.length > 0)
        pendingRejections.value.push(...result.rechazados)
    } catch (e: any) {
      pendingQueue.value.unshift(...enVuelo)
      saveQueue(session.value.id, pendingQueue.value)
      error.value = e?.response?.data?.message ?? 'No se pudo sincronizar el escaneo — se reintenta solo.'
    } finally {
      syncing.value = false
    }
  }

  function startAutoSync() {
    stopAutoSync()
    autoSyncTimer = setInterval(syncNow, AUTO_SYNC_MS)
  }

  function stopAutoSync() {
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer)
      autoSyncTimer = null
    }
  }

  async function flushAndStop() {
    stopAutoSync()
    await syncNow()
  }

  function acknowledgeRejections() {
    pendingRejections.value = []
  }

  /** "Cerrar picking" del grupo — parcial exige cedi.grupo.picking.supervisor (lo valida el backend). */
  async function closeSession() {
    if (!session.value) return
    closing.value = true
    error.value = null
    try {
      await syncNow()
      session.value = await pickingDistribucionApi.closeSession(session.value.id)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo cerrar el picking'
      throw e
    } finally {
      closing.value = false
    }
  }

  // ── Picking por Documento (P-010) ────────────────────────────────────────────────────

  async function loadSolicitud(solicitudId: string) {
    if (!session.value) return
    loadingSolicitud.value = true
    error.value = null
    try {
      solicitudDetalle.value = await pickingDistribucionApi.getSolicitud(session.value.id, solicitudId)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo cargar la solicitud'
      throw e
    } finally {
      loadingSolicitud.value = false
    }
  }

  /** Escaneo directo (sin cola local) de una solicitud puntual — flujo secundario, menos tráfico que el transversal. */
  async function scanSolicitud(solicitudId: string, itemCode: string, cantidad: number) {
    if (!session.value) return null
    scanningSolicitud.value = true
    error.value = null
    try {
      const result = await pickingDistribucionApi.saveScanBatchForSolicitud(session.value.id, solicitudId, [{ itemCode, cantidad }])
      session.value = result.sesion
      await loadSolicitud(solicitudId)
      return result
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo guardar el escaneo'
      throw e
    } finally {
      scanningSolicitud.value = false
    }
  }

  /** "Confirmar recepción 100%" auditada — requiere cedi.grupo.picking.supervisor. */
  async function completarSolicitud(solicitudId: string, motivo: string | null) {
    if (!session.value) return
    completandoSolicitud.value = true
    error.value = null
    try {
      session.value = await pickingDistribucionApi.completarSolicitud(session.value.id, solicitudId, { motivo })
      await loadSolicitud(solicitudId)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo marcar la solicitud completa'
      throw e
    } finally {
      completandoSolicitud.value = false
    }
  }

  return {
    session, loadingSession, error,
    pendingQueue, cantidadEnCola, syncing, lastResult, pendingRejections, closing,
    solicitudDetalle, loadingSolicitud, scanningSolicitud, completandoSolicitud,
    loadSession, addScan, syncNow, startAutoSync, stopAutoSync, flushAndStop, pendienteDeArticulo,
    acknowledgeRejections, closeSession,
    loadSolicitud, scanSolicitud, completarSolicitud,
  }
})
