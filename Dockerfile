FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Rutas relativas del bundle (sin IPs)
COPY deploy/env/bundle.env .env.production

# Base path de la SPA (build-time). Los upstreams van en runtime via active.env.
ARG VITE_APP_BASE_PATH=/scnexus-front/
ENV VITE_APP_BASE_PATH=${VITE_APP_BASE_PATH}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

# Entrypoint: sustituye UPSTREAM_* en el template y arranca nginx.
# Los upstreams llegan como variables de entorno desde docker compose (active.env).
COPY deploy/scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Template nginx: los placeholders ${UPSTREAM_*} se resuelven en runtime.
COPY deploy/nginx/scnexus-docker.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]

