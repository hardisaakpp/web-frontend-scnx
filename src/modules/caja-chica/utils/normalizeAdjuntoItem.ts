import type { AdjuntoItem } from '../types/aprobaciones'

export function normalizeAdjuntoItem(item: any, fallbackIdDetalle: number): AdjuntoItem {
  return {
    idAdjunto: Number(item.idAdjunto ?? item.IdAdjunto ?? 0),
    idDetalle: Number(item.idDetalle ?? item.IdDetalle ?? fallbackIdDetalle),
    rutaArchivo: String(item.rutaArchivo ?? item.RutaArchivo ?? ''),
    fechaSubida: String(item.fechaSubida ?? item.FechaSubida ?? '')
  }
}
