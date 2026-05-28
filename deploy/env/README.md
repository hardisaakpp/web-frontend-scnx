# Configuración de entorno SCNexus

Un solo lugar para **dos capas**:

| Capa | Archivo | Contenido |
|------|---------|-----------|
| **Bundle** (navegador) | `bundle.env` | `VITE_*` con rutas relativas (`/api`, `/api/mba3`, …). **Versionado.** Igual en todos los entornos. |
| **Upstreams** (proxy) | `active.env` | `UPSTREAM_*` con `http://host:puerto`. **No commitear** — copiar desde un `.example`. |

Ruta del archivo activo: **`deploy/env/active.env`** (no es un entorno virtual de Python; no existe comando `activate`).

## Crear y usar `active.env`

| Objetivo | Comando |
|----------|---------|
| Crear perfil local para `npm run dev` | `npm run env:local` (copia `local.env.example` si falta) |
| Crear perfil Docker en tu PC | `npm run docker:env` (copia `local.docker.env.example`) |
| Editar backends / puertos | Abrir `deploy/env/active.env` en el editor |
| Dev Vite (:3000) | `npm run dev` (lee `active.env` si existe; si no, `.env.development`) |
| Docker Nginx (:8082) | `npm run docker:up` o `docker compose --env-file deploy/env/active.env up -d --build` |
| Rebuild sin caché tras cambiar `UPSTREAM_*` | `npm run docker:rebuild` |

Copia manual por perfil (equivalente a los scripts):

```bash
cp deploy/env/local.env.example deploy/env/active.env          # dev local
cp deploy/env/local.docker.env.example deploy/env/active.env   # Docker en PC
cp deploy/env/desa.env.example deploy/env/active.env         # DESA
cp deploy/env/prod-mabuiosapi.env.example deploy/env/active.env  # prod srv-mabuiosapi
```

En servidores Linux, los scripts de deploy cargan variables con `source deploy/env/active.env` antes de `docker compose`; en Windows usa los comandos `npm` / `docker compose --env-file` de la tabla.

**No confundir con:** `.env` o `.env.development` en la raíz del repo (solo Vite en desarrollo). El proxy en Docker y en servidores usa **`deploy/env/active.env`**.

## Inicio rápido (desarrollador)

**Opción A — solo `.env.development` (como antes):**

```env
VITE_CORE_PROXY_TARGET=http://192.168.2.12:8080
VITE_MBA3_PROXY_TARGET=http://localhost:8000
```

```bash
npm run dev
```

Sin `deploy/env/active.env`, esas variables se aplican al proxy (login → Core).

**Opción B — `active.env` en servidor o perfil fijo:**

```bash
npm run env:local
# o: cp deploy/env/local.env.example deploy/env/active.env
npm run dev
```

Si existe `active.env`, sus `UPSTREAM_*` tienen prioridad sobre `.env.development`.

## Servidor de pruebas (DESA)

Un solo front en Docker (**:8082**). Cajachica API en **:8081** solo como `UPSTREAM_CAJA_CHICA`.

```bash
cp deploy/env/desa.env.example deploy/env/active.env
# editar puertos según docker ps (maestro :8004, core :5053, …)
sh ~/deploys/nexus_frontend.sh
# o manualmente:
docker compose --env-file deploy/env/active.env up -d --build
```

Script versionado: `deploy/scripts/nexus_frontend.sh`.

## Producción (srv-mabuiosapi)

`scnexus.mabelgroup.com.ec` — hoy solo existe `/storage/scnexus/dist` (sin git). Migración a Docker: [docs/DEPLOYMENT_PROD_SRV_MABUIOSAPI.md](../../docs/DEPLOYMENT_PROD_SRV_MABUIOSAPI.md). Inventario Apache/Nginx del host: [deploy/production-audit/srv-mabuiosapi/](../production-audit/srv-mabuiosapi/).

```bash
# Tras clonar en /opt/frontend/scnexus-front
cp deploy/env/prod-mabuiosapi.env.example deploy/env/active.env
# MBA3 → mba3-api:8000; caja → 172.17.0.2:8092; Core Auth → 192.168.2.12:8080
docker compose -f docker-compose.yml -f docker-compose.prod-network.yml \
  --env-file deploy/env/active.env up -d --build
docker network connect bridge scnexus-front
sh ~/deploys/nexus_frontend_prod.sh   # incluye redes + connect bridge
```

Script: `deploy/scripts/nexus_frontend_prod.sh`. Corte Apache (una vez): `deploy/apache/003-scnexus-docker.conf.example`.

## Perfiles

| Perfil | Plantilla | Cuándo |
|--------|-----------|--------|
| `local` | `local.env.example` | `npm run dev` en tu PC |
| `desa` | `desa.env.example` | desa-mabuiosapp |
| `prod-mabuiosapi` | `prod-mabuiosapi.env.example` | srv-mabuiosapi (backends en mismo host) |
| `intranet` | `intranet.env.example` | intranet con IPs fijas en otros servidores |

Puedes usar **`active.env`** (recomendado en servidores) o **`SCNEXUS_PROFILE=desa`** con archivo `deploy/env/desa.env`.

## Docker en tu PC (`http://localhost:8082`)

`.env.development` **no** aplica al contenedor. Hay que definir `UPSTREAM_*` y **reconstruir** la imagen:

```bash
cp deploy/env/local.docker.env.example deploy/env/active.env
# UPSTREAM_CORE=http://192.168.2.12:8080  (login)
npm run docker:up
```

O: `npm run docker:env` y luego `npm run docker:up`.

Sin `--env-file deploy/env/active.env`, el build usa `127.0.0.1` y el login devuelve **502**.

## ¿Dónde van las IPs al compilar?

**No van en el JS.** `npm run build` / Docker solo hornean las rutas de `bundle.env`.

Las IPs/hostnames se aplican en:

- **`npm run dev` (:3000):** Vite + `.env.development` (`VITE_*_PROXY_TARGET`) o `active.env`.
- **Docker (:8082):** Nginx en la imagen; `UPSTREAM_*` en `active.env` + `docker compose --env-file deploy/env/active.env build`.

## Archivos antiguos (deprecados en el flujo principal)

- `.env.development` / `.env.development.example` → el flujo recomendado usa `active.env` + `bundle.env`
- `.env.docker.example` → usar `intranet.env.example` o `desa.env.example`
- `.env.production.example` → sustituido por `bundle.env`

Variables legacy `VITE_*_PROXY_TARGET` y `MBA3_UPSTREAM` siguen funcionando si aún existen en un `.env` local antiguo.

> **Nota rama `refactor/mba3-api-service`:** esta rama mantiene `.env.development` de forma intencional como opción simplificada para desarrollo local (Opción A, sin necesidad de crear `active.env`). Su alcance es exclusivamente `npm run dev`; Docker y los servidores lo ignoran. Ver [docs/ENV.md](../../docs/ENV.md).
