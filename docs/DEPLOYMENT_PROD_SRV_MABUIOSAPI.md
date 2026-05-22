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
| **8082** | (libre) | Reservado para contenedor `scnexus-front` |

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
       → proxy_pass http://127.0.0.1:8082/   ← cambio único en 003-scnexus.conf
  → Contenedor scnexus-front (:8082 → Nginx :80 dentro)
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

Redes Docker en prod (`docker-compose.prod-network.yml` + `docker network connect bridge`):

| Backend | URL en `active.env` | Cómo llega el contenedor |
|---------|---------------------|---------------------------|
| Core (`/api/Auth/`, resto `/api/`) | `http://192.168.2.12:8080` | IP del Core de prod (mismo que Apache viejo) |
| MBA3 | `http://mba3-api:8000` | red externa `mba3-nexus_edge` |
| Cajachica | `http://172.17.0.2:8092` | `docker network connect bridge` tras el `up` |
| PYG `/pyg-api/` | `http://scnexus-pyg-api:8080` | red `scnexus-pyg_default` (host publica **5171→8080**; entre contenedores usar **8080**) |
| Empleados `/employees-api/` | `http://host.docker.internal:3001` | PHP en Nginx **host** :3001, no cajachica |
| Conciliación `/conciliacion-api/` | `http://app-conciliacion:8000` | red `conciliacion-bancaria_default` (`8005->8000/tcp`; no `:8080`) |
| Maestro `/maestro-api/` | `http://app-maestro:8000` | red `articulomaestro_default` (ver `docker ps` → puerto tras `->`) |

**No** declarar la red `bridge` en Compose (error: *network-scoped alias is supported only for user defined networks*).

**No** usar `host.docker.internal:8000` ni `:8092` para MBA3/Cajachica en este host (timeout desde contenedor).

**No** usar `intranet.env.example` sin revisar: las IPs 192.168.x no reflejan “todo en localhost Docker” en este host.

---

## 4. Configuración de entorno (dos capas)

Igual que desarrollo y DESA:

| Capa | Archivo | Contenido |
|------|---------|-----------|
| Bundle | `deploy/env/bundle.env` | `VITE_*` = rutas `/api`, `/api/mba3`, … (versionado) |
| Upstreams | `deploy/env/active.env` | `UPSTREAM_*`, `VITE_APP_BASE_PATH=/`, `SCNEXUS_FRONT_PORT=8082` |

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
| Acceso público | IP:8082 o Nginx host | Apache 443 → **8082** (tras corte) |
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
docker network connect bridge scnexus-front   # cajachica 172.17.0.2
```

El script `deploy/scripts/nexus_frontend_prod.sh` hace el `connect bridge` automáticamente.

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
  curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8082/
  curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8082/mba3-consultas/proceso
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

Buscar el destino actual (suele ser Nginx **3001**). Objetivo: reenviar todo el sitio SCNexus al contenedor **8082**, que ya incluye proxy de APIs.

Ejemplo de referencia (ajustar según el vhost real): `deploy/apache/003-scnexus-docker.conf.example`

Tras el cambio, Nginx **:3001** con `root /storage/scnexus/dist` queda sin tráfico público (útil para rollback).

---

## 9. Despliegues recurrentes (post-corte)

Un solo comando (igual filosofía que DESA):

```bash
sh ~/deploys/nexus_frontend_prod.sh
```

El script hace: `git pull` → `docker compose --env-file deploy/env/active.env up -d --build` → log.

Desde el clone también:

```bash
cd /opt/frontend/scnexus-front
npm run docker:up
```

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

Ver historial de conversación y [ENV.md](./ENV.md).

---

## 12. Pendientes antes del primer deploy

| # | Tarea | Responsable |
|---|--------|-------------|
| 1 | Pegar contenido real de `003-scnexus.conf` y cerrar diff Apache | Infra |
| 2 | Acordar rama git y usuario SSH en prod | Equipo |
| 3 | Crear clone en `/opt/frontend/scnexus-front` | Infra |
| 4 | Validar `active.env` (MBA3 `mba3-api`, caja `172.17.0.2`, Core `192.168.2.12:8080`) | DevOps |
| 5 | `docker-compose.prod-network.yml` + `connect bridge` | DevOps |
| 6 | Ventana de corte + rollback comunicado | Coordinación |

---

**Última actualización:** 2026-03-21  
**Servidor:** srv-mabuiosapi  
**Dominio:** scnexus.mabelgroup.com.ec
