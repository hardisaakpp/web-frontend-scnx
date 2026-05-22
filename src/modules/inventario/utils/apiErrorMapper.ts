import type { ApiResponse } from '../types'

type AxiosLikeError = {
  response?: {
    status?: number
    data?: ApiResponse<unknown> & { detail?: string; error?: string }
  }
  code?: string
  message?: string
}

export function mapInventarioApiError(error: unknown, fallback: string): string {
  const err = error as AxiosLikeError
  const body = err.response?.data

  if (body && typeof body === 'object') {
    if (body.success === false) {
      const msg = body.message?.trim()
      if (msg) return msg
      if (body.error_code) return `${body.error_code}: operación no permitida.`
    }
    if (typeof body.message === 'string' && body.message.trim()) return body.message.trim()
    if (typeof body.detail === 'string' && body.detail.trim()) return body.detail.trim()
    if (typeof body.error === 'string' && body.error.trim()) return body.error.trim()
  }

  if (err.code === 'ECONNABORTED') {
    return 'El servidor tardó demasiado. Si la ejecución sigue en curso, refresca la lista en unos minutos.'
  }

  if (!err.response) {
    return 'No hay conexión con el servicio de inventario. Verifica tu red o el proxy de desarrollo.'
  }

  if (err.response.status === 403) {
    return body?.message?.trim() || 'No tiene permiso para esta operación (requiere edición de inventario y, para ejecutar, realiza conteo).'
  }

  return fallback
}
