import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import odcApi from '../services/odcApi'
import type { OdcPickingSessionDto, ScanBatchItemDto, ScanItemOutcome } from '../types'

const AUTO_SYNC_MS = 5000

function storageKey(sessionId: string) {
  return `cedi-picking-queue-${sessionId}`
}

function loadQueue(sessionId: string): ScanBatchItemDto[] {
  try {
    const raw = localStorage.getItem(storageKey(sessionId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(sessionId: string, queue: ScanBatchItemDto[]) {
  localStorage.setItem(storageKey(sessionId), JSON.stringify(queue))
}

/**
 * Escaneo (odcPickingWork.php del legacy): acumula escaneos en localStorage para poder
 * escanear rápido sin ir a BD en cada lectura, y sincroniza el lote acumulado cada 5s
 * (P-006). Si se cierra la pestaña con escaneos sin sincronizar, quedan en localStorage y
 * se retoman al volver a esta sesión — no se pierden.
 */
export const useOdcPickingStore = defineStore('cediOdcPicking', () => {
  const session = ref<OdcPickingSessionDto | null>(null)
  const loadingSession = ref(false)
  const error = ref<string | null>(null)

  const pendingQueue = ref<ScanBatchItemDto[]>([])
  const syncing = ref(false)
  const lastResult = ref<{ aceptados: ScanItemOutcome[]; rechazados: ScanItemOutcome[] } | null>(null)

  // P-007: cierre e integración a SAP.
  const closing = ref(false)
  const integrating = ref(false)

  /**
   * Rechazos SIN reconocer todavía — el modal en la vista se muestra mientras esto tenga
   * algo, y solo se vacía cuando el operador aprieta "Aceptar" (acknowledgeRejections). Se
   * ACUMULA entre ciclos de autosync: si llega un rechazo nuevo mientras el modal de un
   * rechazo anterior todavía está abierto, se agrega a la lista en vez de reemplazarla —
   * así no se puede perder un aviso por otro que llegó encima.
   */
  const pendingRejections = ref<ScanItemOutcome[]>([])

  let autoSyncTimer: ReturnType<typeof setInterval> | null = null

  const cantidadEnCola = computed(() =>
    pendingQueue.value.reduce((acc, item) => acc + item.cantidad, 0))

  /**
   * El operador puede escanear el ItemCode o el código de barras físico del bulto — ambos
   * deben resolver a la misma línea. Si no matchea ninguno, se devuelve el valor tal cual
   * (para que el backend lo rechace con un mensaje claro en vez de que se pierda en silencio).
   */
  function resolveItemCode(scanValue: string): string {
    const linea = session.value?.lineas.find(l => l.itemCode === scanValue || l.codigoBarras === scanValue)
    return linea?.itemCode ?? scanValue
  }

  /** Cuánto queda por escanear de una línea (por ItemCode o código de barras), descontando lo ya en cola sin sincronizar. */
  function pendienteDeLinea(scanValue: string): number {
    const itemCode = resolveItemCode(scanValue)
    const linea = session.value?.lineas.find(l => l.itemCode === itemCode)
    if (!linea) return 0
    const enCola = pendingQueue.value.filter(i => i.itemCode === itemCode).reduce((a, i) => a + i.cantidad, 0)
    return linea.cantidad - linea.cantidadEscaneada - enCola
  }

  async function loadSession(sessionId: string) {
    loadingSession.value = true
    error.value = null
    try {
      session.value = await odcApi.getPickingSession(sessionId)
      pendingQueue.value = loadQueue(sessionId)
      startAutoSync()
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo cargar la sesión de picking'
      throw e
    } finally {
      loadingSession.value = false
    }
  }

  /**
   * Agrega un escaneo a la cola local. No pega a la API — eso lo hace el autosync/syncNow.
   * `scanValue` puede ser el ItemCode o el código de barras físico; siempre se guarda con el
   * ItemCode canónico (es lo que el backend espera y con lo que se agrupan las cantidades).
   */
  function addScan(scanValue: string, cantidad: number) {
    if (!session.value) return
    const itemCode = resolveItemCode(scanValue)

    const existente = pendingQueue.value.find(i => i.itemCode === itemCode)
    if (existente) {
      existente.cantidad += cantidad
    } else {
      pendingQueue.value.push({ itemCode, cantidad })
    }
    saveQueue(session.value.id, pendingQueue.value)
  }

  async function syncNow() {
    if (!session.value || syncing.value || pendingQueue.value.length === 0) return

    // Snapshot: si llegan escaneos nuevos MIENTRAS el POST está en vuelo, no se pierden
    // (quedan en pendingQueue y se envían en el próximo ciclo).
    const enVuelo = pendingQueue.value.splice(0, pendingQueue.value.length)
    syncing.value = true
    try {
      const result = await odcApi.saveScanBatch(session.value.id, enVuelo)
      session.value = result.sesion
      lastResult.value = { aceptados: result.aceptados, rechazados: result.rechazados }
      saveQueue(session.value.id, pendingQueue.value) // persiste lo que haya llegado durante el POST

      if (result.rechazados.length > 0) {
        // Un toast que se desvanece solo no alcanza para esto — un escaneo rechazado
        // significa que el operador tiene en la mano algo que NO quedó registrado, tiene
        // que enterarse sí o sí y confirmar que lo vio (ver acknowledgeRejections).
        pendingRejections.value.push(...result.rechazados)
      }
    } catch (e: any) {
      // Falló la red/servidor: devolver los escaneos a la cola para reintentar en el próximo ciclo.
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

  /** Llamar al salir de la pantalla: intenta mandar lo que quedó pendiente antes de irse. */
  async function flushAndStop() {
    stopAutoSync()
    await syncNow()
  }

  /**
   * Acciones de supervisor (permiso cedi.odc.picking.supervisor, validado por el backend —
   * acá no se revalida, solo se ocultan los botones en la vista). Antes de llamarlas hay que
   * sincronizar lo que esté en cola: resetear/completar mientras hay escaneos sin mandar
   * podría pisarse con el autosync del próximo ciclo.
   */
  async function resetLine(itemCode: string, motivo: string | null) {
    if (!session.value) return
    await syncNow()
    session.value = await odcApi.resetLine(session.value.id, { itemCode, motivo })
  }

  async function markLineComplete(itemCode: string, motivo: string | null) {
    if (!session.value) return
    await syncNow()
    session.value = await odcApi.markLineComplete(session.value.id, { itemCode, motivo })
  }

  async function markAllComplete(motivo: string | null) {
    if (!session.value) return
    await syncNow()
    session.value = await odcApi.markAllComplete(session.value.id, { motivo })
  }

  /** El operador confirmó que vio los rechazos (botón "Aceptar" del modal) — cierra el aviso. */
  function acknowledgeRejections() {
    pendingRejections.value = []
  }

  /**
   * "Cerrar picking" — antes de cerrar hay que mandar lo que quede en cola: cerrar con
   * escaneos sin sincronizar dejaría afuera unidades que el operador cree que ya guardó.
   */
  async function closeSession() {
    if (!session.value) return
    closing.value = true
    error.value = null
    try {
      await syncNow()
      session.value = await odcApi.closeSession(session.value.id)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo cerrar el picking'
      throw e
    } finally {
      closing.value = false
    }
  }

  /**
   * "Integrar a SAP" — crea el GoodsReceipt. Requiere cedi.odc.picking.supervisor (la vista
   * ya oculta el botón sin ese permiso; acá no se revalida). Es seguro reintentar: si ya
   * falló una vez, el backend guarda el motivo en `ultimoErrorIntegracion` y permite
   * reintentar sin duplicar el documento en SAP.
   */
  async function integrateGoodsReceipt() {
    if (!session.value) return
    integrating.value = true
    error.value = null
    try {
      session.value = await odcApi.integrateGoodsReceipt(session.value.id)
    } catch (e: any) {
      error.value = e?.response?.data?.message ?? 'No se pudo integrar a SAP'
      throw e
    } finally {
      integrating.value = false
    }
  }

  return {
    session, loadingSession, error,
    pendingQueue, cantidadEnCola, syncing, lastResult, pendingRejections,
    closing, integrating,
    loadSession, addScan, syncNow, startAutoSync, stopAutoSync, flushAndStop, pendienteDeLinea,
    acknowledgeRejections, resetLine, markLineComplete, markAllComplete,
    closeSession, integrateGoodsReceipt,
  }
})
