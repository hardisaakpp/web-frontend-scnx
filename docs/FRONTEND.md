# Frontend - Convenciones y Flujos

Documentación de convenciones de UI, flujos de pantalla y uso de APIs desde el frontend. Describe con detalle **qué debe hacer el frontend** en los flujos de Redistribución y del botón "Confirmar" en el detalle del pedido.

---

## 0. Capabilities y diagnóstico

### 0.4.1 Diagnóstico

**¿La respuesta incluye las capabilities esperadas?**

En las respuestas de **GET /api/auth/me** (o **GET /Auth/me**), el frontend recibe un objeto `capabilities`. Debe incluir al menos:

- **can_view_odc_sap**: `true` **solo** si el usuario tiene el permiso **odc.view** (sin admin override). Para el uso en el sidebar, ver [0.5.7.1](#0571-botón-sidebar-gestión-odc-sap--permiso-odcview).
- **can_manage_order**: `true` **solo** si el usuario tiene el permiso **odcsap.view**. Para el botón "Gestionar Pedido", ver [0.5.7.2](#0572-botones-gestionar-pedido-y-listado-de-pedidos--permiso-odcsapview).
- **can_view_order_list**: `true` **solo** si el usuario tiene el permiso **odcsap.view**. Para el botón "Listado de Pedidos", ver [0.5.7.2](#0572-botones-gestionar-pedido-y-listado-de-pedidos--permiso-odcsapview).
- **mabel_view**: `true` **solo** si el usuario tiene el permiso **mabel.view**. Si no viene o no es `true`, tratar como `false`. Para Cargar Plantilla, Redistribución, Procesamiento SAP, Procesos y Homologaciones, ver [0.5.7.3](#0573-botones-mabel-view--permiso-mabelview).

**¿Los getters leen solo de capabilities?**

En el store de auth, los getters deben reflejar exclusivamente `state.capabilities` (no derivar de modo, empresa, permissions ni otros datos):

- **canViewOdcSap** → `state.capabilities?.can_view_odc_sap === true`
- **canManageOrder** → `state.capabilities?.can_manage_order === true`
- **canViewOrderList** → `state.capabilities?.can_view_order_list === true`
- **canViewMabel** → `state.capabilities?.mabel_view === true`

### 0.5.7.1 Botón sidebar "Gestión ODC SAP" — permiso `odc.view`

El botón **"Gestión ODC SAP"** en el sidebar depende **únicamente** del permiso `odc.view`.

**Reglas exactas:**

- La capability `can_view_odc_sap` es `true` **solo** si el usuario tiene el permiso `odc.view` (sin admin override).
- El botón **solo debe mostrarse** si `capabilities.can_view_odc_sap === true`.
- El permiso `odc.view` **no** condiciona ningún otro botón ni funcionalidad del dashboard.
- El frontend **no** debe chequear permisos directamente; solo la capability.

**Implementación en frontend:**

```ts
authStore.canViewOdcSap  // getter que refleja capabilities.can_view_odc_sap
```

En el sidebar (p. ej. MainLayout):

```vue
<router-link v-if="authStore.canViewOdcSap" to="/mba3-consultas" ...>
  Gestión ODC SAP
</router-link>
```

Nada más. No usar `permissions.includes('odc.view')` ni `userRoles.includes('Admin')` ni `mba3-consultas.view` para este botón.

**Comportamiento esperado:**

- Usuario sin `odc.view` → no ve el botón.
- Usuario con `odc.view` → ve el botón y puede entrar.

### 0.5.7.2 Botones "Gestionar Pedido" y "Listado de Pedidos" — permiso `odcsap.view`

Los botones **"Gestionar Pedido"** y **"Listado de Pedidos"** en el dashboard de Gestión ODC SAP dependen **únicamente** del permiso `odcsap.view`.

**Reglas exactas:**

- El permiso **odcsap.view** habilita solo esos dos botones; no afecta al sidebar "Gestión ODC SAP" ni a otros botones.
- **can_manage_order** y **can_view_order_list** son `true` **solo** si el usuario tiene `odcsap.view` (sin admin override ni otros permisos).
- Sin `odcsap.view` no se muestra ninguno de los dos.
- El frontend **no** debe chequear permisos directamente; solo las capabilities.

**Mapeo:**

| Permiso       | Capability           | UI                    |
|---------------|----------------------|------------------------|
| `odcsap.view` | `can_manage_order`    | Botón "Gestionar Pedido" |
| `odcsap.view` | `can_view_order_list` | Botón "Listado de Pedidos" |

**Implementación en frontend:**

Usar solo los getters del store de auth:

```ts
authStore.canManageOrder   // capabilities.can_manage_order
authStore.canViewOrderList // capabilities.can_view_order_list
```

En el dashboard (p. ej. DashboardView):

```vue
<button v-if="authStore.canManageOrder && tienePedidos" ...>Gestionar Pedido</button>
<button v-if="authStore.canViewOrderList" ...>Listado de Pedidos</button>
```

No usar `permissions.includes('odcsap.view')` ni lógica distinta de capabilities.

**Comportamiento esperado:**

| Usuario               | "Gestionar Pedido" | "Listado de Pedidos" | Sidebar "Gestión ODC SAP" |
|-----------------------|--------------------|----------------------|---------------------------|
| Con `odcsap.view`     | Visible            | Visible              | Solo si tiene `odc.view`  |
| Sin `odcsap.view`     | No visible         | No visible           | Sin cambios               |

El sidebar solo depende de `odc.view`; `odcsap.view` no lo modifica.

### 0.5.7.3 Botones controlados por `mabel.view` — capability `mabel_view`

Los botones **Cargar Plantilla**, **Redistribución**, **Procesamiento SAP**, **Procesos** y **Homologaciones** en el dashboard de Gestión ODC SAP dependen **únicamente** de la capability **mabel_view** (permiso `mabel.view`).

**Fuente de datos:** solo la respuesta de **GET /api/auth/me** (o **GET /Auth/me**). En la respuesta, `capabilities` viene en **snake_case**; **mabel_view** es `true` solo si el usuario tiene el permiso `mabel.view`. En cualquier otro caso es `false` o no viene (tratar como `false`).

**Getter en el store:** leer **solo** de capabilities:

```ts
canViewMabel → state.capabilities?.mabel_view === true
```

No derivar este valor de `modo`, `empresa`, `permissions`, roles ni de ningún otro dato.

**Botones que controla mabel_view:**

| capability   | Permiso     | UI                |
|-------------|-------------|-------------------|
| `mabel_view` | `mabel.view` | Cargar Plantilla   |
| `mabel_view` | `mabel.view` | Redistribución     |
| `mabel_view` | `mabel.view` | Procesamiento SAP  |
| `mabel_view` | `mabel.view` | Procesos           |
| `mabel_view` | `mabel.view` | Homologaciones     |

Cuando **capabilities.mabel_view === true**, el usuario ve esos cinco botones. Cuando **capabilities.mabel_view !== true**, no se debe mostrar ninguno.

**Uso en la UI:**

Condicionar la visibilidad solo con la capability o con el getter:

```vue
<button v-if="authStore.canViewMabel" ...>Cargar Plantilla</button>
<button v-if="authStore.canViewMabel" ...>Redistribución</button>
<button v-if="authStore.canViewMabel" ...>Procesamiento SAP</button>
<button v-if="authStore.canViewMabel" ...>Procesos</button>
<button v-if="authStore.canViewMabel" ...>Homologaciones</button>
```

**Lo que no debe hacerse:**

- No usar `permissions.includes('mabel.view')`.
- No inferir el permiso desde roles, modo, empresa o lógica propia.
- No mezclar condiciones tipo “modo MABEL” o “usuario de MABEL” con esta visibilidad.

**Regla general:** El frontend no deduce permisos. El backend es la única autoridad sobre capabilities. La UI solo lee `capabilities` (o getters que vengan de ahí) y muestra u oculta según eso.

**Cuándo cargar capabilities:** Al inicio de la app (p. ej. en `initializeAuth`), tras login y al restaurar sesión (token en localStorage). Asegurar que en rutas donde se usen estos botones ya se haya llamado a `/api/auth/me` antes de renderizar. Si no se llama o falla (p. ej. 401), `capabilities` queda vacío o sin cargar → `mabel_view` será falsy → esos cinco botones no se muestran.

---

## 1. Interfaz Redistribución: cargar último pedido para redistribución

**Objetivo:** que al entrar por el botón "Redistribución" el usuario vea enseguida el último pedido con estado **RESPUESTA_PROVEEDOR_CARGADA** (listo para redistribuir), sin usar el buscador. Opcionalmente, mostrar una **lista de pedidos confirmados** para que elija uno.

### 1.0 Backend: último pedido para redistribución y lista de confirmados

**Último pedido (redirect al entrar):** El endpoint **`GET /api/pedidos/ultimo-redistribucion`** devuelve el último pedido con estado **RESPUESTA_PROVEEDOR_CARGADA** (misma idea que cargar-plantilla y `GET /api/plantillas/ultimo`). Query param `solo_usuario` (default `true`). Respuesta: objeto con cabecera básica (`numero_pedido`, etc.) o **`null`**. En frontend: `mba3ConsultasService.getUltimoPedidoRedistribucion(soloUsuario?)`.

**Lista de pedidos confirmados:** El endpoint **`GET /api/pedidos/confirmados`** devuelve una lista paginada de pedidos en estado confirmado (`CONFIRMADO_PROVEEDOR`, `PEDIDO_CONFIRMADO`):

- **Parámetros:** `page`, `pageSize`, opcionalmente `redistribucion_confirmada=true`.
- **Respuesta:** `{ "data": [ ... ], "total", "page", "pageSize", "totalPages" }`.

Se usa para pintar la **lista de pedidos confirmados** en `/redistribucion` (p. ej. `page=1&pageSize=20`).
### 1.1 Rutas implicadas

| Ruta | Cuándo se usa | Qué se muestra |
|------|----------------|----------------|
| `/mba3-consultas/redistribucion` | Clic en "Redistribución" (o acceso directo sin pedido) | Pantalla con **input de búsqueda** para número de pedido. Aquí es donde se debe disparar la carga del "último confirmado". |
| `/mba3-consultas/pedidos/{numero_pedido}/redistribucion` | Tras redirección automática o tras buscar un pedido | Vista de redistribución de **ese** pedido (detalle, cantidades, etc.). |

Ejemplo de URL con pedido:  
`/mba3-consultas/pedidos/P-12.24%20-%2012%20-%202025/redistribucion`

### 1.2 Lógica cuando se monta la ruta sin pedido (`/mba3-consultas/redistribucion`)

Al montar la vista asociada a `/mba3-consultas/redistribucion` (por ejemplo en `onMounted` o equivalente), el frontend debe:

1. **Distinguir que no hay pedido en la URL**  
   - Si la ruta es solo `/mba3-consultas/redistribucion` (sin `numero_pedido` en `params`), se considera "entrada por botón Redistribución".

2. **Mostrar estado de carga**  
   - Pintar algo como "Buscando último pedido..." (o spinner) para que el usuario sepa que se está haciendo una petición.

3. **Pedir el último pedido para redistribución al backend**  
   - Llamar a:  
     `GET /api/pedidos/ultimo-redistribucion?solo_usuario=true`  
     (en el servicio: `mba3ConsultasService.getUltimoPedidoRedistribucion(true)`).  
   - Con header: `Authorization: Bearer {token}`.

4. **Tratar la respuesta**  
   - La API devuelve un objeto con cabecera básica (`numero_pedido`, etc.) o **`null`** si no hay ninguno con estado RESPUESTA_PROVEEDOR_CARGADA.
   - **Si la respuesta trae un objeto con `numero_pedido`:**
     - Redirigir a la vista del pedido usando **una sola** codificación de URL:
       - Construir la ruta:  
         `'/mba3-consultas/pedidos/' + encodeURIComponent(numero_pedido) + '/redistribucion'`
       - Navegar con `router.replace(...)` para que la URL pase a ser algo como:  
         `/mba3-consultas/pedidos/P-12.24%20-%2012%20-%202025/redistribucion`
     - No hacer doble `encodeURIComponent` para evitar `%2520` en la URL.
   - **Si la respuesta es `null` o la petición falla:**
     - No redirigir.
     - Quedarse en `/mba3-consultas/redistribucion` y mostrar el **input de búsqueda** y, si aplica, la **lista de pedidos confirmados** (vía `GET /api/pedidos/confirmados`).

5. **No repetir la llamada cuando ya hay pedido en la URL**  
   - Si la ruta es `/mba3-consultas/pedidos/{numero_pedido}/redistribucion`, el frontend **no** debe volver a llamar a `GET /api/pedidos/ultimo-redistribucion`. Solo debe cargar el pedido indicado por `numero_pedido` (con `loadPedido()` o el flujo que ya exista para esa pantalla).

#### Codificación de la URL (resumen)

Usar `encodeURIComponent(numero_pedido)` una sola vez al montar la ruta. Ejemplo en código:

```ts
router.replace({
  name: 'mba3-consultas-pedido-redistribucion',
  params: { id: encodeURIComponent(numero_pedido) }
})
// o bien:
router.replace('/mba3-consultas/pedidos/' + encodeURIComponent(numero_pedido) + '/redistribucion')
```

### 1.3 Flujo resumido (Redistribución)

```
Usuario hace clic en "Redistribución"
    → Navegación a /mba3-consultas/redistribucion
    → onMounted (o similar) detecta "sin numero_pedido"
    → Muestra "Buscando último pedido..."
    → GET /api/pedidos/ultimo-redistribucion?solo_usuario=true  (vía getUltimoPedidoRedistribucion(true))
    → Si la respuesta trae un objeto con numero_pedido:
        → router.replace('/mba3-consultas/pedidos/' + encodeURIComponent(numero_pedido) + '/redistribucion')
        → La vista con id carga ese pedido (loadPedido, etc.) y el usuario ve el último con RESPUESTA_PROVEEDOR_CARGADA.
    → Si la respuesta es null o hay error:
        → Se queda en /redistribucion con el input de búsqueda y, si aplica, la lista de pedidos confirmados.
```

### 1.3.1 Gestión del botón "Confirmar Redistribución"

En la vista de redistribución (detalle de pedido o `/mba3-consultas/pedidos/{numero_pedido}/redistribucion`) el botón **"Confirmar Redistribución"** debe seguir este contrato:

- **Endpoint:** `POST /api/pedidos/{numero_pedido}/redistribucion/confirmar` (en frontend: `mba3ConsultasService.confirmarRedistribucion(numeroPedido, ajustes_detalle)`).

- **Al hacer clic:** deshabilitar el botón de inmediato, mostrar “Confirmando…” o spinner y llamar al endpoint. No permitir doble envío.

- **Si la petición es exitosa:** actualizar el estado local (p. ej. considerar el pedido en `PEDIDO_CONFIRMADO`) o recargar el pedido, y dejar el botón deshabilitado (en la implementación actual se redirige a Procesamiento SAP).

- **Si la petición falla:** mostrar el error (toast/mensaje) y volver a habilitar el botón para que el usuario pueda reintentar.

- **Deshabilitar según estado al cargar:** si `cabecera.estado === 'PEDIDO_CONFIRMADO'` (o cualquier estado posterior, p. ej. `PROCESADO_SAP`), el botón debe ir deshabilitado al cargar la vista. La vista debe recibir o calcular un booleano tipo `confirmarDeshabilitadoPorEstado` y pasarlo al componente del botón para que lo use en `disabled` junto con `confirmandoRedistribucion`.

El componente `RedistribucionTiendas` define la prop opcional `confirmarDeshabilitadoPorEstado`. Las vistas que lo usan (`PedidoDetalleView`, `MabelTradingRedistribucionView`) deben calcular ese valor desde `pedido?.cabecera?.estado` y pasarlo.

### 1.4 Alternativa UX: lista de pedidos confirmados (misma página o con URL)

Además de “redirect al último confirmado”, el frontend puede ofrecer una **lista de pedidos confirmados** en `/mba3-consultas/redistribucion`:

1. Llamar a `GET /api/pedidos/confirmados?page=1&page_size=20` (o 50, según diseño).
2. Añadir un **bloque o lista** (“Pedidos confirmados”) con los ítems de `data` (mostrando al menos `numero_pedido`, y si se quiere fecha, estado, etc.).
3. Mantener el **buscador por número** como está: quien prefiera escribir el número sigue pudiendo hacerlo.
4. Al **elegir** un pedido de la lista (o al buscar por número), hay dos formas de mostrar el detalle:

| Opción | Comportamiento | URL del detalle |
|--------|----------------|-----------------|
| **A – Todo en `/redistribucion`** | Lista y buscador viven en `/redistribucion`. Al seleccionar (o buscar), el frontend guarda en estado el `numero_pedido` (y si hace falta `pedido_id`), pide los datos de redistribución de ese pedido y **pinta el detalle en un panel/sección de la misma vista** (lista arriba o a un lado, detalle abajo o al otro lado). | Sigue siendo `/mba3-consultas/redistribucion`. |
| **B – Lista en `/redistribucion`, detalle con URL** | Lista y buscador viven en `/redistribucion`. Al seleccionar (o buscar), se **navega a** `/mba3-consultas/pedidos/{numero_pedido}/redistribucion` y allí se muestra el detalle. | `/mba3-consultas/pedidos/{numero_pedido}/redistribucion`. |

- **Opción A:** “Mismo apartado” = literalmente la misma URL; lista + detalle en la misma página.
- **Opción B:** “Mismo apartado” = mismo flujo de pantalla (lista → detalle), pero el detalle tiene su propia URL.

El flujo descrito en 1.2–1.3 (“redirect al último”) es una variante de la **Opción B**: se usa `page=1&page_size=1` y, si hay `data[0]`, se navega a `/pedidos/{numero_pedido}/redistribucion`.

**Resumen:** ¿Se implementa en frontend o en backend? Principalmente en el **frontend**. El backend ya da la lista con `GET /api/pedidos/confirmados`. No es necesario tocar el backend para esta solución; solo si más adelante se quisiera un endpoint más ligero (p. ej. solo `pedido_id` y `numero_pedido`).

---

## 2. Pantalla detalle del pedido: botón "Confirmar"

En `/mba3-consultas/pedidos/{numero_pedido}` el frontend debe integrar el botón "Confirmar" y su estado.

### 2.1 Cuándo mostrar y cuándo deshabilitar

- **Mostrar** el botón solo cuando corresponda al flujo (p. ej. modo EL RAYO, no MABEL TRADING) y no esté oculto por `hideConfirmAndDownload`. Si el backend expone `capabilities.can_confirm_pedido`, usar `capabilities.can_confirm_pedido === true` para decidir visibilidad del botón Confirmar. (Los permisos `odcsap.view` y `odc.view` se han eliminado; la visibilidad depende de las capabilities y de `mba3-consultas.view` para el módulo.)
- **Deshabilitar** el botón cuando `cabecera.estado` sea uno de:
  - `RESPUESTA_PROVEEDOR_CARGADA`
  - `CONFIRMADO_PROVEEDOR`
  - `PEDIDO_CONFIRMADO`
  - o cualquier estado posterior (p. ej. `PROCESADO_SAP`, `CONFIRMADO_ENVIADO`).

En el frontend puede usarse una lista de estados "ya confirmados":

```ts
const ESTADOS_YA_CONFIRMADOS = [
  'RESPUESTA_PROVEEDOR_CARGADA',
  'CONFIRMADO_PROVEEDOR',
  'PEDIDO_CONFIRMADO'
]
const confirmarDeshabilitadoPorEstado = computed(() =>
  ESTADOS_YA_CONFIRMADOS.includes(pedido.value?.cabecera?.estado ?? '')
)
```

También deshabilitar si `loading`, si no hay `pedido`, o si ya está en curso la confirmación (`confirmando`).

### 2.2 Al hacer clic en "Confirmar"

1. **Llamada al backend**  
   - `POST /api/pedidos/{pedido_id}/crear-respuesta-desde-pedido`  
   - En la URL usar **`cabecera.pedido_id`** (UUID) del pedido cargado, no el `numero_pedido` de la ruta.  
   - Body vacío o `{}`.  
   - Header: `Authorization: Bearer {token}`.  
   - En el servicio: `mba3ConsultasService.crearRespuestaProveedorDesdePedido(numeroPedido, cabecera.pedido_id)`.

2. **Mientras se espera respuesta**  
   - Deshabilitar el botón y/o mostrar "Guardando…" / "Confirmando…" / spinner para evitar doble envío.

3. **Si la respuesta es exitosa**  
   - Actualizar el estado del pedido en el frontend (p. ej. con `RESPUESTA_PROVEEDOR_CARGADA`) o recargar el pedido desde el backend.  
   - Dejar el botón "Confirmar" deshabilitado (el estado ya indica que está confirmado).  
   - Opcional: redirigir a `/mba3-consultas/pedidos/{numero_pedido}/redistribucion` o al dashboard, según el flujo de producto acordado.

4. **Si la petición falla**  
   - Mostrar mensaje de error al usuario.  
   - Volver a habilitar el botón para poder reintentar.

5. **Si el backend retorna 409 (ya existe)**  
   - Tratar como idempotente: recargar pedido, deshabilitar botón y, si aplica, redirigir.

#### Qué hace el backend

- Toma los datos actuales del pedido (totales, costos, etc.), genera la respuesta del proveedor y la guarda.
- Actualiza el estado del pedido a **`RESPUESTA_PROVEEDOR_CARGADA`**.
- Registra la confirmación en el historial (tabla de confirmaciones EL RAYO).
- Responde con `status: "success"`, `confirmacion_registrada: true/false`, `estado_guardado`, etc.

---

## 3. Resumen rápido para desarrollo

- **Backend Redistribución:** `GET /api/pedidos/ultimo-redistribucion?solo_usuario=true` (último con RESPUESTA_PROVEEDOR_CARGADA); `GET /api/pedidos/confirmados` (lista paginada para "Pedidos confirmados").
- **Redistribución (comportamiento actual – “redirect al último”):** en `/mba3-consultas/redistribucion` (sin `numero_pedido`), llamar a `GET /api/pedidos/ultimo-redistribucion?solo_usuario=true` (vía `getUltimoPedidoRedistribucion(true)`). Si la respuesta trae `numero_pedido`, hacer `router.replace` a `/mba3-consultas/pedidos/` + `encodeURIComponent(numero_pedido)` + `/redistribucion`. Si es null o hay error, quedarse en la pantalla con el input de búsqueda y, si aplica, la lista de pedidos confirmados.
- **Redistribución (alternativa – lista de confirmados):** llamar a `GET /api/pedidos/confirmados?page=1&page_size=20` (o 50), pintar la lista en `/redistribucion`, y al elegir un ítem (o al buscar por número) mostrar el detalle **en la misma página** (Opción A) o **navegando a** `/pedidos/{numero_pedido}/redistribucion` (Opción B). Ver 1.4.
- **Confirmar:** en detalle de pedido, `POST /api/pedidos/{cabecera.pedido_id}/crear-respuesta-desde-pedido`, y deshabilitar el botón según `cabecera.estado` (y según `loading` / `confirmando`).
