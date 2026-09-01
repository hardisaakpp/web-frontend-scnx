import { cediApi } from '@/lib/http'
import type { ConsultaStockDto, ItemBusquedaDto } from '../types'

const stockApi = {
  /** Búsqueda por ItemCode o código de barras (contains, no exacto). */
  buscarItems: async (query: string, top = 20) => {
    const response = await cediApi.get<ItemBusquedaDto[]>('stock/items', { params: { query, top } })
    return response.data
  },

  /** Stock en todos los almacenes (o uno solo si se pasa "almacen"). */
  getStock: async (itemCode: string, almacen?: string) => {
    const response = await cediApi.get<ConsultaStockDto>(`stock/items/${itemCode}`, { params: { almacen } })
    return response.data
  },
}

export default stockApi
