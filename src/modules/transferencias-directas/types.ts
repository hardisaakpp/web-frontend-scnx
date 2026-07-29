
export type EstadoTransferencia =
  | 'Borrador'
  | 'Procesando'
  | 'CreandoTransferencia'
  | 'TransferenciaCreada'
  | 'EnviadoASap'
  | 'PendienteAprobacionSap'
  | 'Aprobado'
  | 'Rechazado'
  | 'ErrorEnvioSap'

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
  fechaDesde?: string
  fechaHasta?: string
  ordenarPor?: string
  direccion?: 'asc' | 'desc'
  tiendaOrigen?: string
  tiendaDestino?: string
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
  comentarioSap: string | null
  sapDraftDocEntry: number | null
  sapTransferDocNum: number | null
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
  EnviadoASap: 'Enviado a SAP',
  PendienteAprobacionSap: 'Pendiente Aprobación',
  Aprobado: 'Aprobado',
  Rechazado: 'Rechazado',
  ErrorEnvioSap: 'Error Envío SAP',
}

export const etiquetaEstado = (estado: string): string => ESTADO_LABELS[estado] ?? estado

export interface FiltrosExportar {
  estado?: string
  fechaDesde?: string
  fechaHasta?: string
  tiendaOrigen?: string
  tiendaDestino?: string
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


