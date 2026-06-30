# Docker — SCNexus Frontend (intranet)

| Entorno | Comando | URL típica |
|---------|---------|------------|
| Desarrollo en contenedor | `docker compose -f docker-compose.dev.yml up -d` | http://localhost:3000 |
| Local con nginx | `docker compose up -d --build` (usa `deploy/env/active.env`) | http://localhost:8082 (default) |
| Servidores (test/prod) | CD Release Classic — ver [CI_CD_MODULOS.md](./CI_CD_MODULOS.md) | — |

## Configuración (un solo lugar)

```bash
# PC local (Core en 192.168.2.12, MBA3 en host)
cp deploy/env/local.docker.env.example deploy/env/active.env
docker compose up -d --build

# DESA (front :8082; cajachica upstream :8081)
cp deploy/env/desa.env.example deploy/env/active.env
sh ~/deploys/nexus_frontend.sh

# Intranet / prod
cp deploy/env/intranet.env.example deploy/env/active.env
docker compose up -d --build
```

Los upstreams (`UPSTREAM_*`) se inyectan en **runtime** desde `active.env` — no se hornean en la imagen. Si cambias un upstream, solo hace falta reiniciar el contenedor (no rebuild):

```bash
docker compose restart scnexus-front
```

- **Bundle:** `deploy/env/bundle.env` (rutas relativas VITE_*, sin IPs — versionado)
- **Backends:** `UPSTREAM_*` en `deploy/env/active.env` (gitignored — copiar desde `*.env.example`)

Ver [CI_CD_MODULOS.md](./CI_CD_MODULOS.md) para arquitectura completa y cómo agregar módulos.

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

Los upstreams se inyectan en runtime — solo reiniciar el contenedor:

```bash
docker compose restart scnexus-front
# o en producción:
docker restart web-scnexus
```

### 502 desde el contenedor

Probar reachability: `docker exec scnexus-front wget -qO- --timeout=3 http://host.docker.internal:8000/`

Guía timeouts: [timeout-sincronizado-frontend-backend.md](./timeout-sincronizado-frontend-backend.md).
