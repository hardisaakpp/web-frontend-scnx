# Docker — SCNexus Frontend (intranet)

Perfil de despliegue para **servidor de aplicaciones / intranet**, alineado con `deploy/nginx/scnexus.conf.example`.

| Entorno | Comando | URL típica |
|---------|---------|------------|
| Desarrollo | `docker compose -f docker-compose.dev.yml up -d` | http://localhost:3000 |
| Producción (contenedor) | `docker compose up -d --build` | http://localhost:8081 |

## Regla de configuración

| Capa | Desarrollo | Producción (contenedor) |
|------|------------|-------------------------|
| Bundle (`VITE_*`) | Rutas relativas (`/api`, `/api/mba3`, …) | Igual — ver `.env.production.example` |
| Proxy | `VITE_*_PROXY_TARGET` en Vite (localhost / `host.docker.internal`) | `*_UPSTREAM` en `.env` → build-args → Nginx |

No uses IPs en `VITE_*` del build salvo APIs en otro dominio HTTPS público.

**Tabla ruta / variable:** [ENV.md](./ENV.md)

## Inicio rápido

### 1. Configurar upstreams

```bash
cp .env.docker.example .env
# Editar IPs según tu red (Core, Caja Chica, MBA3, etc.)
```

### 2. Desarrollo (Vite + hot reload)

```bash
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml logs -f scnexus-front-dev
```

Con **mba3-consultas** en Docker (red `mba3-nexus_edge`):

```bash
docker compose -f docker-compose.dev.yml -f docker-compose.mba3-network.attach.yml up -d
```

### 3. Producción local (imagen Nginx)

```bash
docker compose up -d --build
curl -sI http://127.0.0.1:8081/
curl -sI http://127.0.0.1:8081/api/mba3/health
```

Tras cambiar `.env` o upstreams: `docker compose build --no-cache && docker compose up -d`.

## Integración con Nginx del host

Opción A — **solo contenedor** en puerto interno (`8081`); el Nginx del servidor hace `proxy_pass` a todas las rutas (`/api/`, `/scan-api/`, …) como en `scnexus.conf.example`.

Opción B — **contenedor autónomo**: publicar `8081` y apuntar el vhost del host al contenedor para `/` y las APIs (misma idea que Apache en despliegues con subruta).

Referencia host sin Docker: `deploy/nginx/scnexus.conf.example`.  
Template dentro del contenedor: `deploy/nginx/scnexus-docker.conf.template`.

## Variables principales

Ver `.env.docker.example`. Las más usadas:

- `SCNEXUS_FRONT_PORT` — puerto en el host (default `8081`)
- `VITE_APP_BASE_PATH` — `/` intranet raíz; `/scnexus-front/` si publicas bajo subruta (requiere ajustes extra en Nginx del host)
- `MBA3_UPSTREAM`, `CORE_UPSTREAM`, `CAJA_CHICA_UPSTREAM`, … — destinos del proxy **dentro** del contenedor

En Linux, `host.docker.internal` requiere `extra_hosts: host-gateway` (ya definido en `docker-compose.yml`).

## Errores frecuentes

### API devuelve `text/html` en lugar de JSON

Estás en **:8081** (Nginx prod) pero querías **:3000** (Vite dev), o falta un `location` en el template (comparar con `scnexus.conf.example`).

### `502` / timeout en un módulo

El upstream no es alcanzable **desde el contenedor**. Prueba:

```bash
docker exec scnexus-front wget -qO- --timeout=3 http://192.168.2.12:8080/ || echo fail
```

Usa IP de red en lugar de `127.0.0.1` para servicios fuera del contenedor.

### Envío a SAP lento o `504` en `/api/mba3`

El front puede esperar hasta **300 s** en `POST /integrar-sap`, pero Nginx en `deploy/nginx/scnexus-docker.conf.template` suele tener `proxy_read_timeout` de **120–180 s** en el `location` de MBA3. Si el API tarda más, sube esos valores y vuelve a `docker compose build --no-cache`.

Guía completa: [timeout-sincronizado-frontend-backend.md](./timeout-sincronizado-frontend-backend.md).

### Cambios en `.env` no aplican

Los upstreams de Nginx se **hornean en la imagen** en el build. Ejecuta `docker compose build --no-cache`.

## Relación con otras ramas

- `frontend-dockerizado`: perfil servidor público `.39` (Apache + subruta). No es requisito para este setup intranet.
- `refactor/mba3-api-service`: desarrollo activo; Docker vive en esta rama.
