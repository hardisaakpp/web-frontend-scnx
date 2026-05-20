#!/usr/bin/env node
/**
 * Garantiza deploy/env/active.env antes de docker compose (build hornea UPSTREAM_* en Nginx).
 * Si no existe, copia local.docker.env.example (Core en red + host.docker.internal para MBA3).
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const active = path.join(root, 'deploy', 'env', 'active.env')
const template = path.join(root, 'deploy', 'env', 'local.docker.env.example')

if (fs.existsSync(active)) {
  process.exit(0)
}

if (!fs.existsSync(template)) {
  console.error('Falta deploy/env/local.docker.env.example')
  process.exit(1)
}

fs.copyFileSync(template, active)
console.log('Creado deploy/env/active.env desde local.docker.env.example')
console.log('UPSTREAM_CORE=http://192.168.2.12:8080 (login). Edita active.env si tu Core usa otra URL.')
