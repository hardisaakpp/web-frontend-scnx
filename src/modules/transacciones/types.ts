// ─── Enums ────────────────────────────────────────────────────────────────────

export type EstadoTransaccion = 'PENDIENTE' | 'RESERVADO' | 'PROCESADO' | 'DESCARTADO'
export type SignoTransaccion = '+' | '-'

// ─── Transacción (respuesta cajero y tesorería) ───────────────────────────────

export interface Transaccion {
  id: number
  referenciaTransaccion: string
  valorMontoTotal: number
  fechaProceso: string
  signo: SignoTransaccion
  tipoTransaccion: string
  descripcionTransaccion: string
  estado: EstadoTransaccion
  codigoAlmacen: string | null
  identificacionCliente?: string | null
}

export interface TransaccionTesoreria extends Transaccion {
  fechaIngreso: string
  tienda: string | null
  codVendedor: string | null
  cliente: string | null
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface ReservarTransaccionRequest {
  codVendedor: string
  codigoAlmacen: string
  nombreAlmacen: string
  usuarioReserva: string
}

// ─── Filtros cajero ───────────────────────────────────────────────────────────

export interface FiltrosCajero {
  idCuenta: number
  monto?: number | null
  referencia?: string | null
  identificacionCliente?: string | null
}

// ─── Filtros tesorería ────────────────────────────────────────────────────────

export interface FiltrosTesoreria {
  idCuenta: number
  desde: string
  hasta: string
  codigoAlmacen?: string | null
  estado?: EstadoTransaccion | null
}
