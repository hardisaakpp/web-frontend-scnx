/**
 * Contratos calcados 1:1 de los DTOs de api-recepcion-proveedores (mismos nombres de
 * campo, incluido "Dscription" sin la primera "e" — intencional, ver
 * OrdenCompraResponse.cs del backend).
 */

export interface OrdenCompraLineaResponse {
  docNum: number
  lineNum: number
  itemCode: string
  dscription: string | null
  codeBars: string | null
  quantity: number
  cantidadPendiente: number
  whsCode: string
  baseType: number
  baseEntry: number
  baseLine: number
}

export interface OrdenCompraResponse {
  docNum: number
  fechaConsultaSap: string
  docDueDate: string | null
  proveedor: string | null
  estado: string
  lineas: OrdenCompraLineaResponse[]
}

export interface EntradaMercaderiaLineaResponse {
  lineNum: number
  itemCode: string
  quantity: number
  baseEntry: number
  baseLine: number
}

export interface EntradaMercaderiaResponse {
  docEntry: number
  docNum: number
  docDate: string
  lineas: EntradaMercaderiaLineaResponse[]
}

export type EstadoPickingSesion = 'EnProceso' | 'Finalizada' | 'EnviandoSap' | 'IntegradaSap' | 'ErrorSap'
export type EstadoPickingLinea = 'Pendiente' | 'Parcial' | 'Completa'

export interface OrdenPickingLineaResponse {
  id: number
  lineNum: number
  itemCode: string
  itemDescription: string | null
  codeBars: string | null
  cantidadPedida: number
  cantidadPendiente: number
  cantidadPickeada: number
  estadoLinea: EstadoPickingLinea
}

export interface OrdenPickingSesionResponse {
  id: number
  docNum: number
  whsCode: string
  estado: EstadoPickingSesion
  fechaInicio: string
  sapDocEntry: number | null
  sapDocNum: number | null
  sapErrorMensaje: string | null
  lineas: OrdenPickingLineaResponse[]
}

export interface OrdenPickingScanResponse {
  id: number
  lineaId: number
  codigoEscaneado: string
  cantidad: number
  usuarioId: string
  fechaHora: string
}

export interface OrdenPickingLogResponse {
  id: number
  fechaHora: string
  nivel: 'Info' | 'Warn' | 'Error'
  evento: string
  detalle: string | null
  usuarioId: string | null
}

export interface OrdenPickingLogGeneralResponse {
  id: number
  docNum: number
  whsCode: string
  fechaHora: string
  nivel: 'Info' | 'Warn' | 'Error'
  evento: string
  detalle: string | null
  usuarioId: string | null
}
