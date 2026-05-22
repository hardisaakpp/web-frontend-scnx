#!/usr/bin/env node
/**
 * Garantiza deploy/env/active.docker.env antes de docker compose.
 * No toca active.env (perfil npm run dev).
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const active = path.join(root, 'deploy', 'env', 'active.docker.env')
const template = path.join(root, 'deploy', 'env', 'local.docker.env.example')

function warnInvalidDockerUpstreams(content) {
  const bad = []
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^UPSTREAM_[A-Z_]+=(.+)$/)
    if (!m) continue
    const val = m[1].trim()
    if (/^http:\/\/127\.0\.0\.1:/i.test(val)) {
      bad.push(line.trim())
    }
  }
  if (bad.length === 0) return

  console.error('active.docker.env usa 127.0.0.1 — dentro del contenedor eso NO es tu PC (502).')
  console.error('Ejecuta: npm run docker:env')
  for (const b of bad) console.error(`  ${b}`)
  process.exit(1)
}

if (fs.existsSync(active)) {
  warnInvalidDockerUpstreams(fs.readFileSync(active, 'utf8'))
  process.exit(0)
}

if (!fs.existsSync(template)) {
  console.error('Falta deploy/env/local.docker.env.example')
  process.exit(1)
}

fs.copyFileSync(template, active)
console.log('Creado deploy/env/active.docker.env desde local.docker.env.example')
