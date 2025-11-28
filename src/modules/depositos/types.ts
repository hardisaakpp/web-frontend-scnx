// Tipos para el módulo de Depósitos

export interface Deposito {
  id: number
  fecha: string
  banco: string
  monto: number
  referencia: string
  estado: 'pendiente' | 'confirmado' | 'rechazado'
}

export interface DepositosState {
  depositos: Deposito[]
  loading: boolean
  error: string | null
}
