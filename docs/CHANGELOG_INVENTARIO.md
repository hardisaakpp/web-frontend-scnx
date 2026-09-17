# Changelog — Módulo Inventario (Frontend)

Registro cronológico de cambios realizados al módulo `src/modules/inventario` con asistencia de Claude Code. Complementa (no reemplaza) el historial de git — acá se explica el *por qué* de cada cambio, agrupado por sesión de trabajo.

> Convención: cada entrada nueva se agrega **arriba**, con fecha, resumen corto, y el estado de commit/deploy al momento de escribirla. Si un ítem sigue sin commitear cuando se agrega una entrada más reciente, se actualiza su estado en vez de duplicarlo.

---

## 2026-09-16 — Menú "Mis Inventarios" para pickers invitados y Consultar Stock con código de barras, costo y PVP (rama fix/inventarios-100926)

3. **Conteo - Picking: panel "Artículos de la toma".** Pedido de operación: el operador no sabía QUÉ artículos debía contar, solo escaneaba. Nuevo bloque colapsable bajo la cabecera (fuera del reconteo, que ya tiene su propia lista) con los artículos del alcance de la toma: código, descripción, código de barras y Nivel 2, **sin stock ni cantidades** a propósito. Filtro por Nivel 2, buscador (código / descripción / barras) y casilla "Solo sin contar"; cada fila marca Contado / Sin contar según tenga registro en la ronda actual, y al enviar un conteo la fila pasa a Contado sin volver a consultar. Consume el nuevo `GET /inventory-sessions/{id}/scope-items` de api-inventario (misma rama), accesible a los pickers de la toma. Si el endpoint falla, la pantalla funciona igual sin el panel.
   **Ingresar cantidad desde la lista:** clic derecho sobre un artículo (en tablet o celular, mantenerlo pulsado ~0,6 s) abre el menú "Ingresar valor" → modal con el artículo y un campo de cantidad (Enter acepta, Esc cancela). Al aceptar se encola exactamente como si se pistoleara el código de barras una vez con esa cantidad (mismo camino que el escáner: cola → Enviados, con el `clientId` idempotente), y la fila pasa a Contado. Un toque o clic normal **no hace nada** a propósito, para que en pantallas táctiles no se registren cantidades por accidente.

2. **Consultar Stock: columnas Código de barras, Costo y PVP** en la tabla y en el Excel (pedido de operación). El backend ya devolvía costo y PVP; el código de barras se agregó al `ItemStockDto` de api-inventario en esta misma rama. Las tres columnas se ordenan por cabecera (costo/PVP numéricos, los ítems sin valor quedan al final en ambas direcciones), el buscador también filtra por código de barras, y costo/PVP se muestran con 2 decimales o "—" si el maestro no los tiene. En el Excel van como número (celda vacía cuando no hay valor) para poder sumar/filtrar; la fila Total y la cabecera se desplazaron a las nuevas posiciones. **Requiere api-inventario** de la misma rama para ver el código de barras; con el backend anterior esa columna sale "—".

1. **Regresión corregida: el picker sin permisos `inventario.*` no veía el menú.** Al agregar un usuario a "Gestionar usuarios de picking" de una toma, antes le aparecía "Mis Inventarios" en el sidebar aunque no tuviera ningún permiso del módulo (la visibilidad se decide con `usePickerSessionAccess`, que consulta `/api/inventory-sessions/my`). El commit `daa04cb` (transferencias directas, 28/07/2026) reescribió el sidebar de `MainLayout.vue` y dejó la condición solo en `hasModuleAccess('inventario') && isTiendaAccess`, con lo que `hasPickerSessions` quedaba calculado pero sin usarse. Se restauró la condición original: `(hasModuleAccess('inventario') && isTiendaAccess) || (!hasModuleAccess('inventario') && hasPickerSessions)`. Las rutas `/inventario/mis-inventarios` y `/inventario/picking/:sessionId` nunca exigieron permiso RBAC, así que el operador sí podía entrar por URL; solo faltaba el acceso desde el menú. Sin cambios en backend.

---

## 2026-09-10 — Novedades del piloto 2 (rama fix/inventarios-100926, desde main)

1. **Cerrar toma desde Conteo de Artículos abre el reparto.** En la prueba la tienda cerró desde ese botón y el reconteo quedó abierto a todos sin preguntar. Ahora, si el cierre deja la toma en Reconteo, se abre el mismo modal de dos pasos (participantes → reparto / enviar sin reparto) que en la lista de tomas, y el texto del panel lo explica.
2. **Listados rápidos.** "Toma Física" y "Mis inventarios" ya no reciben el alcance de stock (items / cantidad), que hacía lento el listado. La columna pasa a **"Contado (ref. / unid.)"**: referencias distintas y unidades registradas en la toma (todas las rondas) más la fecha/hora del último conteo, o "sin conteos". Es un dato barato (una consulta agrupada sobre los conteos) y útil para ver el avance de cada tienda desde la lista.
3. **Scans por usuario con filtro de ronda.** En el detalle de la toma, la sección "Scans por usuario" gana un selector **Conteo + reconteo / Solo conteo / Solo reconteo** que aplica al resumen (recalculado en el front por usuario), al detalle y a las descargas (el archivo lleva sufijo `_conteo` / `_reconteo`). Antes el resumen mezclaba rondas y no había forma de ver el reconteo por separado.
4. **Nueva toma: fecha de cierre por defecto = hoy** en el modal de creación directa (antes venía vacía).
5. **Conteo de Artículos en tablet.** La tabla obligaba a desplazarse a la derecha para ver escaneados, lo anotado y el stock SAP. Debajo de `xl` se ocultan las columnas informativas (#, código de barras, Nivel 2, asignado a) y el código de barras y el asignado pasan como sublínea bajo el código y el nombre; el nombre se recorta a 2 líneas, celdas con menos padding e input de cantidad más angosto. En escritorio se ve igual que antes.
6. Ya incluidos desde ayer en esta rama: buscador de usuarios con autocompletado (pickers y reparto) y sincronización AD en segundo plano.

**Estado:** rama `fix/inventarios-100926`. Tipado limpio. Requiere el backend de la misma rama (totales nullables, hoja RECONTEOS y correos viven en api-inventario).

---

## 2026-09-08 — Piloto 2: tolerancia a fallas de red en la pantalla de conteo (rama feature/inventarios_piloto2)

**Contexto.** Al verificar el punto 1 del correo de la toma OUT-CON ("el picking tolera cortes de red") se encontró que era cierto solo a medias: la cola y los errores de envío vivían en memoria, así que se perdían al refrescar, cerrar la pestaña o volver a "Mis inventarios"; el botón "Reenviar" dependía del operador; y con WiFi conectado pero sin salida cada escaneo esperaba los 30 s de timeout antes de pasar a error. Esta rama incluye todo lo de `fix/inventario-toma-fisica-outcon` más los 4 cambios siguientes en `ConteoPickingView.vue` y `inventarioSesionesApi.addCount`, y el punto 5 que sí requiere el backend de la misma rama. **Sin cambios en Core.**

1. **Pendientes guardados en el dispositivo.** Cola y errores se persisten en `localStorage` por toma (`inv_picking_pendientes_v1_<sessionId>`) y se restauran al reabrir la pantalla: lo que estaba en cola o falló por red se reenvía automáticamente; lo rechazado por el servidor vuelve a mostrarse como error. La clave se borra sola cuando no queda nada pendiente.
2. **Reenvío automático.** Al recibir el evento `online` y cada 30 s (mientras haya errores de conexión) se reencolan los registros marcados como reintentables. Los errores se clasifican: timeout / sin respuesta → reintentable; respuesta del servidor (p. ej. artículo fuera del alcance) → no reintentable, requiere al operador ("Reenviar" manual sigue disponible para ambos).
3. **Aviso al salir con pendientes.** `onBeforeRouteLeave` pide confirmación y `beforeunload` bloquea el cierre/refresh del navegador cuando hay registros sin enviar. Nuevo badge ámbar "N pendientes" en la cabecera y texto explicativo en el bloque de errores.
4. **Timeout de `addCount` a 8 s** (antes 30 s del default de axios). El resto de llamadas del servicio conserva su timeout.
5. **Sin duplicados al reintentar (`clientId`).** El timeout corto hace más probable el caso "la petición sí llegó pero el front no vio la respuesta"; antes, reenviar creaba un segundo conteo. Ahora cada registro de la cola nace con un UUID (`genId` usa `crypto.randomUUID`, con fallback v4 manual para contextos http) que viaja en el body como `clientId`. El backend (`api-inventario` misma rama, columna `inventory_counts.client_id` + índice único filtrado) devuelve el conteo ya guardado si recibe la misma clave en la misma toma. Requiere desplegar el backend de `feature/inventarios_piloto2`; con el backend anterior el campo se ignora y se comporta como hoy.

6. **Eliminar varios ingresos a la vez en el Resumen de Picking** (pedido del piloto: el sistema anterior tenía "Seleccionar todos" + "Eliminar seleccionados" sobre los últimos 50 códigos). En "Últimos 30 ingresos" cada fila borrable tiene casilla; arriba, "Seleccionar todos (N)" (con estado indeterminado) y el botón rojo "Eliminar seleccionados (N)", que pide confirmación indicando cuántos ingresos y unidades se van. Llama a `POST /counts/delete-batch` (backend misma rama); los que el servidor no pudo borrar quedan visibles y se muestra un aviso ámbar con el motivo (p. ej. ingreso de otro operador). El tacho individual sigue funcionando igual.

7. **Gestión de Scans: eliminar de cualquier usuario, también en lote.** La pantalla de administración mostraba "—" en Acciones para usuarios sin acceso global a bodegas aunque tuvieran el permiso de la pantalla. El backend ahora concede el borrado con el permiso `inventario.gestion_scans` (el mismo que abre la ruta), así que quien entra ve "Eliminar" en todas las filas de la ronda vigente. Se agregó columna de casillas con "seleccionar todos" en el encabezado (aplica a los registros filtrados, no solo a la página visible) y botón "Eliminar seleccionados (N)" con diálogo que indica escaneos, unidades y usuarios afectados. Los que el servidor no pudo borrar se informan con el motivo. El subtítulo aclara que cada borrado queda en el log de auditoría (tabla nueva en api-inventario).

12. **Buscador de usuarios con autocompletado (pickers y reparto).** El campo de texto libre del punto 11 obligaba a saber cómo está registrada la cuenta: en el Core muchos usuarios de AD tienen `userName` en forma de correo (437 de 589 en la base de pruebas) y otros no tienen correo, así que escribir "jperez" fallaba. Nuevo componente `UserSearchInput.vue`: mientras se escribe (2+ caracteres, 300 ms de espera) consulta `GET /Users/search?q=` del Core y muestra coincidencias por nombre, usuario de red o correo para elegir con clic o flechas+Enter; Enter sin lista intenta resolver exacto. Solo emite usuarios existentes. Reemplaza los inputs de "Gestionar usuarios de picking" y del paso 1 del reparto. **Requiere Core** `feature/inventarios_piloto2` (endpoint `search`, solo autenticación, devuelve id/usuario/nombre/correo de usuarios activos, máximo 20).

11. **Solo usuarios de AD al agregar pickers o participantes.** Los dos campos de "agregar usuario" (Gestionar usuarios de picking y paso 1 del reparto) aceptaban texto libre; un login mal escrito quedaba guardado y ese operador nunca veía su toma ni su lista. Ahora el front verifica el usuario en el Core con `GET /Users/info/{login}` (`findCoreUser` en `src/utils/resolveUserNames.ts`) y, si no existe, muestra "El usuario X no existe en SCNexus / Directorio Activo"; si existe, guarda el login tal como está registrado. **Requiere Core** rama `feature/inventarios_piloto2` (PR a test): `info/{id}` ahora también resuelve por nombre de usuario, no solo por GUID. Con un Core anterior el campo rechaza todo login que no sea GUID.

10. **Cada operador sabe qué le toca recontar.** Antes nadie veía su parte: el reparto era una columna informativa en Conteo de Artículos y el escáner aceptaba cualquier artículo. Ahora, en tomas en Reconteo: (a) la pantalla de picking muestra arriba el panel **"Tu reconteo: N pendientes de M"** con la lista de artículos (código, descripción, código de barras, Nivel 2) y su estado Pendiente/Recontado, que se actualiza al escanear; si no hay reparto el panel dice "Reconteo abierto" y lista todo lo pendiente; (b) con reparto, escanear o teclear un artículo que no está en la lista se rechaza al instante ("no está en tu lista de reconteo") sin llegar al servidor, y el backend lo rechaza igual si alguien lo intenta por otra vía; (c) Conteo de Artículos gana el filtro **Reconteo: Mis artículos (N) / Todos**, por defecto en "Mis artículos" para quien tiene asignaciones; (d) el cierre desde Conteo de Artículos explica que el reconteo queda abierto a todos y cómo repartirlo después.

9. **Reparto de reconteo en dos pasos.** Pedido del piloto: primero preguntar quiénes recontarán. **Paso 1** lista los candidatos (quienes escanearon en ronda 1, los ya asignados y los usuarios de picking de la toma) con etiquetas "Escaneó N / Asignado N / Picking", casilla para dejarlos fuera y campo para agregar otro usuario de red; el agregado se registra como picker al confirmar para que pueda entrar a recontar, y quitar la marca solo lo saca del reparto sin tocar su acceso. Con 0 participantes el botón pasa a "Enviar sin reparto" (aviso: cualquier usuario con acceso a la toma podrá recontar todo; si había reparto guardado, se borra). **Paso 2** pide al backend la distribución balanceada solo entre los elegidos (`participants`) y muestra en la cabecera, siempre visible, los chips "Usuario · N art." más el total; abajo el detalle editable por Nivel 2 y "← Cambiar participantes". Al guardar, la pantalla de tomas muestra el resumen "Reparto de reconteo guardado: Juan (45), María (49)".

8. **Modal "Reparto de reconteo" ya no se pierde.** Al cerrar una toma con diferencias aparecía el modal, y un clic fuera (o Escape) lo cerraba descartando todo sin aviso; la toma quedaba en Reconteo sin reparto y no había forma de volver a abrirlo. Ahora: (a) clic fuera y Escape no cierran; (b) Cancelar y la X piden confirmación explicando qué queda ("la toma queda en Reconteo sin reparto: cualquier usuario podrá recontar cualquier artículo", o "se descartan los cambios, el reparto anterior se mantiene"); (c) nueva acción **"Repartir reconteo"** en el menú de cada toma en estado Reconteo, que abre el mismo modal precargado con el reparto guardado (`currentUserId` del backend) y botón "Guardar cambios". Además, si la toma se cerró en cero (nadie contó) los selects salían vacíos: el backend ahora incluye a los usuarios de picking como candidatos, y el modal avisa cuando no hay candidatos (con la ruta para asignarlos) o cuando quedan artículos "Sin asignar", deshabilitando Confirmar hasta resolverlo.

**Estado:** commits en `feature/inventarios_piloto2` (web-scnexus y api-inventario). Verificado con `vue-tsc` y compilación en Vite; la idempotencia se probó contra la API local apuntando a pruebas (3 POST con el mismo `clientId` → 1 fila). Falta prueba funcional en dispositivo real con corte de red (piloto).

---

## 2026-09-07 — Observaciones de la toma física OUT-CON (nombres, "No contados", código de barras, carga de la lista)

Rama `fix/inventario-toma-fisica-outcon` (desde `test`), contraparte en `api-inventario` (misma rama).

- **Nombres de usuario en vez de GUID/login/correo.** `src/utils/resolveUserNames.ts` (compartido con
  caja-chica) ya no usa `GET /Users` del Core, que es solo Admin y a un supervisor le fallaba en silencio
  dejando los ids crudos; ahora resuelve cada id con `GET /Users/info/{id}` (solo autenticado, con caché)
  y muestra nombre completo → usuario → correo → id. Con eso el **Detalle de la toma** (resumen y detalle
  de scans y sus descargas), Gestión de scans, reasignación de reconteo e historial de planes muestran el
  nombre. En el **Resumen supervisor** el nombre resuelto tiene prioridad sobre el texto que guarda el
  backend (`userName`, que para usuarios AD es el correo), tanto en "Creado por" como en "Conteo por
  usuario" y en el Excel. Sin cambios en Core.
- **"No contados" deja de ser categoría** (`DetalleTomaFisicaView`): quedan Cerrados / Diferencias / Otros
  códigos; una referencia con stock que nadie contó es una **Diferencia** (faltante completo) y la fila
  lleva la marca "Sin conteo" (columna `SinConteo` en el Excel). El informe de ajuste ya las incluía como
  faltante (`BuildSessionResults` recorre stock ∪ conteos), así que solo cambió la presentación.
  Tipos: `SessionDetailLineDto.notCounted`, `SessionDetailStatsDto` sin `notCounted`.
- **Código de barras en el listado de eliminación** (`ResumenPickingView`, "Últimos 30 ingresos", móvil):
  nueva línea "Cód. barras" por ingreso (`RecentCountItemDto.barcode`, del backend) y el operador ahora
  se muestra por nombre en vez del id.
- **Lista de tomas más rápida** (`SesionesInventarioView`): el rango de fechas viaja al servidor
  (`getSesiones({ since, until })`) en vez de traer el histórico completo y filtrar en el navegador; abre
  con los últimos 15 días (estándar) y recarga al cambiar el rango. El backend calcula el alcance de cada
  toma devuelta contra sc_maestros, por eso el volumen de tomas históricas era lo que hacía lenta la pantalla.
- Estado: **sin commitear** al momento de escribir esto. Requiere desplegar `api-inventario` de la misma
  rama (filtros del listado, `barcode` en picking-summary, clasificación sin `NotCounted`).

## 2026-09-02 — Fix: "Conteo por usuario" del resumen supervisor mostraba GUIDs

- **`SessionUserStatDto.userName`** (types.ts): el backend (`api-inventario` rama `fix/leak`) ahora
  expone el nombre legible tomado de cada conteo (`InventoryCount.UserName`, que ya se guardaba).
  El resumen (`SupervisorResumenView`) y su export CSV usan `u.userName || userLabel(u.userId)` —
  el nombre viene directo del backend y `resolveUserNames` (Core API `/Users`, que falla en
  silencio y dejaba los GUIDs crudos) queda solo como fallback para conteos antiguos sin nombre.
- Estado: rama `fix/nombres-usuarios-inventario` (desde `test`). Requiere desplegar el backend
  `fix/leak` de api-inventario para ver nombres; sin él, el front sigue cayendo al fallback actual.

## 2026-08-28 (2) — Historial de Planes ejecutados

- **Nueva vista `HistorialPlanesView.vue`** (`/inventario/planes/historial`): "Planes Pendientes" filtra a `status=Planned` y los ejecutados desaparecían de esa lista sin forma de consultarlos — el plan en sí **no se borra** al ejecutarse (solo pasa a `Executed`, ver backend), así que no hacía falta ninguna tabla de auditoría nueva, solo exponer el filtro correcto.
- Filtro "Desde" con default de **últimos 15 días** (mismo estándar que "Historial de Mis Conteos"), búsqueda + orden por columna (mismo patrón que "Planes Pendientes"), nombre de quién ejecutó resuelto vía `resolveUserNames`, link directo a la sesión de inventario que generó cada plan.
- Botón "Ver historial" agregado en `PlanesInventarioView.vue`. `inventarioPlanesService.getPlanes()` acepta `since` opcional.
- Estado: **commiteado** en `fix/inventarios-lilipink` (`9a1c3ed`), aún sin pushear. Ver `api-inventario/docs/CHANGELOG_INVENTARIO.md` (2026-08-28, "GetAllAsync de planes acepta filtro 'since'") para el backend.

## 2026-08-28 — Nombre en vez de GUID, "No realizado" visible al usuario, texto (tuya)/(tuyos)

- **`MisInventariosView.vue`**: "Generada por" mostraba el GUID crudo (`s.createdByUserId`) en vez del nombre — el backend ya manda `createdByUserName` en el DTO (no hacía falta resolver por endpoint de usuarios, como sí necesita caja-chica). Ahora usa `s.createdByUserName || s.createdByUserId`.
- **`HistorialConteosView.vue`**: se quita el calificador `(tuya)/(tuyos)` de "cantidad total" y "SKUs" — quedan los dos nombres solos, sin aclaración redundante (la nota de que Excel/Imprimir traen el total de *todos* los usuarios se deja igual, no fue lo que se pidió simplificar).
- Fix relacionado de fondo (100% backend, ver `api-inventario/docs/CHANGELOG_INVENTARIO.md` 2026-08-28): las tomas "No realizado" (Expired) ahora aparecen en "Historial de Mis Conteos" del propio usuario asignado, no solo en la vista de admin — no requirió cambios en este repo, el frontend ya consume `GetMyCountHistoryAsync` tal cual.
- Estado: **commiteado** en rama `fix/inventarios-lilipink` (commit `31cfe62`), aún sin pushear.

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
