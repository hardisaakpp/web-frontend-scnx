# Variables de entorno — SCNexus Frontend

Configuración centralizada en **`deploy/env/`**. Detalle: [deploy/env/README.md](../deploy/env/README.md).

## Regla (dos capas)

| Capa | Dónde | Qué contiene |
|------|-------|----------------|
| **Bundle** | `deploy/env/bundle.env` (versionado) | `VITE_*` = rutas relativas (`/api`, `/api/mba3`, …). **Igual en local, test y prod.** |
| **Upstreams** | `deploy/env/active.env` (no commitear) | `UPSTREAM_*` = `http://host:puerto` para proxy Vite o Nginx |

- **Local:** solo `127.0.0.1` / `localhost` → copiar `local.env.example` → `active.env`
- **Test/prod:** IPs o `host.docker.internal` → copiar `desa.env.example` o `intranet.env.example` → `active.env`

No pongas IPs en `VITE_*` del bundle (Mixed Content en HTTPS).

## Rutas del bundle → upstream

| Módulo | Variable bundle | Ruta HTTP | Variable upstream |
|--------|-----------------|-----------|-------------------|
| Login, Core | `VITE_CORE_API_URL` | `/api/*` | `UPSTREAM_CORE` |
| Auth/me | `VITE_MBA3_API_URL` | `/api/Auth/me` | `UPSTREAM_MBA3_AUTH` (default = MBA3) |
| MBA3 consultas | `VITE_MBA3_API_BASE_URL` | `/api/mba3/*` | `UPSTREAM_MBA3` |
| PYG | — | `/pyg-api/*` | `UPSTREAM_PYG`, prefijo `UPSTREAM_PYG_PREFIX` |
| Caja chica | `VITE_CAJA_CHICA_API_URL` | `/caja-chica-api/*` | `UPSTREAM_CAJA_CHICA` |
| Conciliación | `VITE_CONCILIACION_API_URL` | `/conciliacion-api/*` | `UPSTREAM_CONCILIACION` |
| Maestro | `VITE_MAESTRO_API_URL` | `/maestro-api/*` | `UPSTREAM_MAESTRO` |
| Scan | `VITE_ARTICULO_SCAN_API_URL` | `/scan-api/*` | `UPSTREAM_SCAN` |
| Inventario | `VITE_INVENTARIO_API_URL` | `/inventario-api/*` | `UPSTREAM_INVENTARIO` |
| Promoción sobres | `VITE_PROMOCION_SOBRES_API_URL` | `/promocion-sobres-api/*` | `UPSTREAM_PROMOCION_SOBRES` |
| Slayer | — | `/slayer-api/*` | `UPSTREAM_SLAYER` |

Código de defaults del bundle: `src/config/apiBaseUrls.ts`.  
Carga de env: `deploy/loadEnv.mjs`, `vite.config.ts`.

## Comandos (`deploy/env/active.env`)

No hay comando tipo `activate`: el archivo se **crea**, **edita** y se pasa a Docker con `--env-file`. Detalle: [deploy/env/README.md](../deploy/env/README.md).

```bash
# Primera vez en tu PC (crea deploy/env/active.env si falta)
npm run env:local
npm run dev

# Docker en tu PC o servidor (obligatorio --env-file)
npm run docker:env    # opcional: plantilla local.docker
npm run docker:up
# equivalente manual:
# docker compose --env-file deploy/env/active.env up -d --build

# Tras cambiar UPSTREAM_* en Docker
npm run docker:rebuild
```

| Script npm | Qué hace |
|------------|----------|
| `env:local` | `local.env.example` → `active.env` |
| `docker:env` | `local.docker.env.example` → `active.env` |
| `docker:up` | compose con `--env-file deploy/env/active.env` |
| `docker:rebuild` | build `--no-cache` + up con `active.env` |

## Puertos

- **3000** — `npm run dev` o `docker-compose.dev.yml`
- **8082** (default) — contenedor `scnexus-front` (`SCNEXUS_FRONT_PORT` en `active.env`)

## Compatibilidad

Siguen leyéndose variables antiguas si existen en `.env.development` local: `VITE_*_PROXY_TARGET`, `MBA3_UPSTREAM`, etc.

## Timeouts SAP

Ver [timeout-sincronizado-frontend-backend.md](./timeout-sincronizado-frontend-backend.md).
