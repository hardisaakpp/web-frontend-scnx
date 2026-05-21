# 🚀 Guía de Despliegue

Esta guía cubre el despliegue de SCNexus Frontend al **servidor de pruebas (DESA)** y a **producción**.

| Entorno | Sección |
|--------|---------|
| Pruebas (DESA) | [Servidor de pruebas (DESA)](#servidor-de-pruebas-desa) |
| Producción srv-mabuiosapi | **[DEPLOYMENT_PROD_SRV_MABUIOSAPI.md](./DEPLOYMENT_PROD_SRV_MABUIOSAPI.md)** (Docker + Apache; coordinación mar 2026) |
| Producción (genérico) | [Checklist y despliegue a producción](#despliegue-produccion) |

---

## Servidor de pruebas (DESA)

Despliegue asistido por script en el servidor de desarrollo/pruebas. El front se actualiza desde la rama **`develop`** del repositorio `scnexus-front`.

**Modo actual:** un solo frontend en **Docker** (Nginx + SPA), puerto host **`8082`**. El backend **cajachica** sigue en **`8081`** como upstream (`UPSTREAM_CAJA_CHICA`); no comparte puerto con el front.

| Antes | Ahora |
|-------|--------|
| `npm run dev` → Vite **:3000** | `docker compose` → contenedor `scnexus-front` **:8082** |
| `~/deploys/dev.log` | `~/deploys/scnexus-front.log` |

### Acceso

- **Host SSH:** `desa-mabuiosapp` (nombre interno; usar el mismo host que el equipo usa para SSH).
- **Usuario de despliegue:** `admindesa`.
- **URL típica tras migrar:** `http://210.17.1.53:8082/scnexus-front/` (ajustar IP según el servidor).

### Scripts disponibles

En el home del usuario de despliegue existe el directorio `deploys/` con, entre otros:

| Script | Uso |
|--------|-----|
| `nexus_frontend.sh` | Actualiza y levanta **este** frontend (SCNexus) en Docker |
| `articulo_maestro.sh` | Otro proyecto (artículo maestro) |
| `conciliacion.sh` | Otro proyecto (conciliación) |

Ruta canónica en el repo: `deploy/scripts/nexus_frontend.sh` (copiar al servidor tras `git pull`).

### Instalar o actualizar el script en el servidor (una vez por release)

```bash
cp /opt/frontend/scnexus-front/deploy/scripts/nexus_frontend.sh ~/deploys/nexus_frontend.sh
chmod +x ~/deploys/nexus_frontend.sh
```

### Desplegar el frontend de pruebas

Con sesión SSH como `admindesa`:

```bash
cd ~
sh deploys/nexus_frontend.sh
```

El script, en orden:

1. Entra a `/opt/frontend/scnexus-front` y muestra la rama actual (**`develop`**).
2. Detiene **Vite** en `:3000` (despliegue anterior).
3. Baja `docker-compose.dev.yml` si quedó algún contenedor dev.
4. `git pull origin <rama actual>`.
5. Crea `deploy/env/active.env` desde `desa.env.example` si no existe.
6. `docker compose --env-file deploy/env/active.env up -d --build` (imagen Nginx + SPA).

**Logs:** `/home/admindesa/deploys/scnexus-front.log`

### Configuración en el servidor (centralizada)

```bash
cd /opt/frontend/scnexus-front
cp deploy/env/desa.env.example deploy/env/active.env
# Editar UPSTREAM_* según docker ps en DESA (maestro :8004, cajachica :8081, core :5053, …)
```

Ver [deploy/env/README.md](../deploy/env/README.md). El bundle (`deploy/env/bundle.env`) va versionado; **no** commitear `deploy/env/active.env`.

Si cambias `UPSTREAM_*` en `active.env`, reconstruir sin caché:

```bash
docker compose --env-file deploy/env/active.env build --no-cache
docker compose --env-file deploy/env/active.env up -d
```

### Puertos en DESA (sin choque con cajachica)

| Puerto | Servicio |
|--------|----------|
| **8081** | `cajachica-staging` (upstream API; no usar para el front) |
| **8082** | `scnexus-front` (Nginx + SPA; `SCNEXUS_FRONT_PORT`) |
| **3000** | Libre tras migrar (antes Vite) |

### Si el acceso era por Nginx del host en :3000

Actualizar el `proxy_pass` del sitio SCNexus de `http://127.0.0.1:3000` a `http://127.0.0.1:8082` y recargar Nginx, o usar la URL directa `:8082/scnexus-front/`.

### Autenticación (login / Active Directory)

El navegador llama `POST /api/Auth/login` al **mismo origen** del front (`:8082`). Nginx en el contenedor reenvía a **Core** (`UPSTREAM_CORE`, en DESA suele ser `http://host.docker.internal:5053`).

En `deploy/env/active.env` define también **`CORE_PROXY_HOST`** (ej. `host.docker.internal:5053`). Debe ser el host:puerto que espera Kestrel — equivalente a `changeOrigin: true` en Vite. Si falta o no coincide con `UPSTREAM_CORE`, el Core puede responder **500**.

Tras cambiar `UPSTREAM_CORE` o `CORE_PROXY_HOST`:

```bash
docker compose --env-file deploy/env/active.env build --no-cache
docker compose --env-file deploy/env/active.env up -d
```

Verificación en el servidor:

```bash
bash deploy/scripts/verify-desa-auth.sh
docker logs scnexus-core-api --tail 50
```

| Código | Significado habitual |
|--------|----------------------|
| **401 / 400** | Proxy OK; usuario/contraseña o AD |
| **502 / 504** | Core no alcanzable desde el contenedor front |
| **500** | Core recibió el login; revisar logs del Core (AD, BD, appsettings) |

`GET /api/Auth/me` (capabilities tras login) va a **MBA3** (`UPSTREAM_MBA3_AUTH`). Si MBA3 no está en `:8000`, el login puede funcionar pero fallará `fetchMe`.

### Notas

- **MBA3** (`:8000`): si no aparece en `docker ps`, el módulo MBA3 fallará hasta desplegarlo; el resto del front puede cargar.
- Módulos sin backend en DESA (scan, inventario, …): dejar comentados en `active.env` o apuntar al puerto correcto cuando existan. **No** poner inventario en `:8082` si el front usa ese puerto en el host.

---

<a id="despliegue-produccion"></a>

## 📋 Checklist Pre-Despliegue

### ✅ Variables de Entorno

**IMPORTANTE:** El bundle usa rutas relativas en `deploy/env/bundle.env`. Los hosts reales van en `deploy/env/active.env` (Nginx/Docker), no en `VITE_*` con IPs.

#### Despliegue típico: build en tu PC y copiar `dist/` al servidor

Si generas el build en tu máquina y solo subes `dist/` a algo como `/storage/scnexus/dist/`, el navegador ejecuta **ese** JavaScript. Cualquier `VITE_*` con `http://` o IP privada (p. ej. `http://192.168.x.x:8080/api`) queda **fija en el bundle**: el cliente intentará llamar a esa URL directamente, no pasa por tu Apache/Nginx en HTTPS, y aparece **Mixed Content** (página HTTPS que pide HTTP).

**Solución:** con reverse proxy en el servidor (Apache/Nginx) que enruta `/api/...` al Core y a MBA3, usa **rutas relativas** en `.env.production`, por ejemplo:

- `VITE_API_URL=/api`
- `VITE_CORE_API_URL=/api`
- `VITE_MBA3_API_URL=/api`
- `VITE_MBA3_API_BASE_URL=/api/mba3`

Así el login va a `https://tu-dominio/api/Auth/login` y el proxy del servidor habla con los backends internos.

**IMPORTANTE:** Antes del despliegue, revisar también módulos que tengan su propia base (p. ej. Caja Chica con `VITE_CAJA_CHICA_API_URL`): deben ser relativas al mismo dominio HTTPS o debes exponer un `location` dedicado en nginx y apuntar la variable a esa ruta.

Ejemplo de configuración antigua (incorrecta para HTTPS + proxy):

```env
VITE_CORE_API_URL=http://192.168.2.12:8080/api
```

---

Plantilla recomendada (mismo dominio HTTPS + reverse proxy, como `scnexus.*`):

```env
VITE_API_URL=/api
VITE_CORE_API_URL=/api
VITE_MBA3_API_URL=/api
VITE_MBA3_API_BASE_URL=/api/mba3
VITE_CONCILIACION_API_BASE_URL=/api/conciliacion
VITE_PREFERENCES_API_URL=/api/mba3
VITE_CAJA_CHICA_API_URL=/caja-chica-api
VITE_ARTICULO_SCAN_API_URL=/scan-api
VITE_APP_NAME=SCNexus
```

Para referencia de Nginx del proyecto (incluye routing de Caja Chica), ver `deploy/nginx/scnexus.conf.example`.

Si las APIs viven en **otros hosts** públicos, usa URLs absolutas **https://** (no IPs privadas ni `http://` en producción):

```env
VITE_API_URL=https://api.ejemplo.com/api
VITE_MBA3_API_BASE_URL=https://mba3-api.ejemplo.com
VITE_CONCILIACION_API_BASE_URL=https://conciliacion-api.ejemplo.com
VITE_PREFERENCES_API_URL=https://mba3-api.ejemplo.com
VITE_APP_NAME=SCNexus
```

### ✅ Verificaciones Previas

- [ ] Todas las variables de entorno están configuradas correctamente
- [ ] No hay URLs de localhost o desarrollo en el código
- [ ] El build de producción se ejecuta sin errores
- [ ] Los tests pasan (si están configurados)
- [ ] La versión en `package.json` está actualizada

## 🔨 Build de Producción

### 1. Instalar Dependencias

```bash
npm ci
```

### 2. Verificar Variables de Entorno

Asegúrate de que `.env.production` tenga todas las URLs correctas.

### 3. Ejecutar Build

```bash
npm run build
```

El build generará los archivos estáticos en la carpeta `dist/`.

### 4. Verificar Build Localmente

```bash
npm run preview
```

Esto iniciará un servidor local para probar el build de producción antes del despliegue.

## 📦 Despliegue

### Opción 1: Servidor Web Estático (Nginx, Apache, etc.)

1. Copiar el contenido de `dist/` al directorio del servidor web
2. Configurar el servidor para servir `index.html` en todas las rutas (SPA)
3. Configurar HTTPS y certificados SSL
4. Configurar headers de seguridad (CORS, CSP, etc.)

**Ejemplo de configuración Nginx:**

El archivo de sitio suele estar en `/etc/nginx/sites-available/scnexus`. Para editarlo: `sudo nano /etc/nginx/sites-available/scnexus`.

```nginx
server {
    listen 80;
    server_name scnexus.tu-dominio.com;
    
    # Ruta donde Nginx sirve el frontend (ajustar según el servidor, ej. /storage/scnexus/dist o /var/www/scnexus/dist)
    root /var/www/scnexus/dist;
    index index.html;
    
    # SPA routing - todas las rutas van a index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Headers de seguridad
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Procedimiento en servidor de producción (Nginx)

Pasos habituales en el servidor donde está el proyecto y Nginx:

1. **Entrar al directorio del proyecto** (ruta donde está el repo, ej. `/storage/scnexus/`):

   ```bash
   cd /storage/scnexus/
   ```

2. **Generar el build de producción:**

   ```bash
   npm run build
   ```

   Los archivos se generan en `dist/`.

3. **Reemplazar el contenido desplegado:** copiar o reemplazar el contenido de `dist/` en la ruta que tenga configurada `root` en Nginx para este sitio (la misma ruta indicada en `/etc/nginx/sites-available/scnexus`). Si el `root` apunta a ese mismo proyecto, suele ser reemplazar la carpeta `dist/` del proyecto; si apunta a otra ruta, copiar ahí el contenido de `dist/`.

4. **Comprobar la configuración de Nginx y recargar:**

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **Si necesitas cambiar la configuración del sitio:**

   ```bash
   sudo nano /etc/nginx/sites-available/scnexus
   ```

   Después de guardar, volver a ejecutar `sudo nginx -t` y `sudo systemctl reload nginx`.

### Opción 2: CDN / Hosting Estático

- **Vercel**: Conectar el repositorio y configurar variables de entorno
- **Netlify**: Conectar el repositorio y configurar variables de entorno
- **AWS S3 + CloudFront**: Subir `dist/` a S3 y configurar CloudFront
- **Azure Static Web Apps**: Conectar repositorio y configurar variables

## 🔒 Seguridad

### Headers de Seguridad

Asegúrate de configurar los siguientes headers en tu servidor:

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Content-Security-Policy`: Configurar según tus necesidades
- `Strict-Transport-Security`: Si usas HTTPS

### Variables de Entorno

- **NUNCA** commitees archivos `.env` o `.env.local` al repositorio
- Las variables de entorno se inyectan en tiempo de build
- Verifica que no haya información sensible en el código compilado

## 🧪 Post-Despliegue

### Verificaciones Post-Despliegue

- [ ] La aplicación carga correctamente
- [ ] El login funciona
- [ ] Las llamadas a la API funcionan correctamente
- [ ] No hay errores en la consola del navegador
- [ ] El modo oscuro funciona
- [ ] Las rutas protegidas funcionan correctamente
- [ ] Los permisos y roles funcionan como se espera

### Monitoreo

- Configurar logging y monitoreo de errores (Sentry, LogRocket, etc.)
- Monitorear el rendimiento de la aplicación
- Configurar alertas para errores críticos

## 🔄 Actualización

Para actualizar la aplicación en producción (con Nginx en servidor):

1. En el servidor, ir al directorio del proyecto: `cd /storage/scnexus/` (o la ruta donde esté el repo).
2. Hacer pull de los últimos cambios y, si aplica, actualizar dependencias: `npm ci`.
3. Verificar `.env.production`.
4. Ejecutar build: `npm run build`.
5. Reemplazar el contenido desplegado: copiar el contenido de `dist/` a la ruta que tenga configurada `root` en Nginx para este sitio.
6. Comprobar y recargar Nginx: `sudo nginx -t` y `sudo systemctl reload nginx`.
7. Verificar que la aplicación funciona correctamente en el navegador.

## 📝 Notas Importantes

- El build de producción elimina automáticamente todos los `console.log` gracias a la configuración de Terser
- Los `console.error` están condicionados para solo aparecer en desarrollo
- El código fuente no se incluye en el build (sin sourcemaps en producción)
- Las variables de entorno deben comenzar con `VITE_` para ser accesibles en el código

## 🆘 Troubleshooting

### La aplicación no carga

- Verificar que el servidor esté configurado para servir `index.html` en todas las rutas
- Verificar la consola del navegador para errores
- Verificar que las variables de entorno estén correctamente configuradas

### Las llamadas a la API fallan

- Verificar que las URLs en `.env.production` sean correctas
- Verificar CORS en el backend
- Verificar que el backend esté accesible desde el dominio de producción

### Articulo Scanner (`/scan-api`) responde `text/html` en vez de JSON

Si en Network la llamada a `https://tu-dominio/scan-api/api/v1/warehouses` muestra `200` pero `content-type: text/html`, Nginx esta devolviendo `index.html` (fallback SPA) en lugar del backend.

Causa comun: falta bloque `location /scan-api/` o no esta antes de `location / { try_files ... /index.html; }`.

Configuracion recomendada:

```nginx
location /scan-api/ {
    rewrite ^/scan-api(.*)$ $1 break;
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Authorization $http_authorization;
}
```

Ademas, en el build de frontend usar base relativa para este modulo:

```env
VITE_ARTICULO_SCAN_API_URL=/scan-api
```

Referencia en este repo: `deploy/nginx/scnexus.conf.example`.

Verificacion rapida:

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -i https://scnexus.mabelgroup.com.ec/scan-api/api/v1/warehouses
```

Resultado esperado: `content-type: application/json` y body con arreglo de almacenes.

### Imagenes de Caja Chica en `/uploads` responden 404

Si una URL como `https://scnexus.../uploads/archivo.jpeg` devuelve `404 Not Found (nginx)`, revisar prioridad de `location` en Nginx.

Causa comun: el bloque regex de estaticos (`location ~* \.(js|css|png|jpg|jpeg|...)$`) puede capturar la peticion antes del proxy de `/uploads` y Nginx intenta buscar el archivo en `root` local.

Solucion recomendada:

- Definir `location ^~ /uploads/` (con `^~`, no solo `/uploads/`) para que gane prioridad sobre regex.
- Apuntar `proxy_pass` al backend de Caja Chica donde realmente existe la carpeta/endpoint `/uploads`.
- Mantener `location /caja-chica-api/` para llamadas API (`/api/*`) separado del bloque de archivos.

Ejemplo:

```nginx
location /caja-chica-api/ {
    rewrite ^/caja-chica-api(.*)$ /api$1 break;
    proxy_pass http://192.168.2.211:8092;
}

location ^~ /uploads/ {
    proxy_pass http://192.168.2.211:8092;
}
```

Verificacion rapida en servidor:

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I https://scnexus.mabelgroup.com.ec/uploads/archivo.jpeg
curl -I http://192.168.2.211:8092/uploads/archivo.jpeg
```

Si el segundo `curl` tambien responde 404, el archivo no existe en el backend o la ruta de uploads del servicio es distinta.

### Errores de autenticación

- Verificar que el token se esté guardando correctamente en localStorage
- Verificar que el backend esté configurado para aceptar tokens desde el dominio de producción
- Verificar la configuración de cookies si se usan

---

**Última actualización:** Abril 2026  
**Versión:** 2.1.0
