FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Rutas relativas del bundle (sin IPs)
COPY deploy/env/bundle.env .env.production

# Rutas relativas en el bundle (VITE_*). Sobrescribir en build con --build-arg o ENV.
ARG VITE_APP_BASE_PATH=/scnexus-front/
ENV VITE_APP_BASE_PATH=${VITE_APP_BASE_PATH}

RUN npm run build

FROM nginx:stable-bookworm-slim AS runtime

# Upstreams Nginx (desde deploy/env/active.env vía docker compose build --build-arg)
ARG MBA3_UPSTREAM=http://host.docker.internal:8000
ARG CORE_UPSTREAM=http://192.168.2.12:8080
# Host:puerto que ve Kestrel (changeOrigin). Derivar de UPSTREAM_CORE en active.env.
ARG CORE_PROXY_HOST=host.docker.internal:5053
ARG CAJA_CHICA_UPSTREAM=http://192.168.2.153:8092
ARG EMPLOYEES_UPSTREAM=http://host.docker.internal:3001
ARG PYG_UPSTREAM=http://host.docker.internal:5171
ARG SCAN_API_UPSTREAM=http://host.docker.internal:8080
ARG PROMOCION_SOBRES_UPSTREAM=http://host.docker.internal:8083
ARG INVENTARIO_UPSTREAM=http://host.docker.internal:8082
ARG CONCILIACION_UPSTREAM=http://host.docker.internal:8005
ARG MAESTRO_UPSTREAM=http://host.docker.internal:8001
ARG SLAYER_UPSTREAM=http://192.168.2.153:8093
ARG TRANSACCIONES_UPSTREAM=http://host.docker.internal:8080

COPY deploy/nginx/scnexus-docker.conf.template /tmp/scnexus-docker.conf.template
RUN sed -e "s|__MBA3_UPSTREAM__|${MBA3_UPSTREAM}|g" \
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
        -e "s|__SLAYER_UPSTREAM__|${SLAYER_UPSTREAM}|g" \
        -e "s|__TRANSACCIONES_UPSTREAM__|${TRANSACCIONES_UPSTREAM}|g" \
        /tmp/scnexus-docker.conf.template > /etc/nginx/conf.d/default.conf \
    && rm /tmp/scnexus-docker.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
