// Tipos para el módulo de Reportes

export interface Reporte {
  id: number
  nombre: string
  tipo: 'financiero' | 'operativo' | 'estadistico'
  fechaCreacion: string
  formato: 'pdf' | 'excel' | 'csv'
  url?: string
}

export interface ReportesState {
  reportes: Reporte[]
  loading: boolean
  error: string | null
}
