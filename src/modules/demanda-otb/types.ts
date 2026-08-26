export interface NegocioOtb {
  id: string
  nombre: string
}

export interface DemandaSeriePunto {
  mes: string // YYYY-MM
  historia: number | null
  proyeccion: number | null
  max80: number | null
  min80: number | null
}

export interface DemandaArticuloProyeccion {
  codigo: string
  descripcion: string
  genero: string
  categoria: string
  confianza: 'ALTA' | 'MEDIA' | 'BAJA'
  stockInicial: number
  proximoMesUnidades: number
  proximoMesEtiqueta: string
  rango80Min: number
  rango80Max: number
  semaforoOtb: string
  decision: string
  serie: DemandaSeriePunto[]
}
