#!/usr/bin/env node
/**
 * Cambia el Core API entre entorno local (dev) y producción.
 *
 *   npm run core:dev   → apunta a http://host.docker.internal:5053  (Core local)
 *   npm run core:prod  → apunta a http://192.168.2.12:8080          (Core PROD)
 *
 * Modifica deploy/env/active.docker.env (Docker/Nginx) y deploy/env/active.env (Vite dev).
 * Después de cambiar a dev: npm run docker:up  (Docker) / reiniciar npm run dev (Vite).
 */
import fs from 'node:fs'
import path from 'node:path'

const mode = process.argv[2]

if (!['dev', 'prod'].includes(mode)) {
  console.error('Uso: node scripts/switch-core.mjs [dev|prod]')
  console.error('  dev  → Core local Docker   http://host.docker.internal:8080')
  console.error('        (dotnet run en :5053) CORE_DEV_PORT=5053 node scripts/switch-core.mjs dev')
  console.error('  prod → Core PROD            http://192.168.2.12:8080')
  process.exit(1)
}

const isDev = mode === 'dev'

// Core en Docker local → puerto 8080 (docker-compose.yml del core: ports 8080:8080)
// Core vía dotnet run  → puerto 5053 (launchSettings.json perfil http)
const DEV_PORT    = process.env.CORE_DEV_PORT || '8080'
const CORE_DOCKER = isDev ? `http://host.docker.internal:${DEV_PORT}` : 'http://192.168.2.12:8080'
const CORE_VITE   = isDev ? `http://127.0.0.1:${DEV_PORT}`            : 'http://192.168.2.12:8080'
const PROXY_HOST  = isDev ? `host.docker.internal:${DEV_PORT}`         : '192.168.2.12:8080'

const root = process.cwd()

function patchLine(content, key, value) {
  const re = new RegExp(`^${key}=.*`, 'm')
  return re.test(content)
    ? content.replace(re, `${key}=${value}`)
    : content + `\n${key}=${value}`
}

function patchFile(filePath, patches) {
  if (!fs.existsSync(filePath)) return false
  let content = fs.readFileSync(filePath, 'utf8')
  for (const [key, value] of patches) {
    content = patchLine(content, key, value)
  }
  fs.writeFileSync(filePath, content, 'utf8')
  return true
}

const dockerEnv = path.join(root, 'deploy', 'env', 'active.docker.env')
const devEnv    = path.join(root, 'deploy', 'env', 'active.env')

const dockerOk = patchFile(dockerEnv, [
  ['UPSTREAM_CORE', CORE_DOCKER],
  ['CORE_PROXY_HOST', PROXY_HOST],
])
const devOk = patchFile(devEnv, [
  ['UPSTREAM_CORE', CORE_VITE],
])

const label = isDev ? `Core LOCAL Docker  (host.docker.internal:${DEV_PORT} / 127.0.0.1:${DEV_PORT})` : `Core PROD   (192.168.2.12:8080)`

console.log(`\n🔀 Cambiado a: ${label}`)
if (dockerOk) console.log(`   ✔ active.docker.env → UPSTREAM_CORE=${CORE_DOCKER}`)
else          console.warn(`   ⚠ active.docker.env no existe — ejecuta npm run docker:env primero`)
if (devOk)   console.log(`   ✔ active.env         → UPSTREAM_CORE=${CORE_VITE}`)
else         console.warn(`   ⚠ active.env no existe — ejecuta npm run env:local primero`)

console.log('\nPara aplicar:')
console.log('  Docker → npm run docker:up   (rebuild automático)')
console.log('  Vite   → reiniciar: npm run dev')
