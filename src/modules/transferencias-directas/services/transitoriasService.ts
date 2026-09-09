import { transferenciasDirectasApi } from "@/lib/http"
import { nombreArchivoDesdeHeader } from "../utils/descargas"
import { FiltrosExportarTransitorias, ListarTransitoriasQuery, RegularizarResponse, ResultadoPaginado, SincronizarTransitoriaResponse, TransitoriaDetalle, TransitoriaResumen, TransitoriaReverso } from "../types"

function construirParams(
  valores: Record<string, string | number | boolean | string[] | undefined>
): URLSearchParams {
  const params = new URLSearchParams()
  for (const [clave, valor] of Object.entries(valores)) {
    if (valor === undefined || valor === '') continue
    if (Array.isArray(valor)) valor.forEach((v) => params.append(clave, v))
    else params.set(clave, String(valor))
  }
  return params
}

const transitoriasService = {
  // GET /api/transitorias — filtra por tienda DESTINO según el token
  listar: async (
    query: ListarTransitoriasQuery
  ): Promise<ResultadoPaginado<TransitoriaResumen>> => {
    const params = construirParams({
      pagina: query.pagina,
      tamanoPagina: query.tamanoPagina,
      estadosRecepcion: query.estadosRecepcion,
      tiendaOrigen: query.tiendaOrigen,
      tiendaDestino: query.tiendaDestino,
      fechaDesde: query.fechaDesde,
      fechaHasta: query.fechaHasta,
      docNum: query.docNum,
      ordenarPor: query.ordenarPor,
      direccion: query.direccion,
    })

    const { data } = await transferenciasDirectasApi.get<
      ResultadoPaginado<TransitoriaResumen>
    >('transitorias', { params })
    return data
  },

  // GET /api/transitorias/{id}
  obtenerDetalle: async (id: number): Promise<TransitoriaDetalle> => {
    const { data } = await transferenciasDirectasApi.get<TransitoriaDetalle>(
      `transitorias/${id}`
    )
    return data
  },

  /**
   * POST /api/transitorias/{id}/sincronizar
   * Fuerza la consulta a SAP sin esperar la corrida nocturna.
   * 503 = SAP no respondió a tiempo; se muestra el mensaje del backend.
   */
  sincronizar: async (id: number): Promise<SincronizarTransitoriaResponse> => {
    const { data } = await transferenciasDirectasApi.post<SincronizarTransitoriaResponse>(
      `transitorias/${id}/sincronizar`
    )
    return data
  },

  // GET /api/transitorias/exportar
  exportar: async (filtros: FiltrosExportarTransitorias): Promise<{ blob: Blob; filename: string }> => {
    const params = construirParams({
      estadosRecepcion: filtros.estadosRecepcion,
      tiendaOrigen: filtros.tiendaOrigen,
      tiendaDestino: filtros.tiendaDestino,
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
      docNum: filtros.docNum,
      detallado: filtros.detallado,
    })

    const resp = await transferenciasDirectasApi.get('transitorias/exportar', {
      params,
      responseType: 'blob',
    })
    return {
      blob: resp.data as Blob,
      filename: nombreArchivoDesdeHeader(resp.headers['content-disposition'], 'historialtransitorias.xlsx'),
    }
  },
  regularizar: async (id: number): Promise<RegularizarResponse> => {
    const { data } = await transferenciasDirectasApi.post<RegularizarResponse>(
      `transitorias/${id}/regularizar`
    )
    return data
  },
  /**
   * GET /api/transitorias/{id}/reverso — id de la TRANSITORIA original, no del reverso.
   * 404 si esa transitoria aún no tiene reverso creado.
   */
  obtenerReverso: async (id: number): Promise<TransitoriaReverso> => {
    const { data } = await transferenciasDirectasApi.get<TransitoriaReverso>(
      `transitorias/${id}/reverso`
    )
    return data
  },

}

export default transitoriasService
