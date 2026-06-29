# CI/CD Azure DevOps — SCNexus Frontend

Guía de arquitectura del pipeline y procedimiento completo para agregar un nuevo módulo backend.

---

## Arquitectura: CI vs CD

```
┌─────────────────────────────────────────────────────────────────┐
│  CI  (azure-pipeline/azure-pipeline.yaml)                       │
│                                                                 │
│  Stage 1 — Validación  (todas las ramas)                        │
│    npm ci + vue-tsc --noEmit                                    │
│                                                                 │
│  Stage 2 — Build  (solo ramas main y test)                      │
│    docker build --build-arg VITE_APP_BASE_PATH=...              │
│    → imagen genérica (sin IPs ni upstreams)                     │
│    → push a ACR:                                                │
│         main  → web-scnexus:prod-latest  + prod-{BuildId}       │
│         test  → web-scnexus:test-latest  + test-{BuildId}       │
│                                                                 │
│  El CI NO sabe nada de IPs, puertos ni microservicios.          │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼ imagen en Azure Container Registry (ACR)
┌─────────────────────────────────────────────────────────────────┐
│  CD  (Release Classic — Azure DevOps)                           │
│                                                                 │
│  Agente: agents-srv-test (on-premise, ya autenticado al ACR)    │
│  Variables vinculadas: scnexus-test-env / scnexus-prod-env      │
│                                                                 │
│  Script Command Line (stage TEST):                              │
│    1. docker stop / rm   (contenedor anterior)                  │
│    2. docker pull ACR/web-scnexus:test-latest                   │
│    3. Genera /tmp/scnexus-front.env con los UPSTREAM_*          │
│       desde las variables de Library                            │
│    4. docker run --env-file /tmp/scnexus-front.env              │
│    5. docker image prune -f                                     │
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

La imagen Docker es **genérica**: el mismo artefacto corre en test y en prod. El CD inyecta los upstreams como variables de entorno al arrancar el contenedor desde la Library de Azure DevOps.

Ventajas:
- Cambiar una IP de backend no requiere reconstruir la imagen.
- El CI YAML nunca se toca al agregar módulos nuevos.
- Test y prod usan la misma imagen, solo cambian las variables.

---

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `azure-pipeline/azure-pipeline.yaml` | CI: validación TypeScript + build imagen → ACR |
| `Dockerfile` | Build SPA (node) + empaqueta nginx + entrypoint |
| `deploy/scripts/docker-entrypoint.sh` | Genera nginx.conf al arrancar el contenedor |
| `deploy/nginx/scnexus-docker.conf.template` | Template nginx con `${UPSTREAM_*}` |
| `deploy/env/active.env` | Upstreams locales del desarrollador (gitignored) |
| `deploy/env/*.env.example` | Plantillas de referencia por ambiente |
| `docker-compose.yml` | Levanta el contenedor localmente |

**Azure DevOps:**

| Recurso | Descripción |
|---|---|
| Library `scnexus-test-env` | Variables `TEST_*_UPSTREAM` del ambiente de test |
| Library `scnexus-prod-env` | Variables `PROD_*_UPSTREAM` del ambiente de producción |
| ACR `dockermg-g9hrgcc4etdrh8eg.azurecr.io` | Registro de imágenes Docker |

---

## Script completo del CD (referencia)

```bash
echo "0. Autenticando al Azure Container Registry..."
az acr login --name dockermg-g9hrgcc4etdrh8eg

echo "1. Deteniendo contenedor frontend anterior..."
docker stop web-scnexus || true
docker rm web-scnexus || true

echo "2. Descargando la nueva imagen desde ACR..."
docker pull dockermg-g9hrgcc4etdrh8eg.azurecr.io/web-scnexus:test-latest

echo "3. Generando configuracion de upstreams desde Library..."
cat > /tmp/scnexus-front.env <<EOF
UPSTREAM_MBA3=$(TEST_MBA3_UPSTREAM)
UPSTREAM_CORE=$(TEST_CORE_UPSTREAM)
CORE_PROXY_HOST=$(TEST_CORE_PROXY_HOST)
UPSTREAM_CAJA_CHICA=$(TEST_CAJA_CHICA_UPSTREAM)
UPSTREAM_EMPLOYEES=$(TEST_EMPLOYEES_UPSTREAM)
UPSTREAM_PYG=$(TEST_PYG_UPSTREAM)
UPSTREAM_SCAN=$(TEST_SCAN_API_UPSTREAM)
UPSTREAM_MAESTRO=$(TEST_MAESTRO_UPSTREAM)
UPSTREAM_CONCILIACION=$(TEST_CONCILIACION_UPSTREAM)
UPSTREAM_REPOSICION=$(TEST_REPOSICION_UPSTREAM)
UPSTREAM_INVENTARIO=$(TEST_INVENTARIO_UPSTREAM)
UPSTREAM_PROMOCION_SOBRES=$(TEST_PROMOCION_SOBRES_UPSTREAM)
UPSTREAM_RULETA=$(TEST_RULETA_UPSTREAM)
UPSTREAM_SLAYER=$(TEST_SLAYER_UPSTREAM)
EOF

echo "4. Levantando contenedor con variables en runtime..."
docker run -d --name web-scnexus \
  -p 8082:80 \
  --memory="300m" \
  --cpus="0.5" \
  --restart=always \
  --add-host=host.docker.internal:host-gateway \
  --env-file /tmp/scnexus-front.env \
  dockermg-g9hrgcc4etdrh8eg.azurecr.io/web-scnexus:test-latest

echo "5. Limpieza de imagenes antiguas..."
docker image prune -f

echo "Verificacion:"
docker ps --filter name=web-scnexus --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

> Para **producción** el script es idéntico; solo cambia el tag (`prod-latest`),
> el prefijo de variables (`PROD_*`) y el puerto del contenedor.

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

Cuando se integra un nuevo microservicio, hay que tocar **4 lugares**. El CI YAML nunca se toca.

### Paso 1 — Library de Azure DevOps

En `Pipelines → Library`, agregar la variable en los dos grupos:

| Grupo | Variable | Valor ejemplo |
|---|---|---|
| `scnexus-test-env` | `TEST_NUEVO_UPSTREAM` | `http://host.docker.internal:9000` |
| `scnexus-prod-env` | `PROD_NUEVO_UPSTREAM` | `http://192.168.x.x:9000` |

### Paso 2 — Script del CD (Release Classic)

En el Command Line Script del stage correspondiente, agregar una línea al bloque `cat`:

```bash
# En el stage TEST — agregar dentro del heredoc:
UPSTREAM_NUEVO=$(TEST_NUEVO_UPSTREAM)

# En el stage PROD — agregar dentro del heredoc:
UPSTREAM_NUEVO=$(PROD_NUEVO_UPSTREAM)
```

### Paso 3 — Template nginx (PR al repositorio)

Agregar el bloque `location` en `deploy/nginx/scnexus-docker.conf.template`,
**antes** del bloque genérico `location /api/`:

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

### Paso 4 — Archivos de ejemplo (PR al repositorio)

Agregar la variable en los archivos `.env.example` para que otros desarrolladores sepan que existe:

```bash
# En deploy/env/local.env.example, local.docker.env.example, etc.
UPSTREAM_NUEVO=http://host.docker.internal:9000
```

---

## Checklist módulo nuevo

```
AZURE DEVOPS (sin tocar el repo)
  □ Library scnexus-test-env  → agregar TEST_NUEVO_UPSTREAM
  □ Library scnexus-prod-env  → agregar PROD_NUEVO_UPSTREAM
  □ CD script stage TEST      → UPSTREAM_NUEVO=$(TEST_NUEVO_UPSTREAM)
  □ CD script stage PROD      → UPSTREAM_NUEVO=$(PROD_NUEVO_UPSTREAM)

REPOSITORIO (PR normal → CI construye imagen automáticamente)
  □ nginx template             → location /nuevo-api/ { proxy_pass ${UPSTREAM_NUEVO}; }
  □ deploy/env/*.env.example   → UPSTREAM_NUEVO=http://...
  □ src/modules/nuevo-modulo/  → código Vue del módulo

NO SE TOCA
  □ azure-pipeline/azure-pipeline.yaml
  □ deploy/scripts/docker-entrypoint.sh
  □ docker-compose.yml
  □ Dockerfile
```

---

## Desarrollo local

### Sin Docker (`npm run dev`)

```bash
cp deploy/env/local.env.example deploy/env/active.env
# Editar active.env con las IPs reales de tu máquina
npm run dev
# Frontend disponible en http://localhost:3000
```

### Con Docker (`docker compose`)

```bash
cp deploy/env/local.docker.env.example deploy/env/active.env
# Editar active.env con IPs para contenedor (host.docker.internal, etc.)
docker compose up -d --build
# Frontend disponible en http://localhost:8082
```

Cambiar un upstream **no requiere reconstruir la imagen**:

```bash
# Editar active.env y luego:
docker compose restart scnexus-front   # ~3 segundos
```

---

## Variables de entorno: nomenclatura

| Prefijo | Dónde vive | Ejemplo |
|---|---|---|
| `UPSTREAM_*` | Entorno del contenedor (generado por CD desde Library) | `UPSTREAM_MBA3=http://...` |
| `CORE_PROXY_HOST` | Entorno del contenedor (generado por CD desde Library) | `host.docker.internal:5053` |
| `VITE_*` | `deploy/env/bundle.env` (build-time, va en la imagen) | `VITE_APP_NAME=SCNexus` |
| `TEST_*_UPSTREAM` | Library `scnexus-test-env` en Azure DevOps | `TEST_MBA3_UPSTREAM=http://...` |
| `PROD_*_UPSTREAM` | Library `scnexus-prod-env` en Azure DevOps | `PROD_MBA3_UPSTREAM=http://...` |

Las `VITE_*` se hornean en el bundle JavaScript (visibles en el navegador). Los `UPSTREAM_*` solo existen en el servidor, nunca llegan al cliente.

---

## Troubleshooting

### 502 Bad Gateway en una ruta

```bash
# Verificar que la variable llegó al contenedor
docker exec web-scnexus printenv | grep UPSTREAM

# Verificar reachability del backend
docker exec web-scnexus wget -qO- --timeout=5 http://<upstream>/

# Ver el nginx.conf generado
docker exec web-scnexus cat /etc/nginx/conf.d/default.conf | grep proxy_pass
```

### El contenedor arranca pero nginx falla

```bash
docker logs web-scnexus
docker exec web-scnexus nginx -t
docker exec web-scnexus cat /etc/nginx/conf.d/default.conf
```

### Un upstream nuevo no se sustituye en nginx

```bash
docker exec web-scnexus printenv UPSTREAM_NUEVO
```

Si está vacío, revisar en orden:
1. Que `TEST_NUEVO_UPSTREAM` existe en la Library de Azure DevOps.
2. Que el CD script tiene `UPSTREAM_NUEVO=$(TEST_NUEVO_UPSTREAM)` dentro del bloque `cat`.
3. Que la Library `scnexus-test-env` está vinculada al Release en Azure DevOps.

### Cambios de upstream sin nuevo deploy

```bash
# Producción
docker restart web-scnexus

# Local con docker compose
docker compose restart scnexus-front
```
