# Despliegue producción — srv-mabuiosapi (scnexus.mabelgroup.com.ec)

Documento de coordinación (marzo 2026): estado actual del servidor, migración a Docker y alineación con el flujo de **DESA** (`sh ~/deploys/nexus_frontend.sh`).

**Relacionado:** [DEPLOYMENT.md](./DEPLOYMENT.md) (DESA), [deploy/env/README.md](../deploy/env/README.md), [DOCKER.md](./DOCKER.md).

**Infraestructura del host (sitios Apache/Nginx, puertos):** [deploy/production-audit/srv-mabuiosapi/INFRASTRUCTURE.md](../deploy/production-audit/srv-mabuiosapi/INFRASTRUCTURE.md) — auditoría 2026-03-21.

---

## 1. Resumen ejecutivo

| Tema | Decisión |
|------|----------|
| Enfoque de despliegue | Igual que DESA: **un comando** → script `nexus_frontend_prod.sh` + `deploy/env/active.env` |
| Config de entorno | `deploy/env/` — bundle (rutas) + `UPSTREAM_*` (backends), no IPs en el JS |
| Corte en prod | **Directo** (fuera de horario laboral), sin puerto paralelo |
| Repo en prod hoy | **No existe** — solo `/storage/scnexus/dist` (build copiado a mano) |
| Primer paso en prod | **Clonar** el repositorio; luego Docker + cambio **una vez** en Apache |

---

## 2. Arquitectura actual (antes del corte)

Investigación en `srv-mabuiosapi`:

```text
Usuario
  → https://scnexus.mabelgroup.com.ec  (Apache :443, SSL)
       → /etc/apache2/sites-enabled/003-scnexus.conf
  → Nginx :3001  (server_name scnexus.mabelgroup.com.ec)
       root /storage/scnexus/dist     ← SPA estática (sin git)
       + proxy /api, /api/mba3, /caja-chica-api, …  (ver `deploy/production-audit/srv-mabuiosapi/nginx/scnexus-host-3001.conf`)
```

En el mismo host conviven **otros vhosts Apache** (no tocar al migrar SCNexus): `sapi`, `storecontrol.mabelgroup.com.ec`, `intranet.mabelgroup.com.ec`, `glpi` — ver inventario en [INFRASTRUCTURE.md](../deploy/production-audit/srv-mabuiosapi/INFRASTRUCTURE.md).

| Puerto | Proceso | Uso |
|--------|---------|-----|
| **443** | Apache | HTTPS — varios `ServerName`; SCNexus = `003-scnexus.conf` |
| **3001** | Nginx | Sitio SCNexus (dist) — dejar de usar tras corte |
| **3000** | Nginx | `srv-mabuiosapi.mabeltrading.com` — **no tocar** |
| **8085** | docker-proxy | Contenedor `scnexus-front` |

Contenido real hoy:

```bash
/storage/scnexus/
  dist/          # build pegado (no hay .git)
  backup/
  backupJos/
```

URL de ejemplo que usan los usuarios:  
`https://scnexus.mabelgroup.com.ec/mba3-consultas/proceso`  
→ ruta de **Vue Router** con `VITE_APP_BASE_PATH=/` (raíz del dominio).

---

## 3. Arquitectura objetivo (Docker)

```text
Usuario
  → https://scnexus.mabelgroup.com.ec  (Apache :443)
       → proxy_pass http://127.0.0.1:8085/   ← cambio único en 003-scnexus.conf
  → Contenedor scnexus-front (:8085 → Nginx :80 dentro)
       SPA (bundle con rutas relativas)
       + proxy UPSTREAM_* → backends en el mismo host (docker ps)
```

Backends en el **mismo servidor** (referencia `docker ps`):

| Servicio | Puerto host | Variable |
|----------|-------------|----------|
| Core Auth (prod) | **192.168.2.12:8080** | `UPSTREAM_CORE`, `CORE_PROXY_HOST` |
| scnexus-core-api (local) | 5053 | Solo si se valida login; en prod Auth usar **192.168.2.12:8080** |
| mba3-api | 8000 | `UPSTREAM_MBA3`, `UPSTREAM_MBA3_AUTH` |
| cajachica | 8092 | `UPSTREAM_CAJA_CHICA` |
| app-maestro | 8004 | `UPSTREAM_MAESTRO` |
| app-conciliacion | 8005 | `UPSTREAM_CONCILIACION` |
| scnexus-pyg-api | 5171 | `UPSTREAM_PYG` |
| scnexus-articulo-api (scan) | 8080 | `UPSTREAM_SCAN` |
| api-slayer | 8093 | `UPSTREAM_SLAYER` (desde contenedor: `host.docker.internal:8093`; en shell del host: `127.0.0.1:8093`) |
| scnexus-validacionci-api | 8083 | `UPSTREAM_PROMOCION_SOBRES` |

Plantilla versionada: `deploy/env/prod-mabuiosapi.env.example` → copiar a `active.env` en el servidor.

Redes Docker en prod (`docker-compose.prod-network.yml`):

| Backend | URL en `active.env` | Cómo llega el contenedor |
|---------|---------------------|---------------------------|
| Core (`/api/Auth/`, resto `/api/`) | `http://192.168.2.12:8080` | IP del Core de prod (mismo que Apache viejo) |
| MBA3 | `http://mba3-api:8000` | red externa `mba3-nexus_edge` (declarada en `docker-compose.prod-network.yml`) |
| Cajachica | `http://cajachica:8092` | red externa `cajachica_net` (declarada en `docker-compose.prod-network.yml`) — **DNS por nombre de contenedor** |
| PYG `/pyg-api/` | `http://scnexus-pyg-api:8080` | red `scnexus-pyg_default` (host publica **5171→8080**; entre contenedores usar **8080**) |
| Empleados `/employees-api/` | `http://host.docker.internal:3001` | PHP en Nginx **host** :3001, no cajachica |
| Conciliación `/conciliacion-api/` | `http://app-conciliacion:8000` | red `conciliacion-bancaria_default` (`8005->8000/tcp`; no `:8080`) |
| Maestro `/maestro-api/` | `http://app-maestro:8000` | red `articulomaestro_default` (ver `docker ps` → puerto tras `->`) |

**No** usar `host.docker.internal:8000` para MBA3 en este host — hace timeout desde el contenedor (iptables bloquea tráfico entre redes Docker a través del host). Ver [INCIDENTS.md](../deploy/production-audit/srv-mabuiosapi/INCIDENTS.md) 2026-06-05.

**No** usar `host.docker.internal:8092` para Cajachica en este host (timeout desde contenedor).

**No** usar IPs de bridge (`172.17.0.x`) para Cajachica — esas IPs son dinámicas y cambian al recrear el contenedor. Usar siempre el nombre DNS `cajachica` via `cajachica_net`.

**No** usar `intranet.env.example` sin revisar: las IPs 192.168.x no reflejan “todo en localhost Docker” en este host.

---

## 4. Configuración de entorno (dos capas)

Igual que desarrollo y DESA:

| Capa | Archivo | Contenido |
|------|---------|-----------|
| Bundle | `deploy/env/bundle.env` | `VITE_*` = rutas `/api`, `/api/mba3`, … (versionado) |
| Upstreams | `deploy/env/active.env` | `UPSTREAM_*`, `VITE_APP_BASE_PATH=/`, `SCNEXUS_FRONT_PORT=8085` |

En producción **obligatorio** en `active.env` para el build Docker:

```env
VITE_APP_BASE_PATH=/
```

Si se usa `/scnexus-front/` por error, rompe URLs como `/mba3-consultas/proceso`.

Los `UPSTREAM_*` se hornean en la imagen Nginx al hacer `docker compose build`. Si cambian, rebuild:

```bash
docker compose --env-file deploy/env/active.env build --no-cache
docker compose --env-file deploy/env/active.env up -d
```

---

## 5. Comparación DESA vs producción

| | DESA (desa-mabuiosapp) | Prod (srv-mabuiosapi) |
|--|------------------------|------------------------|
| Rama | `develop` | Acordar (`main` / `develop`) |
| Ruta git | `/opt/frontend/scnexus-front` | Propuesta: `/opt/frontend/scnexus-front` (nuevo clone) |
| Despliegue viejo | Vite :3000 → migrado | `dist/` en `/storage/scnexus/dist` + Nginx :3001 |
| Script | `~/deploys/nexus_frontend.sh` | `~/deploys/nexus_frontend_prod.sh` |
| Plantilla env | `desa.env.example` | `prod-mabuiosapi.env.example` |
| Acceso público | IP:8085 o Nginx host | Apache 443 → **8085** (activo) |
| Cajachica upstream | :8081 (staging) | :8092 (prod) |

---

## 6. Instalación inicial en producción (una vez)

### 6.1 Clonar el repositorio

Elegir ruta con git (no reutilizar solo `/storage/scnexus` sin `.git`):

```bash
sudo mkdir -p /opt/frontend
sudo chown "$USER":"$USER" /opt/frontend   # o usuario de despliegue acordado
cd /opt/frontend
git clone <url-del-repo> scnexus-front
cd scnexus-front
git checkout main   # o la rama acordada
```

### 6.2 Configurar entorno

```bash
cp deploy/env/prod-mabuiosapi.env.example deploy/env/active.env
# Revisar con: docker ps
nano deploy/env/active.env
```

### 6.3 Instalar script de despliegue

```bash
mkdir -p ~/deploys
cp /opt/frontend/scnexus-front/deploy/scripts/nexus_frontend_prod.sh ~/deploys/nexus_frontend_prod.sh
chmod +x ~/deploys/nexus_frontend_prod.sh
```

Variables opcionales al ejecutar:

```bash
PROJECT_DIR=/opt/frontend/scnexus-front LOG_FILE=~/deploys/scnexus-front-prod.log sh ~/deploys/nexus_frontend_prod.sh
```

### 6.4 Redes Docker (prod)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod-network.yml \
  --env-file deploy/env/active.env up -d --build
```

`docker-compose.prod-network.yml` declara `cajachica_net` como red externa, por lo que el contenedor se conecta automáticamente al hacer `up`. No se requiere `docker network connect` manual.

> **Prerequisito:** la red `cajachica_net` debe existir y el contenedor `cajachica` debe estar conectado a ella antes del deploy:
> ```bash
> docker network inspect cajachica_net  # verificar que cajachica aparece en Containers
> ```

### 6.5 Backup del despliegue anterior

```bash
sudo cp -a /storage/scnexus/dist /storage/scnexus/dist.bak.$(date +%Y%m%d)
sudo cp -a /etc/apache2/sites-enabled/003-scnexus.conf /etc/apache2/sites-enabled/003-scnexus.conf.bak.$(date +%Y%m%d)
```

---

## 7. Día del corte (checklist)

Fuera de horario laboral recomendado.

- [ ] Backup `dist/` y `003-scnexus.conf` (§6.5)
- [ ] `sh ~/deploys/nexus_frontend_prod.sh` (build + contenedor en :8082)
- [ ] Probar **sin tocar Apache** aún:
  ```bash
  curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8085/
  curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8085/mba3-consultas/proceso
  ```
- [ ] Revisar login (ver `deploy/scripts/verify-desa-auth.sh` adaptando `FRONT_PORT` y rutas)
- [ ] Editar Apache `003-scnexus.conf`: apuntar al contenedor (§8)
- [ ] `sudo apache2ctl configtest && sudo systemctl reload apache2`
- [ ] Probar en navegador: `https://scnexus.mabelgroup.com.ec/mba3-consultas/proceso`
- [ ] Dejar de desplegar copiando `dist/` a `/storage/scnexus/dist`

---

## 8. Cambio en Apache (una vez)

Revisar el archivo actual:

```bash
sudo cat /etc/apache2/sites-enabled/003-scnexus.conf
```

Buscar el destino actual (suele ser Nginx **3001**). Objetivo: reenviar todo el sitio SCNexus al contenedor **8085**, que ya incluye proxy de APIs.

Ejemplo de referencia (ajustar según el vhost real): `deploy/apache/003-scnexus-docker.conf.example`

Tras el cambio, Nginx **:3001** con `root /storage/scnexus/dist` queda sin tráfico público (útil para rollback).

---

## 9. Despliegues recurrentes (post-corte)

Un solo comando (igual filosofía que DESA):

```bash
sh ~/deploys/nexus_frontend_prod.sh
```

El script (`deploy/scripts/nexus_frontend_prod.sh`) hace en orden:

1. `git pull origin <rama actual>` — trae los últimos cambios del repo
2. Crea `deploy/env/active.env` desde `prod-mabuiosapi.env.example` si no existe
3. Valida que `VITE_APP_BASE_PATH=/` (si no, aborta — evita romperse las rutas)
4. `docker compose -f docker-compose.yml -f docker-compose.prod-network.yml --env-file deploy/env/active.env up -d --build` — rebuild con upstreams horneados en nginx
5. `docker image prune -f` — limpia imágenes dangling
6. Muestra estado del contenedor

> **Importante:** si cambia el script en el repo, copiarlo manualmente al servidor:
> ```bash
> cp /opt/frontend/scnexus-front/deploy/scripts/nexus_frontend_prod.sh ~/deploys/nexus_frontend_prod.sh
> chmod +x ~/deploys/nexus_frontend_prod.sh
> ```

---

## 10. Rollback

1. Restaurar `003-scnexus.conf.bak` (proxy otra vez a **3001** / config anterior).
2. `sudo apache2ctl configtest && sudo systemctl reload apache2`
3. Opcional: `docker compose down` en el clone.
4. `dist.bak` sigue en `/storage/scnexus/` si Apache+Nginx 3001 vuelven a servir estáticos.

---

## 11. Merge main / enfoque de configuración

Tras merge de `main` en la rama de trabajo, los conflictos de env se resolvieron a favor de:

- `deploy/loadEnv.mjs` + `UPSTREAM_*` en `active.env`
- `vite.config.ts` con `upstreamUrl()`
- No volver a IPs en `VITE_*` del bundle

Ver [ENV.md](./ENV.md).

### Seguridad de merge entre ramas de trabajo y main

Las configuraciones de producción son **inmunes a merges** porque viven fuera del repositorio:

| Archivo | ¿En el repo? | ¿Afectable por merge? |
|---|---|---|
| `deploy/env/active.env` | No (gitignored) | Nunca |
| `deploy/env/prod-mabuiosapi.env.example` | Sí | Solo si el merge lo modifica explícitamente |
| `deploy/env/bundle.env` | Sí | Solo si el merge lo modifica explícitamente |
| `.env.development` | Solo en ramas de dev local | Se agrega como archivo nuevo en main; no afecta Docker |

El flujo Docker (`nexus_frontend_prod.sh`) lee **`deploy/env/active.env`** vía `--env-file` y nunca toca `.env.development`. Si ese archivo llega a main por un merge, los servidores que usan Docker lo ignoran por completo.

### Rama `refactor/mba3-api-service` — diferencias de configuración local

Esta rama mantiene intencionalmente `.env.development` para simplificar el arranque de desarrollo local (`npm run dev` sin necesidad de crear `active.env`). Diferencias respecto a main:

| Aspecto | `refactor/mba3-api-service` | `main` |
|---|---|---|
| Config local | `.env.development` (todo en uno) | `deploy/env/active.env` desde un `.example` |
| Core target local | `localhost:5053` | `192.168.2.12:8080` (según perfil) |
| Fallback automático Core | Sí (`resolveActiveBackend` en `vite.config.ts`) | No |

El `vite.config.ts` de la rama refactor incluye una función `resolveActiveBackend` que prueba el backend Core primario (1.5 s de timeout) y, si no responde, usa el fallback definido en `VITE_CORE_FALLBACK_PROXY_TARGET`. Este comportamiento **solo aplica en `mode === 'development'`** y no tiene efecto en builds Docker ni en producción.

---

## 12. Estado del despliegue (actualizado 2026-06-11)

El contenedor `scnexus-front` está activo en producción desde la migración a Docker.

| # | Tarea | Estado |
|---|--------|--------|
| 1 | Apache `003-scnexus.conf` → `ProxyPass / http://127.0.0.1:8085/` | ✅ Activo |
| 2 | Clone en `/opt/frontend/scnexus-front` | ✅ Activo |
| 3 | `active.env` con Core `192.168.2.12:8080` y MBA3 `mba3-api:8000` | ✅ Activo |
| 4 | MBA3 via red `mba3-nexus_edge` (`mba3-api:8000`) | ✅ Corregido 2026-06-05 |
| 5 | `restart: unless-stopped` en compose | ✅ Confirmado 2026-06-10 |
| 6 | Puerto cambiado 8082 → **8085** (Store Control ocupaba 8082) | ✅ Corregido 2026-06-10 |
| 7 | `docker image prune -f` en script de despliegue (limpia imágenes dangling) | ✅ Agregado 2026-06-10 |
| 8 | Cajachica via `cajachica_net` con DNS `cajachica:8092` (reemplaza IP bridge) | ✅ Corregido 2026-06-11 |
| 9 | `docker-compose.prod-network.yml` declara `cajachica_net` — no requiere `connect bridge` manual | ✅ Corregido 2026-06-11 |
| 10 | Verificar otros upstreams con `host.docker.internal` (PYG, Conciliación, Scan, Inventario) | 🔲 Pendiente validar |
| 11 | Verificación post-deploy de upstreams horneados en nginx (previene build con ARG default) | ✅ Agregado 2026-06-16 |
| 12 | Fallback en `auth.ts` cuando `/api/Auth/me` devuelve error de red (504): deriva capabilities desde JWT | ✅ Agregado 2026-06-16 |
| 13 | Timeout corto (10 s) en endpoints `/api/Auth/me` y `/api/auth/me` para no bloquear la UI ante 504 | ✅ Agregado 2026-06-16 |

---

## 13. Incidentes registrados

### 2026-06-16 — 504 en módulo Asignación de Almacenes (Dockerfile ARG default en imagen)

**Síntoma:** `GET /caja-chica-api/Almacenes` devolvía **504 Gateway Timeout** en producción. En desarrollo funcionaba. Red Docker y DNS internos correctos.

**Causa raíz:** el último build usó el ARG default del Dockerfile (`http://192.168.2.153:8092`) porque `active.env` en el servidor no tenía `UPSTREAM_CAJA_CHICA` definido o lo tenía con la IP LAN. La IP LAN del host **no es accesible desde dentro del contenedor** — cajachica solo es alcanzable por DNS mediante `cajachica:8092` vía `cajachica_net`.

**Diagnóstico clave:**
```bash
docker exec scnexus-front grep "proxy_pass" /etc/nginx/conf.d/default.conf
# → proxy_pass http://192.168.2.153:8092;  ← IP en vez de nombre DNS = build con ARG default
```

**Fix inmediato (sin rebuild):**
```bash
docker exec scnexus-front sed -i \
  's|proxy_pass http://192.168.2.153:8092;|proxy_pass http://cajachica:8092;|g' \
  /etc/nginx/conf.d/default.conf
docker exec scnexus-front nginx -s reload
```

**Fix permanente:** verificar que `active.env` tenga `UPSTREAM_CAJA_CHICA=http://cajachica:8092` y hacer rebuild con `bash ~/deploys/nexus_frontend_prod.sh`.

**Lección:** ante cualquier 504 en `/caja-chica-api/`, el primer paso es verificar el upstream horneado en nginx. El script de deploy ahora imprime los upstreams tras cada rebuild. Ver [INCIDENTS.md](../deploy/production-audit/srv-mabuiosapi/INCIDENTS.md) 2026-06-16.

---

### 2026-06-11 — 502 Bad Gateway en módulo Asignación de Almacenes (Caja Chica)

**Síntoma:** `GET /caja-chica-api/Almacenes` devolvía **502 Bad Gateway** en producción. En desarrollo funcionaba correctamente. El módulo mostraba "No se pudo cargar la información."

**Causa raíz:** doble problema acumulado:

1. **Upstream incorrecto horneado en nginx:** `active.env` tenía `UPSTREAM_CAJA_CHICA=http://172.17.0.2:8092` — IP dinámica del bridge default asignada a un contenedor anterior. Al recrear `cajachica`, la IP cambió pero el nginx de `scnexus-front` seguía apuntando a la IP vieja.

2. **Contenedor no conectado a `cajachica_net`:** `docker-compose.prod-network.yml` sobreescribía la lista de redes del servicio sin incluir `cajachica_net`, por lo que el contenedor no podía resolver el nombre DNS `cajachica`.

**Diagnóstico:**
```bash
docker exec scnexus-front grep "caja-chica-api" -A2 /etc/nginx/conf.d/default.conf
# → proxy_pass http://172.17.0.2:8092;  ← IP incorrecta

docker network inspect cajachica_net
# → scnexus-front NO aparecía en Containers
```

**Fix inmediato (sin rebuild):**
```bash
docker network connect cajachica_net scnexus-front
docker exec scnexus-front sed -i \
  's|http://172.17.0.2:8092|http://172.28.0.2:8092|g' \
  /etc/nginx/conf.d/default.conf
docker exec scnexus-front nginx -s reload
```

**Fix permanente (aplicado):**
- `active.env`: `UPSTREAM_CAJA_CHICA=http://cajachica:8092` (nombre DNS en vez de IP)
- `docker-compose.prod-network.yml`: agrega `cajachica_net` a la lista de redes del servicio
- `deploy/scripts/nexus_frontend_prod.sh`: elimina el bloque `docker network connect bridge` obsoleto
- Rebuild: `docker compose -f docker-compose.yml -f docker-compose.prod-network.yml --env-file deploy/env/active.env up -d --build`

**Lección:** nunca usar IPs del bridge default (`172.17.0.x`) como upstreams — son dinámicas. Siempre usar redes user-defined con nombre de contenedor como DNS.

---

**Última actualización:** 2026-06-16 (incidente 504 ARG default; fallback auth.ts; timeout auth endpoints)
**Servidor:** srv-mabuiosapi  
**Dominio:** scnexus.mabelgroup.com.ec
