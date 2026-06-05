# Comandos — auditoría srv-mabuiosapi

Ejecutar en el servidor como usuario con `sudo`. Guardar salida en `deploy/production-audit/srv-mabuiosapi/` si se versiona en git (sin certificados ni claves).

---

## Sitios Apache activos

```bash
sudo apache2ctl -S
sudo ls -la /etc/apache2/sites-enabled/
```

---

## Nginx host

```bash
sudo nginx -t
sudo nginx -T 2>/dev/null | grep -E '^\s*(listen |server_name )'
sudo ls -la /etc/nginx/sites-enabled/
sudo ls -la /etc/nginx/conf.d/
```

---

## Puertos

```bash
sudo ss -tlnp | grep -E 'apache|nginx|:80|:443|:3000|:3001|:8082'
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
```

---

## Front actual (sin git)

```bash
ls -la /storage/scnexus/
ls -la /storage/scnexus/dist/ | head -20
```

---

## Exportar configs al repo (en el servidor, luego scp)

```bash
AUDIT=~/scnexus-prod-audit-$(date +%Y%m%d)
mkdir -p "$AUDIT/apache" "$AUDIT/nginx"

sudo cp /etc/apache2/sites-available/scnexus.conf "$AUDIT/apache/"
sudo cp /etc/apache2/sites-available/intranet.conf "$AUDIT/apache/"
sudo cp /etc/apache2/sites-available/storecontrol.conf "$AUDIT/apache/" 2>/dev/null || true
sudo cp /etc/apache2/sites-available/sitio.conf "$AUDIT/apache/" 2>/dev/null || true
sudo cp /etc/apache2/sites-available/glpi.conf "$AUDIT/apache/" 2>/dev/null || true

sudo cp /etc/nginx/sites-available/scnexus "$AUDIT/nginx/" 2>/dev/null || true
sudo cp /etc/nginx/conf.d/scnexus-front.conf "$AUDIT/nginx/" 2>/dev/null || true

sudo apache2ctl -S > "$AUDIT/apache2ctl-S.txt" 2>&1
sudo nginx -T > "$AUDIT/nginx-T.txt" 2>/dev/null
docker ps > "$AUDIT/docker-ps.txt"
sudo ss -tlnp > "$AUDIT/ss-tlnp.txt"

tar -czf "$AUDIT.tar.gz" -C "$(dirname "$AUDIT")" "$(basename "$AUDIT")"
echo "Paquete: $AUDIT.tar.gz"
```

Desde tu PC:

```bash
scp user@srv-mabuiosapi:~/scnexus-prod-audit-*.tar.gz .
```

Copiar al repo:

```text
deploy/production-audit/srv-mabuiosapi/apache/
deploy/production-audit/srv-mabuiosapi/nginx/
```

---

## Verificar que intranet no se rompió (post-corte SCNexus)

```bash
curl -sS -o /dev/null -w "intranet HTTPS: %{http_code}\n" https://intranet.mabelgroup.com.ec/
curl -sS -o /dev/null -w "scnexus HTTPS: %{http_code}\n" https://scnexus.mabelgroup.com.ec/
```

---

## MBA3 504 en `/api/Auth/me` — aislamiento de redes Docker

`/api/Auth/me` proxea a MBA3 (puerto 8000). Si el contenedor `scnexus-front` no está en la misma red Docker que `mba3-api`, la conexión hace timeout aunque MBA3 responda bien desde el host.

```bash
# 1) MBA3 responde desde el host (debe dar 401 en <1s)
curl -sS -o /dev/null -w "mba3 host: %{http_code} time:%{time_total}\n" --connect-timeout 10 \
  http://127.0.0.1:8000/api/Auth/me

# 2) MBA3 desde DENTRO del contenedor (debe dar 401; si da timeout → problema de red)
docker exec scnexus-front wget -qO- --timeout=10 \
  http://host.docker.internal:8000/api/Auth/me 2>&1 | head -3

# Si (1) OK pero (2) timeout → scnexus-front no está en la red de mba3-api
docker inspect mba3-api | grep -A3 '"Networks"'
# → mba3-consultas_default

# 3) Verificar que el compose tiene la red externa declarada
grep -A4 'mba3_net' /opt/frontend/scnexus-front/docker-compose.yml

# 4) Verificar upstream horneado en la imagen
docker exec scnexus-front grep 'location = /api/Auth/me' -A2 /etc/nginx/conf.d/default.conf
# Debe mostrar: proxy_pass http://mba3-api:8000;

# 5) Si UPSTREAM_MBA3 en active.docker.env sigue siendo host.docker.internal — corregir y rebuild
sed -i 's|UPSTREAM_MBA3=.*|UPSTREAM_MBA3=http://mba3-api:8000|' deploy/env/active.docker.env
sed -i 's|UPSTREAM_MBA3_AUTH=.*|UPSTREAM_MBA3_AUTH=http://mba3-api:8000|' deploy/env/active.docker.env
docker compose --env-file deploy/env/active.docker.env up -d --build
```

**Causa raíz:** `host.docker.internal` resuelve a `172.17.0.1` (bridge docker0), pero iptables de Docker bloquea tráfico entre redes de contenedores distintos a través del host. **Solución permanente:** red externa `mba3-consultas_default` en `docker-compose.yml` + upstream `http://mba3-api:8000`.

---

## Core Auth: 5053 vs 192.168.2.12:8080

En prod, login debe ir al mismo Core que Apache viejo (`192.168.2.12:8080`). El contenedor local `:5053` puede devolver 500 en `/api/Auth/login`.

```bash
# Comparar (sin pegar contraseña real en logs compartidos)
curl -sS -o /dev/null -w "5053: %{http_code}\n" -X POST http://127.0.0.1:5053/api/Auth/login \
  -H "Content-Type: application/json" -d '{"username":"USER","password":"***","useActiveDirectory":true}'
curl -sS -o /dev/null -w "Core prod: %{http_code}\n" -X POST http://192.168.2.12:8080/api/Auth/login \
  -H "Content-Type: application/json" -d '{"username":"USER","password":"***","useActiveDirectory":true}'

# active.env
grep UPSTREAM_CORE deploy/env/active.env
# Debe ser: UPSTREAM_CORE=http://192.168.2.12:8080

cd /opt/frontend/scnexus-front
docker compose -f docker-compose.yml -f docker-compose.prod-network.yml \
  --env-file deploy/env/active.env up -d --build
docker network connect bridge scnexus-front 2>/dev/null || true
docker exec scnexus-front grep 'location /api/Auth/' -A1 /etc/nginx/conf.d/default.conf
```

---

## Caja chica (504 en `/caja-chica-api/`)

El front llama `/caja-chica-api/Almacenes` → Nginx reescribe a `/api/Almacenes` en el upstream `UPSTREAM_CAJA_CHICA`.
Core (`/api/Users`) puede responder **200** mientras cajachica hace **504** si el upstream está mal.

| Síntoma | Causa habitual |
|---------|----------------|
| `Users` 200, `Almacenes` / `UsuariosAlmacenes` 504 | `UPSTREAM_CAJA_CHICA` apunta a IP bridge obsoleta (`172.17.0.2`) o `scnexus-front` no está en `bridge` |
| Host `127.0.0.1:8092` OK, vía `:8082/caja-chica-api/` 504 | Upstream horneado en la imagen no coincide con `active.env` (falta `--build`) |

```bash
# 1) API cajachica en el host
curl -sS -o /dev/null -w "cajachica host: %{http_code}\n" --connect-timeout 10 \
  "http://127.0.0.1:8092/api/Almacenes"

docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep -i caja

# 2) Descubrir upstream correcto
bash /opt/frontend/scnexus-front/deploy/scripts/discover-caja-chica-upstream.sh

# 3) Conectar front a bridge (si usa IP del contenedor cajachica)
docker network connect bridge scnexus-front 2>/dev/null || true

# 4) Ver upstream horneado y active.env
docker exec scnexus-front grep -A3 'location /caja-chica-api/' /etc/nginx/conf.d/default.conf
grep UPSTREAM_CAJA_CHICA /opt/frontend/scnexus-front/deploy/env/active.env

# 5) Tras corregir active.env — rebuild obligatorio
cd /opt/frontend/scnexus-front
docker compose -f docker-compose.yml -f docker-compose.prod-network.yml \
  --env-file deploy/env/active.env up -d --build

curl -sS -o /dev/null -w "caja via front: %{http_code}\n" --connect-timeout 15 \
  "http://127.0.0.1:8082/caja-chica-api/Almacenes"
```

---

## Empleados (404) y PYG (504)

| Ruta | Prod antiguo (Nginx :3001) | `active.env` Docker |
|------|----------------------------|---------------------|
| `/employees-api/` | PHP fastcgi en host (`/opt/klienteV1/cws/api/`) | `UPSTREAM_EMPLOYEES=http://host.docker.internal:3001` |
| `/pyg-api/` | `127.0.0.1:5171` (host→contenedor **8080**) | `UPSTREAM_PYG=http://scnexus-pyg-api:8080` + red `scnexus-pyg_default` |

```bash
# Empleados (debe ser 200, no 404)
curl -sS -o /dev/null -w "employees: %{http_code}\n" \
  "http://127.0.0.1:8082/employees-api/store_employees.php?health=1"

# PYG (no 504)
curl -sS -o /dev/null -w "pyg: %{http_code}\n" --connect-timeout 15 \
  "http://127.0.0.1:8082/pyg-api/uploads"

docker inspect scnexus-pyg-api --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'
```

---

## Conciliación (504 en `/conciliacion-api/`)

Mismo patrón que PYG: `host.docker.internal:8005` → timeout; usar red Docker del contenedor.

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep -i concili
docker inspect app-conciliacion --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'

# Probar puerto interno (srv-mabuiosapi: 8005->8000/tcp → :8000)
docker run --rm --network conciliacion-bancaria_default curlimages/curl:latest \
  -sS -o /dev/null -w "%{http_code}\n" --connect-timeout 15 \
  "http://app-conciliacion:8000/api/v1/reportes/dashboard?mm=05&yyyy=2026"

# active.env: UPSTREAM_CONCILIACION=http://app-conciliacion:8000
# compose: red conciliacion-bancaria_default en docker-compose.prod-network.yml
docker compose -f docker-compose.yml -f docker-compose.prod-network.yml \
  --env-file deploy/env/active.env up -d --build

curl -sS -o /dev/null -w "conciliacion via 8082: %{http_code}\n" --connect-timeout 20 \
  "http://127.0.0.1:8082/conciliacion-api/api/v1/reportes/dashboard?mm=05&yyyy=2026"
```

---

## Slayer / integración caja chica (504 en `/slayer-api/`)

`host.docker.internal` **no existe en la shell del host Linux**. El `curl` desde `root@srv-mabuiosapi` debe usar `127.0.0.1`. El nombre solo funciona **dentro** de `scnexus-front` (ver `extra_hosts` en `docker-compose.yml`).

| Dónde probar | URL Slayer |
|--------------|------------|
| Shell del host | `http://127.0.0.1:8093` |
| Contenedor `scnexus-front` | `http://host.docker.internal:8093` o `http://172.17.0.1:8093` |
| Navegador / Apache | `https://scnexus.../slayer-api/...` → Nginx del front :8082 |

```bash
# 1) Slayer en el host (api-slayer publicado en :8093)
curl -sS -o /dev/null -w "slayer host: %{http_code} time:%{time_total}\n" --connect-timeout 15 \
  "http://127.0.0.1:8093/api/health"

docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep -i slayer

# 2) Desde el contenedor del front (como Nginx hace el proxy)
docker exec scnexus-front wget -qO- --timeout=15 \
  "http://host.docker.internal:8093/api/health" 2>&1 | head -5
# Si falla, probar gateway bridge:
docker exec scnexus-front wget -qO- --timeout=15 \
  "http://172.17.0.1:8093/api/health" 2>&1 | head -5

# 3) Upstream horneado en la imagen (debe coincidir con active.env al build)
docker exec scnexus-front grep -A6 'location /slayer-api/' /etc/nginx/conf.d/default.conf

grep UPSTREAM_SLAYER /opt/frontend/scnexus-front/deploy/env/active.env

# 4) Ruta completa vía front (:8082)
curl -sS -o /dev/null -w "slayer via front: %{http_code}\n" --connect-timeout 15 \
  "http://127.0.0.1:8082/slayer-api/health"

# Tras cambiar UPSTREAM_SLAYER: rebuild obligatorio
cd /opt/frontend/scnexus-front
docker compose -f docker-compose.yml -f docker-compose.prod-network.yml \
  --env-file deploy/env/active.env up -d --build
```

**Patrón típico (srv-mabuiosapi):**

| Prueba | Resultado | Significado |
|--------|-----------|-------------|
| Host `127.0.0.1:8093` | `404` en ~0.01s | Slayer **sí** escucha en el host (404 = ruta `/api/health` puede no existir; la conexión funciona). |
| Contenedor → `host.docker.internal:8093` | timeout | El front **no** llega al puerto del host → **504** en `/slayer-api/`. |
| `8082/slayer-api/health` | `504` | Nginx del front no alcanza el upstream horneado. |

Causas habituales del timeout contenedor→host:

1. Puerto publicado solo en `127.0.0.1:8093` (no en `0.0.0.0`) — ver `docker port api-slayer` y `ss -tlnp | grep 8093`.
2. Firewall/iptables entre redes Docker y el host.

**Corrección recomendada (misma red Docker que `api-slayer`):**

```bash
bash /opt/frontend/scnexus-front/deploy/scripts/discover-slayer-upstream.sh

# Ejemplo tras descubrir red y puerto interno (p. ej. 8080, no 8093):
docker network connect <red-de-api-slayer> scnexus-front
# deploy/env/active.env:
#   UPSTREAM_SLAYER=http://api-slayer:8080
cd /opt/frontend/scnexus-front
docker compose -f docker-compose.yml -f docker-compose.prod-network.yml \
  --env-file deploy/env/active.env up -d --build

docker exec scnexus-front wget -qO- --timeout=5 "http://api-slayer:8080/api/" 2>&1 | head -3
curl -sS -o /dev/null -w "slayer via front: %{http_code}\n" --connect-timeout 15 \
  "http://127.0.0.1:8082/slayer-api/"
```

**Corrección validada en srv-mabuiosapi** (contenedor no alcanza `host.docker.internal`, pero sí la IP LAN del host):

```env
UPSTREAM_SLAYER=http://192.168.2.153:8093
```

```bash
docker exec scnexus-front wget -qO- --timeout=5 "http://192.168.2.153:8093/api/" 2>&1 | head -3
# deploy/env/active.env → rebuild → curl 127.0.0.1:8082/slayer-api/ no debe ser 504
```

Si (1) responde rápido (2xx/404) pero (2) hace **timeout** → no sirve `host.docker.internal`; usar red Docker o IP del contenedor.

Si (1) y (2) OK pero integrar liquidación sigue en 504 → Slayer/SAP tarda más de `proxy_read_timeout` (180s en plantilla) o SAP no responde en prod; revisar logs de `api-slayer`.

---

## Maestro / artículos (504 en `/maestro-api/`)

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep -i maestro
# Ejemplo: 8004->8000/tcp → UPSTREAM_MAESTRO=http://app-maestro:8000

docker run --rm --network articulomaestro_default curlimages/curl:latest \
  -sS -o /dev/null -w "directo: %{http_code}\n" --connect-timeout 15 \
  "http://app-maestro:8000/api/v1/articulos/?page=1&pageSize=1"

# active.env + rebuild + red en docker-compose.prod-network.yml
```
