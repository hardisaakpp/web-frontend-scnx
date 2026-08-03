export interface ColumnConfig {
  key: string
  label: string
  fixed: boolean
}

export interface AprobacionItem {
  idAprobacion: number
  idDetalle: number
  idLiquidacion: number
  codAlmacen: string
  nombreCustodio: string
  cedulaCustodio: string
  fechaCreacion: string
  nombreGasto: string
  concepto: string
  total: number
  nivelAprobacion: number
  estado: string
}

export interface DetalleItem {
  idDetalle: number
  idLiquidacion: number
  fechaConsumo: string
  ruc: string
  nombreProveedor: string
  numeroComprobante: string
  tipoDocumento: string
  concepto: string
  subtotalConIva: number
  subtotalSinIva: number
  iva: number
}

export interface SupervisorDecision {
  montoAprobado: number
  observacion: string
  estado: string
  fechaAprobacion?: string
  idUsuario?: string
  nombreUsuario?: string
}

export interface UserOption {
  id: string
  label: string
}

export interface AdjuntoItem {
  idAdjunto: number
  idDetalle: number
  rutaArchivo: string
  fechaSubida: string
}

export interface DecisionState {
  montoAprobado: string
  observacion: string
}
