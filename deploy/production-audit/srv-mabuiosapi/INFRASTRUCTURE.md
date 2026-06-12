# Infraestructura srv-mabuiosapi — producción

Host: **srv-mabuiosapi**  
Auditoría: **2026-03-21**

---

## 1. Mapa de sitios Apache (HTTPS :443)

Salida de `sudo apache2ctl -S`:

| Orden | ServerName | Archivo enabled | ¿Relacionado con SCNexus front? |
|-------|------------|-----------------|--------------------------------|
| default | `sapi` (+ alias `192.168.2.153`) | `000-sitio.conf` → `sitio.conf` | No |
| — | `storecontrol.mabelgroup.com.ec` | `001-storecontrol.conf` | No |
| — | `intranet.mabelgroup.com.ec` | `002-intranet.conf` → `intranet.conf` | No (`DocumentRoot /storage`) |
| — | **`scnexus.mabelgroup.com.ec`** | **`003-scnexus.conf`** → **`scnexus.conf`** | **Sí** |

### Apache :80

| ServerName | Archivo | Notas |
|------------|---------|--------|
| `sapi` (default) | `000-sitio.conf` | |
| `storecontrol.mabelgroup.com.ec` | `001-storecontrol.conf` | |
| `intranet.mabelgroup.com.ec` | `002-intranet.conf` | |
| `192.168.2.153` (alias `glpi.local`) | `glpi.conf` | GLPI, no intranet hostname |

---

## 2. Nginx en el host (no es el contenedor Docker)

| listen | server_name | Config (enabled) | Rol |
|--------|-------------|------------------|-----|
| **3000** | `srv-mabuiosapi.mabeltrading.com` | (incluido en `nginx -T`) | **Otro sitio** — no tocar por migración SCNexus |
| **3001** | **`scnexus.mabelgroup.com.ec`** | `sites-enabled/scnexus` → `sites-available/scnexus` | Front actual: `root /storage/scnexus/dist` + proxy APIs |
| — | — | `conf.d/scnexus-front.conf` | Revisar contenido en servidor (puede solaparse con `scnexus`) |

---

## 3. Flujo actual de SCNexus (antes de Docker)

```text
                    ┌─────────────────────────────────────────┐
  Usuario HTTPS     │  Apache :443                            │
  scnexus.mabel     │  003-scnexus.conf                       │
  group.com.ec      │  • ProxyPass /api/Auth/me → :8000       │
                    │  • ProxyPass /api/mba3/ → :8000         │
                    │  • ProxyPass /api/Auth/ → 192.168.2.12:8080 (*) │
                    │  • ProxyPass /api/ → 192.168.2.12:8080 (*)      │
                    │  • ProxyPass / → 127.0.0.1:3001         │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │  Nginx :3001 (server_name scnexus…)      │
                    │  root /storage/scnexus/dist               │
                    │  + locations /api, /caja-chica-api, …   │
                    │  + /employees-api (PHP host)            │
                    └──────────────────┬──────────────────────┘
                                       │
         Backends Docker en el host ◄──┘ (8000 MBA3, 5053 Core, 8092 cajachica, …)

(*) En config histórica; validar vs docker ps actual (Core suele ser :5053 en este host).
```

**Front sin git:** `/storage/scnexus/dist` (solo carpetas `dist/`, `backup/`, `backupJos/`).

---

## 4. Flujo objetivo (front Docker)

```text
  Usuario HTTPS
       → Apache :443  (solo 003-scnexus.conf simplificado)
            ProxyPass / → http://127.0.0.1:8082/
       → Contenedor scnexus-front (Nginx :80 interno)
            SPA + proxy UPSTREAM_* (deploy/env/active.env)
```

Los vhosts **intranet**, **storecontrol**, **sapi**, **glpi** no cambian.

---

## 5. Puertos en escucha (referencia 2026-03-21)

| Puerto | Proceso | Servicio / uso |
|--------|---------|----------------|
| 80, 443 | apache2 | Vhosts públicos |
| 3000 | nginx | srv-mabuiosapi.mabeltrading.com |
| 3001 | nginx | scnexus.mabelgroup.com.ec (dist) |
| 8000 | docker-proxy | mba3-api |
| 8004 | docker-proxy | app-maestro |
| 8005 | docker-proxy | app-conciliacion |
| 8006 | docker-proxy | api-reposiciones |
| 8080 | docker-proxy | scnexus-articulo-api (scan) |
| 8082 | *(libre)* | **Reservado** contenedor `scnexus-front` |
| 8083 | docker-proxy | scnexus-validacionci-api |
| 8092 | docker-proxy | cajachica |
| 8093 | docker-proxy | api-slayer |

Comando de verificación: `sudo ss -tlnp | grep -E 'apache|nginx|:443|:3000|:3001|:8082'`

---

## 6. Sitios enabled en Apache (`sites-enabled/`)

```
000-sitio.conf      → sitio.conf
001-storecontrol.conf
002-intranet.conf   → intranet.conf
003-scnexus.conf    → scnexus.conf    ← ÚNICO archivo Apache a editar para el corte
glpi.conf
```

---

## 7. Configuración histórica Nginx :3001 (referencia)

El bloque largo con `root /storage/scnexus/dist` y proxies a `127.0.0.1:8000`, `192.168.2.12:8080`, `192.168.2.153:8080` (cajachica) está documentado en conversación de migración y alineado conceptualmente con:

- `deploy/production-audit/srv-mabuiosapi/nginx/scnexus-host-3001.conf` (prod host :3001)
- `deploy/nginx/scnexus-host.conf.example` (plantilla repo)
- `deploy/nginx/scnexus-docker.conf.template` (contenedor Docker; upstreams vía `active.env`)

**Desfases conocidos vs docker en el mismo host:**

| Ruta / uso | Config antigua (ejemplo) | Prod actual (docker ps) |
|------------|--------------------------|-------------------------|
| Core login `/api/Auth/` | `192.168.2.12:8080` | `192.168.2.12:8080` (Docker prod; :5053 solo local, login 500) |
| Caja chica | `192.168.2.153:8080` | `host.docker.internal:8092` |
| MBA3 | `127.0.0.1:8000` | `host.docker.internal:8000` ✓ |

Plantilla env: `deploy/env/prod-mabuiosapi.env.example`

---

## 8. Apache `scnexus.conf` (resumen conocido)

- SSL en `:443`, `ServerName scnexus.mabelgroup.com.ec`
- APIs en Apache **antes** de Nginx 3001 (`ProxyPass` a :8000 y Core)
- SPA: `ProxyPass / http://127.0.0.1:3001/`
- Tras Docker: un solo `ProxyPass / http://127.0.0.1:8082/` (ver `deploy/apache/003-scnexus-docker.conf.example`)

---

## 9. Intranet (no mezclar con SCNexus)

`intranet.mabelgroup.com.ec` → `002-intranet.conf`:

- `DocumentRoot /storage`
- HTTPS y HTTP separados
- **Independiente** del front SCNexus; no comparte `003-scnexus.conf` ni Nginx :3001

---

## 10. Checklist migración (infra)

- [x] Exportar Apache `sites-available` → `deploy/production-audit/srv-mabuiosapi/apache/`
- [x] Nginx host :3001 → `nginx/scnexus-host-3001.conf` (alineado con plantilla repo)
- [ ] Exportar `/etc/nginx/conf.d/scnexus-front.conf` si existe y difiere
- [ ] Clonar `scnexus-front` en `/opt/frontend/scnexus-front`
- [ ] `deploy/env/active.env` desde `prod-mabuiosapi.env.example`
- [ ] `sh ~/deploys/nexus_frontend_prod.sh` → contenedor en **8082**
- [ ] Probar `curl http://127.0.0.1:8082/`
- [ ] Editar **solo** `003-scnexus.conf` → proxy a **8082**; `apache2ctl configtest`; reload
- [ ] Verificar `https://scnexus.mabelgroup.com.ec/mba3-consultas/proceso`
- [ ] Confirmar intranet / storecontrol / glpi siguen OK
- [ ] Backup `dist/` y configs antes del corte

---

**Última actualización:** 2026-03-21
