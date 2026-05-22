#!/usr/bin/env node
/**
 * Crea deploy/env/active.env desde local.env.example si no existe.
 * Si active.env tiene perfil Docker (host.docker.internal), avisa — rompe npm run dev.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const active = path.join(root, 'deploy', 'env', 'active.env')
const template = path.join(root, 'deploy', 'env', 'local.env.example')

if (fs.existsSync(active)) {
  const content = fs.readFileSync(active, 'utf8')
  if (/host\.docker\.internal/i.test(content)) {
    console.error('active.env tiene perfil Docker (host.docker.internal) — npm run dev fallará en /caja-chica-api/.')
    console.error('Restaura dev: cp deploy/env/local.env.example deploy/env/active.env')
    console.error('Docker usa otro archivo: npm run docker:env  → active.docker.env')
    process.exit(1)
  }
  process.exit(0)
}

if (!fs.existsSync(template)) {
  console.error('Falta deploy/env/local.env.example')
  process.exit(1)
}

fs.copyFileSync(template, active)
console.log('Creado deploy/env/active.env desde local.env.example')
