import { demandaOtbHttp } from '@/lib/http'
import type { SkuDetail } from '../types'

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T | null
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
