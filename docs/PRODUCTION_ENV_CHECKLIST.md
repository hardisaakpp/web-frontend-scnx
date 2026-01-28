# Checklist de Configuración para Producción

## ⚠️ CRÍTICO: Variables de Entorno

Antes de desplegar a producción, **DEBES** actualizar las siguientes URLs en `.env.production`:

### URLs que Requieren Actualización

1. **VITE_MBA3_API_BASE_URL** (Línea 10)
   - ❌ **Actual:** `http://localhost:8000`
   - ✅ **Debe ser:** URL completa del backend MBA3 Consultas en producción
   - **Ejemplo:** `https://api-produccion.mabeltrading.com:8000` o `https://mba3-api.mabeltrading.com`

2. **VITE_CONCILIACION_API_BASE_URL** (Línea 13)
   - ❌ **Actual:** `http://localhost:8002/conciliacion-tesoreria`
   - ✅ **Debe ser:** URL completa del backend de Conciliación Tesorería en producción
   - **Ejemplo:** `https://api-produccion.mabeltrading.com:8002/conciliacion-tesoreria`

3. **VITE_PREFERENCES_API_URL** (Línea 16)
   - ⚠️ **Actual:** `https://tu-mba3-backend.com` (placeholder)
   - ✅ **Debe ser:** URL real del backend de preferencias de usuario en producción
   - **Nota:** Si es la misma que MBA3, usar la misma URL que `VITE_MBA3_API_BASE_URL`

### Variables que NO Requieren Cambio

- **VITE_API_URL** (Línea 7): `/api` - Correcto, usa proxy relativo
- **VITE_APP_NAME** (Línea 19): `SCNexus` - Correcto

## 📋 Checklist Pre-Deploy

- [ ] Actualizar `VITE_MBA3_API_BASE_URL` con URL de producción
- [ ] Actualizar `VITE_CONCILIACION_API_BASE_URL` con URL de producción
- [ ] Actualizar `VITE_PREFERENCES_API_URL` con URL de producción
- [ ] Verificar que todas las URLs usan HTTPS en producción
- [ ] Verificar que los puertos son correctos (si aplica)
- [ ] Probar conexión a las APIs desde el entorno de producción
- [ ] Verificar que no hay referencias a `localhost` en el archivo

## 🔍 Verificación Post-Deploy

Después del despliegue, verificar:

1. **Console del navegador:** No debe haber errores de CORS o conexión
2. **Network tab:** Las peticiones deben ir a las URLs de producción correctas
3. **Login:** Debe funcionar correctamente
4. **APIs:** Todas las llamadas deben responder correctamente

## ⚡ Optimizaciones Aplicadas

Las siguientes optimizaciones ya están implementadas para mejorar el rendimiento en producción:

- ✅ `console.log`, `console.error`, `console.debug` protegidos con `import.meta.env.DEV`
- ✅ `chunkSizeWarningLimit` ajustado a 500 KB para detectar problemas temprano
- ✅ `esbuild` configurado para eliminar `console` y `debugger` en build de producción
- ✅ Sourcemaps deshabilitados en producción para seguridad
- ✅ Minificación con `esbuild` habilitada
- ✅ Code splitting configurado con manual chunks

## 📝 Notas Adicionales

- El archivo `.env.production` **NO** debe ser commiteado con URLs de producción reales si contiene información sensible
- Considera usar variables de entorno del servidor o un sistema de gestión de secretos
- Las URLs deben ser accesibles desde el dominio donde se despliega el frontend
