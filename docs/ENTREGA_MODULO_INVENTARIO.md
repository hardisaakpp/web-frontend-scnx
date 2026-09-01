# Documento de Entrega — Módulo de Inventario

**Módulo:** Inventario (Toma Física, Planificación, Ajustes, Auditoría)
**Repositorios:** `web-scnexus` (frontend) + `api-inventario` (backend)
**Período cubierto:** 13 de agosto — 27 de agosto de 2026

---

## 1. Resumen ejecutivo

El módulo de Inventario cubre el ciclo completo de una toma física: planificación, conteo en piso (por artículo o por picking con escáner), reconteo de diferencias, cierre con snapshot inmutable, auditoría/ajuste de diferencias con valorización, e integración a SAP. Incluye vistas separadas para supervisores/administradores (planificación, bandeja de ajustes, gestión de scans) y autoservicio para tienda (mis inventarios, historial, ver resultado final).

---

## 2. Funcionalidades del módulo

### 2.1 Planificación
- **Planes de Inventario**: crear planes con filtros por Nivel 1/2/3, fecha de apertura/cierre planificada.
- **Planificaciones**: ejecutar un plan genera automáticamente la sesión (toma física) correspondiente.

### 2.2 Toma Física (sesiones)
- Listado de tomas (`Toma Física`) con filtro por estado (Abiertas/Reconteo/Cerradas), rango de fechas, **búsqueda por texto** y **orden por columna** (clic en encabezado), paginado de 10.
- Cada fila muestra bodega, descripción, estado, alcance (cuántos ítems/cantidad entran según los filtros con que se generó la toma) y fechas **definidas** (planificadas al crear, no las reales de ejecución).
- Crear toma directa (sin plan) con código de referencia opcional.
- Eliminar toma (solo si sigue Abierta).
- Marca visual (ícono) en tomas cerradas que ya tienen un ajuste aprobado o fueron descartadas explícitamente ("revisada, sin ajuste").

### 2.3 Conteo
- **Contar Artículos**: búsqueda de artículo por código/código de barras/nombre, con botón de **escaneo por cámara** (usa `BarcodeDetector` nativo o ZXing como respaldo). En Reconteo muestra Total Conteo inicial, Reconteo, Diferencia con signo y usuario asignado.
- **Picking**: conteo colaborativo por cantidad + código de barras (teclado o cámara), cola de envío con reintentos, ingreso alternativo por código de artículo.
- **Reconteo**: al cerrar una toma con diferencias, pasa automáticamente a Reconteo; asignación sugerida por Nivel 2 (prioriza a quien no contó ese artículo en la ronda inicial), el supervisor puede reasignar antes de confirmar.
- Filtro "OTROS CÓDIGOS" para artículos sin clasificación de Nivel 2; stock SAP visible también para usuarios de tienda en Reconteo.

### 2.4 Autoservicio (tienda)
- **Mis Inventarios**: tomas abiertas asignadas a la bodega/usuario, iniciar picking con ubicación opcional (ej. "PASILLO3").
- **Historial de Mis Conteos**: lo enviado por el usuario en cada toma (incluidas cerradas), imprimir o descargar Excel del conteo total de la toma; marca de "ajuste terminado" cuando corresponde.
- **Ver Ajuste Final** (nueva): una vez que el ajuste de una toma está aprobado, la tienda puede ver el resultado final — solo ítem, descripción, diferencia final y valor final, **sin costo ni PVP** (esos solo los ve auditoría/supervisión). Exportable a Excel con las mismas columnas reducidas.

### 2.5 Supervisión
- **Resumen de Toma Física**: progreso de conteo (por artículos o por unidades), estado de cuadre (cuadraron/descuadraron/ítems nuevos), "Valorizado Mabeltrading" (total del almacén vs. lo auditado, a costo), conteo por usuario con ubicación, sincronizar stock desde SAP, cerrar toma (con snapshot inmutable), copiar ID completo, descarga a Excel de 2 hojas (Resumen + Detalle con SAP/Conteo/Reconteo/Diferencia final).
- **Detalle de Toma Física** (snapshot cerrado): tabla completa con búsqueda, orden por columna y paginado; exportable.
- **Gestión de Scans**: ver y, si corresponde, eliminar escaneos de cualquier usuario dentro de una toma (auditoría).

### 2.6 Ajustes (Bandeja de Ajustes)
- Crear un ajuste desde una toma **cerrada**, eligiéndola de una lista (ya no hace falta copiar/pegar el ID) — solo se ofrecen tomas que aún no tienen ajuste ni fueron descartadas.
- **Descartar ajuste**: marcar una toma cerrada como "revisada, sin diferencias que ajustar" — no genera ningún cobro, la toma se queda como está.
- Editar líneas (solo mientras el ajuste está en Draft) — la diferencia ajustada **solo admite números enteros**.
- Agrupar productos equivalentes (una línea compensa a otra).
- **Valorización configurable**: a Costo, a PVP, o a PVP menos un descuento %; se congela al aprobar.
- Flujo de estados: `Draft → InReview → Approved → SentToSap`.
- **Informe final** (Excel, se genera automáticamente al aprobar): hojas DIFERENCIAS / CERRADOS con costo/PVP/valorizado por línea, y hoja RESUMEN con los cuadros "REFERENCIAS" (ítems: cerrados/diferencia+/diferencia-/total) y "UNIDADES" (tipeadas vs. cargadas), más el detalle de escaneos por usuario y el total valorizado.
- Listado de ajustes con búsqueda, orden por columna y columna de notas (ya no muestra los IDs internos).

### 2.7 Permisos
Acceso granular por permiso (`inventario.planificar`, `inventario.generar`, `inventario.toma`, `inventario.estado_sesion`, `inventario.snapshot`, `inventario.bandeja_ajustes`, `inventario.gestion_scans`, `inventario.edicion_ajuste`, `inventario.revision`, `inventario.integracion_sap`); la autoservicio de tienda (Mis Inventarios, Historial, Ver Ajuste Final) no requiere permiso adicional, el backend valida por acceso a bodega.

---

## 3. Funcionalidades y mejoras agregadas (13–27 de agosto)

### Nuevo
- Vista de solo lectura del ajuste final para tienda, sin exponer costo/PVP.
- Descartar ajuste de una toma cerrada sin generar cobro.
- Selector de toma cerrada al crear un ajuste (reemplaza copiar/pegar el ID a mano).
- Marca visual de "cerrado con informe" (aprobado o descartado) en los listados.
- Escaneo por cámara integrado en Contar Artículos y en Picking.
- Cuadro "UNIDADES" en el informe final (faltaba: tipeadas vs. cargadas).
- Botón para copiar el ID completo de la sesión en el Resumen de Supervisor.
- Búsqueda de texto y orden por columna en 7 listados que no lo tenían (Toma Física, Bandeja de Ajustes, Planes, Inventarios Generados, Detalle de Inventario, Planificaciones, detalle de Gestión de Scans).
- Asignación automática de reconteo por Nivel 2; campo de ubicación al iniciar picking; código de referencia libre al crear una toma directa.
- "Valorizado Mabeltrading" (total del almacén vs. lo auditado) y valorización configurable (Costo/PVP/PVP-descuento) en el ajuste, con snapshot de precio congelado por línea.

### Corregido
- El listado de Toma Física y su descarga ya no traen todo el almacén (~3.000 ítems) cuando la toma tenía solo unas decenas — ahora respetan el alcance real de la toma.
- El cierre de una toma sin reconteo previo sincronizaba SAP para el almacén completo aunque la toma tuviera filtros — ahora sincroniza solo lo necesario.
- "Estado de Cuadre" del Resumen de Supervisor: los ítems aún no contados ahora cuentan como "descuadrados" por defecto, así Cuadraron + Descuadraron siempre suma el Total (antes daba 0+0 hasta que se contaba al menos un ítem).
- La diferencia ajustada de una línea solo admite enteros (antes aceptaba decimales).
- Columna "Género" del detalle de toma traía el dato equivocado (leía de otra columna del maestro).
- "Recontar a cero" (confirmar que no hay nada) no se guardaba correctamente; un dispositivo con datos desactualizados podía sobrescribir el conteo recién guardado por otro.
- El filtro de planes mostraba planes de otras tiendas.
- Descarga de reportes cambiada de CSV a Excel real, evitando que Excel interprete códigos de barras largos como notación científica.

### Rendimiento
- Guardar un conteo manual ya no trae todo el stock del almacén — solo el ítem que se está guardando.
- Consulta de stock de varias bodegas en un solo viaje a la base de datos (antes uno por bodega).
- Timeout de listado de sesiones ampliado a 120s para bodegas grandes.

---

## 4. Notas para el equipo de despliegue

- **Migraciones pendientes de aplicar** (ver detalle en `api-inventario/docs/CHANGELOG_INVENTARIO.md`): `AddAdjustmentDiscardedToInventorySession` (agrega 3 columnas a `inventory_sessions`, aditiva, sin pérdida de datos). Las demás migraciones del período ya fueron aplicadas.
- El código de todo lo anterior ya está en `main` de ambos repositorios (vía PRs 416/417/421/423 en `web-scnexus`, equivalentes en `api-inventario`); el fix de "Estado de Cuadre" quedó en una rama aparte (`fix/resumen-inventarios` en `api-inventario`) pendiente de PR al momento de escribir este documento.
- Registro completo y cronológico de cambios técnicos: `web-scnexus/docs/CHANGELOG_INVENTARIO.md` y `api-inventario/docs/CHANGELOG_INVENTARIO.md`.
