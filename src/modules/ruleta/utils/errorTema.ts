import type { AxiosError } from 'axios'

export function mensajeErrorTema(error: unknown, fallback: string, maxMb?: number): string {
  const respuesta = (error as AxiosError<{ error?: string; detail?: string }>)?.response
  if (respuesta?.status === 413 && maxMb) return `La imagen supera el tamaño máximo permitido (${maxMb} MB).`
  if (respuesta?.data?.error) return respuesta.data.error
  if (respuesta?.data?.detail) return respuesta.data.detail
  if (!respuesta) return 'No se pudo contactar al servidor. Comprueba la conexión e intenta nuevamente.'
  return fallback
}
