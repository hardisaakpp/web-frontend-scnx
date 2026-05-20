/** process_id de POST proceso-completo-sap-async, por número de pedido (evita doble envío tras timeout cliente). */
const STORAGE_PREFIX = 'odc_sap_process_'

export function saveOdcSapProcessId(numeroPedido: string, processId: string): void {
  if (!numeroPedido || !processId) return
  try {
    sessionStorage.setItem(STORAGE_PREFIX + numeroPedido, processId)
  } catch (e) {
    if (import.meta.env.DEV) console.warn('[odcSapProcessStorage] No se pudo guardar process_id:', e)
  }
}

export function getOdcSapProcessId(numeroPedido: string): string | null {
  if (!numeroPedido) return null
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + numeroPedido)
  } catch {
    return null
  }
}

export function clearOdcSapProcessId(numeroPedido: string): void {
  if (!numeroPedido) return
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + numeroPedido)
  } catch {
    /* ignore */
  }
}
