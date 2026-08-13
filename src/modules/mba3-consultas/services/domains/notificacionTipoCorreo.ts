import { mba3Api } from '../config/axiosConfig'

export interface TipoCorreo {
  id: number
  tipo_notificacion: string
  tipo_correo: string
  descripcion: string | null
  orden_flujo: number | null
  activo: boolean
  creado_fecha: string
  creado_por: string | null
  modificado_fecha: string | null
  modificado_por: string | null
}

export interface ListadoTiposCorreoResponse {
  tipos_notificacion: string[]
  tipos_correo: TipoCorreo[]
}

export interface VistaPreviaCorreo {
  subject: string
  html: string
}

/**
 * Administración del catálogo de correos (asuntos) por tipo_notificacion (solo Admin).
 * Backend: src/endpoints/notificacion_tipo_correo_endpoints.py
 */
export const notificacionTipoCorreoService = {
  async getTiposCorreo(): Promise<ListadoTiposCorreoResponse> {
    try {
      const response = await mba3Api.get<ListadoTiposCorreoResponse>('/api/notificaciones/tipos-correo')
      return response.data
    } catch (error: any) {
      console.error('❌ [getTiposCorreo] Error al obtener el catálogo de correos:', error)
      throw error
    }
  },

  async crearTipoCorreo(tipoNotificacion: string, tipoCorreo: string, descripcion?: string): Promise<TipoCorreo> {
    try {
      const response = await mba3Api.post<TipoCorreo>('/api/notificaciones/tipos-correo', {
        tipo_notificacion: tipoNotificacion,
        tipo_correo: tipoCorreo,
        descripcion: descripcion || null,
      })
      return response.data
    } catch (error: any) {
      console.error('❌ [crearTipoCorreo] Error al crear fila del catálogo:', error)
      throw error
    }
  },

  async actualizarActivo(id: number, activo: boolean): Promise<void> {
    try {
      await mba3Api.patch(`/api/notificaciones/tipos-correo/${id}`, { activo })
    } catch (error: any) {
      console.error('❌ [actualizarActivo] Error al actualizar fila del catálogo:', error)
      throw error
    }
  },

  async eliminarTipoCorreo(id: number): Promise<void> {
    try {
      await mba3Api.delete(`/api/notificaciones/tipos-correo/${id}`)
    } catch (error: any) {
      console.error('❌ [eliminarTipoCorreo] Error al eliminar fila del catálogo:', error)
      throw error
    }
  },

  /** Devuelve null si no hay vista previa disponible (404 = sin código real asociado). */
  async getPreview(id: number): Promise<VistaPreviaCorreo | null> {
    try {
      const response = await mba3Api.get<VistaPreviaCorreo>(`/api/notificaciones/tipos-correo/${id}/preview`)
      return response.data
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null
      }
      console.error('❌ [getPreview] Error al obtener la vista previa:', error)
      throw error
    }
  },
}
