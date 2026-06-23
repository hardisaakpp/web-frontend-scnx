#!/bin/sh
# Genera nginx.conf desde template sustituyendo variables de upstream.
# Solo sustituye UPSTREAM_* y CORE_PROXY_HOST — las variables propias de nginx
# ($host, $uri, $remote_addr, etc.) quedan intactas.
# Al agregar un nuevo módulo NO hay que tocar este script: basta con pasar
# la variable UPSTREAM_NUEVO al contenedor (via CD o active.env).
set -e

# Defaults para upstreams base. Evitan proxy_pass vacío (error de sintaxis nginx)
# si el contenedor arranca sin active.env o sin CD que provea las variables.
: "${UPSTREAM_MBA3:=http://host.docker.internal:8000}"
: "${UPSTREAM_CORE:=http://192.168.2.12:8080}"
: "${CORE_PROXY_HOST:=192.168.2.12:8080}"
: "${UPSTREAM_CAJA_CHICA:=http://192.168.2.153:8092}"
: "${UPSTREAM_EMPLOYEES:=http://host.docker.internal:3001}"
: "${UPSTREAM_PYG:=http://host.docker.internal:5171}"
: "${UPSTREAM_SCAN:=http://host.docker.internal:8080}"
: "${UPSTREAM_PROMOCION_SOBRES:=http://host.docker.internal:8083}"
: "${UPSTREAM_INVENTARIO:=http://host.docker.internal:8082}"
: "${UPSTREAM_CONCILIACION:=http://host.docker.internal:8005}"
: "${UPSTREAM_MAESTRO:=http://host.docker.internal:8001}"
: "${UPSTREAM_REPOSICION:=http://host.docker.internal:8006}"
: "${UPSTREAM_SLAYER:=http://192.168.2.153:8093}"
: "${UPSTREAM_CAMPANAS:=http://host.docker.internal:5006}"

# SMART MAPPING: If any upstream points to localhost/127.0.0.1, 
# redirect it to host.docker.internal so it works inside the container.
for var in $(printenv | grep -oE '^UPSTREAM_[A-Z0-9_]+'); do
    val=$(eval echo \$$var)
    case "$val" in
        *localhost*|*127.0.0.1*)
            new_val=$(echo "$val" | sed -e 's/localhost/host.docker.internal/g' -e 's/127.0.0.1/host.docker.internal/g')
            echo "Mapping $var: $val -> $new_val"
            eval "$var=$new_val"
            export $var
            ;;
    esac
done

# Lista dinámica: incluye todas las UPSTREAM_* presentes en el entorno + CORE_PROXY_HOST.
# Los módulos nuevos se incorporan automáticamente sin modificar este script.
VARS=$(printenv | grep -oE '^(UPSTREAM_[A-Z0-9_]+|CORE_PROXY_HOST)' \
       | awk '{printf "${%s}", $1}')

envsubst "$VARS" \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
