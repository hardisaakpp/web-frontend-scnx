# 🚀 Guía de Despliegue

Esta guía cubre el despliegue de SCNexus Frontend al **servidor de pruebas (DESA)** y a **producción**.

| Entorno | Sección |
|--------|---------|
| Pruebas (DESA) | [Servidor de pruebas (DESA)](#servidor-de-pruebas-desa) |
| Producción | [Checklist y despliegue a producción](#despliegue-produccion) |

---

## Servidor de pruebas (DESA)

Despliegue asistido por script en el servidor de desarrollo/pruebas. El front se actualiza desde la rama **`develop`** del repositorio `scnexus-front`.

### Acceso

- **Host SSH:** `desa-mabuiosapp` (nombre interno; usar el mismo host que el equipo usa para SSH).
- **Usuario de despliegue:** `admindesa`.

### Scripts disponibles

En el home del usuario de despliegue existe el directorio `deploys/` con, entre otros:

| Script | Uso |
|--------|-----|
| `nexus_frontend.sh` | Actualiza y levanta **este** frontend (SCNexus) |
| `articulo_maestro.sh` | Otro proyecto (artículo maestro) |
| `conciliacion.sh` | Otro proyecto (conciliación) |

Ruta típica en el servidor: `/home/admindesa/deploys/`.

### Desplegar el frontend de pruebas

Con sesión SSH como `admindesa`:

```bash
cd ~
sh deploys/nexus_frontend.sh
```

El script, en orden habitual:

1. Entra al directorio del proyecto clonado del frontend.
2. Muestra la rama actual (debe ser **`develop`**).
3. Detiene procesos anteriores del front.
4. Actualiza el repositorio (`git pull` / fast-forward desde `origin/develop`).
5. Instala dependencias (`npm`, según lo definido en el script).
6. Levanta la aplicación en **segundo plano**.

**Logs:** `/home/admindesa/deploys/dev.log` (revisar ahí errores de build, puerto o runtime).

### Notas

- Variables `VITE_*` y `.env` del entorno de prueba viven en el servidor; no suelen estar en el repo. Para revisar nombres y patrones de URLs, usar [PRODUCTION_ENV_CHECKLIST.md](PRODUCTION_ENV_CHECKLIST.md) como referencia.
- Si el script muestra avisos de `npm audit`, coordinar con el equipo antes de ejecutar `npm audit fix` en el servidor compartido.

---

<a id="despliegue-produccion"></a>

## 📋 Checklist Pre-Despliegue

### ✅ Variables de Entorno

**IMPORTANTE:** Antes del despliegue, actualizar todas las URLs en `.env.production` con las URLs reales de producción.

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

### Errores de autenticación

- Verificar que el token se esté guardando correctamente en localStorage
- Verificar que el backend esté configurado para aceptar tokens desde el dominio de producción
- Verificar la configuración de cookies si se usan

---

**Última actualización:** Abril 2026  
**Versión:** 2.1.0
