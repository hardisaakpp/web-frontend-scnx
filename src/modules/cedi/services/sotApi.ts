import { cediApi } from '@/lib/http'
import type {
  PagedResult,
  SolicitudTransferenciaDetailDto,
  SolicitudTransferenciaDto,
  SolicitudTransferenciaFilterDto,
  SyncSotResult,
} from '../types'

const sotApi = {
  getSolicitudes: async (filters: SolicitudTransferenciaFilterDto, page = 1, pageSize = 20) => {
    const response = await cediApi.get<PagedResult<SolicitudTransferenciaDto>>('sot', { params: { ...filters, page, pageSize } })
    return response.data
  },

  getSolicitud: async (numDoc: string) => {
    const response = await cediApi.get<SolicitudTransferenciaDetailDto>(`sot/${numDoc}`)
    return response.data
  },

  /** POST /api/sot/sync — trae páginas recientes desde el middleware (equivalente a sp_sot_merge). */
  syncSolicitudes: async (maxPages = 5) => {
    const response = await cediApi.post<SyncSotResult>('sot/sync', null, { params: { maxPages } })
    return response.data
  },
}

export default sotApi
