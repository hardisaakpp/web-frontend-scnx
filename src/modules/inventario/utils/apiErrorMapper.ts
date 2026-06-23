import { type AxiosLikeError, parseBackendMessage } from '@/utils/apiErrorMapper'

type InventarioApiBody = {
  success?: boolean
  message?: string
  error_code?: string
  detail?: string
  error?: string
}

export function mapInventarioApiError(error: unknown, fallback: string): string {
  const err = error as AxiosLikeError
  const body = err.response?.data as InventarioApiBody | undefined

  if (body && typeof body === 'object') {
    if (body.success === false) {
      const msg = body.message?.trim()
      if (msg) return msg
      if (body.error_code) return `${body.error_code}: operación no permitida.`
    }
    const backendMsg = parseBackendMessage(body as Record<string, unknown>)
    if (backendMsg) return backendMsg
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
