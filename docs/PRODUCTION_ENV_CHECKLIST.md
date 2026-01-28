# Checklist de Configuración para Producción

## ⚠️ CRÍTICO: Variables de Entorno

Antes de desplegar a producción, **DEBES** revisar y actualizar `.env.production` según tu infraestructura.

### Estructura Actual de URLs

El proyecto soporta **dos patrones** de configuración:

#### 1️⃣ **Patrón Relativo (Recomendado para Proxy/API Gateway)**
```
VITE_API_URL=/api
VITE_MBA3_API_BASE_URL=/api/mba3
VITE_CONCILIACION_API_BASE_URL=/api/conciliacion
VITE_PREFERENCES_API_URL=/api/mba3
```
✅ **Cuándo usar:** Frontend y Backend servidos por el mismo dominio con un API Gateway/Proxy (ej: nginx reverse proxy)
- Las peticiones se envían a `/api/...` relativos al dominio actual
- Ejemplo: `https://scnexus.mabel-trading.com/api/mba3/...`

#### 2️⃣ **Patrón Absoluto (Para APIs en hosts separados)**
```
VITE_MBA3_API_BASE_URL=https://api-backend.mabel-trading.com:8000
VITE_CONCILIACION_API_BASE_URL=https://tesoreria-api.mabel-trading.com:8002/conciliacion-tesoreria
VITE_PREFERENCES_API_URL=https://api-backend.mabel-trading.com:8000
```
⚠️ **Cuándo usar:** APIs en dominios/IPs diferentes (requiere CORS habilitado)
- Las peticiones van a URLs absolutas con dominio
- Ejemplo: `https://api-backend.mabel-trading.com:8000/...`

### Variables que SÍ Requieren Actualización

1. **VITE_PREFERENCES_API_URL**
   - ❌ **Actual:** `/api/mba3` (puede ser incorrecto)
   - ✅ **Verificar:** Debe apuntar al mismo endpoint donde se guardan las preferencias
   - **Nota:** Generalmente es la misma que `VITE_MBA3_API_BASE_URL`

### Variables que NO Requieren Cambio Típicamente

- **VITE_API_URL**: `/api` - Correcto para proxy relativo
- **VITE_MBA3_API_BASE_URL**: `/api/mba3` o absoluta (según infraestructura)
- **VITE_CONCILIACION_API_BASE_URL**: `/api/conciliacion` o absoluta (según infraestructura)
- **VITE_APP_NAME**: `SCNexus` - Correcto

## 📋 Checklist Pre-Deploy

- [ ] **Decidir patrón de URLs:** ¿Patrón relativo (proxy) o absoluto (APIs separadas)?
- [ ] **Configurar .env.production** con las URLs correctas según decisión anterior
- [ ] Si es patrón absoluto:
  - [ ] Verificar que todas las URLs usan HTTPS en producción
  - [ ] Habilitar CORS en los backends para el dominio del frontend
  - [ ] Probar conexión a cada API desde navegador (Network tab)
- [ ] Si es patrón relativo:
  - [ ] Configurar API Gateway/Proxy (nginx) para rutear `/api/*` al backend correcto
  - [ ] Verificar que el proxy está configurado correctamente
- [ ] Verificar que no hay referencias a `localhost` en `.env.production`
- [ ] Ejecutar `npm run build` para verificar que compila sin errores

## 🔍 Verificación Post-Deploy

Después del despliegue, verificar:

1. **Console del navegador:** No debe haber errores de CORS o conexión
2. **Network tab:** 
   - Las peticiones deben ir a las URLs de producción correctas
   - Status codes deben ser 200/201 (no 404 ni CORS errors)
3. **Login:** Debe funcionar correctamente
4. **Funcionalidades:** Todas las llamadas a APIs deben responder correctamente

## ⚡ Optimizaciones Implementadas para Producción

Las siguientes optimizaciones ya están implementadas:

- ✅ **TypeScript Strict Mode** (`noImplicitAny: true`) - Detección de tipos en compile time
- ✅ **Global Error Handler** - Captura centralizada de errores para monitoreo
- ✅ **Production-Safe Logging** - Todos los `console.log` protegidos con `import.meta.env.DEV`
  - En producción, los logs DEV se eliminan via tree-shaking
  - `console.error()` se preserva para reportar errores críticos
- ✅ **Sourcemaps deshabilitados** - No exponemos código fuente en producción
- ✅ **Minificación activa** - Bundle optimizado con esbuild
- ✅ **Code splitting configurado** - Carga de módulos optimizada

## 📝 Notas Importantes

### Seguridad
- El archivo `.env.production` **NO debe ser commiteado** al repositorio si contiene URLs/credenciales sensibles
- Usa un sistema de gestión de secretos (ej: GitHub Secrets, AWS Secrets Manager, etc.)
- Las URLs en `.env.production` serán visibles en el navegador (son públicas)

### Desarrollo vs Producción
- `.env` - Configuración local (localhost:8000, localhost:8002)
- `.env.production` - Configuración de producción (URLs relativas o absolutas según infraestructura)

### Testing
Antes de ir a producción, prueba:
```bash
# Build local
npm run build

# Servir el dist y probar
npm install -g serve
serve -s dist
```
Verifica en Network tab que las peticiones van a las URLs correctas de `.env.production`.
