# Alineación front ↔ backend (jobs async, polling, timeouts)

Patrón de referencia: **202 + `process_id` → polling hasta estado terminal → refresco desde BD → no marcar error local si solo cortó el HTTP (timeout/red).**

Utilidades compartidas:

| Pieza | Ubicación |
|-------|-----------|
| Polling genérico (poll inmediato, luego cada 2 s) | `src/modules/mba3-consultas/utils/pollAsyncJob.ts` |
| SSE + fallback a poll | `followSseStream.ts`, `followAsyncJobSseOrPoll.ts`, `asyncJobStreamUrls.ts` |
| Timeout/red transitorio | `src/modules/mba3-consultas/utils/httpErrors.ts` (`isTransientClientError`, `SAP_MAY_STILL_PROCESSING_MESSAGE`) |
| Progreso modal SAP | `src/modules/mba3-consultas/composables/useSapProcessProgress.ts` |
| `process_id` ODC SAP en sessionStorage | `src/modules/mba3-consultas/utils/odcSapProcessStorage.ts` |

---

## Matriz de flujos

| # | Flujo | Backend | Front | Estado |
|---|--------|---------|-------|--------|
| 1 | Plantilla Excel | `upload-async` + `GET resultado/{id}` | `useFileUpload` + `pollAsyncJob` | **Alineado** (barra 0–25% upload, 25–100% Celery) |
| 2 | Proceso completo SAP | `proceso-completo-sap-async` + `GET proceso-sap/resultado/{id}` | `ejecutarProcesoCompletoSap` + vistas redistribución / cargar-plantilla | **Alineado** (transient, `loadPedido`, reanudar job, progreso real) |
| 3 | Integrar ODC | HTTP largo síncrono | `ProcesoCompletoView` + `integrarSapTimeout` | **Alineado** |
| 4 | Reintento ODC (pedido) | Flags en detalle + mismo job async | Banner + `puede_reintentar_envio_odc_sap` | **Alineado** (evita doble POST si hay `process_id` pendiente) |
| 5 | Reintento ST | `POST .../reintentar-st` sync ~120 s | `OrdenCompraTable` | **Alineado** (transient → warning + refresh lista) |
| 6 | Cruce productos | Celery + SSE/poll | `HomologacionesView` + `ejecutarCruceProductos` | **Alineado** (poll; fallback sync si falla `iniciar`) |
| 7 | Migrar / procesar-oc | GET síncronos largos | `procesoStore` + `ProcesoCompletoView` | **Alineado** (transient + refresh lista/despachos) |
| 8 | Homologaciones sync | POST síncrono | `HomologacionesView` | Transient + refresh lista |
| 9 | Notificaciones SSE | Eventos globales | `useNotificaciones` | Complemento; **siempre** refrescar al fin del poll |
| 10 | SSE streams por job | `.../stream/{process_id}` | `followAsyncJobSseOrPoll` en plantilla, SAP, cruce | **Alineado** (fallback automático a poll si SSE falla) |

---

## Contrato mínimo (jobs async)

1. **Inicio:** `accepted` + `process_id`, o `fallback: sync` / `async: false` → no hacer poll.
2. **Procesando:** `status: processing` + `message` + `progress` (0–100).
3. **Terminal:** `completed` / `success` / `partial` / `error` con cuerpo de negocio.
4. **Cliente:** `pollAsyncJob` (2 s, ~10 min, `workerPickupTimeout` 60 s donde aplique).
5. **Timeout axios/red:** toast **amarillo** + refetch autoritativo (pedido, ODC, flags ST).
6. **Nunca** poner `ERROR` en store local solo por `ECONNABORTED` si Celery puede seguir.

---

## Proceso completo SAP (detalle)

- Composable: `ejecutarProcesoCompletoSap.ts`
- Vistas: `MabelTradingRedistribucionView`, `CargarPlantillaView`, reintento en `ProcesoCompletoView` (`handleRetryProcesoCompletoSAP`)
- Storage: `odc_sap_process_{numero_pedido}` hasta fin de poll
- Si hay job `processing` guardado, un nuevo clic en «Enviar» **reanuda** el poll en lugar de un segundo POST

---

## Plantilla Excel (detalle)

- Composable: `useFileUpload` con `useAsyncUpload: true` en cargar-plantilla
- Mapeo: `mapFileUploadProgress` / `mapServerProcessingProgress` en `useFileUpload.ts`
- Terminal en `GET resultado`: **no** `{ status: "completed" }`; el cuerpo es el mismo que upload síncrono (`success` / `validation_error`, `pedido_id`, …). Solo `status === 'processing'` implica job en curso.

---

## Cruce de productos (detalle)

Contrato **distinto** a plantilla/SAP (validado con backend):

| | Plantilla / SAP | Cruce |
|--|-----------------|--------|
| Inicio async | `202`, `status: accepted` | **`200`**, `status: success`** + `process_id` |
| Poll en curso | Plano: `status`, `step`, `progress`, `message` | `status: processing` + **`estado: { step, progress, message }`** |
| Terminal OK | Cuerpo de negocio (sin wrapper `completed`) | `{ status: success, data: CruceProductosData }` |
| Error | `400` JSON (`validacion_sap`, …) | **`500`** + `detail` (string) |
| Fallback sync | `fallback: sync`, sin `process_id` | Igual: `fallback`/`async: false` o sin `process_id`, cuerpo con `data` |

- Composable: `ejecutarCruceProductos.ts` normaliza poll anidado, SSE plano y fallback sync en `iniciar`.
- UI: botón **Cruce MBA3/SAP** en `HomologacionesView.vue`.
- Fallback `GET realizar-cruce`: solo si falla `POST iniciar` (4xx distinto de 500); **no** en timeout de poll (toast amarillo + refresh).

## Proceso legado migrar / procesar-oc (detalle)

- Store: `procesoStore.ts` propaga errores transitorios con `isTransientClientError`.
- Vista: `ProcesoCompletoView` — `refreshDatosTrasTimeoutProcesoLegado()` en migrar y generar ODC.

## SSE por job (detalle)

1. Conectar a `GET .../stream/{process_id}` vía `followSseStream`.
2. Actualizar barra/mensaje en cada evento `data:` JSON.
3. Al estado terminal, un `GET .../resultado/{id}` final confirma el cuerpo en BD.
4. Si el stream no responde o corta, se usa `pollAsyncJob` (cada 2 s) sin cambiar la UI.

Rutas usadas: `plantillaStreamUrl`, `procesoSapStreamUrl` (+ `stream_url` del 202), `cruceProductosStreamUrl`.

## Checklist E2E (validación manual)

**Automatizado (API mock):** `npm run test:e2e:mba3` — cruce (ítem 6) + plantilla async (ítem 1). Playwright levanta `npm run dev`.

**OpenAPI:** con API en `:8000`, `npm run sync:openapi` actualiza `openapi.json` del front.

**Live (backend real, requiere credenciales):** copiar `.env.test.example` → `.env.test`, luego  
`$env:E2E_LIVE='1'; npm run test:e2e:mba3:live`

**Stack:** `mba3-consultas`: `.\scripts\docker-app-up.ps1 -Build` + `.\scripts\docker-verify.ps1`.  
**Front:** `npm run dev` (proxy a `:8000`). Login con JWT válido.

| # | Pantalla | Acción | OK si… |
|---|----------|--------|--------|
| 1 | Cargar plantilla | Subir `.xlsx` async | Progreso 25–100% desde servidor; redirect o pedido; sin rojo por timeout si SAP tarda |
| 2 | Redistribución | Enviar ODC a SAP | Modal SAP; `doc_num` o partial + `puede_reintentar_envio_odc_sap` coherente |
| 3 | Cargar plantilla | Reintentar envío SAP (banner) | Mismo job async; no doble POST si job pendiente |
| 4 | Proceso completo | Integrar una ODC | Lista con `ENVIADA`; transient → amarillo + refresh |
| 5 | Proceso completo | Reintentar ST | Flags `mostrar_reintentar_st` actualizados |
| 6 | Homologaciones | Cruce MBA3/SAP | Modal; éxito o amarillo si poll timeout |
| 7 | Proceso completo | Migrar / generar ODC | Transient → amarillo + refresh (no error fatal) |

Backend: misma checklist en `mba3-consultas/docs/ALINEACION_FRONT_ASYNC.md`.

---

## Orden sugerido para mejoras futuras

1. Job async en backend para homologaciones `sincronizar` si el tiempo crece.
2. Desactivar SSE por env (`VITE_DISABLE_JOB_SSE`) solo si un proxy no soporta streams.
3. E2E Playwright con auth de prueba para flujos 1–2 (hoy solo `login.spec.ts`).
