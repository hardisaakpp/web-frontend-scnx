import { mba3Api } from '../config/axiosConfig'

export interface NotificacionDestinatario {
  id: number
  tipo_notificacion: string
  email: string
  activo: boolean
  /** null en filas base (aplican a todos los eventos del tipo); con valor, es una exclusión puntual (ej. "REDISTRIBUCION_CONFIRMADA"). */
  codigo_evento: string | null
  creado_fecha: string
  creado_por: string | null
  modificado_fecha: string | null
  modificado_por: string | null
}

export interface ListadoDestinatariosResponse {
  tipos_notificacion: string[]
  destinatarios: NotificacionDestinatario[]
}

/**
 * Administración de destinatarios de notificaciones por email (solo Admin).
 * Backend: src/endpoints/notificacion_destinatarios_endpoints.py
 */
export const notificacionDestinatariosService = {
  async getDestinatarios(): Promise<ListadoDestinatariosResponse> {
    try {
      const response = await mba3Api.get<ListadoDestinatariosResponse>('/api/notificaciones/destinatarios')
      return response.data
    } catch (error: any) {
      console.error('❌ [getDestinatarios] Error al obtener destinatarios:', error)
      throw error
    }
  },

  async crearDestinatario(tipoNotificacion: string, email: string): Promise<NotificacionDestinatario> {
    try {
      const response = await mba3Api.post<NotificacionDestinatario>('/api/notificaciones/destinatarios', {
        tipo_notificacion: tipoNotificacion,
        email,
      })
      return response.data
    } catch (error: any) {
      console.error('❌ [crearDestinatario] Error al crear destinatario:', error)
      throw error
    }
  },

  async actualizarActivo(id: number, activo: boolean): Promise<void> {
    try {
      await mba3Api.patch(`/api/notificaciones/destinatarios/${id}`, { activo })
    } catch (error: any) {
      console.error('❌ [actualizarActivo] Error al actualizar destinatario:', error)
      throw error
    }
  },

  async eliminarDestinatario(id: number): Promise<void> {
    try {
      await mba3Api.delete(`/api/notificaciones/destinatarios/${id}`)
    } catch (error: any) {
      console.error('❌ [eliminarDestinatario] Error al eliminar destinatario:', error)
      throw error
    }
  },
}
