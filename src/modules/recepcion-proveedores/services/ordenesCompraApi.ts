import { recepcionProveedoresApi } from './config/axiosConfig'
import type { OrdenCompraResponse } from '../types'

export const ordenesCompraApi = {
  async buscarPorDocNum(docNum: number): Promise<OrdenCompraResponse> {
    const { data } = await recepcionProveedoresApi.get<OrdenCompraResponse>(`/ordenes-compra/${docNum}`)
    return data
  },

  async actualizarDesdeSap(docNum: number): Promise<OrdenCompraResponse> {
    const { data } = await recepcionProveedoresApi.post<OrdenCompraResponse>(`/ordenes-compra/${docNum}/actualizar`)
    return data
  },
}
