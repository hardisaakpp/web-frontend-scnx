FROM node:20-alpine AS build

LABEL stage=build
LABEL project="web-scnexus"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY . .

# Rutas relativas del bundle (sin IPs)
COPY deploy/env/bundle.env .env.production

# Base path de la SPA (build-time). Los upstreams van en runtime via active.env.
ARG VITE_APP_BASE_PATH=/scnexus-front/
ENV VITE_APP_BASE_PATH=${VITE_APP_BASE_PATH}

RUN npm run build

FROM nginx:stable-bookworm AS runtime

LABEL maintainer="Jose"
LABEL description="Runtime image for SCNexus Frontend"

# Entrypoint: nginx official image (1.19+) already uses envsubst for /etc/nginx/templates/*.template
# Los upstreams llegan como variables de entorno desde docker compose (active.env).

# Template nginx: los placeholders ${UPSTREAM_*} se resuelven en runtime.
COPY deploy/nginx/scnexus-docker.conf.template /etc/nginx/templates/default.conf.template

COPY --from=build /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

EXPOSE 80
# Omitimos ENTRYPOINT manual para usar el predeterminado de nginx que procesará el template
