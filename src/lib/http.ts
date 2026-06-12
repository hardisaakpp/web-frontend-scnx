/**
 * Fábrica centralizada de instancias HTTP (Axios).
 *
 * Cada módulo importa `createModuleApi` o una instancia pre‑creada.
 * Todas comparten:
 *  - Inyección automática de Bearer token
 *  - Redirect a login en 401 (via sessionGuard)
 *  - Headers por defecto JSON
 *  - Manejo automático de FormData (elimina Content-Type para que axios lo setee)
 *
 * Opciones extendidas disponibles:
 *  - `correlationId`: agrega X-Correlation-Id por request
 *  - `auditHeaders`: agrega X-User y X-Origin por request
 *  - `timeout`: timeout custom por instancia
 */
import axios from 'axios'
import { attachUnauthorizedRedirect } from '@/services/sessionGuard'
import { ENV } from '@/config/env'

// ─── Helpers internos ────────────────────────────────────────────────────────

function getStoredToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token')
}

function getCurrentUserName(): string {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return 'desconocido'
    const user = JSON.parse(raw) as { userName?: string }
    return user.userName || 'desconocido'
  } catch {
    return 'desconocido'
  }
}

// ─── Opciones de la fábrica ──────────────────────────────────────────────────

export interface ModuleApiOptions {
  /** Timeout en milisegundos (default: 30_000) */
  timeout?: number
  /** Agregar X-Correlation-Id por request */
  correlationId?: boolean
  /** Agregar X-User y X-Origin por request */
  auditHeaders?: boolean
  /** URLs de 401 que NO deben redirigir a login */
  ignoreUnauthorized?: string[]
}

// ─── Fábrica ─────────────────────────────────────────────────────────────────

/**
 * Crea una instancia Axios preconfigurada con auth interceptor + sessionGuard.
 *
 * @example
 * ```ts
 * // Instancia básica
 * export const pygApi = createModuleApi('/pyg-api')
 *
 * // Con opciones
 * export const maestroApi = createModuleApi('/maestro-api', {
 *   correlationId: true,
 *   auditHeaders: true,
 * })
 * ```
 */
export function createModuleApi(baseURL: string, opts: ModuleApiOptions = {}): ReturnType<typeof axios.create> {
  const instance = axios.create({
    baseURL,
    timeout: opts.timeout ?? 30_000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    withCredentials: true,
  })

  // ── Request interceptor ──────────────────────────────────────────────────
  instance.interceptors.request.use(
    (config) => {
      // 1. Bearer token
      const token = getStoredToken()
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }

      // 2. FormData: dejar que axios fije Content-Type con boundary
      if (config.data instanceof FormData && config.headers) {
        delete config.headers['Content-Type']
      }

      // 3. Correlation ID
      if (opts.correlationId && config.headers) {
        config.headers['X-Correlation-Id'] = crypto.randomUUID()
      }

      // 4. Audit headers (X-User / X-Origin)
      if (opts.auditHeaders && config.headers) {
        config.headers['X-User'] = getCurrentUserName()
        config.headers['X-Origin'] = 'WEB_APP'
      }

      // 5. Fix: Strip leading slash if baseURL is present to avoid bypassing it
      if (config.url?.startsWith('/') && config.baseURL) {
        config.url = config.url.substring(1)
      }

      return config
    },
    (error) => Promise.reject(error),
  )

  // ── 401 → redirect a login ───────────────────────────────────────────────
  attachUnauthorizedRedirect(instance, {
    ignoreUrlIncludes: opts.ignoreUnauthorized ?? ['/auth/login'],
  })

  return instance
}

// ─── Instancias pre-creadas ──────────────────────────────────────────────────
// Cada módulo puede importar directamente la que necesite, o crear la suya
// con `createModuleApi` si necesita opciones extra.

/** Core API (login, Auth, Users, Roles, etc.) */
export const coreApi = createModuleApi(
  ENV.CORE_URL || '/api',
  { ignoreUnauthorized: ['/auth/login'] },
)

/** MBA3 — consultas bajo /api/mba3/* */
export const mba3ConsultasHttp = createModuleApi(
  '/api/mba3',
)

/** MBA3 — Auth/me y capabilities (misma ruta /api) */
export const mba3AuthHttp = createModuleApi(
  ENV.MBA3_URL || '/api',
)

/** Caja Chica */
export const cajaChicaApi = createModuleApi(
  ENV.CAJA_CHICA_URL || '/caja-chica-api',
)

/** PYG (Pérdidas y Ganancias) */
export const pygHttp = createModuleApi(
  ENV.PYG_URL || '/pyg-api',
)

/** Artículo Maestro */
export const maestroHttp = createModuleApi(
  ENV.MAESTRO_URL || '/maestro-api',
  { auditHeaders: true },
)

/** Conciliación Bancaria */
export const conciliacionHttp = createModuleApi(
  ENV.CONCILIACION_URL || '/conciliacion-api',
  { timeout: 60_000 },
)

/** Artículo Scanner */
export const scanHttp = createModuleApi(
  ENV.SCAN_URL || '/scan-api',
  { correlationId: true, timeout: 12_000 },
)

/** Inventario */
export const inventarioHttp = createModuleApi(
  ENV.INVENTORY_URL || '/inventario-api',
  { correlationId: true },
)

/** Promoción Sobres */
export const promoSobresHttp = createModuleApi(
  ENV.PROMO_SOBRES_URL || '/promocion-sobres-api',
  { correlationId: true, auditHeaders: true },
)

/** Slayer (Caja Chica / SAP) */
export const slayerHttp = createModuleApi(
  ENV.SLAYER_URL || '/slayer-api',
)

/** Preferencias de usuario (MBA3 vía /api/users/preferences) */
export const preferencesHttp = createModuleApi(
  ENV.PREFERENCES_URL || '',
)

/** Reposiciones */
export const reposicionesApi = createModuleApi(
  ENV.REPOSICIONES_URL || '/api/reposicion-api',
  { auditHeaders: true, correlationId: true },
)
