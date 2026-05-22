#!/usr/bin/env bash
# Descubre cómo debe configurarse UPSTREAM_SLAYER en deploy/env/active.env (prod).
# Ejecutar en el servidor: bash deploy/scripts/discover-slayer-upstream.sh
set -euo pipefail

SLAYER_NAME="${1:-}"
if [ -z "$SLAYER_NAME" ]; then
  SLAYER_NAME="$(docker ps --format '{{.Names}}' | grep -Ei 'slayer' | head -1 || true)"
fi

echo "=== Slayer / integración (504 en /slayer-api/) ==="
echo ""

echo "--- Host: puerto 8093 ---"
if command -v ss >/dev/null 2>&1; then
  ss -tlnp 2>/dev/null | grep -E ':8093\b' || echo "(sin listener en :8093)"
else
  netstat -tlnp 2>/dev/null | grep -E ':8093\b' || true
fi
for path in /api/health /health /api/; do
  code="$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 3 "http://127.0.0.1:8093${path}" 2>/dev/null || echo '000')"
  echo "  curl 127.0.0.1:8093${path} -> HTTP ${code}"
done
echo ""

if [ -z "$SLAYER_NAME" ]; then
  echo "No se encontró contenedor *slayer* en docker ps."
  echo "Si Slayer está en otro servidor, use UPSTREAM_SLAYER=http://<IP>:8093 (ej. 192.168.2.153:8093)."
  exit 1
fi

echo "--- Contenedor: ${SLAYER_NAME} ---"
docker ps --filter "name=${SLAYER_NAME}" --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
echo ""
docker port "${SLAYER_NAME}" 2>/dev/null || true
echo ""

BINDING="$(docker port "${SLAYER_NAME}" 2>/dev/null | head -1 || true)"
if echo "$BINDING" | grep -q '127.0.0.1:'; then
  echo "AVISO: el puerto publicado solo en 127.0.0.1 — otros contenedores NO pueden usar host.docker.internal:8093."
  echo "  Solución: republicar en 0.0.0.0 O conectar scnexus-front a la red Docker de api-slayer (recomendado)."
  echo ""
fi

echo "--- Redes Docker ---"
docker inspect "${SLAYER_NAME}" --format '{{range $name, $cfg := .NetworkSettings.Networks}}  {{$name}}  IP={{$cfg.IPAddress}}  Aliases={{join $cfg.Aliases ","}}{{println}}{{end}}'

FIRST_NET="$(docker inspect "${SLAYER_NAME}" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{"\n"}}{{end}}' | head -1)"
INTERNAL_PORT="$(docker inspect "${SLAYER_NAME}" --format '{{range $p, $cfg := .NetworkSettings.Ports}}{{if $cfg}}{{(index $cfg 0).HostPort}}->{{$p}}{{end}}{{end}}' 2>/dev/null | sed -n 's/.*->\([0-9]*\)\/.*/\1/p' | head -1)"

# Puerto interno del contenedor (primer mapeo host->container)
CONTAINER_PORT="$(docker port "${SLAYER_NAME}" 2>/dev/null | sed -n 's/.*:\([0-9]*\)->.*/\1/p' | head -1)"
if [ -z "$CONTAINER_PORT" ]; then
  CONTAINER_PORT="${INTERNAL_PORT:-8093}"
fi

echo ""
echo "--- Prueba desde scnexus-front (si existe) ---"
if docker ps --format '{{.Names}}' | grep -qx 'scnexus-front'; then
  for url in \
    "http://host.docker.internal:8093/api/" \
    "http://172.17.0.1:8093/api/" \
    "http://${SLAYER_NAME}:${CONTAINER_PORT}/api/"; do
    if docker exec scnexus-front wget -qO- --timeout=5 "$url" >/dev/null 2>&1; then
      echo "  OK  ${url}"
    else
      echo "  FAIL ${url}"
    fi
  done
else
  echo "  (contenedor scnexus-front no está en ejecución)"
fi

echo ""
echo "--- Recomendación active.env ---"
if [ -n "$FIRST_NET" ]; then
  echo "  1) Conectar el front a la red de Slayer:"
  echo "       docker network connect ${FIRST_NET} scnexus-front"
  echo "  2) En deploy/env/active.env:"
  echo "       UPSTREAM_SLAYER=http://${SLAYER_NAME}:${CONTAINER_PORT}"
  echo "  3) Rebuild:"
  echo "       docker compose -f docker-compose.yml -f docker-compose.prod-network.yml \\"
  echo "         --env-file deploy/env/active.env up -d --build"
else
  echo "  UPSTREAM_SLAYER=http://172.17.0.1:8093"
  echo "  (o IP del contenedor slayer si host.docker.internal hace timeout)"
fi
echo ""
