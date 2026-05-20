/**
 * Timeout HTTP para POST /integrar-sap (síncrono).
 * Alineado con tiempos reales: SAP + emails + transferencias pueden superar 60s.
 */
const BASE_TIMEOUT_MS = 120_000 // 2 min para 1 ODC
const TIMEOUT_PER_EXTRA_ODC_MS = 30_000
const MIN_TIMEOUT_MS = 120_000
const MAX_TIMEOUT_MS = 300_000 // 5 min

export function calculateIntegrarSapTimeoutMs(
  referenciaDespacho?: string | string[]
): number {
  const numOrdenes = Array.isArray(referenciaDespacho)
    ? referenciaDespacho.length
    : referenciaDespacho
      ? 1
      : 0

  const calculated =
    BASE_TIMEOUT_MS +
    (numOrdenes > 1 ? (numOrdenes - 1) * TIMEOUT_PER_EXTRA_ODC_MS : 0)

  return Math.max(MIN_TIMEOUT_MS, Math.min(MAX_TIMEOUT_MS, calculated))
}
