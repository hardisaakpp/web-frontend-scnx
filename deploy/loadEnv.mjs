/**
 * Carga centralizada de entorno SCNexus.
 *
 * - deploy/env/bundle.env     → VITE_* (rutas relativas; igual en todos los entornos)
 * - deploy/env/active.env     → UPSTREAM_* (gitignored; copiar desde *.env.example)
 * - deploy/env/<profile>.env  → alternativa si SCNEXUS_PROFILE=local|desa|intranet
 *
 * En build de producción solo importan las VITE_* del bundle; los UPSTREAM_* van a Nginx (Docker).
 */
import fs from 'node:fs'
import path from 'node:path'

const ENV_DIR = path.join(process.cwd(), 'deploy', 'env')

/** Defaults solo para desarrollo local (npm run dev). Sin IPs de red. */
export const LOCAL_UPSTREAM_DEFAULTS = {
  // UPSTREAM_CORE: 'http://210.17.1.53:5053',
  UPSTREAM_CORE: 'http://localhost:5053',
  UPSTREAM_MBA3: 'http://127.0.0.1:8000',
  UPSTREAM_MBA3_AUTH: 'http://127.0.0.1:8000',
  UPSTREAM_CAJA_CHICA: 'http://127.0.0.1:8092',
  UPSTREAM_PYG: 'http://127.0.0.1:5171',
  UPSTREAM_PYG_PREFIX: '/api',
  UPSTREAM_MAESTRO: 'http://127.0.0.1:8001',
  UPSTREAM_CONCILIACION: 'http://127.0.0.1:8005',
  UPSTREAM_SCAN: 'http://127.0.0.1:8080',
  UPSTREAM_INVENTARIO: 'http://127.0.0.1:8082',
  UPSTREAM_PROMOCION_SOBRES: 'http://127.0.0.1:8083',
  UPSTREAM_SLAYER: 'http://127.0.0.1:8093',
  UPSTREAM_EMPLOYEES: 'http://127.0.0.1:8092',
  UPSTREAM_REPOSICION: 'http://127.0.0.1:8006',
  UPSTREAM_RECEPCION: 'http://127.0.0.1:8007',
  UPSTREAM_RECEPCION_PROVEEDORES: 'http://127.0.0.1:8031',
  UPSTREAM_DEMANDA_OTB: 'http://127.0.0.1:8008',
  UPSTREAM_RULETA: 'http://localhost:5062',
  UPSTREAM_TRANSACCIONES: 'http://127.0.0.1:8080',
  UPSTREAM_CEDI: 'http://localhost:5065',
  UPSTREAM_TRANSFERENCIAS_DIRECTAS: 'http://localhost:5046',
}

/** Nombres legacy (vite / docker antiguos) → UPSTREAM_* */
const LEGACY_UPSTREAM_KEYS = {
  CORE: ['VITE_CORE_PROXY_TARGET'],
  MBA3: ['VITE_MBA3_PROXY_TARGET'],
  MBA3_AUTH: ['VITE_AUTH_ME_PROXY_TARGET'],
  CAJA_CHICA: ['VITE_CAJA_CHICA_PROXY_TARGET'],
  PYG: ['VITE_PYG_PROXY_TARGET'],
  MAESTRO: ['VITE_MAESTRO_API_TARGET'],
  CONCILIACION: ['VITE_CONCILIACION_PROXY_TARGET'],
  SCAN: ['VITE_ARTICULO_SCAN_PROXY_TARGET'],
  INVENTARIO: ['VITE_INVENTARIO_PROXY_TARGET'],
  PROMOCION_SOBRES: ['VITE_PROMOCION_SOBRES_PROXY_TARGET'],
  SLAYER: ['VITE_SLAYER_PROXY_TARGET'],
  EMPLOYEES: ['VITE_STORE_EMPLOYEES_PROXY_TARGET'],
  REPOSICION: ['VITE_REPOSICION_PROXY_TARGET'],
}

const LEGACY_DOCKER_UPSTREAM = {
  CORE: 'CORE_UPSTREAM',
  MBA3: 'MBA3_UPSTREAM',
  CAJA_CHICA: 'CAJA_CHICA_UPSTREAM',
  PYG: 'PYG_UPSTREAM',
  MAESTRO: 'MAESTRO_UPSTREAM',
  CONCILIACION: 'CONCILIACION_UPSTREAM',
  SCAN: 'SCAN_API_UPSTREAM',
  INVENTARIO: 'INVENTARIO_UPSTREAM',
  PROMOCION_SOBRES: 'PROMOCION_SOBRES_UPSTREAM',
  SLAYER: 'SLAYER_UPSTREAM',
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

export function resolveProfile(mode = 'development') {
  if (process.env.SCNEXUS_PROFILE) return process.env.SCNEXUS_PROFILE
  return mode === 'development' ? 'local' : 'intranet'
}

/**
 * Copia VITE_*_PROXY_TARGET de .env.development → UPSTREAM_* si no hay active.env.
 * Así login/Core sigue usando VITE_CORE_PROXY_TARGET sin duplicar en active.env.
 * @param {Record<string, string>} env
 */
export function promoteLegacyProxyTargets(env) {
  for (const [key, legacyKeys] of Object.entries(LEGACY_UPSTREAM_KEYS)) {
    const upstreamKey = `UPSTREAM_${key}`
    if (env[upstreamKey]) continue
    for (const leg of legacyKeys) {
      if (env[leg]) {
        env[upstreamKey] = env[leg]
        break
      }
    }
  }
  if (!env.UPSTREAM_PYG_PREFIX && env.VITE_PYG_PROXY_PREFIX !== undefined) {
    env.UPSTREAM_PYG_PREFIX = env.VITE_PYG_PROXY_PREFIX
  }
}

/**
 * @param {string} [mode] vite mode (development | production)
 * @returns {{ profile: string, env: Record<string, string>, activeEnvLoaded: boolean }}
 */
export function loadScnexusDeployEnv(mode = 'development') {
  const profile = resolveProfile(mode)
  const merged = { ...parseEnvFile(path.join(ENV_DIR, 'bundle.env')) }
  let activeEnvLoaded = false

  const active = path.join(ENV_DIR, 'active.env')
  if (fs.existsSync(active)) {
    Object.assign(merged, parseEnvFile(active))
    activeEnvLoaded = true
  } else {
    const named = path.join(ENV_DIR, `${profile}.env`)
    if (fs.existsSync(named)) {
      Object.assign(merged, parseEnvFile(named))
    }
    // No cargar *.env.example en runtime (solo plantillas para copiar).
  }

  for (const [key, val] of Object.entries(process.env)) {
    if (val === undefined) continue
    if (key.startsWith('UPSTREAM_') || key.startsWith('VITE_') || key === 'SCNEXUS_FRONT_PORT') {
      merged[key] = val
    }
  }

  return { profile, env: merged, activeEnvLoaded }
}

/**
 * Env unificado para Vite dev: bundle + active/profile + .env.development + legacy → UPSTREAM.
 * @param {string} mode
 * @param {Record<string, string>} [viteModeEnv] resultado de loadEnv(mode, cwd, '')
 */
export function mergeViteDevEnv(mode, viteModeEnv = {}) {
  const { env: merged, activeEnvLoaded } = loadScnexusDeployEnv(mode)
  Object.assign(merged, viteModeEnv)
  for (const key of Object.keys(process.env)) {
    if (key.startsWith('VITE_') && process.env[key] !== undefined) {
      merged[key] = process.env[key]
    }
  }
  if (!activeEnvLoaded) {
    promoteLegacyProxyTargets(merged)
  }
  return merged
}

/**
 * URL de backend para proxy dev o build-args Docker.
 * @param {Record<string, string>} env
 * @param {keyof typeof LOCAL_UPSTREAM_DEFAULTS | keyof typeof LEGACY_UPSTREAM_KEYS} key
 */
/** Defaults Docker prod (imagen Nginx); Core en intranet como en refactor. */
export const DOCKER_UPSTREAM_DEFAULTS = {
  UPSTREAM_CORE: 'http://192.168.2.12:8080',
  UPSTREAM_MBA3: 'http://host.docker.internal:8000',
  UPSTREAM_MBA3_AUTH: 'http://host.docker.internal:8000',
  UPSTREAM_CAJA_CHICA: 'http://192.168.2.153:8092',
  UPSTREAM_PYG: 'http://host.docker.internal:5171',
  UPSTREAM_MAESTRO: 'http://host.docker.internal:8001',
  UPSTREAM_CONCILIACION: 'http://host.docker.internal:8005',
  UPSTREAM_SCAN: 'http://host.docker.internal:8080',
  UPSTREAM_INVENTARIO: 'http://host.docker.internal:8082',
  UPSTREAM_PROMOCION_SOBRES: 'http://host.docker.internal:8083',
  UPSTREAM_SLAYER: 'http://host.docker.internal:8093',
  UPSTREAM_EMPLOYEES: 'http://192.168.2.153:8092',
  UPSTREAM_REPOSICION: 'http://host.docker.internal:8006',
  UPSTREAM_RECEPCION: 'http://host.docker.internal:8007',
  UPSTREAM_TRANSACCIONES: 'http://host.docker.internal:8080',
}

export function upstreamUrl(env, key, { docker = false } = {}) {
  const primary = `UPSTREAM_${key}`
  if (env[primary]) return env[primary]

  const legacy = LEGACY_UPSTREAM_KEYS[key]
  if (legacy) {
    for (const k of legacy) {
      if (env[k]) return env[k]
    }
  }

  const dockerLegacy = LEGACY_DOCKER_UPSTREAM[key]
  if (dockerLegacy && env[dockerLegacy]) return env[dockerLegacy]

  const defaults = docker ? DOCKER_UPSTREAM_DEFAULTS : LOCAL_UPSTREAM_DEFAULTS
  return defaults[primary] ?? DOCKER_UPSTREAM_DEFAULTS.UPSTREAM_CORE
}

/** Mapeo UPSTREAM_* → ARGs del Dockerfile / docker-compose build. */
export function dockerBuildArgsFromEnv(env) {
  return {
    MBA3_UPSTREAM: upstreamUrl(env, 'MBA3'),
    CORE_UPSTREAM: upstreamUrl(env, 'CORE'),
    CAJA_CHICA_UPSTREAM: upstreamUrl(env, 'CAJA_CHICA'),
    PYG_UPSTREAM: upstreamUrl(env, 'PYG'),
    SCAN_API_UPSTREAM: upstreamUrl(env, 'SCAN'),
    PROMOCION_SOBRES_UPSTREAM: upstreamUrl(env, 'PROMOCION_SOBRES'),
    INVENTARIO_UPSTREAM: upstreamUrl(env, 'INVENTARIO'),
    CONCILIACION_UPSTREAM: upstreamUrl(env, 'CONCILIACION'),
    MAESTRO_UPSTREAM: upstreamUrl(env, 'MAESTRO'),
    SLAYER_UPSTREAM: upstreamUrl(env, 'SLAYER'),
    EMPLOYEES_UPSTREAM: upstreamUrl(env, 'EMPLOYEES'),
    REPOSICION_UPSTREAM: upstreamUrl(env, 'REPOSICION'),
    RECEPCION_UPSTREAM: upstreamUrl(env, 'RECEPCION'),
    TRANSACCIONES_UPSTREAM: upstreamUrl(env, 'TRANSACCIONES'),
    VITE_APP_BASE_PATH: env.VITE_APP_BASE_PATH || '/',
    CORE_PROXY_HOST: env.CORE_PROXY_HOST || 'host.docker.internal:5053',
  }
}
