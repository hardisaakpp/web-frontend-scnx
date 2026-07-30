import { reposicionesApi } from '@/lib/http'

import type { 
  PagedResult, 
  CatalogoItem, 
  CatalogoItemDetail, 
  CatalogoFilters, 
  ListasFiltros,
  Almacen,
  CarritoResponse,
  HistorialCabecera,
  HistorialDetalleItem,
  RepLog,
  SaveItemRequest,
  UpdateCommentRequest,
  HistorialSolicitudSap,
  StatusResponse
} from '../types'

const reposicionApi = {
  // Catalogo
  getCatalogo: async (filters: CatalogoFilters) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString())
      }
    })
    const url = 'Catalogo'
    console.log("🚀 [ReposicionAPI] getCatalogo:", url, filters)
    const response = await reposicionesApi.get<PagedResult<CatalogoItem>>(url, { params })
    return response.data
  },

  getAlmacenes: async () => {
    const url = 'Almacen'
    console.log("🚀 [ReposicionAPI] getAlmacenes:", url)
    const response = await reposicionesApi.get<Almacen[]>(url)
    return response.data
  },

  getFiltros: async (whsCode: string) => {
    const response = await reposicionesApi.get<ListasFiltros>('Catalogo/filtros', { params: { whsCode } })
    return response.data
  },

  getItemDetalle: async (itemCode: string, whsCode: string) => {
    const response = await reposicionesApi.get<CatalogoItemDetail>(`Catalogo/${itemCode}`, { params: { whsCode } })
    return response.data
  },

  // Solicitud (Carrito)
  saveItem: async (request: SaveItemRequest) => {
    const response = await reposicionesApi.post('Solicitud/item', request)
    return response.data
  },

  saveComment: async (request: UpdateCommentRequest) => {
    const response = await reposicionesApi.post('Solicitud/comment', request)
    return response.data
  },

  getCarrito: async (whsCode: string) => {
    const response = await reposicionesApi.get<CarritoResponse>('Solicitud/carrito', { params: { whsCode } })
    return response.data
  },

  getStatus: async () => {
    const response = await reposicionesApi.get<StatusResponse>('Solicitud/status')
    return response.data
  },

  // Historial
  getHistorial: async (whsCode: string | undefined, desde: string, hasta: string, idUser?: number) => {
    const params: any = { desde, hasta }
    if (whsCode) params.whsCode = whsCode
    if (idUser) params.idUser = idUser
    const response = await reposicionesApi.get<HistorialCabecera[]>('Historial', { params })
    return response.data
  },

  getLog: async (toWhs: string, fecha: string) => {
    const response = await reposicionesApi.get<RepLog>('Historial/log', { params: { toWhs, fecha } })
    return response.data
  },

  getDetalles: async (id: number) => {
    const response = await reposicionesApi.get<HistorialDetalleItem[]>(`Historial/${id}/detalles`)
    return response.data
  },

  getPdfUrl: (id: number) => {
    // Para URLs de archivos directos, usamos el baseURL inyectado o el manual
    const base = reposicionesApi.defaults.baseURL?.replace(/\/$/, '') || ''
    return `${base}/Historial/${id}/pdf`
  },

  getCarritoPdfUrl: (whsCode: string) => {
    const base = reposicionesApi.defaults.baseURL?.replace(/\/$/, '') || ''
    return `${base}/Solicitud/pdf?whsCode=${whsCode}`
  },

  getSolicitudesSap: async (whsCode: string, fecha: string) => {
    const response = await reposicionesApi.get<HistorialSolicitudSap[]>('Historial/solicitudes', { params: { whsCode, fecha } })
    return response.data
  }

}

export default reposicionApi
