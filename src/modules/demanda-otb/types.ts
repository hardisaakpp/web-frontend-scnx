export interface DemandaSeriePunto {
  mes: string // YYYY-MM
  historia: number | null
  proyeccion: number | null
  max80: number | null
  min80: number | null
}

/** GET /catalogo/{negocio}/sku/{sku} — mismo shape que SkuDetailDto del backend. */
export interface SkuDetail {
  negocio: string
  codigo: string
  nombre: string
  nivel1: string | null
  nivel2: string | null
  nivel3: string | null
  categoria: string | null
  confianza: string | null
  stockInicial: number
  semaforo: string | null
  decisionOtb: string | null
  sugerenciaCompra: number | null
  serie: DemandaSeriePunto[]
}
