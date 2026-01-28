# 🚀 Guía de Despliegue a Producción

Esta guía describe los pasos necesarios para desplegar SCNexus Frontend a producción.

## 📋 Checklist Pre-Despliegue

### ✅ Variables de Entorno

**IMPORTANTE:** Antes del despliegue, actualizar todas las URLs en `.env.production` con las URLs reales de producción:

```env
# API Backend Core (Apps pruebas)
VITE_API_URL=https://api.produccion.com/api

# API Backend MBA3 Consultas
VITE_MBA3_API_BASE_URL=https://mba3-api.produccion.com

# API Backend Conciliación Tesorería
VITE_CONCILIACION_API_BASE_URL=https://conciliacion-api.produccion.com

# API Backend Preferencias de Usuario
VITE_PREFERENCES_API_URL=https://mba3-api.produccion.com

# Nombre de la aplicación
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

```nginx
server {
    listen 80;
    server_name scnexus.tu-dominio.com;
    
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

Para actualizar la aplicación en producción:

1. Hacer pull de los últimos cambios
2. Actualizar dependencias: `npm ci`
3. Verificar `.env.production`
4. Ejecutar build: `npm run build`
5. Desplegar nueva versión de `dist/`
6. Verificar que todo funciona correctamente

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

**Última actualización:** Enero 2026  
**Versión:** 2.0.0
