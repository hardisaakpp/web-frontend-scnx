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
  descripcion: string | null
  nivel1: string | null
  nivel2: string | null
  nivel3: string | null
  genero: string | null
  categoria: string | null
  confianza: string | null
  stockInicial: number | null
  semaforo: string | null
  coberturaDias: number | null
  coberturaTotalDias: number | null
  decisionOtb: string | null
  sugerenciaCompra: number | null
  proximoMes: string | null
  prediccionProximoMes: number | null
  rangoMin80: number | null
  rangoMax80: number | null
  tieneProyeccion: boolean
  mensaje: string | null
  serie: DemandaSeriePunto[]
}

/** Item de GET /catalogo/{negocio} — recortado, sin niveles/confianza (viven en Facetas). */
export interface CatalogoItem {
  codigoProducto: string
  nombreProducto: string
  tieneProyeccion: boolean
}

export interface CatalogoFacetas {
  nivel1: string[]
  nivel2: string[]
  nivel3: string[]
  genero: string[]
  marcaComercial: string[]
  coleccion: string[]
  confianza: string[]
}

export interface CatalogoResponse {
  negocio: string
  items: CatalogoItem[]
  total: number
  facetas: CatalogoFacetas
}

export interface CatalogoFiltros {
  codigo?: string
  nombre?: string
  busqueda?: string
  nivel1?: string
  nivel2?: string
  nivel3?: string
  genero?: string
  marcaComercial?: string
  coleccion?: string
  confianza?: string
  limite?: number
}
