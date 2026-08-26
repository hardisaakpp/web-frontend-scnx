# Histórico de Fases — Módulo Reposiciones

Registro append-only de los hitos del módulo. Cada fase se cierra con su estado final antes de abrir la siguiente; no se reescribe una fase ya cerrada, solo se agregan nuevas.

---

## Fase 1 — Migración e independencia inicial del legacy ✅

**Periodo:** desde 2026-06-01 (`62c170c` implementación inicial del módulo)
**Estado:** Completado — en producción, adaptación exitosa por parte del usuario final.

**Hito:** el módulo pertenecía al sistema legacy (Store Control / `sc22`) y estaba pensado para un solo negocio. Se migró la lógica a SCNexus (Vue 3 + .NET 8) replicando y mejorando el flujo original (catálogo paginado, solicitud diaria, historial).

**Plan de referencia:** [PLAN_FASE1_FRONTEND.md](PLAN_FASE1_FRONTEND.md) *(archivo original se llamaba `PLAN_FASE2_FRONTEND.md`; se corrigió el nombre para que coincida con el hito real)*.

---

## Fase 2 — Independencia total del legacy + base multinegocio ⚠️ (backend completo, frontend parcial)

**Periodo:** 2026-06-11 → 2026-08-04
**Rama de trabajo:** `feature/fase2-multinegocio` (mergeada; la mayoría de los cambios de esta fase se hicieron ahí). La rama actual `feature/fase2-multinegocio-control-cambios` nace directamente de esa rama, sin commits propios adicionales todavía.
**Estado:** Backend completado. Frontend con adaptación pendiente — no se alcanzó a cerrar un periodo de adopción propio antes de pasar a fase 3.

**Hitos:**
- Independencia total del sistema legacy (ya no depende de `sc22`).
- Backend adaptado para soportar modelo de negocio de único → **multinegocio**.

**Cambios por commit (rama `feature/fase2-multinegocio`, 6 commits sobre `main`):**

| Fecha | Commit | Cambio |
|---|---|---|
| 2026-07-30 | `a58bbd5` | **Hito principal.** Migra `getAlmacenes` de `Catalogo/almacenes` a `Almacen` (nuevo endpoint). El tipo `Almacen` pasa de `{whsCode, whsName}` a `{id?, code, name, esCentroDistribucion?, centroDistribucionId?, centroDistribucionCode?}` — introduce el concepto de Centro de Distribución (CD) como agrupador de negocio. Ver [[reposiciones_almacen_endpoint]]. |
| 2026-08-03 | `a17cc76` | Agrega `catalogoAlmacenes` + getter `etiquetaAlmacen` en el store para mostrar "código — nombre" de bodega (antes solo código). Fix adicional: el modal "Ver SAP" en `AdminHistorialView` nunca se había implementado y el botón no tenía efecto. |
| 2026-08-03 | `239bc5d` | Agrega reporte general (PDF/Excel) vía `getHistorialPdfGeneralUrl` / `getHistorialExcelGeneralUrl`, con soporte de query param **`cdCode`** ya construido en el service — pero **no expuesto en la UI todavía** (ver comentario en `AdminHistorialView.vue:93`: *"cdCode se omite a propósito: el reporte general incluye todos los CD"*). También agrega búsqueda por tipeado de tienda en `SolicitarView`. |
| 2026-08-04 | `0f31e89` | Rediseño del bloque de filtros de `SolicitarView` a un panel fijo (trigger en header, sin botón Aplicar, `maxHeight` sincronizado con la tabla, "Limpiar" fijo abajo). Ver [[reposiciones_filtros_panel_ux]]. |
| 2026-08-04 | `ca5bbf8` | Nueva vista `AdminCatalogoView.vue` (658 líneas, solo lectura) + ruta `/reposiciones/admin/catalogo`. Cambia la regla de navegación del router: antes admin-only iba directo a `/admin/historial`; ahora **todo admin (con o sin permiso de tienda) pasa por el Dashboard** para elegir entre Catálogo (solo lectura) e Historial Global, porque ya tiene más de una vista disponible. |
| 2026-08-04 | `897e534` | Limpieza de novedades de Sonar (calidad de código, sin cambio funcional). |

**Mejoras incrementales adicionales sobre la base de fase 1 (fechas previas a la rama, ya en `main`):** dashboard y permisos por rol, selección de tienda para administradores, validación de horarios, modales en vez de alerts.

**Qué quedó pendiente (hereda fase 3):**
- Separación de vistas por negocio en el frontend. La lógica base ya existe (se pueden ver tiendas de otros negocios, y el tipo `Almacen` ya trae el CD), pero falta adaptar la UI para separarlas por negocio.
- Exponer el filtro por Centro de Distribución (`cdCode`) en la UI de reportes Excel/PDF general — el parámetro ya existe en el service (`239bc5d`), solo falta el selector en `AdminHistorialView`. Ver [[reposiciones_cd_filter_pendiente]].
- Control de cambios formal de cara a una versión final.

**Por qué no se completó el ciclo de adopción de esta fase:** la necesidad de dar soporte a otras marcas/negocios obligó a avanzar directamente a la mejora de fase 3 sin un periodo de uso/adaptación exclusivo como el que tuvo fase 1.

---

## Fase 3 — En definición 🚧

**Rama de trabajo:** `feature/fase3-multinegocio-frontend-control-cambios` *(renombrada desde `feature/fase2-multinegocio-control-cambios`; se corrigió porque el trabajo ahí corresponde a fase 3, no a fase 2)*.
**Estado:** Alcance en definición.

**Objetivo (borrador):** completar la adaptación multinegocio en el frontend (separación real de vistas por negocio) y establecer un control de cambios para una versión final del módulo. El grueso de los cambios se espera a nivel backend, pero el desarrollo frontend no debe descuidarse.

**Marca el cierre del desarrollo por fases numeradas del módulo.** A partir de esta fase, el trabajo sobre reposiciones pasa a manejarse como ramas por requerimiento puntual (una rama por feature/fix, sin numeración de fase), igual que el resto de módulos del repo. Por eso este dato se deja aquí y no en el nombre de la rama: la rama se borra al mergear, este documento no.

**Control de cambios — 3 puntos (frontend), origen QA:**

1. **Limpiar filtros del catálogo al cambiar de vista y volver** ✅. Causa: el store de Pinia es singleton durante toda la sesión SPA; `filters` no se reseteaba al salir de `SolicitarView`. Fix: acción `resetFilters()` en `reposicionStore.ts` (sin fetch), invocada en `onUnmounted` de `SolicitarView.vue`. No afecta `whsCode` (bodega seleccionada), solo los 7 campos de búsqueda.
2. **Renombrar "Observación" → "Observación/Responsable" en catálogo (frontend) + mostrar el campo en reportes Excel/PDF (backend)** ✅ frontend / ⏳ backend. Encabezado ya actualizado en `SolicitarView.vue`. La parte de reportes es 100% backend, fuera de este repo.
3. **Confirmar antes de solicitar si ya hay tránsito para el artículo** ✅. Origen: QA identificó que un usuario puede pedir cantidad de un producto sin saber que ya tiene unidades en tránsito (solicitadas días anteriores, pendientes de llegar a tienda) — al llegar el tránsito, recibiría lo nuevo más lo viejo, generando sobre-stock accidental. Decisión: 100% frontend, sin auditoría en backend (si el usuario confirma pese al aviso, se registra como solicitud normal, sin flag adicional). Implementado en `updateQuantity` (`SolicitarView.vue`): si `item.totalTransitoria > 0` y la cantidad solicitada es > 0, se muestra modal de confirmación antes de guardar — mismo patrón ya usado para el chequeo de "cantidad > sugerido".

**Rol `reposiciones.negocio` (administración acotada a un Centro de Distribución):**

Se agregó un tercer rol además de `tienda` y `administrador`: `reposiciones.negocio` (permiso único, sin una clave por negocio). Un usuario con este permiso ve las mismas vistas que `administrador` (Catálogo, Historial) pero acotadas a su propio CD — **Configuración queda solo para `administrador`**, ya que reconfigurar la jerarquía de CDs/tiendas es una acción estructural, no operativa del día a día.

**Cómo se resuelve el alcance (sin permiso por negocio):** se reutiliza el mismo mecanismo que ya usa `reposiciones.tienda` — el `codAlmacen` de `authStore.userWarehouseAccesses` (helper: `composables/useNegocioScope.ts`). Para un usuario negocio, ese `codAlmacen` debe ser el código del **CD** que administra (ej. `RG-CD`), no el de una tienda. Ese código se reenvía como `cdCode` a `GET /api/Almacen` y como `whsCode` a `GET /api/Historial` (ambos ya resuelven "CD → su grupo completo" del lado del backend).

**Incompatibilidad tienda + negocio, ya corregida:** un usuario con `reposiciones.tienda` **y** `reposiciones.negocio` a la vez tiene un `codAlmacen` de tienda y otro de CD en `warehouseAccesses`. `reposicionStore.fetchAlmacenes()` (la que alimenta el Catálogo de Tienda) confiaba en **cualquier** `codAlmacen` como bodega seleccionable, sin distinguir si era un CD — un CD terminaba apareciendo como "tienda" a la que solicitar reposición, lo cual no tiene sentido de negocio (un CD es origen, no destino). Fix: en `fetchAlmacenes()` se excluye cualquier `codAlmacen` cuyo `catalogoAlmacenes` resuelva `esCentroDistribucion: true`. Del lado negocio (`useNegocioScope.ts`) no hizo falta el mismo arreglo: el backend ya aísla por separado los códigos que no resuelven a un CD (`cdCodesInvalidos`), así que un `codAlmacen` de tienda mezclado ahí no rompe el filtro del CD real.

**Deuda técnica identificada (2026-08-07), pendiente para un próximo cambio — NO resolver ahora:**
- **`codAlmacen` es un campo sobrecargado.** Para `tienda` significa "una tienda que operas"; para `negocio` significa "el CD que administras" — es el mismo campo con dos significados distintos, sin ninguna validación que impida asignarle a un usuario negocio el código de una tienda por error (pasó justo en la primera prueba: se asignó `RL-RGCEN`, una tienda, en vez de `RG-CD`).
- **Falla "abierto" en vez de "cerrado".** Si el código asignado a un negocio no resuelve a un CD real, `GET /api/Almacen?cdCode=` y `GET /api/Historial?whsCode=` no aplican ningún filtro (comportamiento documentado en el backend: *"si ninguno resuelve, no filtra nada"*) — el usuario ve **todos** los negocios en vez de ninguno. El backend ya devuelve `cdCodesInvalidos` con la razón exacta (`{codigo, razon}`), pero el frontend hoy lo descarta (`reposicionApi.getAlmacenes()` solo devuelve `.items`). Corregirlo implicaría: exponer `cdCodesInvalidos`, y para usuarios negocio (no admin) tratar "código no resuelve a CD" como "no mostrar nada + avisar", no como "mostrar todo".

Este bloque se completa/actualiza cuando el alcance quede definido con más detalle. Cuando fase 3 se cierre, este bloque queda fijo y se documenta la siguiente fase debajo — no se sobrescribe.
