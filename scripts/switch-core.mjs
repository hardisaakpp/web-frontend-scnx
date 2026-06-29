#!/usr/bin/env node
/**
 * Cambia el Core API entre entorno local (dev) y producción en active.env.
 *
 *   npm run core:dev   → apunta a http://127.0.0.1:8080 (se mapea a host.docker.internal en Docker)
 *   npm run core:prod  → apunta a http://192.168.2.12:8080
 */
import fs from 'node:fs'
import path from 'node:path'

const mode = process.argv[2]

if (!['dev', 'prod'].includes(mode)) {
  console.error('Uso: node scripts/switch-core.mjs [dev|prod]')
  console.error('  dev  → Core local http://127.0.0.1:8080')
  console.error('  prod → Core PROD  http://192.168.2.12:8080')
  process.exit(1)
}

const isDev = mode === 'dev'
const DEV_PORT = process.env.CORE_DEV_PORT || '8080'
const CORE_URL = isDev ? `http://127.0.0.1:${DEV_PORT}` : 'http://192.168.2.12:8080'

const root = process.cwd()
const devEnv = path.join(root, 'deploy', 'env', 'active.env')

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

const devOk = patchFile(devEnv, [
  ['UPSTREAM_CORE', CORE_URL],
])

const label = isDev ? `Core LOCAL (${CORE_URL})` : `Core PROD (192.168.2.12:8080)`

console.log(`\n🔀 Cambiado a: ${label}`)
if (devOk) {
  console.log(`   ✔ deploy/env/active.env → UPSTREAM_CORE=${CORE_URL}`)
} else {
  console.warn(`   ⚠ active.env no existe — ejecuta npm run env:local primero`)
}

console.log('\nPara aplicar:')
console.log('  Vite   → reiniciar npm run dev')
console.log('  Docker → npm run docker:up')
