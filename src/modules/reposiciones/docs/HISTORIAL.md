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

Este bloque se completa/actualiza cuando el alcance quede definido con más detalle. Cuando fase 3 se cierre, este bloque queda fijo y se documenta la siguiente fase debajo — no se sobrescribe.
