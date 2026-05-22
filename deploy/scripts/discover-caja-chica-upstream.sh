#!/usr/bin/env bash
# Descubre UPSTREAM_CAJA_CHICA para deploy/env/active.env (prod srv-mabuiosapi).
# 504 en /caja-chica-api/ → Nginx del front no alcanza el backend cajachica.
# Ejecutar en el servidor: bash deploy/scripts/discover-caja-chica-upstream.sh
set -euo pipefail

CAJA_NAME="${1:-}"
if [ -z "$CAJA_NAME" ]; then
  CAJA_NAME="$(docker ps --format '{{.Names}}' | grep -Ei 'cajachica|caja-chica|caja_chica' | head -1 || true)"
fi

LAN_IP="${CAJA_CHICA_LAN_IP:-192.168.2.153}"
PROBE_PATH="/api/Almacenes"

echo "=== Caja chica /caja-chica-api/ (504) ==="
echo ""

echo "--- Host: puerto 8092 ---"
if command -v ss >/dev/null 2>&1; then
  ss -tlnp 2>/dev/null | grep -E ':8092\b' || echo "(sin listener en :8092)"
else
  netstat -tlnp 2>/dev/null | grep -E ':8092\b' || true
fi
for path in /api/Almacenes /api/UsuariosAlmacenes; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 5 "http://127.0.0.1:8092${path}" 2>/dev/null || echo '000')"
  echo "  curl 127.0.0.1:8092${path} -> HTTP ${code} (401/403 = API viva; 000 = no responde)"
done
echo ""

if [ -z "$CAJA_NAME" ]; then
  echo "No se encontró contenedor *cajachica* en docker ps."
  echo "Si la API está en el host, pruebe: UPSTREAM_CAJA_CHICA=http://${LAN_IP}:8092"
  exit 1
fi

echo "--- Contenedor: ${CAJA_NAME} ---"
docker ps --filter "name=${CAJA_NAME}" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
docker port "${CAJA_NAME}" 2>/dev/null || true
echo ""

BRIDGE_IP="$(docker inspect "${CAJA_NAME}" --format '{{.NetworkSettings.Networks.bridge.IPAddress}}' 2>/dev/null || true)"
echo "--- IP en red bridge (cambia si recreas el contenedor) ---"
echo "  bridge IP: ${BRIDGE_IP:-(no en bridge)}"
echo ""

test_from_front() {
  local url="$1"
  if docker exec scnexus-front wget -qO- --timeout=5 "$url" >/dev/null 2>&1; then
    echo "  OK  ${url}"
  else
    echo "  FAIL ${url}"
  fi
}

echo "--- Prueba desde scnexus-front (si existe) ---"
if docker ps --format '{{.Names}}' | grep -qx 'scnexus-front'; then
  ON_BRIDGE="$(docker network inspect bridge --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -qw scnexus-front && echo yes || echo no)"
  echo "  scnexus-front en bridge: ${ON_BRIDGE}"
  if [ "$ON_BRIDGE" != yes ]; then
    echo "  AVISO: ejecutar: docker network connect bridge scnexus-front"
  fi
  test_from_front "http://${LAN_IP}:8092${PROBE_PATH}"
  test_from_front "http://host.docker.internal:8092${PROBE_PATH}"
  test_from_front "http://172.17.0.1:8092${PROBE_PATH}"
  if [ -n "$BRIDGE_IP" ]; then
    test_from_front "http://${BRIDGE_IP}:8092${PROBE_PATH}"
  fi
  baked="$(docker exec scnexus-front grep -A3 'location /caja-chica-api/' /etc/nginx/conf.d/default.conf 2>/dev/null | grep proxy_pass || true)"
  echo "  upstream horneado: ${baked:-'(no encontrado)'}"
else
  echo "  (contenedor scnexus-front no está en ejecución)"
fi

echo ""
echo "--- Recomendación active.env ---"
if [ -n "$BRIDGE_IP" ]; then
  echo "  Opción A (bridge; requiere: docker network connect bridge scnexus-front):"
  echo "    UPSTREAM_CAJA_CHICA=http://${BRIDGE_IP}:8092"
  echo "  (NO fijar 172.17.0.2 a mano — la IP cambia al recrear cajachica)"
fi
echo "  Opción B (mismo patrón que Slayer si host.docker.internal hace timeout):"
echo "    UPSTREAM_CAJA_CHICA=http://${LAN_IP}:8092"
echo ""
echo "  Rebuild obligatorio tras cambiar UPSTREAM_CAJA_CHICA:"
echo "    docker compose -f docker-compose.yml -f docker-compose.prod-network.yml \\"
echo "      --env-file deploy/env/active.env up -d --build"
echo ""
echo "  Validar vía front:"
echo "    curl -sS -o /dev/null -w 'caja via 8082: %{http_code}\\n' --connect-timeout 15 \\"
echo "      'http://127.0.0.1:8082/caja-chica-api/Almacenes'"
