# Refactorización de mba3ConsultasApi.ts

**Fecha de inicio:** 2026-01-28  
**Rama:** `refactor/mba3-api-service`  
**Estado:** 🔄 En progreso

## Objetivo

Refactorizar el archivo monolítico `mba3ConsultasApi.ts` (2317 líneas) en módulos más pequeños, mantenibles y organizados por dominio de negocio, sin romper la compatibilidad existente.

## Análisis de dependencias

### Archivos que importan `mba3ConsultasService`

Total: **26 archivos** que dependen del servicio

#### Views (13 archivos)
- `ReporteDiferenciasView.vue`
- `RemisionesView.vue`
- `ProcesoCompletoView.vue`
- `PedidosListView.vue`
- `PedidoDetalleView.vue`
- `ProcesamientoSAPView.vue`
- `PedidoCrearView.vue`
- `ODCErroresView.vue`
- `MabelTradingRedistribucionView.vue`
- `OrdenesCompraView.vue`
- `DashboardView.vue`
- `CargarPlantillaView.vue`
- `CargarPlantillasView.vue`

#### Stores (3 archivos)
- `procesoStore.ts`
- `ordenesCompraStore.ts`
- `homologacionesStore.ts`

#### Composables (4 archivos)
- `usePedidoDetalle.ts`
- `useRedistribucion.ts`
- `useFileUpload.ts`
- `useColumnManagement.ts`

#### Components (6 archivos)
- `DespachosTable.vue`
- `CorregirSkuModal.vue`
- `HomologacionCreateModal.vue`
- `UploadErrorModal.vue`
- `OrdenCompraTable.vue`
- `BuscarSkuModal.vue`

### Métodos más utilizados

Basado en el análisis del código:

1. **Pedidos y plantillas:**
   - `uploadPlantilla()`
   - `getPedido()`
   - `crearPedidoManual()`
   - `cargarRespuestaProveedor()`

2. **Procesamiento:**
   - `procesarOC()`
   - `integrarSAP()`
   - `procesarOCDesdePedido()`

3. **Consultas:**
   - `getDespachos()`
   - `getOrdenesCompra()`
   - `getRemisiones()`
   - `getSkuHomologaciones()`

4. **Búsqueda:**
   - `buscarSkuMba3()`
   - `buscarSkuSap()`
   - `buscarSugerenciasSku()`

5. **Reportes:**
   - `getReporteDiferencias()`
   - `getProcesamientoSAP()`

### Patrones de manejo de errores actuales

El código actual tiene **múltiples patrones inconsistentes** de manejo de errores:

1. **Patrón 1: Lanzar error directamente**
   ```typescript
   throw new Error(extractedMessage || defaultMessage)
   ```

2. **Patrón 2: Preservar error original con mensaje extraído**
   ```typescript
   const enrichedError = new Error(message) as any
   enrichedError.response = error.response
   throw enrichedError
   ```

3. **Patrón 3: Extraer mensaje del response.data**
   ```typescript
   if (error.response?.data?.type === 'business_exception') {
     return error.response.data.error || error.response.data.message
   }
   ```

4. **Patrón 4: Manejo especial de 400 con validación**
   ```typescript
   if (error.response?.status === 400 && error.response?.data?.status === 'validation_error') {
     return normalizeValidationResponse(error.response.data)
   }
   ```

5. **Patrón 5: Retry logic (solo en `migrar()`)**
   ```typescript
   for (let attempt = 0; attempt <= retries; attempt++) {
     // Retry con delay progresivo
   }
   ```

## Nueva estructura propuesta

```
src/modules/mba3-consultas/services/
├── mba3ConsultasApi.ts          # Archivo principal - reexporta todo
├── config/
│   └── axiosConfig.ts           # Configuración de axios e interceptores
├── utils/
│   ├── errorHandler.ts          # Manejo consistente de errores
│   ├── urlBuilder.ts            # Construcción de URLs con params
│   └── fileValidator.ts         # Validación de archivos
└── domains/
    ├── health.ts                # healthCheck, consultar
    ├── migracion.ts             # migrar (con retry logic)
    ├── ordenesCompra.ts         # CRUD de órdenes de compra
    ├── despachos.ts             # CRUD de despachos
    ├── remisiones.ts            # CRUD de remisiones
    ├── homologaciones.ts        # CRUD de homologaciones SKU
    ├── cruceProductos.ts        # Cruce automático de productos
    ├── busquedaSku.ts           # Búsqueda y sugerencias de SKU
    ├── pedidos.ts               # Gestión de pedidos y plantillas
    ├── respuestaProveedor.ts    # Respuestas de proveedores
    ├── procesamiento.ts         # Procesamiento ODC y SAP
    └── reportes.ts              # Reportes y diferencias
```

## Estado de la refactorización

### ✅ Fase 1: Preparación
- [x] Crear rama `refactor/mba3-api-service`
- [x] Documentar dependencias en `REFACTOR_MBA3_API.md`
- [ ] Crear tests de regresión (opcional)

### 🔄 Fase 2: Extraer utilidades
- [ ] Crear `errorHandler.ts`
- [ ] Crear `urlBuilder.ts`
- [ ] Crear `fileValidator.ts`

### ⏳ Fase 3: Dividir en módulos
- [ ] Crear estructura de carpetas
- [ ] Extraer configuración de axios → `axiosConfig.ts`
- [ ] Migrar dominio `health.ts`
- [ ] Migrar dominio `despachos.ts`
- [ ] Migrar dominio `remisiones.ts`
- [ ] Migrar dominio `ordenesCompra.ts`
- [ ] Migrar dominio `homologaciones.ts`
- [ ] Migrar dominio `busquedaSku.ts`
- [ ] Migrar dominio `cruceProductos.ts`
- [ ] Migrar dominio `pedidos.ts`
- [ ] Migrar dominio `respuestaProveedor.ts`
- [ ] Migrar dominio `procesamiento.ts`
- [ ] Migrar dominio `reportes.ts`
- [ ] Migrar dominio `migracion.ts`

### ⏳ Fase 4: Archivo principal
- [ ] Actualizar `mba3ConsultasApi.ts` con reexports

### ⏳ Fase 5: Verificación
- [ ] Compilar sin errores
- [ ] Probar funcionalidades manualmente
- [ ] Verificar que todos los imports funcionan

### ⏳ Fase 6: Limpieza
- [ ] Actualizar `docs/FRONTEND.md`
- [ ] Documentar helpers con JSDoc
- [ ] Optimizar imports de tipos

## Commits realizados

- `[2026-01-28]` Crear rama y documentación inicial

## Notas importantes

⚠️ **Compatibilidad:** El objeto `mba3ConsultasService` debe mantener la misma interfaz
⚠️ **No cambiar firmas:** Mantener mismos parámetros y tipos de retorno
⚠️ **Migración incremental:** Un dominio a la vez, con tests después de cada uno
⚠️ **Preservar comportamiento:** Manejo de errores idéntico al actual

## Próximos pasos

1. Crear helpers de utilidades (`errorHandler`, `urlBuilder`, `fileValidator`)
2. Extraer configuración de axios
3. Migrar dominio más simple (`health.ts`) como prueba
4. Validar que todo funciona antes de continuar
