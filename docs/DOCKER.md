# Docker — SCNexus Frontend (intranet)

| Entorno | Comando | URL típica |
|---------|---------|------------|
| Desarrollo en contenedor | `docker compose -f docker-compose.dev.yml up -d` | http://localhost:3000 |
| Test/prod en contenedor | `docker compose up -d --build` | http://localhost:8082 (default) |

## Configuración (un solo lugar)

```bash
# PC local (Core en 192.168.2.12, MBA3 en host)
npm run docker:env
npm run docker:up

# DESA (front :8082; cajachica upstream :8081)
cp deploy/env/desa.env.example deploy/env/active.env
sh ~/deploys/nexus_frontend.sh

# Intranet / prod
cp deploy/env/intranet.env.example deploy/env/active.env

docker compose --env-file deploy/env/active.env build --no-cache
docker compose --env-file deploy/env/active.env up -d
```

**Importante:** `env_file` del servicio no alimenta los `build.args`. Usa siempre `--env-file deploy/env/active.env` (o `npm run docker:up`).

- **Bundle:** `deploy/env/bundle.env` (rutas relativas, sin IPs)
- **Backends:** `UPSTREAM_*` en `deploy/env/active.env`

Ver [deploy/env/README.md](../deploy/env/README.md).

## Desarrollo local sin Docker

```bash
npm run env:local   # crea active.env si falta
npm run dev
```

## MBA3 en Docker (red compartida)

```bash
docker compose -f docker-compose.dev.yml -f docker-compose.mba3-network.attach.yml up -d
```

Ajustar en `active.env`: `UPSTREAM_MBA3=http://mba3-api:8000` (y `UPSTREAM_MBA3_AUTH` igual).

## Integración con Nginx del host

El contenedor publica `SCNEXUS_FRONT_PORT` (default **8082**; en DESA evitar **8081** si cajachica lo usa).

Referencia host: `deploy/nginx/scnexus-host.conf.example` · prod: `deploy/production-audit/srv-mabuiosapi/nginx/` · Docker: `deploy/nginx/scnexus-docker.conf.template`.

## Errores frecuentes

### API devuelve HTML en lugar de JSON

Puerto equivocado: **3000** = Vite dev, **8082** = Nginx en contenedor.

### Cambios en `active.env` no aplican (Docker prod)

Los upstreams se hornean en la imagen: `docker compose build --no-cache`.

### 502 desde el contenedor

Probar reachability: `docker exec scnexus-front wget -qO- --timeout=3 http://host.docker.internal:8000/`

Guía timeouts: [timeout-sincronizado-frontend-backend.md](./timeout-sincronizado-frontend-backend.md).
