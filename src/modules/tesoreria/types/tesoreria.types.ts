/**
 * DTOs y contratos de request/response de api-tesoreria.
 * El backend serializa con System.Text.Json en camelCase (default de ASP.NET Core), enums como
 * número entero (sin JsonStringEnumConverter) y `DateOnly` como cadena "yyyy-MM-dd".
 */

// ─── Enums del backend (valores numéricos tal cual los emite System.Text.Json) ──────────────
export enum EstadoDeposito {
  Pendiente = 1,
  IntegradoSAP = 2,
  RechazadoSAP = 3,
  Anulado = 4
}

export enum TipoEmpresa {
  MabelTrading = 1,
  ComercialEcuador = 2
}

/** Texto y tono accesibles (no solo color) para cada EstadoDeposito — WCAG 1.4.1. */
export const ESTADO_DEPOSITO_META: Record<EstadoDeposito, { label: string; tono: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  [EstadoDeposito.Pendiente]: { label: 'Pendiente de envío', tono: 'warning' },
  [EstadoDeposito.IntegradoSAP]: { label: 'Integrado en SAP', tono: 'success' },
  [EstadoDeposito.RechazadoSAP]: { label: 'Rechazado por SAP', tono: 'danger' },
  [EstadoDeposito.Anulado]: { label: 'Anulado', tono: 'neutral' }
}

/** Filtro rápido activo sobre las tarjetas KPI de MisDepositosView (filtrado en memoria, sin refetch). */
export type TipoFiltroKpi = 'todos' | 'pendientesSap' | 'conDiferencia' | 'cuadrados'

// ─── Resumen diario (efectivo de caja vs. depositado) ───────────────────────────────────────
export interface ResumenComparativoDto {
  fechaCierre: string // DateOnly "yyyy-MM-dd"
  codigoAlmacen: string
  totalEfectivo: number
  totalDepositado: number
  diferencia: number
  pendientesSAP: number
}

// ─── Papeleta de depósito ────────────────────────────────────────────────────────────────────
export interface DepositoDto {
  id: number
  empresaId: TipoEmpresa
  almacenId: number
  codigoAlmacen: string
  fechaCierreCaja: string
  fechaDepositoBanco: string
  cuentaFinancieraId: number
  numeroComprobante: string
  montoDepositado: number
  moneda: string
  tipoDeposito: string
  responsable: string
  esSobrante: boolean
  estado: EstadoDeposito
  creadoSAP: boolean
  docEntrySAP: number | null
  fechaIntegracionSAP: string | null
  adjuntoId?: number | null
  nombreArchivoOriginal?: string | null
  tieneAdjunto?: boolean
}

export interface DetalleDiarioDto {
  codigoAlmacen: string
  fechaCierreCaja: string
  depositos: DepositoDto[]
  permitirNuevoDeposito: boolean
  motivoBloqueo: string | null
}

// ─── Cuenta financiera (para el selector de cuenta bancaria receptora) ──────────────────────
export interface CuentaFinancieraDto {
  id: number
  codigoCuentaSAP: string
  codigoFormateado: string
  nombreCuenta: string
  habilitadaParaTiendas: boolean
  activa: boolean
}

// ─── Resultado de sincronización manual del subconjunto bancario del catálogo SAP (Mabel Trading) ──
export interface ResultadoSincronizacionCuentasDto {
  cuentasRecibidasSap: number
  cuentasFiltradasBancarias: number
  cuentasNuevas: number
  cuentasActualizadas: number
}

// ─── Auditoría global (sábana multitienda) ──────────────────────────────────────────────────
export interface AuditoriaGlobalDto {
  /** 0 cuando la fila es sintética ("Falta depósito"): no existe ningún DepositoTienda real detrás. */
  id: number
  empresaId: TipoEmpresa
  codigoAlmacen: string
  fechaCierreCaja: string
  fechaDepositoBanco: string
  numeroComprobante: string
  montoDepositado: number
  codigoCuentaSAP: string
  responsable: string
  estado: EstadoDeposito
  docEntrySAP: number | null
  creadoSAP: boolean
  adjuntoId?: number | null
  nombreArchivoOriginal?: string | null
  tieneAdjunto?: boolean
  /** Efectivo recontado en el arqueo físico de caja (dbo.cicUs) para el (almacén, fecha) de esta fila. */
  efectivoCierre: number
  /** efectivoCierre - montoDepositado, a nivel de fila. */
  diferencia: number
  /** Etiqueta humana lista para mostrar/exportar (independiente del valor numérico de `estado`). */
  estadoDescripcion: string
  /** true = fila sintética: hubo arqueo de caja pero la tienda no ha registrado ninguna papeleta. */
  requiereDeposito: boolean
}

/** Opciones del filtro de estado de la sábana de auditoría (ver GetAuditoriaGlobalQuery.Estado en el backend). */
export type FiltroEstadoAuditoria = 'TODOS' | 'FALTA_DEPOSITO' | 'INTEGRADO' | 'PENDIENTE' | 'RECHAZADO'

export interface PaginatedList<T> {
  items: T[]
  pageNumber: number
  totalPages: number
  totalCount: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

// ─── Respuesta de integración a SAP ──────────────────────────────────────────
export interface SapDepositResponseDto {
  docEntry: number
  mensaje?: string | null
}


// ─── Configuración de políticas de días de gracia ───────────────────────────────────────────
export interface ConfiguracionTesoreriaDto {
  bloqueoNuevoActivo: boolean
  diasMaximoNuevo: number
  bloqueoDepositoActivo: boolean
  diasMaximoDeposito: number
  /** Hora local de Ecuador a partir de la cual se bloquea el registro extemporáneo. El backend
   *  serializa el TimeSpan como "HH:mm:ss" (p. ej. "14:00:00"). */
  horaLimiteCorte: string
  // ─── Motor de notificaciones acumulativas (independiente del candado de tienda) ────────────
  notificacionesActivas: boolean
  usarRangoCalendarioNotificacion: boolean
  diasVentanaNotificacion: number
  /** DateOnly "yyyy-MM-dd", solo relevante cuando usarRangoCalendarioNotificacion es true. */
  fechaInicioNotificacion: string | null
  fechaFinNotificacion: string | null
}

export type UpdateConfiguracionRequest = ConfiguracionTesoreriaDto

// ─── Resultado de una corrida (automática o manual) del motor de notificaciones ─────────────
export interface ResultadoNotificacionesDto {
  tiendasEvaluadas: number
  correosEnviados: number
  tiendasOmitidas: number
  errores: number
}

// ─── Gestión de cuentas financieras (activación/desactivación, Contabilidad/Admin) ──────────
export interface ActualizarEstadoCuentaPayload {
  activa: boolean
  habilitadaParaTiendas: boolean
}

// ─── Comprobante de depósito (MinIO) ────────────────────────────────────────────────────────
export interface UrlComprobanteDto {
  url: string
  nombreArchivo: string
}

/** ProblemDetails de ASP.NET Core, incluidos conflictos sin diccionario de validación. */
export interface TesoreriaProblemDetails {
  status?: number
  title?: string
  detail?: string
  correlationId?: string
  errors?: Record<string, string[] | string>
}

export interface ErrorRespuestaTesoreria {
  response?: { status?: number; data?: TesoreriaProblemDetails }
  message?: string
}

// ─── Requests ────────────────────────────────────────────────────────────────────────────────
export interface GetResumenDepositosParams {
  codigoAlmacen: string
  fechaDesde: string // yyyy-MM-dd
  fechaHasta: string // yyyy-MM-dd
}

export interface GetAuditoriaGlobalParams {
  fechaDesde: string
  fechaHasta: string
  codigoAlmacen?: string | null
  estado?: FiltroEstadoAuditoria | null
  pageNumber?: number
  pageSize?: number
}

/** Campos de CrearDepositoCommand; se envían como multipart/form-data (ver tesoreriaApi.crearDeposito). */
export interface CrearDepositoPayload {
  almacenId: number
  codigoAlmacen: string
  fechaCierreCaja: string
  fechaDepositoBanco: string
  cuentaFinancieraId: number
  numeroComprobante: string
  montoDepositado: number
  moneda: string
  tipoDeposito: string
  responsable: string
  esSobrante: boolean
  comprobante: File
}

// ─── Destinatarios de alertas de Tesorería (Contactos de Notificación, Contabilidad/Admin) ──
export interface ContactoNotificacionDto {
  id: number
  empresaId: TipoEmpresa
  nombreCompleto: string
  email: string
  cargo: string | null
  activo: boolean
  fechaCreacion: string
}

export interface CrearContactoNotificacionPayload {
  nombreCompleto: string
  email: string
  cargo: string | null
}

export interface ActualizarContactoNotificacionPayload extends CrearContactoNotificacionPayload {
  activo: boolean
}

export interface CambiarEstadoContactoPayload {
  activo: boolean
}

export interface EnviarCorreoPruebaResultadoDto {
  enviados: number
  destinatarios: string[]
}

/** Permisos canónicos Tesoreria.Depositos.* — deben coincidir EXACTO con los claims emitidos por api-core-scnexus. */
export const TESORERIA_PERMISOS = {
  Consultar: 'Tesoreria.Depositos.Consultar',
  Crear: 'Tesoreria.Depositos.Crear',
  IntegrarSAP: 'Tesoreria.Depositos.IntegrarSAP',
  AuditarGlobal: 'Tesoreria.Depositos.AuditarGlobal',
  Eliminar: 'Tesoreria.Depositos.Eliminar',
  AutorizarSobregiro: 'Tesoreria.Depositos.AutorizarSobregiro',
  ConfigurarBloqueos: 'Tesoreria.Depositos.ConfigurarBloqueos'
} as const
