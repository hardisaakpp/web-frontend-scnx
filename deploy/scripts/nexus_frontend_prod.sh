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
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod-network.yml)

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

if [[ "${VITE_APP_BASE_PATH:-}" != "/" ]]; then
  echo "ERROR: en prod active.env debe tener VITE_APP_BASE_PATH=/ (actual: ${VITE_APP_BASE_PATH:-vacío})"
  exit 1
fi

echo "Build y levantar scnexus-front (Nginx en host :${FRONT_PORT})..."
mkdir -p "$(dirname "$LOG_FILE")"
{
  echo "=== $(date -Iseconds) prod deploy branch=$BRANCH port=$FRONT_PORT ==="
  docker compose "${COMPOSE_FILES[@]}" --env-file "$ACTIVE_ENV" up -d --build

  # Cajachica en red bridge (172.17.0.2) — no declarar bridge en compose (falla con alias)
  if docker network inspect bridge --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -qw scnexus-front; then
    echo "scnexus-front ya está en red bridge"
  else
    echo "Conectando scnexus-front a red bridge (cajachica 172.17.0.2)..."
    docker network connect bridge scnexus-front
  fi

  docker ps --filter name=scnexus-front --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
} 2>&1 | tee -a "$LOG_FILE"

echo "Front Docker listo."
echo "  Logs: $LOG_FILE"
echo "  Prueba local: curl -I http://127.0.0.1:${FRONT_PORT}/"
echo "  Público (tras corte Apache): https://scnexus.mabelgroup.com.ec/"
echo "  Doc: docs/DEPLOYMENT_PROD_SRV_MABUIOSAPI.md"
