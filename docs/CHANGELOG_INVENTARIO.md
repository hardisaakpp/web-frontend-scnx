# Changelog — Módulo Inventario (Frontend)

Registro cronológico de cambios realizados al módulo `src/modules/inventario` con asistencia de Claude Code. Complementa (no reemplaza) el historial de git — acá se explica el *por qué* de cada cambio, agrupado por sesión de trabajo.

> Convención: cada entrada nueva se agrega **arriba**, con fecha, resumen corto, y el estado de commit/deploy al momento de escribirla. Si un ítem sigue sin commitear cuando se agrega una entrada más reciente, se actualiza su estado en vez de duplicarlo.

---

## 2026-08-21 — Fix: columna "Género" traía el dato equivocado

- **`DetalleTomaFisicaView.vue`** (tabla y ambos descargables — filtrado y consolidado): la columna "Género" (rebautizada así el 17-ago desde "Familia", ver esa entrada) seguía leyendo `row.familia`, que en el backend venía de `item_group_name` en vez de `u_gen`. Nivel1/Nivel2/Nivel3 estaban correctos, solo Género estaba mal. **Fix es 100% backend** — `familia`/`Familia` se dejó igual como nombre de campo (no se tocó nada en este repo), solo cambió su origen en `api-inventario`. Ver `api-inventario/docs/CHANGELOG_INVENTARIO.md` (2026-08-21, "Fix: columna Género...").
- Estado: **sin commitear**.

## 2026-08-21 — Valorizado Mabeltrading + valorización del ajuste (costo/PVP)

- **`SupervisorResumenView.vue`**: nueva tarjeta "Valorizado Mabeltrading (a costo)" con "Total inventario" (todo el almacén sin filtrar) y "Cuánto se auditó" (el alcance filtrado de esta toma — lo que el plan/sesión decidió inventariar, no lo ya escaneado; casi siempre menor al total). `summary.totalValorizedCost`/`auditedValorizedCost`, nuevos en `SupervisorSummaryDto`. Sin filtros propios nuevos — la vista ya es por sesión única.
- **`AdjustmentsBoardView.vue`**: selector "Valorización del reporte final" (Costo / PVP / PVP menos descuento %) por ajuste — `PATCH .../valuation`, se bloquea junto con el resto de la edición una vez `Approved`/`SentToSap` (informe ya generado e inmutable). Tabla de líneas gana columnas Costo/PVP/Valorizado; tarjetas de detalle y listado ganan el total valorizado.
- **`ItemStockDto`** (consulta de stock) gana `cost`/`pvp`, espejo del backend — no se consume aún en ninguna vista de stock, solo queda disponible.
- Tipos nuevos/actualizados en `scnexusInventoryApi.ts` (`AdjustmentValuationMode`, campos de costo/PVP/valorizado en `AdjustmentLineDto`/`AdjustmentDetailDto`/`AdjustmentSummaryDto`) y en `types.ts` (`SupervisorSummaryDto.totalValorizedCost`/`auditedValorizedCost`).
- El costo/PVP viene de `sc_maestros.items_local.costo`/`.pvp` (ya creadas por el negocio, `decimal(19,6)`) — ya no es placeholder. Ver `api-inventario/docs/CHANGELOG_INVENTARIO.md` (2026-08-21).
- Estado: **sin commitear**.

## 2026-08-17 — Encabezado "Familia" → "Género"

- **`DetalleTomaFisicaView.vue`**: el encabezado de columna decía "Familia" pero el campo (`familia`, viene de `item_group_name` en `items_local`) en realidad representa el Género del artículo. Se corrigió el texto visible en la tabla y en el export a Excel — se dejó el nombre interno del campo/DTO sin tocar (`SessionDetailLineDto.Familia` sigue igual en el backend).

## 2026-08-17 — Export a Excel real + limpieza de picking link

- **Descarga de reportes en formato Excel real (.xlsx), no CSV** — `/inventario/sesiones/{id}/detalle`. El CSV hacía que Excel interpretara códigos de barras largos como notación científica (`8E2121.11`) al no poder forzar el tipo de celda. Se agregó `src/utils/exportExcel.ts` (usa `xlsx`/SheetJS, instalado desde el CDN oficial de SheetJS — la versión de npm tiene 2 CVEs de lectura sin parche que no aplican a nuestro caso de solo-escritura, pero se evitó igual) y se marcan como texto las columnas `CodigoBarras`/`ItemCode`. Reemplazó `toCSV`/`downloadCSV` en `DetalleTomaFisicaView.vue`.
  - Pendiente: aplicar el mismo util a `HistorialConteosView.vue` y al CSV de `SupervisorResumenView.vue`, que tienen el mismo problema.
- **Eliminado el botón "Copiar link de picking"** en `/inventario/sesiones` (`SesionesInventarioView.vue`) — el flujo real quedó resuelto por login + "Mis Inventarios".
- **Modales "Nueva Toma" y "Nuevo Plan" ya no se vacían al cerrarlos con clic afuera/Escape** (`CrearSesionDirectaModal.vue`, `CrearPlanModal.vue`) — solo se limpian al presionar "Cancelar" explícitamente o tras generar exitosamente.
- Estado: **sin commitear** (working tree de `fix/cchica-reportes-070826`).

## 2026-08-16/17 — Ubicación en picking, reconteo por Nivel 2, campo de referencia

- **Campo "Ubicación" (≤10 alfanumérico, opcional)** al presionar "Iniciar picking" en `MisInventariosView.vue` — se guarda en el picker (backend) y se muestra en `SupervisorResumenView.vue` → "Conteo por usuario".
- **Asignación automática de reconteo por Nivel 2** (`RecountAssignmentModal.vue`, nuevo): al pasar una toma a Reconteo, propone qué usuario recuenta cada artículo — prioriza a quien NO lo escaneó en el conteo inicial, agrupado por Nivel 2 para minimizar movimiento físico. El supervisor puede reasignar ítems o quitar usuarios (redistribuye automáticamente) antes de confirmar. Es **solo informativo**: no restringe técnicamente quién puede contar qué. Se abre automáticamente al cerrar una toma y pasar a Reconteo (`SesionesInventarioView.vue`, `SupervisorResumenView.vue`).
- **`ContarArticulosView.vue` en modo Reconteo**: nuevas columnas Total Conteo (inicial), Reconteo, Total Reconteo, Diferencia (con signo) y "Asignado a".
- **Campo "Código de referencia"** (≤10 alfanumérico, opcional) al crear una toma directa (`CrearSesionDirectaModal.vue`) — visible para cualquiera con permiso `inventario.generar` (no solo admins, corregido tras feedback).
- **Botón "Eliminar toma"** en `/inventario/sesiones`, solo visible cuando el estado es Abierta.
- Estado: **sin commitear**.

## 2026-08-14/15 — Batch de 7 mejoras + fix de redirect al crear toma

- **Nombres de usuario reales** (no IDs crudos) en detalle de scans, gestión de scans y resumen por usuario — nuevo util compartido `src/utils/resolveUserNames.ts` (movido desde `caja-chica/utils`, reutilizado).
- **Resumen de avance por unidades** además de por artículos, con toggle en `SupervisorResumenView.vue`.
- **Ordenar por clic en encabezado** en `DetalleTomaFisicaView.vue` y `ContarArticulosView.vue`.
- **Filtro Nivel 2 "OTROS CÓDIGOS"** en `ContarArticulosView.vue` para artículos sin clasificación.
- **Stock SAP visible en Reconteo** para usuarios de tienda (antes se ocultaba siempre).
- **Fix: crear una toma en `/inventario/sesiones` ya no redirige** a la pantalla de detalle — se queda en la lista, la refresca, y muestra mensaje de éxito (`onSesionCreada`).
- Commits: `afa3d6a` (mover resolveUserNames), `45c5eec` (feat batch de 7).

## 2026-08-13 — Fix guardado de conteo manual (dos dispositivos)

- **`onManualBlur` en `ContarArticulosView.vue` solo guarda si el valor cambió** respecto al mostrado en pantalla — antes, cualquier blur (incluso sin editar) reenviaba el valor, y como el backend reemplaza el conteo manual completo (no por usuario), un dispositivo con datos desactualizados podía borrar el conteo recién guardado por otro.

---

Ver también: `api-inventario/docs/CHANGELOG_INVENTARIO.md` para los cambios de backend correspondientes (muchos de los ítems de arriba dependen de endpoints/migraciones documentados ahí).
