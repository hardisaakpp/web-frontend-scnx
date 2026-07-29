import { transferenciasDirectasApi } from "@/lib/http"
import { ActualizarSolicitudRequest, ConfiguracionEnvio, ConfiguracionEnvioRequest, CrearDefinitivaResponse, CrearSolicitudRequest, CrearSolicitudResponse, ErrorSap, EstadoTransferencia, FiltrosExportar, ListarSolicitudesQuery, ResultadoPaginado, SolicitudDetalle, SolicitudResumen } from "../types"
import { nombreArchivoDesdeHeader } from "../utils/descargas"

const transferenciasService = {
  // GET /api/solicitudes-transferencia (paginado + filtros)
  listar: async (query: ListarSolicitudesQuery): Promise<ResultadoPaginado<SolicitudResumen>> => {
    const params: Record<string, string | number> = {
      pagina: query.pagina,
      tamanoPagina: query.tamanoPagina,
    }
    if (query.estado) params.estado = query.estado
    if (query.fechaDesde) params.fechaDesde = query.fechaDesde
    if (query.fechaHasta) params.fechaHasta = query.fechaHasta
    if (query.tiendaOrigen) params.tiendaOrigen = query.tiendaOrigen
    if (query.tiendaDestino) params.tiendaDestino = query.tiendaDestino
    if (query.ordenarPor) params.ordenarPor = query.ordenarPor
    if (query.direccion) params.direccion = query.direccion

    const { data } = await transferenciasDirectasApi.get<ResultadoPaginado<SolicitudResumen>>(
      'solicitudes-transferencia',
      { params }
    )
    return data
  },
  //POST /api/solicitudes-transferencias
  crear: async (payload: CrearSolicitudRequest): Promise<CrearSolicitudResponse> => {
    const {data} = await transferenciasDirectasApi.post<CrearSolicitudResponse>(
      'solicitudes-transferencia',
      payload
    )
    return data
  },
  // GET {id} → cabecera + productos
  obtenerDetalle: async (id: number): Promise<SolicitudDetalle> => {
    const { data } = await transferenciasDirectasApi.get<SolicitudDetalle>(`solicitudes-transferencia/${id}`)
    return data
  },

  // PUT {id} editar 
  actualizar: async (id: number, body: ActualizarSolicitudRequest): Promise<{ id: number; estado: EstadoTransferencia }> => {
    const { data } = await transferenciasDirectasApi.put<{ id: number; estado: EstadoTransferencia }>(
      `solicitudes-transferencia/${id}`, body
    )
    return data
  },

  // POST {id}/enviar-aprobacion
  enviarAprobacion: async (id: number): Promise<{ estado: EstadoTransferencia }> => {
    const { data } = await transferenciasDirectasApi.post<{ estado: EstadoTransferencia }>(
      `solicitudes-transferencia/${id}/enviar-aprobacion`
    )
    return data
  },
  // POST {id}/crear-definitiva → genera la transferencia en SAP (solo Aprobado)
  crearDefinitiva: async (id: number): Promise<CrearDefinitivaResponse> => {
    const { data } = await transferenciasDirectasApi.post<CrearDefinitivaResponse>(
      `solicitudes-transferencia/${id}/crear-definitiva`,
      {} 
    )
    return data
  },
    exportar: async (filtros: FiltrosExportar): Promise<{ blob: Blob; filename: string }> => {
    const params: Record<string, string> = {}
    if (filtros.estado) params.estado = filtros.estado
    if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
    if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta
    if (filtros.tiendaOrigen) params.tiendaOrigen = filtros.tiendaOrigen
    if (filtros.tiendaDestino) params.tiendaDestino = filtros.tiendaDestino

    const resp = await transferenciasDirectasApi.get('solicitudes-transferencia/exportar', {
      params,
      responseType: 'blob',
    })
    return {
      blob: resp.data as Blob,
      filename: nombreArchivoDesdeHeader(resp.headers['content-disposition'], 'transferencias.xlsx'),
    }
  },
   listarConfiguracionMarcas: async (): Promise<ConfiguracionEnvio[]> => {
    const { data } = await transferenciasDirectasApi.get<ConfiguracionEnvio[]>('configuracion-envios')
    return data
  },
  crearConfiguracionMarcas: async (body: ConfiguracionEnvioRequest): Promise<ConfiguracionEnvio> => {
    const { data } = await transferenciasDirectasApi.post<ConfiguracionEnvio>('configuracion-envios', body)
    return data
  },
  actualizarConfiguracionMarcas: async (id: number, body: ConfiguracionEnvioRequest): Promise<ConfiguracionEnvio> => {
    const { data } = await transferenciasDirectasApi.put<ConfiguracionEnvio>(`configuracion-envios/${id}`, body)
    return data
  },
   // GET {id}/errores-sap 
  obtenerErroresSap: async (id: number): Promise<ErrorSap[]> => {
    const { data } = await transferenciasDirectasApi.get<ErrorSap[]>(`solicitudes-transferencia/${id}/errores-sap`)
    return data
  },

}
export default transferenciasService
