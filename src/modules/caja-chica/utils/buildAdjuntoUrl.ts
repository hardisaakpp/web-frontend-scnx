/** Resuelve URL de adjunto Caja Chica (uploads actuales, media legacy o API). */
export function buildAdjuntoUrl(ruta: string, fileBaseUrl: string): string {
  if (!ruta) return '#'
  if (ruta.startsWith('http')) return ruta
  if (ruta.startsWith('/media/')) return ruta
  if (ruta.startsWith('media/')) return `/${ruta}`
  if (ruta.startsWith('/uploads')) return ruta
  return `${fileBaseUrl}${ruta}`
}

export function cajaChicaFileBaseUrl(): string {
  const apiBaseUrl = (import.meta.env.VITE_CAJA_CHICA_API_URL || '/caja-chica-api').replace(/\/+$/, '')
  return apiBaseUrl.endsWith('/api') ? apiBaseUrl.slice(0, -4) : apiBaseUrl
}

export function createBuildAdjuntoUrl(): (ruta: string) => string {
  const fileBaseUrl = cajaChicaFileBaseUrl()
  return (ruta: string) => buildAdjuntoUrl(ruta, fileBaseUrl)
}
