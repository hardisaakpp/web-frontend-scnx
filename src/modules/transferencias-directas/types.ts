
export type EstadoTransferencia =
  | 'Borrador'
  | 'Procesando'
  | 'CreandoTransferencia'
  | 'TransferenciaCreada'
  | 'EnviadoASap'
  | 'PendienteAprobacion'
  | 'Aprobado'
  | 'Rechazado'
  | 'ErrorEnvioSap'
  | 'PendienteEnvioSap'
  /** Borrado lógico: el back lo excluye de los listados normales. */
  | 'Cancelado'

//Estados transitorios (spinner / auto-refrescar).
export const ESTADOS_TRANSITORIOS: EstadoTransferencia[] = ['Procesando', 'CreandoTransferencia']




// ─── Paginación genérica (esquema de respuesta) ─────────────────────────────
export interface ResultadoPaginado<T> {
  datos: T[]
  totalRegistros: number
  paginaActual: number
  tamanoPagina: number
  totalPaginas: number
}

// ─── 1) Crear solicitud ────────────────
export interface DetalleSolicitudRequest {
  itemCode: string
  codeBars: string
  itemName?: string
  foreignName?: string
  cantidadSolicitada: number
}

export interface CrearSolicitudRequest {
  usuarioSolicitante: string
  tiendaOrigenCodigo: string
  tiendaDestinoCodigo: string
  tiendaDestinoNombre: string
  justificacion?: string
  guiaEnvio?: string
  enviarAAprobacion: boolean
  /**
   * UUID generado al abrir el formulario. Si el usuario reintenta tras un timeout,
   * viaja la misma clave y el backend devuelve la solicitud ya creada en vez de duplicar.
   */
  idempotencyKey: string
  detalles: DetalleSolicitudRequest[]
}

export interface CrearSolicitudResponse {
  id: number
}
// ─── 2) Listado solicitudes-transferencia
export interface ListarSolicitudesQuery {
  pagina: number
  tamanoPagina: number
  estado?: EstadoTransferencia
  excluirEstados?: EstadoTransferencia[]
  fechaDesde?: string
  fechaHasta?: string
  ordenarPor?: string
  direccion?: 'asc' | 'desc'
  tiendaOrigen?: string
  tiendaDestino?: string
  docNum?: number
}

export interface SolicitudResumen {
  id: number
  usuarioSolicitante: string
  fechaSolicitud: string
  justificacion: string
  tiendaOrigenCodigo: string
  tiendaOrigen: string          
  tiendaDestinoCodigo: string
  tiendaDestino: string         
  estado: EstadoTransferencia
  guiaEnvio: string | null
  cantidadProductos: number
  aprobadoPor: string | null
  // Documento de transferencia en SAP (null hasta que se crea)
  sapTransferDocEntry: number | null
  sapTransferDocNum: number | null
  /** El backend decide si el reenvío manual está habilitado (depende de horario). */
  puedeReenviarSap: boolean
}

// crear transferencia definitiva
export interface CrearDefinitivaRequest {
  guiaEnvio?: string
}

//Resultado cuando se crea una trasnferencia definitiva
export type ResultadoCrearDefinitiva =
  | 'Creada'        // 200 → éxito
  | 'NoCreada'      // 422 → temporal (reintentar si estado sigue Aprobado)
  | 'NoAprobada'    // 409 → refrescar
  | 'ErrorConsulta' // 503 → SAP no disponible, reintentar luego

export interface CrearDefinitivaResponse {
  resultado: ResultadoCrearDefinitiva
  estado: EstadoTransferencia
  sapTransferDocEntry?: number
  sapTransferDocNum?: number
  mensaje: string
}

// ─── 4) Listado tiendas DESTINO 

export interface TiendaDestino {
  whsCode: string
  whsNombre: string
  marca: string
  sitio: string
  uBogTra: string

}

// ─── 5) búsqueda de productos (rate limit) ──────────────

//Al menos UNO de los filtros es obligatorio; nunca consultar sin filtro.
export interface BuscarProductosQuery {
  itemCode?: string
  codeBars?: string
  itemName?: string
  whsCode?: string
}

export interface ProductoBusqueda {
  itemCode: string
  codeBars: string
  itemName: string
  foreignName: string
}

// ─── Estado local de la UI (detalle de la transferencia) ─────────────────────

//Tipo de búsqueda que elige el usuario en el buscador de productos. */
export type TipoBusquedaProducto = 'itemCode' | 'codeBars' | 'itemName'

/** Cantidad máxima por producto en una transferencia. */
export const CANTIDAD_MAX = 99999

// ─── Guía LAAR ───────────────────────────────────────────────────────────────
// No se pide al crear/editar un borrador: solo al enviar a aprobación, que es
// cuando el usuario ya despachó y tiene el número real.

/** Largo exacto de la guía LAAR. */
export const GUIA_LARGO = 10

/** Deja solo alfanuméricos en mayúsculas (lo que acepta el input). */
export const normalizarGuia = (valor: string): string =>
  valor.toUpperCase().replace(/[^A-Z0-9]/g, '')

/** Una guía válida son exactamente GUIA_LARGO alfanuméricos. */
export const esGuiaValida = (valor: string): boolean =>
  new RegExp(`^[A-Z0-9]{${GUIA_LARGO}}$`).test(valor.trim())

// Línea del detalle de la solicitud (productos)
export interface DetalleLinea {
  itemCode: string
  codeBars: string
  itemName?: string
  foreignName?: string
  cantidadSolicitada: number
}

export interface SolicitudDetalle {
  id: number
  usuarioSolicitante: string
  fechaSolicitud: string
  justificacion: string | null
  tiendaOrigenCodigo: string
  tiendaOrigen: string
  tiendaDestinoCodigo: string
  tiendaDestino: string
  estado: EstadoTransferencia
  guiaEnvio: string | null
  sapDraftDocEntry: number | null
  sapTransferDocNum: number | null
  // Resolución del aprobador (el comentario aplica tanto a aprobación como a rechazo)
  aprobadoPor: string | null
  fechaAprobacion: string | null
  comentarioAprobador: string | null
  fechaEnvioSap: string | null
  fechaUltimaSincronizacion: string | null
  productos: DetalleLinea[]
}

export interface ActualizarSolicitudRequest {
  justificacion?: string
  guiaEnvio?: string
  detalles: DetalleSolicitudRequest[]
}

export const ESTADO_LABELS: Record<string, string> = {
  Borrador: 'Borrador',
  Procesando: 'Procesando',
  CreandoTransferencia: 'Creando Transferencia',
  TransferenciaCreada: 'Transferencia Creada',  
  PendienteAprobacion: 'Pendiente Aprobación',
  PendienteEnvioSap: 'Pendiente Envio Sap',
  EnviadoASap: 'Enviado a SAP',
  Rechazado: 'Rechazado',
  ErrorEnvioSap: 'Error Envío SAP',
  Cancelado: 'Cancelado',
}

export const etiquetaEstado = (estado: string): string => ESTADO_LABELS[estado] ?? estado

export interface FiltrosExportar {
  estado?: string
  excluirEstados?: string[]
  fechaDesde?: string
  fechaHasta?: string
  tiendaOrigen?: string
  tiendaDestino?: string
  docNum?: number
  /** false = una fila por solicitud · true = una fila por unidad de producto */
  detallado?: boolean
}

export interface ConfiguracionEnvio {
  id: number
  marcaOrigen: string
  marcaDestino: string
  activo: boolean
  fechaCreacion: string
  fechaActualizacion: string | null
}

export interface ConfiguracionEnvioRequest {
  marcaOrigen: string
  marcaDestino: string
  activo: boolean
}
export interface ErrorSap {
  operacion: string
  mensaje: string
  fecha: string
}

// ─── Error 400 por stock insuficiente (RN-22) ────────────────────────────────
// Lo devuelven enviar-aprobacion y aprobar cuando el stock no alcanza.

export interface StockFaltante {
  itemCode: string
  solicitado: number
  disponible: number
}

export interface ErrorStockInsuficiente {
  error: string
  faltantes: StockFaltante[]
}

export interface MatrizAprobacion{
  id:number
  marcaOrigen: string
  marcaDestino: string
  whsCodeDestino: string|null
  requiereAprobacion: boolean
  rolAprobador: string|null
  activo:boolean
}

export interface ReglaAprobacionRequest{
  marcaOrigen: string
  marcaDestino: string
  whsCodeDestino: string|null
  requiereAprobacion: boolean
  rolAprobador?: string|null
  activo: boolean
}
export const MARCA_TODAS='*'

export interface AprobarSolicitudRequest{
  observacion?: string
}

export interface RechazarSolicitudRequest{
  motivoRechazo: string
}

export interface ContadorPendientesResponse{
  total:number
}

//GESTION DE TRANSITORIAS
export type  EstadoRecepcion = 
| 'PendienteVerificar'   //creada en sap, aun no consultada
| 'TransitoriaAbierta'   //  verificada, nada recibido
| 'RecepcionParcial'    //se recibio parte, queda saldo
| 'Cerrada' //recepcion completa
| 'RegularizadaAutomatica' //el sistema devolvio el saldo a origen
| 'RegularizadaManual' //un usuario disparo la devolucion
| 'RequiereRevisionManual' //datos de SAP inconsistentes

//Estados ya resueltos: el worker no los procesa y ya no se debe volver a sincronizar el estado
export const ESTADOS_RECEPCION_TERMINALES: EstadoRecepcion[] = [
  'Cerrada',
  'RegularizadaAutomatica',
  'RegularizadaManual',
  'RequiereRevisionManual'
]

export const ESTADO_RECEPCION_LABELS: Record<string, string> = {
  PendienteVerificar: 'Sin Verificar',
  TransitoriaAbierta: 'Transitoria Abierta',
  RecepcionParcial: 'Recepción Parcial',
  Cerrada: 'Cerrada',
  RegularizadaAutomatica: 'Regularizada Automática',
  RegularizadaManual: 'Regularizada Manual',
  RequiereRevisionManual: 'Requiere Revisión Manual',
}

export const etiquetaEstadoRecepcion = (estado: string): string =>
  ESTADO_RECEPCION_LABELS[estado] ?? estado

export type CampoOrdenTransitoria =
| 'FechaEnvioSap'
| 'FechaSolicitud'
| 'FechaTransitoriaAbierta'
| 'FechaUltimaSincronizacion'
| 'EstadoRecepcion'
| 'TiendaOrigen'
| 'TiendaDestino'
| 'TotalPendiente'

export interface ListarTransitoriasQuery {
  pagina?: number
  tamanoPagina?: number
  estadosRecepcion?: EstadoRecepcion[]
  tiendaOrigen?: string
  tiendaDestino?: string
  fechaDesde?: string
  fechaHasta?: string
  docNum?: number
  ordenarPor?: CampoOrdenTransitoria
  direccion?: 'Asc' | 'Desc'
}

export interface FiltrosExportarTransitorias {
  estadosRecepcion?: EstadoRecepcion[]
  tiendaOrigen?: string
  tiendaDestino?: string
  fechaDesde?: string
  fechaHasta?: string
  docNum?: number
  detallado?: boolean
}

export interface TransitoriaResumen {
  id: number
  sapTransferDocNum: number | null
  sapTransferDocEntry: number | null
  guiaEnvio: string | null
  tiendaOrigenCodigo: string
  tiendaOrigen: string
  tiendaDestinoCodigo: string   // bodega TRANSITORIA (ej. TRL-SCA), no la real
  tiendaDestino: string
  estadoRecepcion: EstadoRecepcion
  fechaEnvioSap: string | null
  fechaTransitoriaAbierta: string | null
  fechaUltimaSincronizacion: string | null
  cantidadProductos: number        // ítems distintos
  unidadesEnviadas: number         // suma de unidades
  unidadesRecibidas: number | null // null = nunca sincronizado (≠ 0)
  totalPendiente: number | null    // null = nunca sincronizado (≠ 0)
  puedeReversarse: boolean
  plazoVencido: boolean
  diasConfigurados: number | null //null= aun nose configuran los dias que tienen plazo una transitoria
  diasTranscurridos: number
  //Si la transferencia creada tiene un reverso/regularizacion asociado 
  reversoEstado: EstadoTransferencia | null //null = no tiene reverso
  reversoSapTransferDocNum: number | null // solo cuando el reverso se creo correctamnte en sap (stock transfer)
}

export interface TransitoriaLinea {
  itemCode: string
  itemName: string | null
  codeBars: string
  cantidadSolicitada: number
  cantidadPendiente: number | null //null = no sincronizada
  cantidadRecibida: number | null //=solcitada-pendiente
}
export interface TransitoriaDetalle {
  id: number
  sapTransferDocNum: number | null
  sapTransferDocEntry: number | null
  guiaEnvio: string | null
  tiendaOridenCodigo: string
  tiendaOrigen: string
  tiendaDestinoCodigo: string
  tiendaDestino: string
  estadoRecepcion: EstadoRecepcion
  fechaEnvioSap: string | null
  fechaTransitoriaAbierta: string | null
  fechaUltimaSincronizacion: string | null
  lineas: TransitoriaLinea[] 
  puedeReversarse: boolean
  plazoVencido: boolean
  diasConfigurados: number | null
  diasTranscurridos: number 
}
export interface SincronizarTransitoriaResponse {
  id: number
  estadoRecepcion: EstadoRecepcion
}

//Opcion de realizar una devolucion de stock a la tienda origen de manera manual
export interface RegularizarResponse {
  solicitudReversoId: number
  mensaje: string
}

//GET/transitorias/{id}/reverso: 
export interface TransitoriaReverso{
  id: number   // = solicitudReversoId (para errores-sap/reenviar-sap)
  solicitudOrigenId: number // = id de la transitoria original (mismo valor con el que se llamó a este endpoint)
  sapTransferDocNum: number | null
  sapTransferDocEntry:  number | null 
  guiaEnvio: string | null
  tiendaOrigenCodigo: string //invertida respecto de la transitoria original
  tiendaOrigen: string
  tiendaDestinoCodigo: string
  tiendaDestino: string
  estado: EstadoTransferencia
  fechaEnvioSap: string | null
  lineas: TransitoriaLinea[]
  baseDocumento: number | null //docunum de la transitoria original
  justificacion: string
  usuarioSolicitante: string
}

export interface ConfiguracionDiasTransitoria {
  id: number
  marca: string
  bodegaCodigo: string | null  //null = aplica a todas las tiendas de la marca 
  dias: number
  activo: boolean
}

export interface ConfiguracionDiasTransitoriaRequest{
  marca: string
  bodegaCodigo: string | null
  dias: number
  activo: boolean
}

