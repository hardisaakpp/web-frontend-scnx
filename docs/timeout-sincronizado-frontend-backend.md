# Timeouts y envío a SAP — alineación frontend ↔ backend

## Resumen

El frontend evita cortar peticiones HTTP antes de que el backend termine el envío a SAP, y distingue **errores del cliente** (timeout axios, red) de **errores reales del servidor** (504, validación SAP, etc.).

| Flujo | Mecanismo | Timeout / espera en front |
|-------|-----------|---------------------------|
| **`POST /integrar-sap`** (Proceso completo → Enviar a SAP) | HTTP síncrono | **120 s** base + **30 s** por ODC extra (máx. **300 s**) |
| **`POST .../proceso-completo-sap`** (fallback sync) | HTTP síncrono | **300 s** (5 min) |
| **`POST .../proceso-completo-sap-async`** + polling | Celery + `GET .../proceso-sap/resultado/{id}` | POST **90 s**; polling hasta **10 min** |
| **Plantilla `upload-async`** + polling | Celery + `GET .../resultado/{id}` | POST **60 s**; polling hasta **11 min** |
| Resto de `mba3Api` | Default axios | **30 s** (salvo overrides por endpoint) |

**Backend (referencia):** Celery `task_time_limit=600` s; el API puede persistir `ENVIADA` aunque el navegador ya haya cortado la conexión.

---

## Archivos en el frontend

| Archivo | Rol |
|---------|-----|
| `src/modules/mba3-consultas/utils/integrarSapTimeout.ts` | Cálculo de timeout para `integrarSAP` |
| `src/modules/mba3-consultas/utils/httpErrors.ts` | `isTransientClientError`, mensaje `SAP_MAY_STILL_PROCESSING_MESSAGE` |
| `src/modules/mba3-consultas/utils/pollAsyncJob.ts` | Polling genérico (plantilla, proceso SAP) |
| `src/modules/mba3-consultas/composables/ejecutarProcesoCompletoSap.ts` | Async + polling + fallback sync |
| `src/modules/mba3-consultas/composables/useFileUpload.ts` | `waitForAsyncPlantillaResult` (usa `pollAsyncJob`) |
| `src/modules/mba3-consultas/services/domains/procesamiento.ts` | `integrarSAP` |
| `src/modules/mba3-consultas/services/domains/pedidos.ts` | `procesoCompletoSAP`, `procesoCompletoSAPAsync` |
| `src/modules/mba3-consultas/views/ProcesoCompletoView.vue` | Toast amarillo + refresh en timeout/red |
| `src/modules/mba3-consultas/views/MabelTradingRedistribucionView.vue` | Idem en «Enviar ODC a SAP» |
| `src/modules/mba3-consultas/services/config/axiosConfig.ts` | Interceptor (headers `X-Request-Timeout` en dev) |

---

## Timeout dinámico en `integrarSAP`

Definido en `calculateIntegrarSapTimeoutMs()`:

- **1 ODC:** 120 s  
- **N ODCs:** 120 + (N − 1) × 30 s, tope **300 s**

Ejemplo: 3 ODCs → 180 s.

Uso en `mba3ConsultasApi.integrarSAP` y `procesamientoService.integrarSAP`.

---

## Errores transitorios (cliente)

`isTransientClientError` es verdadero solo para:

- `ECONNABORTED` / mensaje con `timeout`
- `ERR_NETWORK`, `ECONNRESET`, `Network Error`

**No** incluye respuestas HTTP **504/502** del servidor → siguen siendo toast **rojo** y error de negocio.

### Comportamiento en UI

| Situación | Toast | Estado local en tabla |
|-----------|-------|------------------------|
| Éxito HTTP | Verde / modal | `ENVIADA` |
| Timeout/red en cliente | **Amarillo** + mensaje «el servidor puede seguir procesando…» | **No** se fuerza `ERROR`; se refresca lista desde API |
| 504 / error SAP / validación | Rojo | `ERROR` si el backend lo indica |

Vistas afectadas: `ProcesoCompletoView` (`handleIntegrarOC`, múltiples, reintento SAP), `MabelTradingRedistribucionView` (`handleEnviarOdcSap`).

---

## Proceso completo SAP (redistribución)

1. `POST /api/pedidos/{numero}/proceso-completo-sap-async` → `202` + `process_id` (o `200` sync inmediato si `fallback: "sync"`).
2. Polling cada **2 s** con `pollAsyncJob` (máx. **10 min**).
3. Si **503** (`celery_unavailable` / `storage_required`) → fallback a `proceso-completo-sap` sync (**300 s**).

Ver `ejecutarProcesoCompletoSap.ts`.

---

## Proxy (Vite / Nginx)

El bundle solo usa rutas relativas (`/api/mba3`, …). Los timeouts del **proxy** deben ser ≥ los del axios:

| Entorno | Configuración |
|---------|----------------|
| Dev | Vite en `vite.config.ts` (proxy al MBA3 API) |
| Docker / prod | `deploy/nginx/scnexus-docker.conf.template` — muchos `location` usan `proxy_read_timeout 120s`; bloque MBA3 con **180s** en algunos paths |

Si el front espera hasta **300 s** en `integrar-sap` pero Nginx corta a **120–180 s**, verás **504** (error rojo), no toast amarillo. Ajustar upstream en Nginx/Apache si hace falta.

Ver [ENV.md](./ENV.md) y [DOCKER.md](./DOCKER.md).

---

## Headers opcionales del backend

El interceptor en `axiosConfig.ts` puede leer (solo log en dev):

- `X-Request-Timeout`
- `X-Request-Timeout-Min`

El cálculo actual **no depende** de ellos; son recomendación futura. Ejemplo backend (valores alineados con front: base **120** s):

```python
estimated_timeout = 120
if num_ordenes > 1:
    estimated_timeout += (num_ordenes - 1) * 30
response.headers["X-Request-Timeout"] = str(estimated_timeout)
response.headers["X-Request-Timeout-Min"] = "120"
```

---

## Checklist de validación en dev

1. Stack: API mba3-consultas, Celery (flujos async), front `:3000` con proxy a MBA3.
2. **ODC lenta (~60–90 s)** en Proceso completo → Enviar a SAP: overlay hasta respuesta; toast verde; fila **`ENVIADA`**; sin badge rojo falso.
3. **Corte cliente** (si aún ocurre): toast amarillo; tras refresh/F5 → **`ENVIADA`** si SAP terminó.
4. **DevTools → Network:** éxito → `POST /integrar-sap` o polling `proceso-sap/resultado/*` con **200**; corte → `failed`/`canceled` en axios pero `GET /ordenes-compra` puede mostrar `ENVIADA`.
5. **Redistribución** con Celery: progreso hasta **10 min** sin caer por `maxWaitMessage` prematuro.

### Si algo no cuadra

| Síntoma | Revisar |
|---------|---------|
| Rojo local pero `ENVIADA` en BD | Path que marca `ERROR` sin pasar por `isTransientClientError` |
| Amarillo pero sigue `PENDIENTE` | Backend aún procesando o falló SAP (logs API, `SAP_SERVICE_LAYER_TIMEOUT`) |
| 504 en Network | Proxy/backend, no timeout axios → debe ser toast **rojo** |

---

## Próximo paso opcional (no implementado)

`POST /integrar-sap-async` + polling (mismo patrón que `proceso-completo-sap-async`) requeriría endpoint en el backend. Hoy **integrar-sap** sigue siendo una sola petición HTTP síncrona.

---

## Debugging

En consola del navegador (dev):

```
⏱️ [integrarSAP] Timeout calculado: 120s para 1 ODC(s)
⏱️ [MBA3 API] Backend recomiende timeout: …s (mín: …s)
```

Documentación relacionada: [optimizacion-estados-odc.md](./optimizacion-estados-odc.md), [MODAL_INTEGRACION_SAP_SOLICITUDES_TRANSFERENCIA.md](./MODAL_INTEGRACION_SAP_SOLICITUDES_TRANSFERENCIA.md).
