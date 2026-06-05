import api from '@/services/api'
import type { 
  PagedResult, 
  CatalogoItem, 
  CatalogoItemDetail, 
  CatalogoFilters, 
  ListasFiltros,
  Almacen,
  CarritoItem,
  CarritoResponse,
  HistorialCabecera,
  HistorialDetalleItem,
  RepLog,
  SaveItemRequest,
  UpdateCommentRequest,
  HistorialSolicitudSap
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
    const url = 'reposicion-api/Catalogo'
    console.log("🚀 [ReposicionAPI] getCatalogo:", url, filters)
    const response = await api.get<PagedResult<CatalogoItem>>(url, { params })
    return response.data
  },

  getAlmacenes: async () => {
    const url = 'reposicion-api/Catalogo/almacenes'
    console.log("🚀 [ReposicionAPI] getAlmacenes:", url)
    const response = await api.get<Almacen[]>(url)
    return response.data
  },

  getFiltros: async (whsCode: string) => {
    const response = await api.get<ListasFiltros>('reposicion-api/Catalogo/filtros', { params: { whsCode } })
    return response.data
  },

  getItemDetalle: async (itemCode: string, whsCode: string) => {
    const response = await api.get<CatalogoItemDetail>(`reposicion-api/Catalogo/${itemCode}`, { params: { whsCode } })
    return response.data
  },

  // Solicitud (Carrito)
  saveItem: async (request: SaveItemRequest) => {
    const response = await api.post('reposicion-api/Solicitud/item', request)
    return response.data
  },

  saveComment: async (request: UpdateCommentRequest) => {
    const response = await api.post('reposicion-api/Solicitud/comment', request)
    return response.data
  },

  getCarrito: async (whsCode: string) => {
    const response = await api.get<CarritoResponse>('reposicion-api/Solicitud/carrito', { params: { whsCode } })
    return response.data
  },

  getStatus: async () => {
    const response = await api.get<{ isOpen: boolean }>('reposicion-api/Solicitud/status')
    return response.data
  },

  // Historial
  getHistorial: async (whsCode: string, desde: string, hasta: string, idUser?: number) => {
    const params: any = { whsCode, desde, hasta }
    if (idUser) params.idUser = idUser
    const response = await api.get<HistorialCabecera[]>('reposicion-api/Historial', { params })
    return response.data
  },

  getLog: async (toWhs: string, fecha: string) => {
    const response = await api.get<RepLog>('reposicion-api/Historial/log', { params: { toWhs, fecha } })
    return response.data
  },

  getDetalles: async (id: number) => {
    const response = await api.get<HistorialDetalleItem[]>(`reposicion-api/Historial/${id}/detalles`)
    return response.data
  },

  getPdfUrl: (id: number) => {
    return `/api/reposicion-api/Historial/${id}/pdf`
  },

  getCarritoPdfUrl: (whsCode: string) => {
    return `/api/reposicion-api/Solicitud/pdf?whsCode=${whsCode}`
  },

  getSolicitudesSap: async (whsCode: string, fecha: string) => {
    const response = await api.get<HistorialSolicitudSap[]>('reposicion-api/Historial/solicitudes', { params: { whsCode, fecha } })
    return response.data
  }
}

export default reposicionApi
