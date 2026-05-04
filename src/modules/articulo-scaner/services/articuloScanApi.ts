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
 * - Sin `VITE_ARTICULO_SCAN_API_URL`: en **desarrollo** `/scan-api` (proxy Vite → `VITE_ARTICULO_SCAN_PROXY_TARGET`);
 *   en **build** `/api` (mismo origen HTTPS que el Core: `GET /api/v1/warehouses` vía `location /api/` en Nginx).
 * - Si el scan va por otro prefijo en prod: `VITE_ARTICULO_SCAN_API_URL` (p. ej. `https://…/scan-api` o origen relativo `/scan-api`).
 * No usar `http://<host>:8080` por defecto: con HTTPS el navegador bloquea Mixed Content.
 */
const rawScanBaseUrl =
  import.meta.env.VITE_ARTICULO_SCAN_API_URL || (import.meta.env.DEV ? '/scan-api' : '/api')
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

function scanConfigError(message: string): Error {
  return new Error(`[articulo-scan] ${message}`)
}

function warehousesFromArrayPayload(payload: unknown[]): WarehouseDto[] {
  if (payload.length === 0) return []
  const first = payload[0]
  if (first && typeof first === 'object' && 'code' in first && typeof (first as WarehouseDto).code === 'string') {
    return payload as WarehouseDto[]
  }
  return payload
    .map((item) => (typeof item === 'object' && item !== null ? normalizeWarehouse(item as Record<string, unknown>) : null))
    .filter((w): w is WarehouseDto => w !== null)
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
    const headers = response.headers as Record<string, string | undefined>
    const contentType = headers['content-type'] ?? headers['Content-Type'] ?? ''
    if (typeof contentType === 'string' && contentType.includes('text/html')) {
      throw scanConfigError(
        'El servidor devolvió HTML en lugar de JSON. Revisa que Nginx enrute el API de scan (p. ej. /api o /scan-api) antes del fallback del SPA.'
      )
    }

    const payload: unknown = response.data
    if (typeof payload === 'string') {
      if (payload.trimStart().startsWith('<')) {
        throw scanConfigError(
          'La respuesta parece ser una página HTML. Revisa la URL base del scanner y el proxy inverso.'
        )
      }
    }

    if (Array.isArray(payload)) {
      return warehousesFromArrayPayload(payload as unknown[])
    }
    if (payload && typeof payload === 'object') {
      const body = payload as WarehousesApiResponse
      if (Array.isArray(body.data)) return warehousesFromArrayPayload(body.data as unknown[])
      if (Array.isArray(body.warehouses)) return warehousesFromArrayPayload(body.warehouses as unknown[])
    }
    throw scanConfigError('Formato de lista de almacenes no reconocido.')
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
