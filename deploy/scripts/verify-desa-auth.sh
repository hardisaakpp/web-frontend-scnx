#!/usr/bin/env bash
# Comprueba reachability de login (Core) y Auth/me (MBA3) desde el host DESA.
# Uso: bash deploy/scripts/verify-desa-auth.sh

set -euo pipefail

FRONT_PORT="${SCNEXUS_FRONT_PORT:-8082}"
CORE_URL="${UPSTREAM_CORE:-http://127.0.0.1:5053}"
MBA3_URL="${UPSTREAM_MBA3_AUTH:-${UPSTREAM_MBA3:-http://127.0.0.1:8000}}"

echo "=== Front Nginx (:${FRONT_PORT}) ==="
curl -sS -o /dev/null -w "GET /scnexus-front/ → %{http_code}\n" "http://127.0.0.1:${FRONT_PORT}/scnexus-front/" || true

echo "=== Core directo (${CORE_URL}) ==="
curl -sS -o /dev/null -w "POST /api/Auth/login (sin body) → %{http_code}\n" \
  -X POST "${CORE_URL}/api/Auth/login" \
  -H 'Content-Type: application/json' \
  -d '{}' || true

echo "=== Login vía front (proxy Nginx en contenedor) ==="
curl -sS -o /dev/null -w "POST /api/Auth/login → %{http_code}\n" \
  -X POST "http://127.0.0.1:${FRONT_PORT}/api/Auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"userName":"test","password":"test","useActiveDirectory":false}' || true

echo "=== MBA3 Auth/me (${MBA3_URL}) ==="
curl -sS -o /dev/null -w "GET /api/Auth/me (sin token) → %{http_code}\n" \
  "${MBA3_URL}/api/Auth/me" || true

echo ""
echo "Interpretación:"
echo "  - 401/400 en login = proxy OK, revisar credenciales o AD en Core"
echo "  - 502/504 vía :${FRONT_PORT} = UPSTREAM_CORE o CORE_PROXY_HOST incorrectos → rebuild"
echo "  - 500 en login = Core recibe la petición; ver logs: docker logs scnexus-core-api"
