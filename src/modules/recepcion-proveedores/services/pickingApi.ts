import { recepcionProveedoresApi } from './config/axiosConfig'
import type { OrdenPickingLineaResponse, OrdenPickingLogGeneralResponse, OrdenPickingLogResponse, OrdenPickingScanResponse, OrdenPickingSesionResponse } from '../types'

export const pickingApi = {
  async obtenerSesionActiva(docNum: number): Promise<OrdenPickingSesionResponse | null> {
    try {
      const { data } = await recepcionProveedoresApi.get<OrdenPickingSesionResponse>('/picking/activa', { params: { docNum } })
      return data
    } catch (error: unknown) {
      if ((error as { response?: { status?: number } })?.response?.status === 404) return null
      throw error
    }
  },

  async iniciar(docNum: number, whsCode: string): Promise<OrdenPickingSesionResponse> {
    const { data } = await recepcionProveedoresApi.post<OrdenPickingSesionResponse>('/picking/iniciar', { docNum, whsCode })
    return data
  },

  async obtenerSesion(sesionId: number): Promise<OrdenPickingSesionResponse> {
    const { data } = await recepcionProveedoresApi.get<OrdenPickingSesionResponse>(`/picking/${sesionId}`)
    return data
  },

  async obtenerScans(sesionId: number): Promise<OrdenPickingScanResponse[]> {
    const { data } = await recepcionProveedoresApi.get<OrdenPickingScanResponse[]>(`/picking/${sesionId}/scans`)
    return data
  },

  async obtenerLogs(sesionId: number): Promise<OrdenPickingLogResponse[]> {
    const { data } = await recepcionProveedoresApi.get<OrdenPickingLogResponse[]>(`/picking/${sesionId}/logs`)
    return data
  },

  async escanear(sesionId: number, codigo: string, cantidad: number): Promise<OrdenPickingLineaResponse> {
    const { data } = await recepcionProveedoresApi.post<OrdenPickingLineaResponse>(`/picking/${sesionId}/escanear`, { codigo, cantidad })
    return data
  },

  async eliminarScan(sesionId: number, scanId: number): Promise<void> {
    await recepcionProveedoresApi.delete(`/picking/${sesionId}/scans/${scanId}`)
  },

  async cerrar(sesionId: number): Promise<OrdenPickingSesionResponse> {
    const { data } = await recepcionProveedoresApi.post<OrdenPickingSesionResponse>(`/picking/${sesionId}/cerrar`)
    return data
  },

  async obtenerLogsGeneral(params: { desde?: string; hasta?: string; docNum?: number }): Promise<OrdenPickingLogGeneralResponse[]> {
    const { data } = await recepcionProveedoresApi.get<OrdenPickingLogGeneralResponse[]>('/picking/logs', { params })
    return data
  },

  async integrarSap(sesionId: number): Promise<OrdenPickingSesionResponse> {
    const { data } = await recepcionProveedoresApi.post<OrdenPickingSesionResponse>(`/picking/${sesionId}/integrar-sap`)
    return data
  },

  async verificarEstadoSap(sesionId: number): Promise<OrdenPickingSesionResponse> {
    const { data } = await recepcionProveedoresApi.post<OrdenPickingSesionResponse>(`/picking/${sesionId}/verificar-estado-sap`)
    return data
  },

  async eliminarSesion(sesionId: number): Promise<void> {
    await recepcionProveedoresApi.delete(`/picking/${sesionId}`)
  },
}
