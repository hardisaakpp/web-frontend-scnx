import axios from 'axios'
import { attachUnauthorizedRedirect } from '@/services/sessionGuard'
import { correlationFromResponseHeaders } from '../utils/apiErrorMapper'
import type {
  ArticleDetailDto,
  ScanResolveRequest,
  WarehouseDto
} from '../types'

/**
 * Base URL del microservicio de scan.
 * Por defecto `/scan-api` (mismo origen): en dev el proxy de Vite reenvía a `VITE_ARTICULO_SCAN_PROXY_TARGET`;
 * en prod HTTPS, Nginx debe exponer `location /scan-api/` al backend (ver `deploy/nginx/scnexus.conf.example`).
 * Nunca usar `http://<host>:8080` por defecto en el bundle: con página HTTPS el navegador bloquea Mixed Content.
 * Para otro host explícito: `VITE_ARTICULO_SCAN_API_URL` (idealmente `https://...`).
 */
const rawScanBaseUrl = import.meta.env.VITE_ARTICULO_SCAN_API_URL || '/scan-api'
const normalizedScanBaseUrl = rawScanBaseUrl.replace(/\/+$/, '')
const scanApiPrefix = /\/api$/i.test(normalizedScanBaseUrl) ? '/v1' : '/api/v1'

const articuloScanApi = axios.create({
  baseURL: normalizedScanBaseUrl,
  timeout: 12000,
  headers: {
    Accept: 'application/json'
  }
})

articuloScanApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    config.headers = config.headers ?? {}
    config.headers['X-Correlation-Id'] = crypto.randomUUID()
    return config
  },
  (error) => Promise.reject(error)
)

attachUnauthorizedRedirect(articuloScanApi)

type WarehousesApiResponse = {
  data?: WarehouseDto[]
  warehouses?: WarehouseDto[]
}

type ResolveApiResponse = {
  data?: {
    article?: ArticleDetailDto | null
  }
  article?: ArticleDetailDto | null
}

function normalizeWarehouse(raw: Record<string, unknown>): WarehouseDto | null {
  const code =
    (typeof raw.code === 'string' && raw.code) ||
    (typeof raw.warehouseCode === 'string' && raw.warehouseCode) ||
    (typeof raw.id === 'string' && raw.id) ||
    null
  const name =
    (typeof raw.name === 'string' && raw.name) ||
    (typeof raw.description === 'string' && raw.description) ||
    code ||
    ''
  if (!code) return null
  return { code, name: name || code }
}

export const articuloScanService = {
  /**
   * GET {prefix}/warehouses — lista de almacenes para el combo.
   */
  async getWarehouses(): Promise<WarehouseDto[]> {
    const response = await articuloScanApi.get<WarehousesApiResponse | WarehouseDto[] | Record<string, unknown>[]>(
      `${scanApiPrefix}/warehouses`
    )
    const payload = response.data
    if (Array.isArray(payload)) {
      if (payload.length === 0) return []
      const first = payload[0]
      if (first && typeof first === 'object' && 'code' in first && typeof (first as WarehouseDto).code === 'string') {
        return payload as WarehouseDto[]
      }
      return payload
        .map((item) => (typeof item === 'object' && item !== null ? normalizeWarehouse(item as Record<string, unknown>) : null))
        .filter((w): w is WarehouseDto => w !== null)
    }
    return payload.data ?? payload.warehouses ?? []
  },

  /**
   * POST {prefix}/scan/resolve — equivalente al flujo “Mostrar” + consulta AJAX legacy.
   */
  async resolveScan(payload: ScanResolveRequest): Promise<{ article: ArticleDetailDto | null; correlationId?: string }> {
    const response = await articuloScanApi.post<ResolveApiResponse>(
      `${scanApiPrefix}/scan/resolve`,
      payload
    )
    const apiData = response.data
    const article = apiData.data?.article ?? apiData.article ?? null
    const correlationId = correlationFromResponseHeaders(response.headers)
    return { article, correlationId }
  }
}
