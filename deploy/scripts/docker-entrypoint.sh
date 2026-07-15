#!/bin/sh
set -e

# ==============================================================================
# 1. DEFAULT VALUES (Fallback)
# ==============================================================================
export UPSTREAM_MBA3=${UPSTREAM_MBA3:-http://host.docker.internal:8000}
export UPSTREAM_CORE=${UPSTREAM_CORE:-http://210.17.1.53:5053/}
export CORE_PROXY_HOST=${CORE_PROXY_HOST:-210.17.1.53:5053}
export UPSTREAM_CAJA_CHICA=${UPSTREAM_CAJA_CHICA:-http://192.168.2.153:8092}
export UPSTREAM_EMPLOYEES=${UPSTREAM_EMPLOYEES:-http://host.docker.internal:3001}
export UPSTREAM_PYG=${UPSTREAM_PYG:-http://host.docker.internal:5171}
export UPSTREAM_SCAN=${UPSTREAM_SCAN:-http://host.docker.internal:8080}
export UPSTREAM_PROMOCION_SOBRES=${UPSTREAM_PROMOCION_SOBRES:-http://host.docker.internal:8083}
export UPSTREAM_INVENTARIO=${UPSTREAM_INVENTARIO:-http://host.docker.internal:8082}
export UPSTREAM_INV_PLANES=${UPSTREAM_INV_PLANES:-$UPSTREAM_INVENTARIO}
export UPSTREAM_CONCILIACION=${UPSTREAM_CONCILIACION:-http://host.docker.internal:8005}
export UPSTREAM_MAESTRO=${UPSTREAM_MAESTRO:-http://host.docker.internal:8004}
export UPSTREAM_REPOSICION=${UPSTREAM_REPOSICION:-http://host.docker.internal:8006}
export UPSTREAM_SLAYER=${UPSTREAM_SLAYER:-http://192.168.2.153:8093}
export UPSTREAM_RULETA=${UPSTREAM_RULETA:-http://host.docker.internal:5006}

# ==============================================================================
# 2. SMART MAPPING (localhost -> host.docker.internal)
# ==============================================================================
for var in $(env | grep -oE '^UPSTREAM_[A-Z0-9_]+'); do
    val=$(eval echo \$$var)
    case "$val" in
        *localhost*|*127.0.0.1*)
            new_val=$(echo "$val" | sed -e 's/localhost/host.docker.internal/g' -e 's/127.0.0.1/host.docker.internal/g')
            echo "Mapping $var: $val -> $new_val"
            export "$var=$new_val"
            ;;
    esac
done

# ==============================================================================
# 3. NGINX CONFIG GENERATION
# ==============================================================================
TEMPLATE="/etc/nginx/templates/default.conf.template"
OUTPUT="/etc/nginx/conf.d/default.conf"

# List variables to substitute (prevents envsubst from breaking nginx internal vars like $host)
VARS=$(env | grep -oE '^(UPSTREAM_[A-Z0-9_]+|CORE_PROXY_HOST)' | sed 's/^/$/' | tr '\n' ',' | sed 's/,$//')

echo "Generating Nginx config with variables: $VARS"
envsubst "$VARS" < "$TEMPLATE" > "$OUTPUT"

echo "Activation complete. Starting Nginx..."
exec nginx -g 'daemon off;'
