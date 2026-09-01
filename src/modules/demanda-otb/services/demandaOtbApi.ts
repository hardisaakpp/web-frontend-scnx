import { demandaOtbHttp } from '@/lib/http'
import type { AgregadoResponse, CatalogoFiltros, CatalogoResponse, DesgloseResponse, NivelesTree, OtbExportRequest, OtbFiltros, OtbResponse, OtbSkusResponse, SkuDetail } from '../types'

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T | null
}

function buildCatalogoQuery(filtros?: CatalogoFiltros): string {
  const qs = new URLSearchParams()
  if (filtros?.codigo) qs.append('codigo', filtros.codigo)
  if (filtros?.nombre) qs.append('nombre', filtros.nombre)
  if (filtros?.busqueda) qs.append('busqueda', filtros.busqueda)
  if (filtros?.nivel1) qs.append('nivel1', filtros.nivel1)
  if (filtros?.nivel2) qs.append('nivel2', filtros.nivel2)
  if (filtros?.nivel3) qs.append('nivel3', filtros.nivel3)
  if (filtros?.genero) qs.append('genero', filtros.genero)
  if (filtros?.marcaComercial) qs.append('marcaComercial', filtros.marcaComercial)
  if (filtros?.coleccion) qs.append('coleccion', filtros.coleccion)
  if (filtros?.confianza) qs.append('confianza', filtros.confianza)
  if (filtros?.limite) qs.append('limite', String(filtros.limite))
  const query = qs.toString()
  return query ? `?${query}` : ''
}

export async function getCatalogo(negocio: string, filtros?: CatalogoFiltros): Promise<CatalogoResponse> {
  const { data } = await demandaOtbHttp.get<ApiEnvelope<CatalogoResponse>>(
    `/catalogo/${encodeURIComponent(negocio)}${buildCatalogoQuery(filtros)}`
  )
  if (!data.data) throw new Error(data.message || `No se pudo cargar el catálogo de '${negocio}'.`)
  return data.data
}

export async function getSkuDetail(negocio: string, sku: string): Promise<SkuDetail> {
  const { data } = await demandaOtbHttp.get<ApiEnvelope<SkuDetail>>(
    `/catalogo/${encodeURIComponent(negocio)}/sku/${encodeURIComponent(sku)}`
  )
  if (!data.data) throw new Error(data.message || `No se encontró el SKU '${sku}' en '${negocio}'.`)
  return data.data
}

export async function getNegocios(): Promise<string[]> {
  const { data } = await demandaOtbHttp.get<ApiEnvelope<{ negocios: string[] }>>('/negocios')
  return data.data?.negocios ?? []
}

export async function getNiveles(negocio: string): Promise<NivelesTree> {
  const { data } = await demandaOtbHttp.get<ApiEnvelope<NivelesTree>>(
    `/niveles/${encodeURIComponent(negocio)}`
  )
  if (!data.data) throw new Error(data.message || `No se pudo cargar el árbol de niveles de '${negocio}'.`)
  return data.data
}

export async function getAgregado(negocio: string, campo: string, valor: string): Promise<AgregadoResponse> {
  const qs = new URLSearchParams({ campo, valor })
  const { data } = await demandaOtbHttp.get<ApiEnvelope<AgregadoResponse>>(
    `/niveles/${encodeURIComponent(negocio)}/agregado?${qs.toString()}`
  )
  if (!data.data) throw new Error(data.message || `No se encontró demanda agregada para ${campo}='${valor}'.`)
  return data.data
}

export async function getDesgloseGenero(negocio: string, campo: string, valor: string): Promise<DesgloseResponse> {
  const qs = new URLSearchParams({ campo, valor })
  const { data } = await demandaOtbHttp.get<ApiEnvelope<DesgloseResponse>>(
    `/niveles/${encodeURIComponent(negocio)}/genero?${qs.toString()}`
  )
  if (!data.data) throw new Error(data.message || `No se encontró desglose por género para ${campo}='${valor}'.`)
  return data.data
}

export async function getDesgloseMarcaComercial(negocio: string, campo: string, valor: string): Promise<DesgloseResponse> {
  const qs = new URLSearchParams({ campo, valor })
  const { data } = await demandaOtbHttp.get<ApiEnvelope<DesgloseResponse>>(
    `/niveles/${encodeURIComponent(negocio)}/marca-comercial?${qs.toString()}`
  )
  if (!data.data) throw new Error(data.message || `No se encontró desglose por marca comercial para ${campo}='${valor}'.`)
  return data.data
}

function buildOtbQuery(filtros?: OtbFiltros): string {
  const qs = new URLSearchParams()
  if (filtros?.fecha) qs.append('fecha', filtros.fecha)
  if (filtros?.coleccion) qs.append('coleccion', filtros.coleccion)
  if (filtros?.marcaProveedor) qs.append('marcaProveedor', filtros.marcaProveedor)
  if (filtros?.origen) qs.append('origen', filtros.origen)
  if (filtros?.descontinuado) qs.append('descontinuado', filtros.descontinuado)
  if (filtros?.repocision) qs.append('repocision', filtros.repocision)
  if (filtros?.inactivo) qs.append('inactivo', filtros.inactivo)
  if (filtros?.sku) qs.append('sku', filtros.sku)
  const query = qs.toString()
  return query ? `?${query}` : ''
}

export async function getOtb(negocio: string, filtros?: OtbFiltros): Promise<OtbResponse> {
  const { data } = await demandaOtbHttp.get<ApiEnvelope<OtbResponse>>(
    `/otb/${encodeURIComponent(negocio)}${buildOtbQuery(filtros)}`
  )
  if (!data.data) throw new Error(data.message || `El negocio '${negocio}' no tiene datos de OTB.`)
  return data.data
}

export async function getOtbSkus(
  negocio: string, nivel1: string, nivel2: string, nivel3: string, fecha: string
): Promise<OtbSkusResponse> {
  const qs = new URLSearchParams({ nivel1, nivel2, nivel3, fecha })
  const { data } = await demandaOtbHttp.get<ApiEnvelope<OtbSkusResponse>>(
    `/otb/${encodeURIComponent(negocio)}/skus?${qs.toString()}`
  )
  if (!data.data) throw new Error(data.message || `No se encontró ese nodo en '${negocio}'.`)
  return data.data
}

/**
 * Excel generado server-side (agrupación nativa por Nivel1/2/3/Género + drill-down de SKUs
 * de TODOS los nodos filtrados, no solo los expandidos en pantalla) — por eso es POST con
 * body en vez de reusar los filtros de /otb como query params.
 */
export async function exportOtb(negocio: string, filtros: OtbExportRequest): Promise<Blob> {
  const response = await demandaOtbHttp.post(
    `/otb/${encodeURIComponent(negocio)}/export`,
    filtros,
    { responseType: 'blob' }
  )
  return response.data as Blob
}
