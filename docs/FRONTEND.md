# Frontend - Convenciones y Flujos

Documentación de convenciones de UI, flujos de pantalla y uso de APIs desde el frontend. Describe con detalle **qué debe hacer el frontend** en los flujos de Redistribución y del botón "Confirmar" en el detalle del pedido.

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
