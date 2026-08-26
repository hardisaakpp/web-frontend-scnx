// ─── CRUD base (listado admin) ────────────────────────────────────────────────
export interface Ruleta {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
  fechaCreacion: string
  fechaActualizacion: string | null
}

export interface RuletaFilters {
  search?: string
  activo?: boolean
  page?: number
  pageSize?: number
}

export interface RuletaPagination {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── Catálogo ─────────────────────────────────────────────────────────────────
export interface Tienda {
  id: number
  codigo: string
  nombre: string
  ciudad: string
  activa: boolean
}

export interface SegmentoRuleta {
  id: number
  nombre: string
  descripcion?: string | null
  tipo: 'digital' | 'fisico' | 'relleno'
  imagen_url: string | null
  color: string
  es_vacio: boolean
}

// ─── Identificación de cliente (API Credicorp / segmentación) ─────────────────
export type SegmentoCliente =
  | 'GRUPO_1'
  | 'GRUPO_2'
  | 'GRUPO_3'
  | 'GRUPO_4'
  | 'GRUPO_5'
  | 'GRUPO_6'

export interface IdentificacionCliente {
  identificacion: string
  correo: string | null
  segmento: SegmentoCliente | null
  en_lista_negra: boolean
  nombre: string | null
  telefono: string | null
}

// ─── Admin: Campañas ──────────────────────────────────────────────────────────
// Estado persistido de la campaña (máquina de estados estricta e inmutable, Fase 1):
// Borrador → Activa ↔ Pausada → Finalizada (candado permanente, nunca regresa).
// "programada" NO es un estado persistido — es un derivado de estado_operativo
// (Activa con fecha_inicio futura), por eso vive solo en EstadoOperativoCampana.
export type EstadoCampana = 'borrador' | 'activa' | 'pausada' | 'finalizada'
export type EstadoOperativoCampana = 'borrador' | 'programada' | 'disponible' | 'pausada' | 'vencida' | 'finalizada'

export interface Campana {
  id: string
  nombre: string
  descripcion?: string
  fecha_inicio: string
  fecha_fin: string
  cooldown_dias: number
  max_giros: number
  segmentos_permitidos: SegmentoCliente[]
  estado: EstadoCampana
  estado_operativo: EstadoOperativoCampana
  esta_vigente: boolean
  disponible_para_giro: boolean
  motivo_no_disponible?: string | null
  requiere_validacion_onecard: boolean
  tiene_premios: boolean
  hora_feliz_inicio?: string | null
  hora_feliz_fin?: string | null
}

export interface CampanaBackendResponse {
  id: string
  nombre: string
  descripcion: string | null
  fechaInicio: string
  fechaFin: string
  estado: string
  estadoOperativo: string
  estaVigente: boolean
  disponibleParaGiro: boolean
  motivoNoDisponible: string | null
  diasEntreGiros: number
  maxGirosPorCliente: number
  segmentosPermitidos: string[] | null
  requiereValidacionOneCard: boolean
  createdAt: string
  createdBy: string
  premios: unknown[] | null
  horaFelizInicio: string | null
  horaFelizFin: string | null
}

export interface CrearCampanaDTO {
  nombre: string
  descripcion?: string
  fecha_inicio: string
  fecha_fin: string
  cooldown_dias: number
  max_giros: number
  segmentos_permitidos: SegmentoCliente[]
  requiere_validacion_onecard: boolean
  hora_feliz_inicio?: string | null
  hora_feliz_fin?: string | null
}

// Duplicación limpia (deep clone) de una campaña: solo pide lo que no puede heredarse
// automáticamente del origen (nombre y vigencia) — el resto de parámetros, premios y tiendas
// se copian tal cual en el backend, con el stock reseteado a 0 y sin arrastrar historial.
export interface DuplicarCampanaDTO {
  nombre: string
  fecha_inicio: string
  fecha_fin: string
}

export interface CampanaDisponibleBackendResponse {
  disponible: boolean
  estadoOperativo: string
  motivo: string | null
  campana: CampanaBackendResponse | null
}

export interface DisponibilidadCampana {
  disponible: boolean
  estado_operativo: string
  motivo: string | null
  campana: Campana | null
}

// ─── Admin: Premios y probabilidades ─────────────────────────────────────────
export type TipoPremio = 'fisico' | 'digital' | 'descuento' | 'relleno'

export interface PremioAdmin {
  id: string
  nombre: string
  descripcion?: string | null
  tipo: TipoPremio
  stock_total: number | null
  stock_disponible?: number | null
  valor_referencial?: number | null
  es_relleno: boolean
  imagen_url?: string
  controla_stock_por_tienda: boolean
  orden_ruleta?: number | null
  // Token de concurrencia optimista (base64) recibido del backend. Se debe reenviar
  // tal cual al guardar para que el servidor detecte ediciones simultáneas (409).
  rowVersion?: string
}

export interface CrearPremioDTO {
  nombre: string
  descripcion?: string
  es_vacio: boolean
  tipo: TipoPremio
  segmento: SegmentoCliente
  controla_stock_por_tienda: boolean
  stock_total: number | null
  valor_referencial?: number | null
  imagen_url?: string
  orden_ruleta?: number | null
}

export interface AsignacionStockDTO {
  tiendaCodigo: string
  cantidad: number
}

export type EstadoGrupo = 'completo' | 'incompleto' | 'advertencia'

export interface GrupoProbabilidad {
  grupo: SegmentoCliente
  label: string
  estado: EstadoGrupo
  premios: PremioAdmin[]
}

export interface ProbabilidadGrupo {
  grupo: string
  porcentajeGanar: number
}

// ─── Admin: Inventario por tienda ─────────────────────────────────────────────
export interface TiendaInventario {
  id: number
  nombre: string
  codigo: string
}

export interface InventarioPremio {
  premio_id: string
  nombre: string
  tipo: string
  // Techo real e inmutable de bodega (Premio.StockTotalBodega crudo) — NO la suma de lo ya
  // repartido entre tiendas. Ver PremioBackendResponse.stockTotalBodega.
  stock_total: number
  por_tienda: Record<number, number>
  total_asignado: number
  restante_bodega: number
  // Token de concurrencia optimista del premio, para reenviarlo en setDistribucionTienda.
  row_version?: string
}

// ─── Admin: Dashboard Global ──────────────────────────────────────────────────
export interface MetricasGlobal {
  total_participantes: number
  participantes_delta_hoy: number
  afiliaciones_nuevas: number
  afiliaciones_delta_hoy: number
  tasa_conversion: number
  tasa_conversion_meta: number
  premios_entregados: number
  premios_redimidos: number
  porcentaje_redimidos: number
}

export interface EfectividadTienda {
  tienda_id: number
  tienda_nombre: string
  giros: number
  participantes: number
  afiliaciones: number
  conversion: number
  premios: number
  stock_restante: number
  alerta_stock: boolean
}

export interface SegmentacionGrupo {
  grupo: SegmentoCliente
  label: string
  cantidad: number
  porcentaje: number
  color: string
}

export interface ConversionSemanal {
  label: string
  valor: number
}

// ─── Supervisor ───────────────────────────────────────────────────────────────
export interface MetricasSupervisor {
  total_giros: number
  clientes_unicos: number
  afiliaciones: number
  afiliaciones_delta: number
  tasa_conversion: number
  tienda_nombre: string
  tienda_ciudad: string
  fecha: string
}

export type EstadoEnrolador = 'activo' | 'alerta' | 'inactivo'

export interface EnroladorMetrica {
  id: number
  nombre: string
  tienda?: string
  giros: number
  clientes_unicos: number
  afiliaciones: number
  conversion: number
  estado: EstadoEnrolador
}

// ─── Giro ─────────────────────────────────────────────────────────────────────
export interface ResultadoGiro {
  giro_id: string | number
  codigo_canje: string
  premio: SegmentoRuleta
  es_ganador: boolean
  indice_segmento: number
  cliente: IdentificacionCliente
}

// ─── Backend DTOs ─────────────────────────────────────────────────────────────
export interface InventarioTiendaBackend {
  id: string
  tiendaCodigo: string
  stockTotal: number
  stockDisponible: number
}

export interface PremioBackendResponse {
  id: string
  nombre: string
  descripcion: string | null
  tipo: string
  segmento: string | null
  stockTotal: number | null
  // Techo real e inmutable de bodega. Cuando controlaStockPorTienda=true, `stockTotal` arriba es
  // la SUMA de lo ya repartido entre tiendas (no un límite) — este campo es el que hay que usar
  // para validar contra el límite real. Ver PremioDto.StockTotalBodega en el backend.
  stockTotalBodega?: number | null
  stockDisponible?: number | null
  valorReferencial: number | null
  esVacio: boolean
  activo: boolean
  imagenUrl?: string
  controlaStockPorTienda?: boolean
  inventariosTienda?: InventarioTiendaBackend[]
  rowVersion?: string
  // Orden visual del segmento en la ruleta. El backend siempre lo envía (int no-anulable);
  // nunca reenviar `0` a secas al editar sin intención real de mover el premio — ver
  // premioToBackend en ruletaApi.ts.
  ordenRuleta?: number
}

export interface StockPremio {
  id: string
  nombre: string
  tipo: string
  stockTotal: number
  stockDisponible: number
  alertaBajoStock: boolean
}

// ─── Preview de impacto de stock en el pacing (SpinEngine) ───────────────────
export interface PreviewImpactoStockItem {
  premioId: string
  tiendaCodigo: string
  nuevoStockTotal: number
}

// Una fila tienda→stock dentro de una distribución completa (guardado atómico por premio).
export interface DistribucionTiendaItem {
  tiendaCodigo: string
  stockTotal: number
}

export interface ImpactoStock {
  premioId: string
  premioNombre: string
  tiendaCodigo: string
  stockActual: number
  stockNuevo: number
  disponibleHoyActual: number
  disponibleHoyNuevo: number
}

// ─── Verificación y redención ─────────────────────────────────────────────────
export interface GiroVerificacionResponse {
  id: string
  campanaId: string
  nombreCampana: string
  clienteIdentificacion: string
  clienteCorreo: string | null
  esGanador: boolean
  premioNombre: string
  premioTipo: string
  codigoRedencion: string
  fechaGiro: string
  enroladorNombre: string | null
}

export interface RedencionResponse {
  id: string
  giroId: string
  codigoRedencion: string
  premioNombre: string
  fechaRedencion: string
  redimidoPorNombre: string | null
  notas: string | null
}

// ─── Métricas campaña ─────────────────────────────────────────────────────────
export interface MetricasCampana {
  totalGiros: number
  totalGanadores: number
  porcentajeGanadores: number
  premiosEntregados: number
  stockRestanteGlobal: number
}

// ─── Historial de giros (paginado) ────────────────────────────────────────────
export interface HistorialGiroItem {
  id: string
  fecha: string
  identificacion: string
  tiendaCodigo: string
  enroladorNombre: string | null
  premioNombre: string
  premioTipo: string
  segmento: SegmentoCliente | null
  estado: string
  esGanador: boolean
  codigoRedencion: string | null
  redimido: boolean
  // Grupo/segmento del cliente (API Credicorp): GRUPO_1..GRUPO_6, sin lista cerrada
  grupo: string | null
}

// Enum del backend (Ruleta.Domain.Enums.EstadoGiro). Pendiente/Anulado no se
// ofrecen como filtro en la UI: en la práctica cualquier Giro se resuelve a
// Ganador o SinPremio al crearse, y nunca se marca Anulado.
export enum EstadoGiro {
  Pendiente = 0,
  Ganador = 1,
  SinPremio = 2,
  Anulado = 3,
  Redimido = 4
}

// Se filtra por el NOMBRE del enum (?estado=Redimido), no por su valor numérico:
// así el query string es legible en devtools/logs y no se rompe si el backend
// reordena el enum. El model binder de ASP.NET Core para [FromQuery] resuelve
// el nombre directo a GiroFilterDto.Estado sin necesidad de mandar "4".
export type EstadoPremioFiltro = 'Ganador' | 'SinPremio' | 'Redimido'

export interface GiroFilters {
  campanaId?: string
  premioNombre?: string
  segmento?: SegmentoCliente
  fechaInicio?: string
  fechaFin?: string
  estado?: EstadoPremioFiltro
}

export interface DistribucionSegmentos {
  labels: SegmentoCliente[]
  data: number[]
}

export interface HistorialGirosResponse {
  totalRegistros: number
  totalPaginas: number
  paginaActual: number
  items: HistorialGiroItem[]
}

export interface GiroRequestDTO {
  identificacion: string
  campanaId: string
  tiendaCodigo: string
  enroladorId?: number
  deviceHash?: string
}

export interface GiroBackendResponse {
  id: string
  codigoCanje: string
  premioGanado: PremioBackendResponse
  fechaGiro: string
  clienteIdentificacion: string
}

// ─── Tema visual de la ruleta ──────────────────────────────────────────────────
export interface TemaRuleta {
  // Segmentos de la rueda
  paleta_segmentos: string[]
  color_texto_segmentos: string

  // Aro exterior
  color_aro_primario: string
  color_aro_secundario: string

  // Hub central
  color_hub_fondo: string
  color_hub_acento: string

  // Puntero/flecha
  color_puntero: string

  // Fondo de pantalla
  color_fondo_inicio: string
  color_fondo_fin: string

  // Halo/glow
  color_halo: string

  // Botón girar
  color_boton: string
}

