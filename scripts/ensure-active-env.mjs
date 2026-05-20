#!/usr/bin/env node
/**
 * Crea deploy/env/active.env desde local.env.example si no existe.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const active = path.join(root, 'deploy', 'env', 'active.env')
const template = path.join(root, 'deploy', 'env', 'local.env.example')

if (fs.existsSync(active)) {
  process.exit(0)
}

if (!fs.existsSync(template)) {
  console.error('Falta deploy/env/local.env.example')
  process.exit(1)
}

fs.copyFileSync(template, active)
console.log('Creado deploy/env/active.env desde local.env.example')
