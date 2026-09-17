import { recepcionProveedoresApi } from './config/axiosConfig'
import type { EntradaMercaderiaResponse, OrdenCompraPendienteResponse, OrdenCompraResponse } from '../types'

export const ordenesCompraApi = {
  async buscarPorDocNum(docNum: number): Promise<OrdenCompraResponse> {
    const { data } = await recepcionProveedoresApi.get<OrdenCompraResponse>(`/ordenes-compra/${docNum}`)
    return data
  },

  async obtenerPendientes(params: { desde?: string; hasta?: string }): Promise<OrdenCompraPendienteResponse[]> {
    const { data } = await recepcionProveedoresApi.get<OrdenCompraPendienteResponse[]>('/ordenes-compra/pendientes', { params })
    return data
  },

  async actualizarDesdeSap(docNum: number): Promise<OrdenCompraResponse> {
    const { data } = await recepcionProveedoresApi.post<OrdenCompraResponse>(`/ordenes-compra/${docNum}/actualizar`)
    return data
  },

  async obtenerEntradasRelacionadas(docNum: number): Promise<EntradaMercaderiaResponse[]> {
    const { data } = await recepcionProveedoresApi.get<EntradaMercaderiaResponse[]>(`/ordenes-compra/${docNum}/entradas-mercaderia`)
    return data
  },
}
