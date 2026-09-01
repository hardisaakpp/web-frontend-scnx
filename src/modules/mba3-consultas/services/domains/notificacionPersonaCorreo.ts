import { mba3Api } from '../config/axiosConfig'

export interface PersonaCorreoRow {
  id: number
  nombre: string
  email: string
  creado_fecha: string
  creado_por: string | null
  tipo_correo_id: number
  tipo_correo: string
  tipo_notificacion: string
  descripcion: string | null
}

/**
 * Organización persona-céntrica: qué correos del catálogo debería recibir
 * cada persona (nombre + email). Solo Admin.
 * Es la fuente real de destinatarios del envío de correos.
 * Backend: src/endpoints/notificacion_persona_correo_endpoints.py
 */
export const notificacionPersonaCorreoService = {
  async getPersonasCorreo(): Promise<PersonaCorreoRow[]> {
    try {
      const response = await mba3Api.get<{ personas_correo: PersonaCorreoRow[] }>('/api/notificaciones/personas-correo')
      return response.data.personas_correo
    } catch (error: any) {
      console.error('❌ [getPersonasCorreo] Error al obtener personas y correos:', error)
      throw error
    }
  },

  async crearLink(nombre: string, email: string, tipoCorreoId: number): Promise<PersonaCorreoRow> {
    try {
      const response = await mba3Api.post<PersonaCorreoRow>('/api/notificaciones/personas-correo', {
        nombre,
        email,
        tipo_correo_id: tipoCorreoId,
      })
      return response.data
    } catch (error: any) {
      console.error('❌ [crearLink] Error al vincular persona con correo:', error)
      throw error
    }
  },

  async eliminarLink(id: number): Promise<void> {
    try {
      await mba3Api.delete(`/api/notificaciones/personas-correo/${id}`)
    } catch (error: any) {
      console.error('❌ [eliminarLink] Error al desvincular correo:', error)
      throw error
    }
  },

  async eliminarPersona(email: string): Promise<void> {
    try {
      await mba3Api.delete(`/api/notificaciones/personas-correo/persona/${encodeURIComponent(email)}`)
    } catch (error: any) {
      console.error('❌ [eliminarPersona] Error al eliminar persona:', error)
      throw error
    }
  },
}
