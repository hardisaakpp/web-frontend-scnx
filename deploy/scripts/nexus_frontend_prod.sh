#!/usr/bin/env bash
# Despliegue SCNexus Frontend en PRODUCCIÓN (srv-mabuiosapi / scnexus.mabelgroup.com.ec).
# Mismo flujo que DESA: git pull + active.env + docker compose up --build.
#
# Requisitos previos (una vez):
#   - Clone git del repo (ej. /opt/frontend/scnexus-front) — /storage/scnexus/dist NO es un repo
#   - deploy/env/active.env desde prod-mabuiosapi.env.example
#   - Apache 003-scnexus.conf apuntando a http://127.0.0.1:8082/ (ver docs/DEPLOYMENT_PROD_SRV_MABUIOSAPI.md)
#
# Instalación del script:
#   cp /opt/frontend/scnexus-front/deploy/scripts/nexus_frontend_prod.sh ~/deploys/nexus_frontend_prod.sh
#   chmod +x ~/deploys/nexus_frontend_prod.sh
#
# Uso:
#   sh ~/deploys/nexus_frontend_prod.sh

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/frontend/scnexus-front}"
LOG_FILE="${LOG_FILE:-$HOME/deploys/scnexus-front-prod.log}"
ACTIVE_ENV="deploy/env/active.env"
PROD_EXAMPLE="deploy/env/prod-mabuiosapi.env.example"

cd "$PROJECT_DIR" || { echo "No existe $PROJECT_DIR — clonar el repo primero (ver docs/DEPLOYMENT_PROD_SRV_MABUIOSAPI.md)"; exit 1; }

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Rama actual: $BRANCH"

echo "Actualizando repositorio..."
git pull origin "$BRANCH"

if [[ ! -f "$ACTIVE_ENV" ]]; then
  cp "$PROD_EXAMPLE" "$ACTIVE_ENV"
  echo "Creado $ACTIVE_ENV desde prod-mabuiosapi.env.example — revisa UPSTREAM_* con: docker ps"
fi

# shellcheck disable=SC1090
set -a
source "$ACTIVE_ENV"
set +a
FRONT_PORT="${SCNEXUS_FRONT_PORT:-8082}"

echo "Build y levantar scnexus-front (Nginx en host :${FRONT_PORT})..."
mkdir -p "$(dirname "$LOG_FILE")"
{
  echo "=== $(date -Iseconds) prod deploy branch=$BRANCH port=$FRONT_PORT ==="
  docker compose --env-file "$ACTIVE_ENV" up -d --build
  docker ps --filter name=scnexus-front --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
} 2>&1 | tee -a "$LOG_FILE"

echo "Front Docker listo."
echo "  Logs: $LOG_FILE"
echo "  Prueba local: curl -I http://127.0.0.1:${FRONT_PORT}/"
echo "  Público (tras corte Apache): https://scnexus.mabelgroup.com.ec/"
echo "  Doc: docs/DEPLOYMENT_PROD_SRV_MABUIOSAPI.md"
