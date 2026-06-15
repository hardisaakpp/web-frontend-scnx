#!/bin/sh
set -e

# ==============================================================================
# 1. GENERATE public/config.js (Runtime Frontend Config)
# ==============================================================================
CONFIG_FILE="/usr/share/nginx/html/config.js"
echo "window.CONFIG = {" > $CONFIG_FILE

# Convert all VITE_ environment variables to window.CONFIG entries
env | grep '^VITE_' | while read -r line; do
    key=$(echo $line | cut -d'=' -f1)
    value=$(echo $line | cut -d'=' -f2- | sed "s/'/\\\\'/g")
    echo "  $key: '$value'," >> $CONFIG_FILE
done

echo "};" >> $CONFIG_FILE

# ==============================================================================
# 2. GENERATE Nginx Configuration (Runtime Backend Proxy)
# ==============================================================================
# Placeholders: __*_UPSTREAM__
TEMPLATE="/tmp/scnexus-docker.conf.template"
OUTPUT="/etc/nginx/conf.d/default.conf"

if [ -f "$TEMPLATE" ]; then
    echo "Generating Nginx config from template..."
    
    # Use environment variables if present, otherwise use defaults
    MBA3_UPSTREAM=${UPSTREAM_MBA3:-${MBA3_UPSTREAM:-http://host.docker.internal:8000}}
    CORE_UPSTREAM=${UPSTREAM_CORE:-${CORE_UPSTREAM:-http://192.168.2.12:8080}}
    CORE_PROXY_HOST=${CORE_PROXY_HOST:-host.docker.internal:5053}
    CAJA_CHICA_UPSTREAM=${UPSTREAM_CAJA_CHICA:-${CAJA_CHICA_UPSTREAM:-http://192.168.2.153:8092}}
    EMPLOYEES_UPSTREAM=${UPSTREAM_EMPLOYEES:-${EMPLOYEES_UPSTREAM:-http://host.docker.internal:3001}}
    PYG_UPSTREAM=${UPSTREAM_PYG:-${PYG_UPSTREAM:-http://host.docker.internal:5171}}
    SCAN_API_UPSTREAM=${UPSTREAM_SCAN:-${SCAN_API_UPSTREAM:-http://host.docker.internal:8080}}
    PROMOCION_SOBRES_UPSTREAM=${UPSTREAM_PROMOCION_SOBRES:-${PROMOCION_SOBRES_UPSTREAM:-http://host.docker.internal:8083}}
    INVENTARIO_UPSTREAM=${UPSTREAM_INVENTARIO:-${INVENTARIO_UPSTREAM:-http://host.docker.internal:8082}}
    CONCILIACION_UPSTREAM=${UPSTREAM_CONCILIACION:-${CONCILIACION_UPSTREAM:-http://host.docker.internal:8005}}
    MAESTRO_UPSTREAM=${UPSTREAM_MAESTRO:-${MAESTRO_UPSTREAM:-http://host.docker.internal:8004}}
    REPOSICION_UPSTREAM=${UPSTREAM_REPOSICION:-${REPOSICION_UPSTREAM:-http://host.docker.internal:8006}}
    SLAYER_UPSTREAM=${UPSTREAM_SLAYER:-${SLAYER_UPSTREAM:-http://192.168.2.153:8093}}

    # SMART MAPPING: If any upstream points to localhost/127.0.0.1, 
    # redirect it to host.docker.internal so it works inside the container.
    for var in MBA3_UPSTREAM CORE_UPSTREAM CAJA_CHICA_UPSTREAM EMPLOYEES_UPSTREAM PYG_UPSTREAM SCAN_API_UPSTREAM PROMOCION_SOBRES_UPSTREAM INVENTARIO_UPSTREAM CONCILIACION_UPSTREAM MAESTRO_UPSTREAM REPOSICION_UPSTREAM SLAYER_UPSTREAM; do
        val=$(eval echo \$$var)
        case "$val" in
            *localhost*|*127.0.0.1*)
                new_val=$(echo "$val" | sed -e 's/localhost/host.docker.internal/g' -e 's/127.0.0.1/host.docker.internal/g')
                echo "Mapping $var: $val -> $new_val"
                eval "$var=$new_val"
                ;;
        esac
    done

    sed -e "s|__MBA3_UPSTREAM__|${MBA3_UPSTREAM}|g" \

        -e "s|__CORE_UPSTREAM__|${CORE_UPSTREAM}|g" \
        -e "s|__CORE_PROXY_HOST__|${CORE_PROXY_HOST}|g" \
        -e "s|__CAJA_CHICA_UPSTREAM__|${CAJA_CHICA_UPSTREAM}|g" \
        -e "s|__EMPLOYEES_UPSTREAM__|${EMPLOYEES_UPSTREAM}|g" \
        -e "s|__PYG_UPSTREAM__|${PYG_UPSTREAM}|g" \
        -e "s|__SCAN_API_UPSTREAM__|${SCAN_API_UPSTREAM}|g" \
        -e "s|__PROMOCION_SOBRES_UPSTREAM__|${PROMOCION_SOBRES_UPSTREAM}|g" \
        -e "s|__INVENTARIO_UPSTREAM__|${INVENTARIO_UPSTREAM}|g" \
        -e "s|__CONCILIACION_UPSTREAM__|${CONCILIACION_UPSTREAM}|g" \
        -e "s|__MAESTRO_UPSTREAM__|${MAESTRO_UPSTREAM}|g" \
        -e "s|__REPOSICION_UPSTREAM__|${REPOSICION_UPSTREAM}|g" \
        -e "s|__SLAYER_UPSTREAM__|${SLAYER_UPSTREAM}|g" \
        "$TEMPLATE" > "$OUTPUT"
    
    echo "Nginx config generated in $OUTPUT"
fi

# Execute the original command (usually nginx)
exec "$@"

