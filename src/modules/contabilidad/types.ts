// Tipos para el módulo de Contabilidad

export interface Transaccion {
  id: number
  fecha: string
  descripcion: string
  tipo: 'ingreso' | 'egreso'
  monto: number
  estado: 'pendiente' | 'procesado' | 'cancelado'
  categoria?: string
}

export interface Balance {
  ingresos: number
  egresos: number
  balance: number
}

export interface ContabilidadState {
  transacciones: Transaccion[]
  balance: Balance
  loading: boolean
  error: string | null
}
