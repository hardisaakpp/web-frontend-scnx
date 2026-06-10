# Incidentes de producción — srv-mabuiosapi

Registro cronológico de fallos y correcciones en `scnexus.mabelgroup.com.ec`.

---

## 2026-06-05 — Caída tras reinicio del servidor

**Duración estimada:** ~2–3 h  
**Impacto:** SCNexus inaccesible; login bloqueado; `/api/Auth/me` con 504 permanente.

### Síntoma inicial

```
Proxy Error — The proxy server received an invalid response from an upstream server.
```

Apache devuelve error de proxy porque el contenedor `scnexus-front` estaba parado (`Exited 255`) tras el reinicio del servidor.

---

### Cadena de fallos y correcciones

#### 1. Contenedor parado — `Exited 255`

El contenedor tenía `restart: unless-stopped` pero se detuvo igualmente en el reinicio (comportamiento esperado cuando Docker mismo se reinicia con el sistema).

```bash
docker ps -a | grep scnexus-front
# scnexus-front   Exited (255) 11 minutes ago
docker start scnexus-front
```

**Resultado:** fallo — puerto 8082 ya ocupado.

#### 2. `docker-proxy` huérfano sosteniendo el puerto 8082

Los procesos `docker-proxy` (PIDs 3244, 3252) seguían corriendo del ciclo anterior y no liberaron el puerto 8082 al salir el contenedor. Ni `docker stop`, ni `docker rm`, ni `kill -9` en los PIDs funcionaron: Docker los reiniciaba.

**Corrección:**

```bash
systemctl restart docker
cd /opt/frontend/scnexus-front
docker compose --env-file deploy/env/active.docker.env up -d
```

**Resultado:** nuevo fallo — `host not found in upstream "mba3-api"`.

#### 3. Imagen obsoleta con build args incorrectos

La imagen en caché tenía `MBA3_UPSTREAM=mba3-api` (nombre de servicio Docker de una red distinta, ya eliminada) y `SCNEXUS_FRONT_PORT=8081` en `active.docker.env` mientras Apache espera el puerto 8082.

**Correcciones en `/opt/frontend/scnexus-front/deploy/env/active.docker.env`:**

```env
SCNEXUS_FRONT_PORT=8082      # era 8081
UPSTREAM_MBA3=http://mba3-api:8000  # era http://host.docker.internal:8000 → ver punto 5
```

```bash
docker compose --env-file deploy/env/active.docker.env up -d --build
```

#### 4. Login Core devuelve 504 (`/api/Auth/login`)

`UPSTREAM_CORE` estaba apuntando a `host.docker.internal:8080`, que en este host es `scnexus-articulo-api` (scanner), **no** el Core API.

**Corrección en `active.docker.env`:**

```env
UPSTREAM_CORE=http://192.168.2.12:8080     # era http://host.docker.internal:8080
CORE_PROXY_HOST=192.168.2.12:8080          # era host.docker.internal:8080
```

Rebuild obligatorio (upstream horneado en imagen Nginx).

#### 5. `/api/Auth/me` devuelve 504 — aislamiento de redes Docker

`/api/Auth/me` → Nginx del contenedor → `http://host.docker.internal:8000` (MBA3). La conexión hacía timeout:

```bash
docker exec scnexus-front wget -qO- http://host.docker.internal:8000/api/Auth/me
# wget: can't connect to remote host (172.17.0.1): Operation timed out
```

**Causa raíz:** `scnexus-front` está en la red `scnexus-front_default` y MBA3 (`mba3-api`) en `mba3-consultas_default`. El contenedor Docker no puede alcanzar servicios de otra red a través de `host.docker.internal` (172.17.0.1) porque iptables de Docker bloquea ese tráfico inter-red.

`ss -tlnp | grep :8000` confirmó que MBA3 publica `0.0.0.0:8000` (era alcanzable desde el host, no desde el contenedor).

**Corrección:** unir `scnexus-front` a la red `mba3-consultas_default` como red externa en `docker-compose.yml`:

```yaml
# docker-compose.yml
services:
  scnexus-front:
    networks:
      - default
      - mba3_net

networks:
  default: {}
  mba3_net:
    external: true
    name: mba3-consultas_default
```

```env
# active.docker.env
UPSTREAM_MBA3=http://mba3-api:8000
UPSTREAM_MBA3_AUTH=http://mba3-api:8000
```

```bash
git pull
docker compose --env-file deploy/env/active.docker.env up -d --build
```

---

### Estado de `active.docker.env` al cierre del incidente

```env
UPSTREAM_CORE=http://192.168.2.12:8080
CORE_PROXY_HOST=192.168.2.12:8080
UPSTREAM_MBA3=http://mba3-api:8000
UPSTREAM_MBA3_AUTH=http://mba3-api:8000
UPSTREAM_CAJA_CHICA=http://192.168.2.153:8092
UPSTREAM_PYG=http://host.docker.internal:5171
UPSTREAM_CONCILIACION=http://host.docker.internal:8005
UPSTREAM_SCAN=http://host.docker.internal:8080
UPSTREAM_INVENTARIO=http://host.docker.internal:8082
UPSTREAM_PROMOCION_SOBRES=http://host.docker.internal:8083
UPSTREAM_SLAYER=http://192.168.2.153:8093
SCNEXUS_FRONT_PORT=8082
```

---

### Lecciones aprendidas

| # | Lección |
|---|---------|
| 1 | `restart: unless-stopped` **no garantiza** que el contenedor suba tras un reinicio del SO si el daemon Docker también se reinicia. Usar `restart: always` si se requiere arranque automático garantizado. |
| 2 | Los upstreams de MBA3 (`host.docker.internal`) fallan cuando el contenedor front y MBA3 están en redes Docker distintas. **Siempre usar nombre de servicio + red compartida.** |
| 3 | El puerto 8080 en este host es `scnexus-articulo-api` (scanner), **no** el Core. El Core real es `192.168.2.12:8080` (servidor LAN separado). |
| 4 | Tras un reinicio, verificar que los `docker-proxy` huérfanos no estén sosteniendo puertos con `ss -tlnp | grep 8085`. Si los hay, `systemctl restart docker` es la corrección. |
| 5 | Cualquier cambio de `UPSTREAM_*` requiere `--build` (están horneados en la imagen Nginx). |

---

**Registrado:** 2026-06-05  
**Autor:** Carlos Ortiz

---

## 2026-06-10 — Conflicto persistente en puerto 8082 tras reinicio del servidor

**Duración estimada:** resuelto en la sesión  
**Impacto:** `scnexus-front` no podía iniciar tras reinicios del servidor; requería intervención manual cada vez.

### Síntoma

Después del incidente 2026-06-05, al volver a reiniciar el servidor el contenedor fallaba de nuevo con:

```
Bind for 0.0.0.0:8082 failed: port is already allocated
```

### Causa raíz

Dos factores combinados:

1. **`docker-proxy` huérfano** — los procesos `docker-proxy` del ciclo anterior retienen el puerto al reiniciarse el daemon Docker.
2. **Store Control ocupa el 8082** — otro servicio del host arranca en el puerto 8082 durante el inicio del SO, generando conflicto permanente con ese puerto.

### Corrección

Cambio de puerto permanente de **8082 → 8085** en todos los archivos de configuración:

| Archivo | Cambio |
|---------|--------|
| `deploy/env/active.env` (servidor, gitignored) | `SCNEXUS_FRONT_PORT=8082` → `8085` |
| `deploy/env/active.docker.env` | `SCNEXUS_FRONT_PORT=8081` → `8085` |
| `deploy/env/prod-mabuiosapi.env.example` | `8082` → `8085` |
| `docker-compose.yml` | port mapping default `8085` |
| `deploy/apache/003-scnexus-docker.conf.example` | `8082` → `8085` |
| `deploy/scripts/nexus_frontend_prod.sh` | fallback `8082` → `8085` |
| Apache `/etc/apache2/sites-enabled/003-scnexus.conf` (servidor) | `ProxyPass / http://127.0.0.1:8082/` → `:8085/` |

Adicionalmente se agregó `docker image prune -f` al script `nexus_frontend_prod.sh` para limpiar imágenes `<none>:<none>` automáticamente tras cada build.

### Verificación post-corrección

```bash
ss -tlnp | grep 8085
# LISTEN docker-proxy — solo scnexus-front usa 8085, nada más en el host

docker inspect scnexus-front --format '{{.HostConfig.RestartPolicy.Name}}'
# unless-stopped ← garantiza reinicio automático tras reboot del SO
```

### Lecciones aprendidas

| # | Lección |
|---|---------|
| 1 | El puerto asignado al contenedor debe ser exclusivo en el host. Verificar con `ss -tlnp` antes de elegir el puerto y confirmar que ningún otro servicio (Docker o nativo) lo ocupe durante el arranque. |
| 2 | `restart: unless-stopped` sí garantiza que el contenedor levante tras reboot del SO, siempre que no haya conflicto de puerto al arrancar. El problema del 2026-06-05 era el conflicto de puerto, no la política de restart. |

---

**Registrado:** 2026-06-10  
**Autor:** Carlos Ortiz
