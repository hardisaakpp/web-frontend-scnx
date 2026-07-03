// ─── Enums ────────────────────────────────────────────────────────────────────

export type EstadoTransaccion = 'Pendiente' | 'Reservado' | 'Procesado' | 'Descartado'
export type SignoTransaccion = 'C' | 'D' // C = Crédito, D = Débito

// ─── Transacción cajero ───────────────────────────────────────────────────────

export interface Transaccion {
  id: number
  idCuenta?: number
  idSecuencia?: number | null
  referenciaTransaccion: string
  referenciaTransaccion2?: string | null
  valorMontoTotal: number
  fechaProceso: string
  fechaIngreso: string
  fechaModificacion?: string | null
  signo: SignoTransaccion
  tipoTransaccion?: string | null
  descripcionTransaccion?: string | null
  descripcionTransferencia?: string | null
  descripcionCausal?: string | null
  nombreOficina?: string | null
  nombreBeneficiario?: string | null
  nombreEstablecimiento?: string | null
  estado: EstadoTransaccion
  codigoAlmacen?: string | null
  idTransaccionContable?: number | null
  codigoReverso?: string | null
}

// ─── Transacción tesorería ────────────────────────────────────────────────────

export interface TransaccionTesoreria extends Transaccion {
  tipoTransaccion: string
  valorSaldoContable?: number | null
  valorSaldoDisponible?: number | null
  nombreAlmacen?: string | null
  codVendedor?: string | null
  usuarioReserva?: string | null
  fechaReserva?: string | null
}

// ─── Cuenta bancaria (tesorería) ─────────────────────────────────────────────

export interface CuentaTesoreria {
  id: number
  codigo: string
  descripcion: string
  numeroCuentaMascarado: string
}

// ─── Almacén ──────────────────────────────────────────────────────────────────

export interface Almacen {
  codAlmacen: string
  nombre: string
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface ReservarTransaccionRequest {
  codigoAlmacen: string
  nombreAlmacen?: string
  codVendedor?: string
}

// ─── Filtros cajero ───────────────────────────────────────────────────────────

export interface FiltrosCajero {
  valorMontoTotal: number
  referenciaTransaccion: string
  descripcionTransferencia?: string | null
  referenciaTransaccion2?: string | null
  descripcionCausal?: string | null
  descripcionTransaccion?: string | null
}

// ─── Filtros tesorería ────────────────────────────────────────────────────────

export interface FiltrosTesoreria {
  idCuenta: number
  desde: string
  hasta: string
  codigoAlmacen?: string | null
  estado?: EstadoTransaccion | null
}

// ─── Auditoría cajero ─────────────────────────────────────────────────────────

export interface RegistrarEventoCajeroRequest {
  tipoEvento: 'INICIO_RESERVA' | 'CANCELAR_RESERVA'
  idTransaccion: number
}
