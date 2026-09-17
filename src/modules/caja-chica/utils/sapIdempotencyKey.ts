/**
 * Clave de idempotencia que Caja Chica envía al middleware SAP al integrar una liquidación
 * (POST /v1/liquidaciones, campo `U_sap_id`, UDF alfanumérico de 60 en la factura de proveedor).
 *
 * Convención acordada con el equipo (api-middleware-sap/docs/idempotencia-documentos.md):
 * `{modulo}-{entidad}-{id}`, estable por operación. Una liquidación se integra a SAP una sola vez,
 * así que su id basta: cada reintento (manual, o de la cola del middleware) envía la misma clave y
 * el middleware devuelve la factura ya creada en vez de duplicarla.
 */
export const SAP_IDEMPOTENCY_PREFIX = 'cajachica-liquidacion'

/** Tamaño del UDF U_sap_id en SAP. */
export const SAP_IDEMPOTENCY_MAX_LENGTH = 60

export function buildLiquidacionSapId(idLiquidacion: number): string {
  if (!Number.isInteger(idLiquidacion) || idLiquidacion <= 0) {
    throw new Error(`idLiquidacion inválido para la clave de idempotencia SAP: ${String(idLiquidacion)}`)
  }

  const key = `${SAP_IDEMPOTENCY_PREFIX}-${idLiquidacion}`
  if (key.length > SAP_IDEMPOTENCY_MAX_LENGTH) {
    throw new Error(`La clave de idempotencia SAP supera ${SAP_IDEMPOTENCY_MAX_LENGTH} caracteres: ${key}`)
  }

  return key
}
