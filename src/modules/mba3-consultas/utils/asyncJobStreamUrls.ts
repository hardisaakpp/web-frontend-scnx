import { MBA3_API_BASE_URL } from '@/config/apiBaseUrls'

/** URL absoluta al origen del front (proxy dev / gateway prod reescribe a MBA3). */
export function buildMba3ApiUrl(path: string): string {
  const base = MBA3_API_BASE_URL.replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

export function plantillaStreamUrl(processId: string): string {
  return buildMba3ApiUrl(`/api/plantillas/stream/${encodeURIComponent(processId)}`)
}

export function procesoSapStreamUrl(processId: string, streamUrlFromApi?: string | null): string {
  if (streamUrlFromApi) {
    if (streamUrlFromApi.startsWith('http://') || streamUrlFromApi.startsWith('https://')) {
      return streamUrlFromApi
    }
    return buildMba3ApiUrl(streamUrlFromApi.startsWith('/') ? streamUrlFromApi : `/${streamUrlFromApi}`)
  }
  return buildMba3ApiUrl(`/api/pedidos/proceso-sap/stream/${encodeURIComponent(processId)}`)
}

export function cruceProductosStreamUrl(processId: string): string {
  return buildMba3ApiUrl(`/cruce-productos/stream/${encodeURIComponent(processId)}`)
}
