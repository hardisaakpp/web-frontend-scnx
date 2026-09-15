# Funcionalidades Estandarizadas (Escalables a Módulos)

Guía única para implementar funcionalidades reutilizables entre módulos del frontend SCNexus.

Este documento centraliza los estándares transversales que ya existen en el proyecto para evitar duplicación de lógica y mantener consistencia de UX y de integración con backend.

---

## 1) Objetivo y alcance

Aplicar en cualquier módulo que requiera:

- notificaciones visuales homogéneas (toast),
- reacción a eventos en tiempo real (SSE),
- sincronización de UI tras mutaciones de API,
- manejo uniforme de errores y estados de carga.

Este documento no reemplaza guías específicas; las referencia y las organiza.

---

## 2) Notificaciones Toast estandarizadas

### 2.1 Base global

- Store/composable base: `src/composables/useToast.ts`
- Contenedor global visual: `src/components/feedback/ToastContainer.vue`
- Montaje global: `src/layouts/MainLayout.vue`

Implicación: cualquier módulo puede emitir toasts sin montar nada extra en su vista.

### 2.2 Wrapper recomendado por módulo

- Composable estandarizado: `src/composables/useModuleNotifications.ts`

Uso:

```ts
import { useModuleNotifications } from '@/composables/useModuleNotifications'

const notifier = useModuleNotifications('PYG')

notifier.success({ title: 'Carga completada', message: 'Se procesó correctamente.' })
notifier.warning({ title: 'Validación', message: 'Revisa el archivo.' })
notifier.error({ title: 'Error al subir', message: 'No se pudo completar la carga.' })
notifier.info({ title: 'Actualización', message: 'Se refrescó el historial.' })
```

### 2.3 Regla de estandarización

- No usar `useToast` directo en nuevas vistas de negocio.
- Usar `useModuleNotifications('<MODULO>')` para homogeneidad de formato y prefijo.

---

## 3) Notificaciones en tiempo real (SSE)

### 3.1 Capa global

- Composable SSE: `src/composables/useNotificaciones.ts`
- Estado compartido para vistas: `lastNotification`

Flujo:

1. Se abre stream SSE autenticado.
2. Llega evento `notification`.
3. Se muestra toast (si aplica).
4. Se actualiza `lastNotification` para que las vistas reaccionen.

### 3.2 Regla de consumo en vistas

En cada módulo, reaccionar a `lastNotification` por `metadata.accion` (acción de negocio), no por lógica frágil de texto.

Ejemplo recomendado:

```ts
watch(lastNotification, (notification) => {
  if (!notification) return
  if (notification.metadata?.accion !== 'mi_accion_finalizada') return
  void recargarDatos()
})
```

### 3.3 Caso PYG (referencia implementada)

En PYG ya se aplica este patrón:

- Acción SSE: `pyg_upload_completed`
- Reacción: `loadUploads()` para refrescar historial automáticamente.
- Toast informativo de actualización.

---

## 4) Sincronización UI tras mutaciones API

Estándar del proyecto:

- Si el backend devuelve entidad actualizada en `POST/PUT/PATCH`, fusionar esa respuesta en estado local.
- Evitar refetch completo cuando no sea necesario.
- Usar refetch cuando el proceso sea asíncrono o afecte colecciones amplias.

Referencia detallada:

- `docs/MUTACIONES_API_SINCRONIZACION_UI.md`

---

## 5) Contrato frontend-backend para escalabilidad

Para cada nueva funcionalidad estándar, definir explícitamente:

1. Endpoint(s), método(s) y permisos requeridos.
2. Payload request/response tipado en servicio TS.
3. Estados funcionales (`success`, `warning`, `error`, `processing`).
4. Errores esperados (400/401/403/404/409/500) y mensaje UI.
5. Evento SSE asociado (`metadata.accion`) y acción de UI al recibirlo.

---

## 6) Checklist de implementación por módulo

1. Crear/usar servicio API tipado del módulo.
2. Integrar `useModuleNotifications('<MODULO>')`.
3. Mapear toasts en eventos clave:
   - éxito de operación,
   - validación/bloqueo,
   - error de integración,
   - info de actualización.
4. Si hay tiempo real:
   - consumir `lastNotification`,
   - filtrar por `metadata.accion`,
   - refrescar datos (`loadXxx()`).
5. Validar linter y flujo manual end-to-end.
6. Documentar acción SSE y comportamiento esperado.

---

## 7) Referencias relacionadas

- `docs/NOTIFICACIONES_SSE.md`
- `docs/MUTACIONES_API_SINCRONIZACION_UI.md`
- `docs/FRONTEND.md`
- `docs/MODULOS.md`
- `docs/ARQUITECTURA_Y_NUEVOS_MODULOS.md`

---

## 8) Reutilización de componentes y eliminación segura de duplicación

Aplica cuando el mismo patrón de UI o lógica (markup + handlers + validaciones) aparece
copiado en 2 o más archivos. Caso de referencia: dedup del selector de columnas, el
drag&drop de columnas y los listados de pedidos del módulo mba3-consultas (ver commits
`refactor(mba3-consultas): deduplicar...` en `feature/odc-segunda-fase-front-refactor`).

### 8.1 Cuándo compartir y cuándo no

No toda similitud justifica una pieza compartida. La pregunta que decide no es "¿se ve
parecido?" sino **¿es el mismo concepto que debe cambiar junto, o es una coincidencia que
hoy se comporta igual?**

- **Compartir** cuando es la misma regla/concepto (validación, cálculo, regla de negocio,
  mapeo de estado). El riesgo de NO compartir en estos casos es la deriva silenciosa: una
  corrección se aplica en una copia y no en las demás sin que nadie lo note. Ejemplo real
  ya presente en el código: `DespachosTable.vue` reimplementó `formatCurrency`/`formatNumber`
  en vez de usar `utils/formatters.ts`, y ya difiere en cómo muestra valores nulos.
- **Duplicar a propósito** cuando la similitud es coincidencia, no una regla compartida:
  dos piezas que hoy se ven o comportan igual pero representan conceptos independientes
  que pueden divergir por razones de negocio legítimas. Forzar la reutilización ahí crea
  un acoplamiento falso (Sandi Metz: *"duplication is far cheaper than the wrong
  abstraction"* — una abstracción incorrecta cuesta más de deshacer que la duplicación que
  evitó). Caso real de este proyecto: el color y la posición del botón "Columnas" en
  `RemisionesTable.vue`/`DespachosTable.vue`/`HistorialOrdenesTable.vue` es una decisión de
  diseño propia de cada pantalla, no una regla — se compartió la lógica (validación,
  estado, click-outside, que sí es la misma regla en las 3) pero se dejó el markup/color
  local a propósito.
- **Señales adicionales para no apurar la abstracción:**
  - "Regla de tres": duplicado 2 veces puede ser coincidencia; duplicado 3+ veces ya es un
    patrón real que vale la pena nombrar.
  - Si compartir algo pequeño exige una interfaz con muchas opciones para cubrir todos los
    casos, evaluar si el costo de esa interfaz (legibilidad, indirección) supera el ahorro
    real de líneas.
  - Si dos piezas van a divergir pronto por una razón de negocio ya conocida, compartir
    hoy solo obliga a desarmarlo después.

### 8.2 Cómo diseñar la pieza compartida

- Leer el código **real** de TODOS los consumidores antes de diseñar — no asumir que "se
  ven parecidos" implica que son iguales.
- Si hay variantes con comportamiento observable distinto (no solo de estilo), **no
  promediarlas ni forzar una sola implementación**: exponer opciones/parámetros que
  reproduzcan cada variante exactamente. Ejemplo real: `composables/useColumnDragAndDrop.ts`
  cubre 2 variantes (con/sin columnas fijas) vía opciones, sin "corregir" ninguna.
- Antes de crear algo nuevo, revisar si ya existe una pieza compartida a medio aplicar
  (ej. una función en `utils/` que algún comentario dice "debe mantenerse en sync" con
  copias locales) y reconciliar con ella en vez de crear una tercera copia.

### 8.3 Límite estricto: presentación vs. datos/permisos

- Una pieza compartida de presentación (traducir un estado a texto/color, ordenar/paginar
  filas ya recibidas, markup de un selector/dropdown) **nunca** debe decidir qué datos
  pedir, qué endpoint llamar, ni aplicar lógica de permisos/negocio.
- Esa lógica (qué pedidos/estados puede ver cada rol, qué parámetros mandar al backend,
  `route.name`, `meta.permissions`) se queda en cada consumidor. Compartir la capa visual
  no implica fusionar la capa de acceso a datos.

### 8.4 No arreglar de paso

Un refactor de deduplicación no es el lugar para "corregir" inconsistencias que se
descubran en el camino (un color que no es el esperado, una validación que falta en un
archivo y sobra en otro). Documentarlo y preguntar antes de aplicar cualquier cambio de
comportamiento observable — aunque parezca una mejora.

### 8.5 Proceso obligatorio

1. Rama dedicada, separada de cualquier feature en curso (evita mezclar historial de
   negocio con refactor puro; permite revertir el refactor sin arrastrar fixes de negocio).
2. Diseñar y crear la(s) pieza(s) compartida(s) primero, sin tocar consumidores.
3. `npx vue-tsc --noEmit` limpio sobre la pieza nueva antes de migrar ningún consumidor.
4. Migrar cada consumidor preservando su comportamiento exacto, incluida cualquier
   asimetría real entre ellos (no forzar un comportamiento nuevo en un consumidor que no
   lo tenía).
5. Revisar el diff de cada archivo migrado a mano — no basta con que compile. Buscar
   específicamente cambios de color, posición, texto o comportamiento no solicitados.
6. `npx vue-tsc --noEmit` limpio sobre todo el proyecto al final.
7. Un bloque de refactor cohesivo por commit.

### 8.6 Ubicación y organización de `src/components/`

`src/components/` es la única ubicación de componentes compartidos entre módulos (ver
`docs/MODULOS.md`). Esta subsección formaliza **cómo** se organiza y **cuándo** algo va ahí,
después de auditar el estado real del repo (2026-09): el mecanismo ya existía y tenía
adopción real (`VolverButton`, `QuickTablePagination`), pero convivía sin convención escrita
con copias locales en módulos que ya habían empezado a divergir en silencio (ver 8.7).

**Regla de ubicación:** un componente va en `src/components/` solo si es UI genérica y
agnóstica de dominio (presentación pura, sin lógica de negocio ni de permisos — ver 8.3) Y
no depende de un composable/servicio que viva dentro de un módulo específico. Si un
componente "compartido" necesita lógica de un módulo puntual, esa lógica también debe
volverse compartida (`src/composables/`) antes de que el componente pueda vivir en la raíz
— no al revés. Todo lo demás va en `src/modules/<módulo>/components/`.

**Organización por subcarpeta** (sin prefijo `Base*`/`App*` — se evaluó pero se descartó por
el costo de renombrar ~30 imports de `VolverButton` sin beneficio real sobre agrupar por
carpeta):

| Subcarpeta | Contiene | Ejemplos actuales |
|---|---|---|
| `navegacion/` | Navegación entre pantallas | `VolverButton.vue` |
| `paginacion/` | Controles de paginación de tablas/listados | `QuickTablePagination.vue`, `PageJumpInput.vue` |
| `feedback/` | Estados de carga y notificación | `LoadingSpinner.vue`, `SkeletonTable.vue`, `ToastContainer.vue` |
| `modales/` | Diálogos genéricos (confirmar/error/éxito) | `ConfirmModal.vue`, `ErrorModal.vue`, `SuccessModal.vue` |
| `datos/` | Presentación de datos (tabs, gráficos) | `FolderTabs.vue`, `BarChart.vue`, `DoughnutChart.vue` |
| *(raíz, sin subcarpeta)* | Casos con acoplamiento de dominio pendiente de resolver — ver 8.7 | `WarehouseSelect.vue`, `ScannerPanel.vue` |
| `assistant/` | Feature del widget asistente (mIA), no es design-system genérico | `AssistantWidget.vue`, `CoolTurito.vue` |

**Contrato mínimo para un componente nuevo en `src/components/<categoría>/`:**

- Comentario de cabecera (TSDoc-like) explicando propósito y contrato de props/eventos —
  igual que ya hacen `RequiereAccionToggleButton.vue` o `DebouncedSearchField.vue` en
  mba3-consultas, aunque esos sean componentes de módulo.
- Soporte de dark mode (`dark:*`) desde el primer commit — ver `docs/DARK_MODE_GUIDE.md`. No
  es opcional para algo que se ofrece a cualquier módulo.
- `defineEmits<{ evento: [payload] }>()` (sintaxis de tupla). No usar la sintaxis de firma de
  función (`defineEmits<(e: 'x') => void>()`) en componentes nuevos — ambas conviven hoy en
  el repo pero la de tupla es la que predomina.
- Antes de crear uno nuevo: revisar si ya existe algo equivalente en `src/components/` o como
  copia local en algún módulo (ver 8.7) — no crear una tercera implementación del mismo
  concepto sin antes revisar ese backlog.

### 8.7 Backlog de deduplicación conocido (no resuelto en esta pasada)

Auditoría 2026-09 sobre `src/components/` vs. `src/modules/*/components/`. Documentado para
que cada equipo de módulo lo resuelva cuando le toque — no se migró ningún consumidor de
módulo en esta pasada, solo se reorganizó `src/components/` (ver 8.6).

**Tier 1 — copias idénticas o casi idénticas (mecánico, bajo riesgo):**

| Componente compartido | Copia local | Módulo |
|---|---|---|
| `components/modales/ConfirmModal.vue` | `ConfirmDialog.vue` | `recepcion-mercaderia` |
| `components/modales/ErrorModal.vue` | `ErrorDialog.vue` | `recepcion-mercaderia` |
| `components/paginacion/PageJumpInput.vue` | `PageJumpInput.vue` (mismo nombre) | `recepcion-mercaderia` |
| `components/feedback/SkeletonTable.vue` | `SkeletonTable.vue` (mismo nombre) | `mba3-consultas` |

**Tier 2 — casi idénticas pero la copia compartida ya corrigió algo que la copia local no
tiene (migrar aquí también arregla un bug silencioso, no solo deduplica):**

| Componente compartido | Copia local | Diferencia real detectada |
|---|---|---|
| `components/feedback/LoadingSpinner.vue` | `LoadingSpinner.vue` | mba3-consultas — difiere en `<output>` (raíz) vs `<div role="status">` (local) y en el import de `computed` (`vue` vs `@vue/reactivity`) |
| `components/datos/BarChart.vue` | `BarChart.vue` | mba3-consultas — la copia compartida ya tiene soporte dark mode, la local no |
| `components/datos/DoughnutChart.vue` | `DoughnutChart.vue` | mba3-consultas — mismo caso: falta dark mode en la copia local |
| `components/datos/FolderTabs.vue` | `FolderTabs.vue` | mba3-consultas — la copia local tiene además funciones muertas sin uso |

**Tier 3 — acoplamiento de arquitectura sin resolver, requiere decisión de diseño antes de
tocar código (no es solo deduplicar):**

- `src/components/ScannerPanel.vue` (pensado como compartido) importa
  `useBarcodeScanner` desde `src/modules/articulo-scaner/composables/`, es decir depende de
  un módulo de negocio específico — viola la regla de 8.6. Al mismo tiempo,
  `src/modules/inventario/` mantiene su propia copia tanto del componente como del
  composable. Antes de mover nada hay que decidir: ¿el composable de escaneo se vuelve
  compartido (`src/composables/useBarcodeScanner.ts`) y ambos módulos consumen de ahí?
  ¿Es dueño `articulo-scaner` y `inventario`/la raíz deben consumir su versión? Afecta a 2
  módulos de negocio ajenos entre sí — no resolver unilateralmente sin sus dueños.
- `src/components/WarehouseSelect.vue`: patrón de UI genérico (combobox con búsqueda) pero
  atado al dominio "almacén/tienda" en su implementación actual. Evaluar si conviene
  generalizarlo (recibir la fuente de datos por prop) o dejarlo explícitamente como
  componente de dominio fuera de `src/components/`.

**Tier 4 — mismo concepto, implementaciones independientes (no es copy-paste, requiere
diseñar una API común antes de unificar — seguir el proceso de 8.2/8.5):**

- **Modal de confirmación**: al menos 5 implementaciones conviven — `ConfirmModal.vue` (raíz,
  Teleport manual), `ConfirmDialog.vue` (`recepcion-mercaderia`, copia de la anterior),
  `ConfirmActionModal.vue` (`cedi`, `@headlessui/vue` + variante de countdown),
  `SimpleConfirmModal.vue` (`mba3-consultas`, en realidad es de "éxito" pese al nombre),
  `ModalConfirmacion.vue` (`transferencias-directas`, variantes `primary`/`peligro` + slot de
  error de stock). No unificar sin antes decidir cuál set de variantes debe cubrir la pieza
  compartida.
- **Badges de estado/notificación**: `AccionPendienteBadge.vue` (`mba3-consultas`, contador de
  notificación) vs. `EstadoBadge.vue` (`integraciones`, badge semántico de 5 tonos) son
  conceptos de "badge" distintos, no duplicados entre sí, pero ninguno de los dos tiene
  equivalente en `src/components/` — evaluar si conviene una pieza `Badge` genérica de la que
  ambos hereden variantes.
- **Input de búsqueda con debounce**: `DebouncedSearchField.vue` (`mba3-consultas`) ya
  deduplicó 8 copias dentro del propio módulo, pero `demanda-otb`, `gestion-usuarios`,
  `reposiciones` y `recepcion-mercaderia` implementan debounce a mano en sus vistas sin
  reusar ese componente ni tener uno propio equivalente.

---

## 9) Convenciones de mantenimiento

- Cualquier nuevo patrón transversal debe agregarse aquí primero.
- Si una guía específica cambia (SSE, mutaciones, módulos), actualizar enlaces y resumen de este documento.
- Evitar crear lógica estándar aislada en un solo módulo sin registrarla en esta guía.

