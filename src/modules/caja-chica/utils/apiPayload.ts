/** Los endpoints de Caja Chica devuelven el array directo o envuelto en `{ data: [...] }`. */
export function extractItemsArray(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray((payload as { data?: unknown })?.data)) return (payload as { data: any[] }).data
  return []
}
