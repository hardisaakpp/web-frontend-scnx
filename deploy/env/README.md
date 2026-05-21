# Configuración de entorno SCNexus

Un solo lugar para **dos capas**:

| Capa | Archivo | Contenido |
|------|---------|-----------|
| **Bundle** (navegador) | `bundle.env` | `VITE_*` con rutas relativas (`/api`, `/api/mba3`, …). **Versionado.** Igual en todos los entornos. |
| **Upstreams** (proxy) | `active.env` | `UPSTREAM_*` con `http://host:puerto`. **No commitear** — copiar desde un `.example`. |

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
cp deploy/env/local.env.example deploy/env/active.env
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

`scnexus.mabelgroup.com.ec` — hoy solo existe `/storage/scnexus/dist` (sin git). Migración a Docker documentada en [docs/DEPLOYMENT_PROD_SRV_MABUIOSAPI.md](../../docs/DEPLOYMENT_PROD_SRV_MABUIOSAPI.md).

```bash
# Tras clonar en /opt/frontend/scnexus-front
cp deploy/env/prod-mabuiosapi.env.example deploy/env/active.env
sh ~/deploys/nexus_frontend_prod.sh
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

## Archivos antiguos (deprecados)

- `.env.development` / `.env.development.example` → usar `active.env` + `bundle.env`
- `.env.docker.example` → usar `intranet.env.example` o `desa.env.example`
- `.env.production.example` → sustituido por `bundle.env`

Variables legacy `VITE_*_PROXY_TARGET` y `MBA3_UPSTREAM` siguen funcionando si aún existen en un `.env` local antiguo.
