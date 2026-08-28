import { demandaOtbHttp } from '@/lib/http'
import type { CatalogoFiltros, CatalogoResponse, SkuDetail } from '../types'

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
