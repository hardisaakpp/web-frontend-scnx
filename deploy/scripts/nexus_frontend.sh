#!/usr/bin/env bash
# Despliegue SCNexus Frontend en DESA (desa-mabuiosapp).
# Un solo front: contenedor Nginx + SPA en SCNEXUS_FRONT_PORT (default 8082).
# Cajachica sigue en :8081 como upstream; no comparte puerto con el front.
#
# Instalación en el servidor (una vez):
#   cp /opt/frontend/scnexus-front/deploy/scripts/nexus_frontend.sh ~/deploys/nexus_frontend.sh
#   chmod +x ~/deploys/nexus_frontend.sh
#
# Uso: sh ~/deploys/nexus_frontend.sh

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/frontend/scnexus-front}"
LOG_FILE="${LOG_FILE:-/home/admindesa/deploys/scnexus-front.log}"
ACTIVE_ENV="deploy/env/active.env"
DESA_EXAMPLE="deploy/env/desa.env.example"

cd "$PROJECT_DIR" || { echo "No existe $PROJECT_DIR"; exit 1; }

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Rama actual: $BRANCH"

echo "Deteniendo Vite (despliegue anterior en :3000)..."
pkill -f "vite --host 0.0.0.0 --port 3000" 2>/dev/null || pkill -f "/opt/frontend/scnexus-front/node_modules/.bin/vite" 2>/dev/null || true
sleep 2

echo "Bajando contenedor dev antiguo (si existía)..."
docker compose -f docker-compose.dev.yml down 2>/dev/null || true

echo "Actualizando repositorio..."
git pull origin "$BRANCH"

if [[ ! -f "$ACTIVE_ENV" ]]; then
  cp "$DESA_EXAMPLE" "$ACTIVE_ENV"
  echo "Creado $ACTIVE_ENV desde desa.env.example — revisa UPSTREAM_* con: docker ps"
fi

# shellcheck disable=SC1090
set -a
source "$ACTIVE_ENV"
set +a
FRONT_PORT="${SCNEXUS_FRONT_PORT:-8082}"

echo "Build y levantar scnexus-front (Nginx en host :${FRONT_PORT})..."
{
  echo "=== $(date -Iseconds) deploy branch=$BRANCH port=$FRONT_PORT ==="
  docker compose --env-file "$ACTIVE_ENV" up -d --build
  docker ps --filter name=scnexus-front --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
} 2>&1 | tee -a "$LOG_FILE"

echo "Front Docker listo."
echo "  Logs: $LOG_FILE"
echo "  URL directa: http://$(hostname -I 2>/dev/null | awk '{print $1}'):${FRONT_PORT}/scnexus-front/"
echo "  Si antes usabas :3000, actualiza bookmarks o Nginx del host a :${FRONT_PORT}."
