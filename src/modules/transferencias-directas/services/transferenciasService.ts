import { transferenciasDirectasApi } from "@/lib/http"
import { ActualizarSolicitudRequest, AprobarSolicitudRequest, ConfiguracionEnvio, ConfiguracionEnvioRequest, ContadorPendientesResponse, CrearDefinitivaRequest, CrearDefinitivaResponse, CrearSolicitudRequest, CrearSolicitudResponse, ErrorSap, EstadoTransferencia, FiltrosExportar, ListarSolicitudesQuery, RechazarSolicitudRequest, ResultadoPaginado, SolicitudDetalle, SolicitudResumen } from "../types"
import { nombreArchivoDesdeHeader } from "../utils/descargas"


function construirParams(valores: Record<string, string | number | boolean | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams()
  for (const [clave, valor] of Object.entries(valores)) {
    if (valor === undefined || valor === '') continue
    if (Array.isArray(valor)) valor.forEach((v) => params.append(clave, v))
    else params.set(clave, String(valor))
  }
  return params
}

const transferenciasService = {
  // GET /api/solicitudes-transferencia (paginado + filtros)
  listar: async (query: ListarSolicitudesQuery): Promise<ResultadoPaginado<SolicitudResumen>> => {
    const params = construirParams({
      pagina: query.pagina,
      tamanoPagina: query.tamanoPagina,
      estado: query.estado,
      excluirEstados: query.excluirEstados,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
      tiendaOrigen: query.tiendaOrigen,
      tiendaDestino: query.tiendaDestino,
      docNum: query.docNum,
      ordenarPor: query.ordenarPor,
      direccion: query.direccion,
    })

    const { data } = await transferenciasDirectasApi.get<ResultadoPaginado<SolicitudResumen>>(
      'solicitudes-transferencia',
      { params }
    )
    return data
  },

  //POST /api/solicitudes-transferencias
  crear: async (payload: CrearSolicitudRequest): Promise<CrearSolicitudResponse> => {
    const { data } = await transferenciasDirectasApi.post<CrearSolicitudResponse>(
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

  /** Reintento manual de envío a SAP (solo si la fila trae puedeReenviarSap). */
  reenviarSap: async (id: number): Promise<{ estado: EstadoTransferencia }> => {
    const { data } = await transferenciasDirectasApi.post<{ estado: EstadoTransferencia }>(
      `solicitudes-transferencia/${id}/reenviar-sap`
    )
    return data
  },
  // POST {id}/crear-definitiva → genera la transferencia en SAP (solo Aprobado)
  crearDefinitiva: async (id: number, guiaEnvio?: string | null): Promise<CrearDefinitivaResponse> => {
    const body: CrearDefinitivaRequest = {}
    if (guiaEnvio) body.guiaEnvio = guiaEnvio
    const { data } = await transferenciasDirectasApi.post<CrearDefinitivaResponse>(
      `solicitudes-transferencia/${id}/crear-definitiva`,
      body
    )
    return data
  },
  exportar: async (filtros: FiltrosExportar): Promise<{ blob: Blob; filename: string }> => {
    const params = construirParams({
      estado: filtros.estado,
      excluirEstados: filtros.excluirEstados,
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
      tiendaOrigen: filtros.tiendaOrigen,
      tiendaDestino: filtros.tiendaDestino,
      docNum: filtros.docNum,
      detallado: filtros.detallado,
    })

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
  // GET pendientes-aprobacion/contador → { total }
  contadorPendientesAprobacion: async (): Promise<number> => {
    const { data } = await transferenciasDirectasApi.get<ContadorPendientesResponse>(
      'solicitudes-transferencia/pendientes-aprobacion/contador'
    )
    return data.total
  },

  // POST {id}/aprobar
  aprobar: async (id: number, body: AprobarSolicitudRequest): Promise<{ estado: string }> => {
    const { data } = await transferenciasDirectasApi.post<{ estado: string }>(
      `solicitudes-transferencia/${id}/aprobar`, body
    )
    return data
  },

  // POST {id}/rechazar
  rechazar: async (id: number, body: RechazarSolicitudRequest): Promise<{ estado: string }> => {
    const { data } = await transferenciasDirectasApi.post<{ estado: string }>(
      `solicitudes-transferencia/${id}/rechazar`, body
    )
    return data
  },
}
export default transferenciasService
