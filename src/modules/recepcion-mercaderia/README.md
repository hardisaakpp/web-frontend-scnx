# Módulo de Recepción de Mercadería

Recepción de transferencias entre almacenes (CD → tienda): materialización de solicitudes pendientes desde SAP, picking/escaneo, confirmación con integración a SAP (segundo tramo del stock transfer), registro de diferencias e historial. Reemplaza el flujo equivalente del legacy `sc22` (`recP.php`).

Backend real: [`api-recepcion-mercaderia`](../../../../api-recepcion-mercaderia) (.NET 8, Clean Architecture) — no es un mock ni un stub, todas las vistas consumen la API real.

## Estructura

```text
recepcion-mercaderia/
├── components/
│   ├── ConfirmDialog.vue      # Modal de confirmación (ej. "Materializar")
│   └── ErrorDialog.vue        # Modal de error de acciones (scan/confirm/diferencias)
├── config/
│   └── featureReadiness.ts    # Kill switch manual para el flujo de Pendientes (ver Limitaciones)
├── services/
│   └── recepcionApi.ts        # Único punto de mapeo wire-shape backend -> tipos del módulo
├── stores/                    # Pinia, uno por área funcional (no hay un store único)
│   ├── pendingStore.ts        # Pendientes + materializar
│   ├── transitStore.ts        # Reporte de transferencias en tránsito (solo lectura)
│   ├── inProgressStore.ts     # Lista "En Curso" + paginación (split de pickingStore, ver auditoría SOLID)
│   ├── pickingStore.ts        # Detalle: scan, confirm, diferencias, GLPI, reportes
│   └── historyStore.ts        # Historial (propio + "todos los almacenes")
├── views/
│   ├── DashboardView.vue
│   ├── PendingTransfersView.vue
│   ├── TransitTransfersView.vue # Reporte de tránsito (N.° transferencia, destino transitoria, cantidad, fecha)
│   ├── InProgressView.vue
│   ├── TransferDetailView.vue # Picking + confirm + diferencias (vista más grande del módulo)
│   └── HistoryView.vue
├── utils/
│   ├── downloadBlob.ts        # Trigger de descarga compartido (reportes xlsx)
│   └── apiErrorMapper.ts      # backendErrorMessage(), compartido por inProgressStore/pickingStore
├── types.ts                   # DTOs — comentados con el shape REAL del backend, no el ideal
└── router.ts
```

## Rutas

| Ruta | Vista | Permiso |
|---|---|---|
| `/recepcion-mercaderia` | `DashboardView` | `requiresAuth` (los accesos internos se filtran por permiso) |
| `/recepcion-mercaderia/pendientes` | `PendingTransfersView` | `recepcion.reception.view` |
| `/recepcion-mercaderia/en-curso` | `InProgressView` | `recepcion.reception.view` |
| `/recepcion-mercaderia/en-curso/:id` | `TransferDetailView` | `recepcion.reception.view` |
| `/recepcion-mercaderia/transitorias` | `TransitTransfersView` | `recepcion.reception.transit.view` |
| `/recepcion-mercaderia/historial` | `HistoryView` | `recepcion.history.view` **o** `recepcion.history.viewall` |

Los permisos de historial son independientes y la ruta aplica semántica OR. Con solo `recepcion.history.view`, `HistoryView.vue` consulta `GET /history`; con `recepcion.history.viewall`, incluso si también está asignado el permiso anterior, prioriza `GET /history/all`. Sin ninguno, el guard global redirige a `/forbidden`. Los permisos de acción dentro del detalle (`recepcion.picking.scan`, `recepcion.reception.confirm`, `recepcion.reception.confirm.partial`, `recepcion.diferencias.gestionar`) también se chequean en el componente, no a nivel de ruta — ver `router.ts` para el razonamiento (evita el patrón `beforeEnter` por ruta que sí usa `reposiciones`, considerado redundante).

## Backend Integrado

- **Repo:** `api-recepcion-mercaderia` (.NET 8) — capas `Reception.Domain/Application/Infrastructure/Api`.
- **Proxy:** `/api/recepcion-api/*` → `/api/*` en el backend real, tanto en Vite dev (`vite.config.ts`) como en nginx dockerizado (`deploy/nginx/scnexus-docker.conf.template`). Prefijo de rutas consumidas: `recepcion-api/reception/*` (`recepcionApi.ts:19`).
- **Puertos:** `5215` local (`dotnet run`) / `8007` dockerizado (`api-recepcion-mercaderia/docker-compose.yml`) — ver `docs/Puertos.MD`.
- **Integración SAP:** el `confirm()` de una transferencia dispara un segundo stock transfer en SAP vía `api-middleware-sap` (`POST /api/v1/stock-transfers/based-on-document`), replicando el segundo tramo (Transitoria → Tienda real) del legacy `sc22`.

## Permisos

Todos bajo el prefijo `recepcion.` (cualquier permiso con ese prefijo, o rol `Admin`, habilita la entrada del sidebar — `MainLayout.vue`, `hasModuleAccess('recepcionmercaderia')`):

| Permiso | Habilita |
|---|---|
| `recepcion.reception.view` | Ver Pendientes, En Curso y Detalle |
| `recepcion.history.view` | Acceder al Historial y consultar el propio almacén (`GET /history`) |
| `recepcion.history.viewall` | Acceder al Historial y consultar/exportar el consolidado (`GET /history/all`, `GET /history/all/export`); no requiere `recepcion.history.view` |
| `recepcion.picking.scan` | Inputs de escaneo (barcode + manual fallback) en el detalle |
| `recepcion.reception.confirm` | Botón "Confirmar" |
| `recepcion.reception.confirm.partial` | Botón "Confirmar parcial" |
| `recepcion.diferencias.gestionar` | Eliminar una diferencia registrada |
| `recepcion.reception.transit.view` | Ver el reporte de Transferencias en Tránsito (`GET /pending-transfers/transit`) y exportarlo a xlsx (`GET /pending-transfers/transit/report`, validado también server-side — 403 sin el permiso) |

Como en todo el repo: estos strings deben existir en SCNexus Core y estar asignados a roles — el frontend no los crea (ver `docs/SISTEMA_PERMISOS.md`).

`GET /history/export` (botón "Exportar Excel" en la vista propia de Historial) no está gateado por ningún permiso adicional — cualquier usuario con `recepcion.history.view` lo puede usar; el backend acota el archivo a los almacenes que ya tiene asignados en Core, mismo criterio que `GET /history`.

## Flujo funcional

1. **Pendientes** (`PendingTransfersView`): lista solicitudes de transferencia SAP no materializadas. "Materializar" crea la `ReceptionTransfer` real en el backend.
2. **En Curso / Picking** (`InProgressView` → `TransferDetailView`): escaneo por código de barras (línea con barcode) o input manual (línea sin barcode). El exceso sobre lo pedido se registra como diferencia — no se descarta silenciosamente como hacía el legacy.
3. **Confirmar / Confirmar parcial**: confirmar exige todas las líneas completas; "Confirmar parcial" tiene un gate de reconteo forzado (paridad legacy — primer intento resetea y pide recontar, el segundo pasa). Dispara el segundo stock transfer en SAP.
4. **Historial** (`HistoryView`): transferencias confirmadas, propio almacén o todos (según permiso), export a xlsx.

## Limitaciones conocidas

- **`series` en el contrato SAP** (`ConfirmReceptionTransferCommand.cs` en el backend) queda en `null` con un `TODO` — pendiente de confirmación del equipo SAP/middleware.
- **`featureReadiness.pendingTransfersReady`** (`config/featureReadiness.ts`) es un kill switch manual, no una probe de salud del backend. Hoy está en `true` (flujo de Pendientes confirmado funcionando). Si se pone en `false`, `PendingTransfersView` muestra un banner "Próximamente" y `pendingStore` no emite llamadas reales — útil ante una degradación de la integración SAP sin tener que revertir código.
- **`InProgressView.vue` no muestra ningún mensaje si falla el fetch de la lista** — gap detectado en auditoría, no corregido aún.
- El flujo de cierre contra `BaseEntry`/`BaseLine` no pudo probarse con datos reales de producción: la base SAP de test (`TEST_MABEL`) no comparte números de documento con producción.

## Testing

- Unitarios: `tests/unit/modules/recepcion-mercaderia/` (stores, vistas, `recepcionApi.ts`).
- E2E (Playwright): `tests/e2e/recepcion-picking.spec.ts`, `recepcion-history.spec.ts`, `recepcion-rbac.spec.ts`, mocks compartidos en `tests/e2e/helpers/recepcionMocks.ts`.

## Consideraciones de Desarrollo

- **TDD estricto**: todo cambio de comportamiento en este módulo debe partir de un test que falle primero.
- **`pickingStore.ts` separa `fetchError` de `actionError`** deliberadamente — no reutilizar un solo campo de error para fetch y para acciones de mutación; ese acoplamiento causó un bug real (el modal de error se disparaba también en fallos de carga inicial).
- **Documentación de funciones**: TSDoc (`/** */`) en toda función con nombre que documenta su contrato (se ve en el hover del editor en cada call site); `//` solo para notas puntuales dentro del cuerpo de una función o sobre un `ref` de estado — no hay una convención de documentar cada `ref` individualmente.
- **Wire-shape mapping**: `recepcionApi.ts` y `types.ts` documentan explícitamente dónde el nombre interno del módulo difiere del campo real del backend (ej. `transferId` interno vs. `id` real) — no asumir que los DTOs reflejan el contrato ideal, están anotados con el contrato REAL verificado contra el código del backend.
