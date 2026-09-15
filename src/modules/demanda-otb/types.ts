export interface DemandaSeriePunto {
  mes: string // YYYY-MM
  historia?: number | null
  historiaComparable?: number | null
  proyeccion?: number | null
  max80?: number | null
  min80?: number | null
  max95?: number | null
  min95?: number | null
  /** Unidades aportadas por catálogo nuevo (sin historia propia) para ese mes. */
  catalogoNuevo?: number | null
  /** proyeccion + catalogoNuevo del mes — ya sumado por el backend. */
  total?: number | null
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
  rangoMin95?: number | null
  rangoMax95?: number | null
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

/** GET /niveles/{negocio} — árbol en cascada (Nivel1 → Nivel2 → Nivel3), no facetas independientes. */
export interface Nivel2Nodo {
  nombre: string
  nivel3: string[]
}

export interface Nivel1Nodo {
  nombre: string
  nivel2: Nivel2Nodo[]
}

export interface NivelesTree {
  negocio: string
  nivel1: Nivel1Nodo[]
}

/** GET /niveles/{negocio}/agregado — mismo shape que /sku pero sumado para todos los SKUs del nodo. */
export interface AgregadoResponse {
  negocio: string
  campo: string
  valor: string
  nSkus: number
  proximoMes: string | null
  prediccionProximoMes: number | null
  rangoMin80: number | null
  rangoMax80: number | null
  rangoMin95?: number | null
  rangoMax95?: number | null
  stockInicial?: number | null
  /** Unidades de próximo mes aportadas por catálogo nuevo (sin historia propia). */
  catalogoNuevoProximoMes?: number | null
  /** prediccionProximoMes + catalogoNuevoProximoMes — ya sumado por el backend. */
  prediccionProximoMesTotal?: number | null
  /** rangoMin80/Max80 desplazado por catalogoNuevoProximoMes — ya sumado por el backend. */
  rangoMin80Total?: number | null
  rangoMax80Total?: number | null
  /** Igual que arriba pero para el rango 95%, si el backend llega a mandarlo. */
  rangoMin95Total?: number | null
  rangoMax95Total?: number | null
  /**
   * Pendiente en el backend (en curso) — para un nodo agregado no es "ALTA/MEDIA/BAJA" de un
   * SKU puntual, sino una etiqueta propia del agregado (ej. "AGREGADO"). Queda tipado desde ya
   * para no tener que tocar el frontend de nuevo cuando el backend la empiece a mandar.
   */
  confianza?: string | null
  serie: DemandaSeriePunto[]
}

/** GET /niveles/{negocio}/genero y /marca-comercial — mismo nodo que /agregado, repartido en grupos. */
export interface DesgloseGrupo {
  valor: string
  nSkus: number
  prediccionProximoMes: number
  rangoMin80: number
  rangoMax80: number
  totalHorizonte: number
  pct: number
}

export interface DesgloseResponse {
  negocio: string
  campo: string
  valor: string
  proximoMes: string
  totalProx: number
  totalHorizonte: number
  grupos: DesgloseGrupo[]
}

/**
 * GET /otb/{negocio} — fila de la tabla OTB, grano Nivel1×Nivel2×Nivel3×Género. Sin filtros de
 * atributo es passthrough de otb.Nodo (completamente poblado); con Coleccion/MarcaProveedor/Origen/
 * Descontinuado/Repocision/Inactivo/Sku se recalcula en vivo desde Proyeccion+Historico y varios
 * campos quedan en null (ver `OtbResponse.filtrado` para saber cuál camino se usó).
 */
export interface NodoFila {
  nivel1: string | null
  nivel2: string | null
  nivel3: string | null
  genero: string | null
  ventasPlanificada: number | null
  min80: number | null
  max80: number | null
  min95: number | null
  max95: number | null
  skus: number | null
  stockInicial: number | null
  stockDia: number | null
  transito: number | null
  /** Inv. Final Planificado y OTB con la Cobertura Deseada por defecto de BI (`otbParams.target`,
   *  modo Regular) — el backend ahora los calcula y los manda listos. El cliente los usa tal cual
   *  mientras no se edite Cobertura Deseada ni se cambie a modo Pico; en cuanto se edita algo, el
   *  cliente recalcula con la misma fórmula (ver invFinalPlanificado()/otbUnidades() en OtbView.vue). */
  invFinalPlanificado: number | null
  otb: number | null
  tendenciaRatio: number | null
  tendencia: string | null
  semaforo: string | null
  coberturaDias: number | null
  decisionOtb: string | null
  catNuevo: number | null
  ventasTotal: number | null
  referencia: number | null
  exceso: number | null
  catNuevoTopado: number | null
  lyUds: number | null
  nivelMes: number | null
  crec12M: number | null
  /** = ceil(max(otb, 0)) con el OTB de arriba — golden-tested contra los 727 nodos de ROLAND
   *  (2026-09-14), 0 discrepancias. El cliente lo recalcula igual si otb cambia (ver pedidoValue()). */
  pedido: number | null
}

/** Constantes del modelo de semáforo — mismos números que usó BI, para que el frontend simule. */
export interface OtbParams {
  target: number
  sobrestockRatio: number
}

/** Texto de decisión por combinación Semáforo×Tendencia (12 casos) — para recalcular la
 *  Decisión en el cliente si algún día se recalcula el Semáforo también. */
export type MatrizDecision = Record<string, Record<string, string>>

export interface OtbResponse {
  negocio: string
  fecha: string
  fechasDisponibles: string[]
  /** Día del mes en que BI ejecutó el cálculo de Stock día — se muestra junto a esa columna. */
  diaEjecucionBi: number
  filtrado: boolean
  rows: NodoFila[]
  otbParams: OtbParams
  matriz: MatrizDecision
  colecciones: string[]
  marcasProveedor: string[]
  origenes: string[]
  descontinuados: string[]
  repociones: string[]
  inactivos: string[]
  /** Suma de CatNuevo de todas las filas visibles. */
  catNuevoTotal: number
  /** false si hay algún filtro de atributo activo — con filtro, catNuevoTotal ya no corresponde al subconjunto. */
  catNuevoAplicable: boolean
  /** Filas con Exceso > 0 (aviso "⚠ N por revisar"). */
  nodosMarcados: number
  /** Filas cuyo catálogo nuevo se recortó por el tope. */
  nodosTopados: number
}

export interface OtbFiltros {
  fecha?: string
  coleccion?: string
  marcaProveedor?: string
  origen?: string
  descontinuado?: string
  repocision?: string
  inactivo?: string
  sku?: string
}

/** POST /otb/{negocio}/export — mismos filtros que /otb, más los de columna (nivel1/2/3/
 *  género) y tipoMes, ya que el Excel se genera server-side con todos los nodos+SKUs. */
export interface OtbExportRequest extends OtbFiltros {
  tipoMes?: 'regular' | 'pico'
  /** Confirmado contra el swagger real (2026-09-14, ExportarOtbRequest): es GLOBAL para todo el
   *  export, no por fila — a diferencia de Pedido en `nivel3Multiple`, que sí es por fila. Todavía
   *  no hay un control en la UI que arme este valor (Cobertura Deseada solo se edita por fila en
   *  la tabla) — pendiente de definir con el usuario. Omitido = el backend usa su propio default. */
  coberturaDeseada?: number
  nivel1?: string
  nivel2?: string
  nivel3?: string
  genero?: string
  /** Filtro adicional e independiente del `nivel3` de arriba — se arma marcando el checkbox
   *  "Nivel 3 → Excel" de filas puntuales en la tabla (Nivel3+Género), cada una con su propio
   *  Pedido editado. Vacío/omitido = comportamiento actual sin cambios (exporta todo). */
  nivel3Multiple?: OtbExportNivel3Item[]
}

/** Un ítem de `OtbExportRequest.nivel3Multiple` — una fila (Nivel3+Género) marcada para
 *  exportar, con su Pedido editado. `genero` se omite si la fila no tiene género (null).
 *  Confirmado contra el swagger real (Nivel3PedidoDto, 2026-09-14): a esa fecha NO llevaba
 *  coberturaDeseada por fila — ese campo era global, ver `OtbExportRequest.coberturaDeseada`.
 *  `coberturaDeseada` de abajo es un pedido de cambio (2026-09-15, ver
 *  docs/NEXUS_OTB_REQUEST_EXPORT_NIVEL3_MULTIPLE.md §6) — el backend todavía NO lo soporta;
 *  se manda ya por si acaso, pero no tiene efecto hasta que lo implementen. */
export interface OtbExportNivel3Item {
  nivel3: string
  genero?: string
  /** Pendiente de soporte en backend (§6 del doc de arriba) — se manda igual, sin efecto todavía. */
  coberturaDeseada?: number
  pedido: number
}

/** GET /otb/{negocio}/skus — drill-down del [+], SIN filtrar por género (viaja por SKU). */
export interface OtbSkuItem {
  codigo: string
  nombre: string
  genero: string | null
  predUnidades: number | null
  stockInicial: number | null
  semaforo: string | null
  coberturaDias: number | null
  coberturaTotalDias: number | null
  decisionOtb: string | null
  pedido: number | null
}

export interface OtbSkusResponse {
  negocio: string
  nivel1: string
  nivel2: string
  nivel3: string
  fecha: string
  skus: OtbSkuItem[]
}
