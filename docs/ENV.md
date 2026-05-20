# Variables de entorno — SCNexus Frontend

## Regla

| Capa | Desarrollo | Producción |
|------|------------|------------|
| **Bundle** (`VITE_*` en `.env.development` / build) | Rutas relativas (`/api`, `/api/mba3`, …) | Igual |
| **Proxy** | `VITE_*_PROXY_TARGET` → Vite (`vite.config.ts`) | `*_UPSTREAM` → Nginx (`.env.docker.example` + Docker) |

No uses `http://192.168.x.x` en `VITE_*` del bundle (Mixed Content en HTTPS).

## Archivos

| Archivo | Uso |
|---------|-----|
| `.env.development.example` → `.env.development` | `npm run dev` o `docker-compose.dev.yml` |
| `.env.production.example` → `.env.production` | `npm run build` (opcional si Docker copia la plantilla) |
| `.env.docker.example` → `.env` | `docker compose build` (upstreams Nginx) |

## Rutas del bundle → proxy

| Módulo / uso | Variable bundle | Ruta HTTP | Proxy dev (env) | Proxy prod (Docker) |
|--------------|-----------------|-----------|-----------------|---------------------|
| Login, Core | `VITE_CORE_API_URL` | `/api/*` (excepto reglas abajo) | `VITE_CORE_PROXY_TARGET` | `CORE_UPSTREAM` |
| Auth/me, capabilities | `VITE_MBA3_API_URL` | `/api/Auth/me` | `VITE_AUTH_ME_PROXY_TARGET` | `MBA3_UPSTREAM` |
| MBA3 consultas | `VITE_MBA3_API_BASE_URL` | `/api/mba3/*` | `VITE_MBA3_PROXY_TARGET` | `MBA3_UPSTREAM` |
| Preferencias UI | (vacío) | `/api/users/preferences` | `VITE_MBA3_PROXY_TARGET` | `MBA3_UPSTREAM` |
| PYG | `VITE_PYG_API_URL` o `/pyg-api` | `/pyg-api/*` | `VITE_PYG_PROXY_TARGET` | `PYG_UPSTREAM` |
| Caja chica | `VITE_CAJA_CHICA_API_URL` | `/caja-chica-api/*` | `VITE_CAJA_CHICA_PROXY_TARGET` | `CAJA_CHICA_UPSTREAM` |
| Conciliación | `VITE_CONCILIACION_API_URL` | `/conciliacion-api/*` | `VITE_CONCILIACION_PROXY_TARGET` | `CONCILIACION_UPSTREAM` |
| Maestro artículos | `VITE_MAESTRO_API_URL` | `/maestro-api/*` | `VITE_MAESTRO_API_TARGET` | `MAESTRO_UPSTREAM` |
| Scan | `VITE_ARTICULO_SCAN_API_URL` | `/scan-api/*` | `VITE_ARTICULO_SCAN_PROXY_TARGET` | `SCAN_API_UPSTREAM` |
| Inventario | `VITE_INVENTARIO_API_URL` | `/inventario-api/*` | `VITE_INVENTARIO_PROXY_TARGET` | `INVENTARIO_UPSTREAM` |
| Promoción sobres | `VITE_PROMOCION_SOBRES_API_URL` | `/promocion-sobres-api/*` | `VITE_PROMOCION_SOBRES_PROXY_TARGET` | `PROMOCION_SOBRES_UPSTREAM` |
| Slayer (caja chica) | `/slayer-api` en código | `/slayer-api/*` | `VITE_SLAYER_PROXY_TARGET` | `SLAYER_UPSTREAM` |

Código central de defaults: `src/config/apiBaseUrls.ts`.

## Puertos

- **3000** — desarrollo (Vite)
- **8081** — contenedor intranet `scnexus-front` (Nginx)

Ver también [DOCKER.md](./DOCKER.md).

## Timeouts SAP (mba3-consultas)

El bundle no define timeouts HTTP; los fija el código del módulo (`integrarSAP` 120–300 s, polling async hasta 10 min). El **proxy** (Vite en dev, Nginx en Docker) debe permitir al menos el mismo tiempo en rutas `/api/mba3` hacia el API; si Nginx corta antes (p. ej. `proxy_read_timeout 120s`), aparecerá **504** (error de servidor), no el toast amarillo de timeout de axios.

Detalle: [timeout-sincronizado-frontend-backend.md](./timeout-sincronizado-frontend-backend.md).
