#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const src = path.join(root, 'deploy', 'env', 'local.docker.env.example')
const dest = path.join(root, 'deploy', 'env', 'active.env')

if (!fs.existsSync(src)) {
  console.error('Falta deploy/env/local.docker.env.example')
  process.exit(1)
}

fs.copyFileSync(src, dest)
console.log('Copiado local.docker.env.example → deploy/env/active.env')
console.log('Edita UPSTREAM_CORE si tu Core usa otra IP/puerto.')
console.log('Luego: npm run docker:up')
