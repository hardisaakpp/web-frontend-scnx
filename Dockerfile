FROM node:20-alpine AS build
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

FROM nginx:1.27-alpine AS runtime

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
ARG REPOSICION_UPSTREAM=http://host.docker.internal:8006
ARG SLAYER_UPSTREAM=http://192.168.2.153:8093

COPY deploy/nginx/scnexus-docker.conf.template /tmp/scnexus-docker.conf.template


COPY --from=build /app/dist /usr/share/nginx/html

COPY deploy/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

