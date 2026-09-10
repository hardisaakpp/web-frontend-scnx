# Módulo Integraciones (soporte SAP / HITELL)

Pantallas de soporte sobre **api-middleware-sap** para que el equipo de sistemas vea qué pasó con
cada integración y reintegre a HITELL los documentos rechazados, sin entrar a la base de datos.

Ruta: `/integraciones`. Código: `src/modules/integraciones/`. Menú: entrada "Integraciones" en
`src/layouts/MainLayout.vue`, visible para quien tenga cualquier permiso `integraciones.*`.
Manual para el usuario final: [MANUAL_USUARIO_MODULO_INTEGRACIONES.md](MANUAL_USUARIO_MODULO_INTEGRACIONES.md).

## Pestañas

Las tres pestañas siguen el estándar de listados del proyecto: **paginación en servidor** (20 filas
por página, solo viaja la página pedida) y **filtro de fechas con los últimos 3 días por defecto**
(`rangoUltimosDias` en `utils/formatters.ts`), para que la primera carga no traiga tablas completas.

| Pestaña | Ruta | Fuente en el middleware | Qué muestra |
|---|---|---|---|
| HITELL (WEBPOS) | `/integraciones/hitell` | `GET /api/v1/webpos/sync-status` | Estado por documento SAP (transferencia `ST` o entrada de mercadería `GR`): Integrado, No corresponde o Rechazado, con el motivo interpretado (p. ej. producto no creado en HITELL) y los ítems afectados. Se busca por **número de documento SAP (DocNum)**; el DocEntry se muestra como dato secundario. Botón **Reintegrar** para los rechazados. |
| Cola SAP | `/integraciones/cola-sap` | `GET /api/v1/jobs`, `GET /api/v1/jobs/{id}` | Peticiones a SAP que el middleware encoló porque SAP no respondió en 10 s o estaba saturado. El job queda registrado de forma permanente y su fila cambia de estado (Encolado, Procesando, Completado, Error) con cada reintento; se ve también el payload enviado y el resultado. |
| Bitácora de peticiones | `/integraciones/bitacora` | `GET /api/v1/api-logs`, `GET /api/v1/api-logs/{id}` | Toda petición que pasó por el middleware desde cualquier módulo (excepto health, swagger y estas mismas consultas), haya ido a la cola o no: endpoint, usuario, código HTTP, duración, request y response truncados a 2000 caracteres. La hora es la de Ecuador (UTC-5). |

Diferencia entre Cola SAP y Bitácora: la bitácora es el registro completo de llamadas; la cola solo
tiene las que no pudieron completarse de forma síncrona. Una petición encolada aparece en ambas: en
la bitácora con respuesta 202 y el `jobId`, y en la cola con su evolución.

### Reintegrar a HITELL

`POST /api/v1/webpos/stock-transfers/{docEntry}/retry` (ST) o
`POST /api/v1/webpos/goods-receipts/{docEntry}/retry` (GR). El middleware vuelve a leer el
documento desde SAP y reenvía el aviso de stock a HITELL; **nunca crea ni modifica nada en SAP**.
Se puede repetir hasta que el documento quede Integrado o No corresponde. El resultado se muestra
como toast:

| Respuesta del middleware | Mensaje |
|---|---|
| `Synced` | Documento integrado en HITELL |
| `SkippedNotPos` | No corresponde integrar: ningún almacén del documento usa WEBPOS |
| `Rejected` | HITELL volvió a rechazar (se muestra el motivo) |
| `Queued` | HITELL no respondió a tiempo; quedó encolado (se muestra el jobId) |
| `Error` | Error al notificar a HITELL |

## Permisos

Registrar en SCNexus Core (catálogo `Permissions`, módulo `integraciones`) y asignar a los roles
de soporte; sin esto el menú no aparece y las rutas llevan a `/forbidden`. Ver
[SISTEMA_PERMISOS.md](SISTEMA_PERMISOS.md).

| Clave | Uso |
|---|---|
| `integraciones.view` | Ver las tres pestañas |
| `integraciones.hitell.retry` | Botón Reintegrar en la pestaña HITELL |

El rol `Admin` accede a todo sin necesidad de estos permisos. Constantes en
`src/modules/integraciones/permissions.ts`.

## Conexión con el middleware

Cliente `slayerHttp` (`src/lib/http.ts`), base `/slayer-api` → proxy a `{UPSTREAM_SLAYER}/api`
(`vite.config.ts` en desarrollo, nginx de `scnexus-front` en producción). El middleware no valida
el JWT: el control de acceso es el de permisos del front descrito arriba.

Antes de desplegar en un ambiente:

1. Desplegar api-middleware-sap con la rama `feature/integraciones-logs` (o posterior): agrega
   `GET /jobs`, `GET /api-logs`, `GET /api-logs/{id}`, y en `GET /webpos/sync-status` paginación,
   rango de fechas y búsqueda por `docNum` (nueva columna `doc_num`, que el middleware graba al
   notificar a HITELL).
2. En `sc_middleware` correr, de ese repo: `sql/create_pos_sync_status.sql` (en producción la tabla
   **no existía** al 2026-09-07, por eso el estado HITELL daba 500), `sql/alter_pos_sync_status_add_doc_num.sql`
   si la tabla ya existía sin `doc_num`, y `sql/create_api_log_indexes.sql` (índices para paginar
   `api_log` y `job_queue`; la tabla `api_log` de producción es grande).
3. Verificar que `UPSTREAM_SLAYER` del front apunte al middleware vivo (ya hubo un 502 en
   producción por una IP vieja horneada en esa variable).
