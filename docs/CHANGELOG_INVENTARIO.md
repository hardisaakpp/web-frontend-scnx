# Changelog — Módulo Inventario (Frontend)

Registro cronológico de cambios realizados al módulo `src/modules/inventario` con asistencia de Claude Code. Complementa (no reemplaza) el historial de git — acá se explica el *por qué* de cada cambio, agrupado por sesión de trabajo.

> Convención: cada entrada nueva se agrega **arriba**, con fecha, resumen corto, y el estado de commit/deploy al momento de escribirla. Si un ítem sigue sin commitear cuando se agrega una entrada más reciente, se actualiza su estado en vez de duplicarlo.

---

## 2026-08-25 — Selector de toma + descartar ajuste + copiar ID en Resumen

- **`AdjustmentsBoardView.vue`**: el formulario "Crear Ajuste" ya no pide pegar el `sessionId` a mano — ahora es un `<select>` con las tomas cerradas que todavía no tienen ajuste ni fueron descartadas (`sesionesPendientes`, calculado sobre `inventarioSesionesService.getSesiones()`). Nuevo botón "Descartar (sin ajuste)" junto a "Crear Ajuste" — llama a `discardAdjustment` (ver backend), sin cobro, la toma se queda cerrada tal cual está; confirma con un diálogo simple antes de ejecutar.
- **`SupervisorResumenView.vue`**: botón de copiar el ID completo de la sesión al portapapeles junto al ID truncado del encabezado (antes no había forma de obtener el ID completo sin abrir devtools).
- **Ícono de "ajuste terminado"**: se reemplazó la ⭐ por `CheckBadgeIcon` en `HistorialConteosView.vue` y `SesionesInventarioView.vue` — ahora cubre dos casos con el mismo ícono pero tooltip distinto: verde "Cerrado con informe de ajuste aprobado" o gris "Cerrado — revisado sin ajuste" (descartado).
- Tipos nuevos: `adjustmentDiscarded` en `InventorySessionListItemDto`/`MyCountHistorySessionDto` (`types.ts`), `discardAdjustment` en `scnexusInventoryApi.ts`.
- Estado: **sin commitear**, en `feature/req_inventarios240826`. Ver `api-inventario/docs/CHANGELOG_INVENTARIO.md` (2026-08-25, "Descartar ajuste...") para el backend.

## 2026-08-25 — Ajuste final para tienda, marca de cerrados con informe, enteros, búsqueda/orden en listas

- **`AjusteFinalTiendaView.vue`** (nueva, ruta `/inventario/mis-inventarios/ajuste/:sessionId`, sin permiso RBAC — autoservicio, el backend valida acceso por bodega): vista de solo lectura del ajuste ya aprobado de una toma, para el rol tienda. Muestra Item/Descripción/Diferencia final/Valor final — **sin columnas de costo ni PVP** (a diferencia de `AdjustmentsBoardView.vue`, que sí las muestra a auditoría/supervisión). Descarga a Excel con las mismas 4 columnas, también sin costo.
- **`HistorialConteosView.vue`**: botón "Ver ajuste final" por sesión (habilitado cuando `hasApprovedAdjustment`) y una ⭐ junto al badge de estado en las sesiones cerradas que ya tienen ajuste aprobado.
- **`SesionesInventarioView.vue`** (listado de Toma Física): misma ⭐ junto al badge "Cerrada". Además, estándar de búsqueda + orden por columna (ver abajo).
- **Estándar de búsqueda + orden por columna** aplicado a las listas de tabla que no lo tenían — mismo patrón que ya tenía `DetalleTomaFisicaView.vue` (`search` + clic en `<th>` para ordenar, con indicador ▲/▼): `SesionesInventarioView.vue` (pedido explícito, "tomas físicas"), `AdjustmentsBoardView.vue`, `PlanesInventarioView.vue`, `GeneratedInventoriesView.vue`, `InventoryDetailView.vue`, `InventoryPlanningsView.vue`, y la tabla de detalle de `GestionScansView.vue` (que ya tenía búsqueda, solo le faltaba orden). No se tocaron `PlanningDetailView.vue`/`ResumenPickingView.vue` (tablas chicas de tamaño fijo, no lo necesitan) ni `SessionCenterView.vue`/`PlanningWorkbenchView.vue` (pantallas de prueba de API, no de uso diario).
- **`AdjustmentsBoardView.vue`**: la diferencia ajustada de cada línea ahora solo acepta enteros (`step="1"`, validación en frontend con mensaje claro antes de guardar) — espejo de la validación nueva en el backend (`InventoryAdjustmentLine.UpdateAudit`).
- Tipos nuevos en `types.ts` (`hasApprovedAdjustment`/`adjustmentId` en `InventorySessionListItemDto` y `MyCountHistorySessionDto`) y `scnexusInventoryApi.ts` (`getAdjustmentBySession`). Ver `api-inventario/docs/CHANGELOG_INVENTARIO.md` (2026-08-25) para el backend.
- **Incidente durante el trabajo**: al correr varios agentes en paralelo (uno por vista, para aplicar el estándar de búsqueda/orden) sobre el mismo worktree, uno de ellos hizo un `git stash`/`git stash pop` exploratorio que salió mal a medias y dejó temporalmente 2 archivos (`GestionScansView.vue`, `InventoryPlanningsView.vue`) con la plantilla ya editada pero el script sin los cambios correspondientes (no compilaban). Detectado con `vue-tsc --noEmit` y corregido a mano completando el script faltante en ambos; verificado de nuevo con `vue-tsc` limpio (exit 0) en todo el proyecto y `git status`/`git stash list` consistentes al terminar. Nada se perdió, pero quedó documentado por si el mismo patrón (agentes en paralelo + `git stash` exploratorio) se repite en otra sesión.
- Estado: **sin commitear**, en `feature/req_inventarios240826` (worktree de esta sesión). `vue-tsc --noEmit` limpio.

## 2026-08-25 — Escáner de código de barras copiado a Inventario + rediseño de listas

- **`useBarcodeScanner.ts`/`ScannerPanel.vue`** copiados tal cual (no importados) desde `articulo-scaner` a `src/modules/inventario/{composables,components}/` — a pedido explícito del usuario, para no acoplar el módulo inventario al módulo scanner. Único cambio: el import interno de `ScannerPanel.vue` apunta a la copia local del composable.
- Botón de cámara agregado en **`ContarArticulosView.vue`** (junto a "Buscar artículo") y **`ConteoPickingView.vue`** (junto a "Escanear código de barras") — abren el mismo `ScannerPanel` copiado; el código detectado llena el campo de búsqueda/pasa directo a la cola de picking, respectivamente.
- **`SesionesInventarioView.vue`** (listado de Toma Física): ancho completo, columnas reducidas a Bodega/Descripción/Estado/Listado(items+cant.)/Fecha definida/Acciones (Plan/ID/Creado por se movieron al Resumen), paginado de 10. "Listado (items/cant.)" y "Fecha definida" reflejan el **alcance definido** de la toma (filtros con los que se generó), no el avance de conteo ni las fechas reales de apertura/cierre — esas siguen en `SupervisorResumenView.vue`.
- **`SupervisorResumenView.vue`**: encabezado gana `referenceCode`, Plan/ID, Creado por. Descarga cambiada de CSV a **Excel de 2 hojas** ("Resumen" con los datos ya visibles en pantalla, "Detalle" con Código/Descripción/SAP/Conteo/Reconteo/Diferencia final/Estado) — antes bajaba TODO el almacén (~3k filas) en vez de solo el alcance de la toma (~45), ver fix de backend del mismo día.
- Estado: **sin commitear**, en `feature/req_inventarios240826` (worktree de esta sesión).

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
