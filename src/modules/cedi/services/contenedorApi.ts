import { cediApi } from '@/lib/http'
import type { ContenedorDto, EmpacarItemRequest, TrazabilidadSolicitudDto } from '../types'

const contenedorApi = {
  crear: async (grupoId: string, solicitudId: string) => {
    const response = await cediApi.post<ContenedorDto>(`grupos/${grupoId}/solicitudes/${solicitudId}/contenedores`)
    return response.data
  },

  getContenedores: async (grupoId: string, solicitudId: string) => {
    const response = await cediApi.get<ContenedorDto[]>(`grupos/${grupoId}/solicitudes/${solicitudId}/contenedores`)
    return response.data
  },

  /** "Inventario real-time" + trazabilidad completa: picking vs. empaque por ítem, con todos los contenedores. */
  getTrazabilidad: async (grupoId: string, solicitudId: string) => {
    const response = await cediApi.get<TrazabilidadSolicitudDto>(`grupos/${grupoId}/solicitudes/${solicitudId}/trazabilidad`)
    return response.data
  },

  empacarItem: async (contenedorId: string, request: EmpacarItemRequest) => {
    const response = await cediApi.post<ContenedorDto>(`contenedores/${contenedorId}/items`, request)
    return response.data
  },

  cerrar: async (contenedorId: string) => {
    const response = await cediApi.post<ContenedorDto>(`contenedores/${contenedorId}/close`)
    return response.data
  },
}

export default contenedorApi
