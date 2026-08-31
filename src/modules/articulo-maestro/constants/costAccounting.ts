// Opciones del selector "Sistema de Evaluación" (costAccountingMethod).
// Centralizadas aquí (en vez de <option> quemados en el template) para que
// el fallback seguro de FormularioArticulo.vue pueda validar contra la
// misma fuente de verdad que renderiza el <select>.

export interface CostAccountingOption {
  value: string
  label: string
  description: string
}

export const OPCIONES_COST_ACCOUNTING: readonly CostAccountingOption[] = [
  { value: 'A', label: 'A - Promedio Ponderado', description: 'Cálculo de costo promedio móvil' },
  { value: 'B', label: 'B - Lote / Serie', description: 'Valuación individual por lote/serie' },
  { value: 'F', label: 'F - FIFO', description: 'Primero en entrar, primero en salir' },
  { value: 'S', label: 'S - Estándar', description: 'Costo fijo predeterminado' },
] as const

export const DEFAULT_COST_ACCOUNTING = 'A'
