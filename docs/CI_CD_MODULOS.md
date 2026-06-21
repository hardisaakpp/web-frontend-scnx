# CI/CD y Módulos — SCNexus Frontend

Guía de arquitectura del pipeline, cómo funcionan los upstreams en runtime y el procedimiento completo para agregar un nuevo módulo backend.

---

## Arquitectura: CI vs CD

```
┌─────────────────────────────────────────────────────────────────┐
│  CI  (azure-pipeline/azure-pipeline.yaml)                       │
│                                                                 │
│  Stage 1 — Validación                                           │
│    npm ci + vue-tsc --noEmit                                    │
│                                                                 │
│  Stage 2 — Build                                                │
│    docker build --build-arg VITE_APP_BASE_PATH=/               │
│    → imagen genérica (sin IPs ni upstreams)                     │
│    → push a localhost:5000/web-scnexus:prod-{BuildId}           │
│                                                                 │
│  El CI NO sabe nada de IPs, puertos ni microservicios.          │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼ imagen genérica
┌─────────────────────────────────────────────────────────────────┐
│  CD  (Release Classic — Azure DevOps)                           │
│                                                                 │
│  Variables vinculadas: scnexus-test-env / scnexus-prod-env      │
│                                                                 │
│  Script Command Line:                                           │
│    1. docker stop / rm (contenedor anterior)                    │
│    2. docker pull localhost:5000/web-scnexus:test-latest        │
│    3. Genera /tmp/scnexus-front.env con los UPSTREAM_*          │
│       desde las variables de Library                            │
│    4. docker run --env-file /tmp/scnexus-front.env ...          │
│                                                                 │
│  El CD provee las IPs reales de cada ambiente.                  │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼ contenedor arranca
┌─────────────────────────────────────────────────────────────────┐
│  Contenedor nginx:1.27-alpine                                   │
│                                                                 │
│  docker-entrypoint.sh:                                          │
│    1. Lee UPSTREAM_* del entorno (provistos por CD)             │
│    2. envsubst sobre nginx.conf.template → nginx.conf           │
│    3. exec nginx -g 'daemon off;'                               │
│                                                                 │
│  Nginx sirve la SPA y proxea /api/*, /caja-chica-api/*, etc.    │
└─────────────────────────────────────────────────────────────────┘
```

### Por qué los upstreams van en runtime (no en build)

Antes, los upstreams se bakeaban en la imagen durante el CI (`docker build --build-arg MBA3_UPSTREAM=...`). Eso generaba:

- Una imagen diferente por ambiente (test y prod eran imágenes distintas).
- Cada nuevo módulo requería modificar el CI YAML (mala práctica).
- Cambiar un upstream obligaba a reconstruir la imagen completa.

Ahora la imagen es **genérica**: el mismo artefacto corre en test y en prod. El CD inyecta los upstreams como variables de entorno al arrancar el contenedor.

---

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `azure-pipeline/azure-pipeline.yaml` | CI: validación TypeScript + build imagen |
| `Dockerfile` | Build SPA (node) + empaqueta nginx + entrypoint |
| `deploy/scripts/docker-entrypoint.sh` | Genera nginx.conf al arrancar el contenedor |
| `deploy/nginx/scnexus-docker.conf.template` | Template nginx con `${UPSTREAM_*}` |
| `deploy/env/active.env` | Upstreams reales del servidor (gitignored) |
| `deploy/env/*.env.example` | Plantillas de referencia por ambiente |
| `docker-compose.yml` | Levanta el contenedor localmente |

---

## Cómo funciona el entrypoint al arrancar

`deploy/scripts/docker-entrypoint.sh` ejecuta tres pasos:

```sh
# 1. Aplica defaults para upstreams no configurados (evita nginx.conf inválido)
: "${UPSTREAM_MBA3:=http://host.docker.internal:8000}"
: "${UPSTREAM_CORE:=http://192.168.2.12:8080}"
# ... (un default por cada upstream conocido)

# 2. Construye lista dinámica de todas las UPSTREAM_* presentes en el entorno
VARS=$(printenv | grep -oE '^(UPSTREAM_[A-Z0-9_]+|CORE_PROXY_HOST)' \
       | awk '{printf "${%s}", $1}')

# 3. Sustituye solo esas variables en el template (el resto de $ nginx queda intacto)
envsubst "$VARS" \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
```

La lista es **dinámica**: cualquier variable `UPSTREAM_*` que esté en el entorno se incorpora automáticamente al nginx.conf. No hay que tocar el entrypoint al agregar módulos nuevos.

---

## Agregar un nuevo módulo backend

Cuando se integra un nuevo microservicio al frontend, hay que tocar **tres cosas** (el CI YAML nunca se toca):

### Paso 1 — Library de Azure DevOps

En `Pipelines → Library`, agregar la variable en los dos grupos:

| Grupo | Variable | Valor ejemplo |
|---|---|---|
| `scnexus-test-env` | `TEST_NUEVO_UPSTREAM` | `http://host.docker.internal:9000` |
| `scnexus-prod-env` | `PROD_NUEVO_UPSTREAM` | `http://192.168.2.x:9000` |

### Paso 2 — CD Release Classic

En el Command Line Script del stage correspondiente, agregar una línea al bloque que genera `/tmp/scnexus-front.env`:

```bash
# Stage TEST — agregar:
UPSTREAM_NUEVO=$(TEST_NUEVO_UPSTREAM)

# Stage PROD — agregar:
UPSTREAM_NUEVO=$(PROD_NUEVO_UPSTREAM)
```

El bloque completo del script del CD queda así:

```bash
echo "3. Generando configuración de upstreams..."
cat > /tmp/scnexus-front.env <<EOF
UPSTREAM_MBA3=$(TEST_MBA3_UPSTREAM)
UPSTREAM_CORE=$(TEST_CORE_UPSTREAM)
CORE_PROXY_HOST=$(TEST_CORE_PROXY_HOST)
# ... upstreams existentes ...
UPSTREAM_NUEVO=$(TEST_NUEVO_UPSTREAM)    # ← nueva línea
EOF
```

### Paso 3 — Repositorio (PR normal)

**3a. Agregar `location` en el template nginx:**

`deploy/nginx/scnexus-docker.conf.template`

```nginx
# =========================
# Nuevo Módulo
# =========================
location /nuevo-api/ {
    rewrite ^/nuevo-api(.*)$ $1 break;
    proxy_pass ${UPSTREAM_NUEVO};
    proxy_http_version 1.1;
    client_max_body_size 50M;
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization $http_authorization;
}
```

> El `location` debe ir **antes** del bloque genérico `location /api/` para que nginx lo evalúe primero.

**3b. Agregar la variable en los archivos `.env.example`:**

`deploy/env/local.env.example`, `local.docker.env.example`, `desa.env.example`, `intranet.env.example`, `prod-mabuiosapi.env.example`:

```bash
UPSTREAM_NUEVO=http://host.docker.internal:9000
```

**3c. Opcional — agregar default en el entrypoint:**

`deploy/scripts/docker-entrypoint.sh` (solo si el módulo existe en todos los ambientes):

```sh
: "${UPSTREAM_NUEVO:=http://host.docker.internal:9000}"
```

Si el módulo no existe en DESA, dejarlo comentado en `desa.env.example` y omitir el default — el contenedor arrancará igual y esa ruta dará 502 hasta que el backend esté disponible.

### Resumen checklist módulo nuevo

```
□ Library scnexus-test-env  → TEST_NUEVO_UPSTREAM
□ Library scnexus-prod-env  → PROD_NUEVO_UPSTREAM
□ CD script (test stage)    → UPSTREAM_NUEVO=$(TEST_NUEVO_UPSTREAM)
□ CD script (prod stage)    → UPSTREAM_NUEVO=$(PROD_NUEVO_UPSTREAM)
□ nginx template            → location /nuevo-api/ { proxy_pass ${UPSTREAM_NUEVO}; }
□ *.env.example (5 archivos)→ UPSTREAM_NUEVO=http://...
□ CI YAML                   → NO SE TOCA
□ docker-entrypoint.sh      → NO SE TOCA (lista dinámica)
□ docker-compose.yml        → NO SE TOCA
```

---

## Desarrollo local

### Sin Docker (`npm run dev`)

El proxy de Vite lee los `UPSTREAM_*` desde `deploy/env/active.env`. No interviene nginx.

```bash
cp deploy/env/local.env.example deploy/env/active.env
# Editar active.env con las IPs reales de tu máquina
npm run dev
# Frontend disponible en http://localhost:3000
```

### Con Docker (`docker compose`)

```bash
cp deploy/env/local.docker.env.example deploy/env/active.env
# Editar active.env con las IPs para contenedor (host.docker.internal, etc.)
docker compose up -d --build
# Frontend disponible en http://localhost:8082
```

Si cambias un upstream en `active.env`, **ya no hace falta reconstruir** la imagen:

```bash
# Antes (imagen bakeada): necesitaba rebuild completo ~2 min
docker compose up -d --build

# Ahora (runtime): solo restart del contenedor ~3 seg
docker compose restart scnexus-front
```

---

## Variables de entorno: nomenclatura

| Prefijo | Dónde vive | Ejemplo |
|---|---|---|
| `UPSTREAM_*` | `active.env`, entorno del contenedor | `UPSTREAM_MBA3=http://mba3-api:8000` |
| `CORE_PROXY_HOST` | `active.env`, entorno del contenedor | `CORE_PROXY_HOST=mba3-api:8000` |
| `VITE_*` | `deploy/env/bundle.env` (build-time) | `VITE_API_URL=/api` |
| `TEST_*_UPSTREAM` | Library `scnexus-test-env` (CD) | `TEST_MBA3_UPSTREAM=http://...` |
| `PROD_*_UPSTREAM` | Library `scnexus-prod-env` (CD) | `PROD_MBA3_UPSTREAM=http://...` |

Las `VITE_*` se hornean en el bundle JavaScript (visibles en el navegador). Los `UPSTREAM_*` solo existen en el servidor — nunca llegan al cliente.

---

## Troubleshooting

### 502 Bad Gateway en una ruta

El upstream no es alcanzable desde el contenedor.

```bash
# Verificar que la variable llegó al contenedor
docker exec scnexus-front printenv | grep UPSTREAM

# Verificar reachability del backend
docker exec scnexus-front wget -qO- --timeout=5 http://<upstream>/

# Ver el nginx.conf generado
docker exec scnexus-front cat /etc/nginx/conf.d/default.conf | grep proxy_pass
```

### El contenedor arranca pero nginx falla

Revisar el nginx.conf generado por el entrypoint:

```bash
docker logs scnexus-front
docker exec scnexus-front nginx -t
docker exec scnexus-front cat /etc/nginx/conf.d/default.conf
```

### Un upstream nuevo no se sustituye

Verificar que la variable está disponible en el entorno del contenedor:

```bash
docker exec scnexus-front printenv UPSTREAM_NUEVO
```

Si está vacía, el CD no está pasando la variable. Revisar:
1. Que `TEST_NUEVO_UPSTREAM` existe en la Library.
2. Que el CD script tiene `UPSTREAM_NUEVO=$(TEST_NUEVO_UPSTREAM)` en el bloque `cat`.
3. Que la Library está vinculada al Release.

### Cambios en `active.env` no aplican

Con el nuevo sistema de runtime, basta con reiniciar el contenedor:

```bash
docker compose restart scnexus-front
# o en producción:
docker restart web-scnexus
```

No hace falta `--build` para cambios de upstream.
