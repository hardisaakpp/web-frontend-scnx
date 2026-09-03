# Manual de Usuario — Recepción de Mercadería

**Módulo Recepción de Mercadería — SCNexus**

---

## 1. Introducción

Este manual describe el uso del módulo **Recepción de Mercadería** dentro de SCNexus. El módulo permite recibir en tienda las transferencias de mercadería enviadas desde el Centro de Distribución (CD): recibir las solicitudes pendientes que llegan desde SAP, escanear los productos recibidos, confirmar la recepción y consultar el historial de transferencias ya recibidas.

### 1.1 Permisos

El acceso a cada pantalla y botón depende de los permisos asignados a su usuario. Un mismo usuario puede tener varios de estos permisos a la vez.

| Permiso | Habilita |
|---|---|
| `recepcion.reception.view` | Ver **Pendientes**, **En Curso** y el **Detalle** de una transferencia |
| `recepcion.reception.transit.view` | Ver y exportar el reporte de **Transferencias en Tránsito** |
| `recepcion.history.view` | Ver el **Historial** de su propio almacén |
| `recepcion.history.viewall` | Ver el Historial de **todos los almacenes** y exportar el consolidado |
| `recepcion.picking.scan` | Usar el escaneo (código de barras / manual) en el Detalle |
| `recepcion.reception.confirm` | Usar el botón **Confirmar** |
| `recepcion.reception.confirm.partial` | Usar el botón **Confirmar parcial** |
| `recepcion.diferencias.gestionar` | Eliminar una diferencia ya registrada |

Si su usuario no tiene ningún permiso del módulo, el Dashboard se mostrará sin tarjetas.

---

## 2. Acceso al módulo

1. Inicie sesión en SCNexus con su usuario y contraseña.
2. En el menú lateral (sidebar), pulse **Recepción Mercadería**.
3. Se mostrará el **Dashboard** del módulo.

---

## 3. Dashboard

**Ruta:** `/recepcion-mercaderia`

El dashboard muestra tarjetas de acceso rápido. Las tarjetas que ve dependen de sus permisos:

| Tarjeta | Descripción | Requiere |
|---|---|---|
| **Transferencias Pendientes** | Recepción de traslados desde SAP | `recepcion.reception.view` |
| **En Curso / Picking** | Escanear, confirmar y registrar diferencias | `recepcion.reception.view` |
| **Transferencias en Tránsito** | Pendientes de SAP con destino a bodega transitoria | `recepcion.reception.transit.view` |
| **Historial** | Transferencias recibidas de mi almacén (o de todos, según permiso) | `recepcion.history.view` o `recepcion.history.viewall` |

---

## 4. Transferencias Pendientes

**Ruta:** Dashboard → **Transferencias Pendientes**

### 4.1 Descripción

Lista las solicitudes de transferencia que llegaron desde SAP y todavía no fueron recibidas en el sistema. "Recibir" crea la recepción real y lo lleva directo a su detalle para comenzar el escaneo.

> **Aviso "Próximamente":** si esta funcionalidad está temporalmente desactivada por mantenimiento de la integración con SAP, en lugar de la tabla verá un aviso: *"Esta función está bloqueada por la integración con SAP. Estará disponible próximamente."*

### 4.2 Pasos

1. Use el campo **Buscar por documento, artículo o descripción** para filtrar (la búsqueda se aplica sola al dejar de escribir).
2. En la tabla verá: Documento, Fecha, Artículo, Origen, Destino, Cantidad.
3. Pulse **Recibir** en la fila deseada.
4. Confirme en el diálogo *"¿Desea proceder a recibir la transferencia número {N}?"*.
5. El sistema lo llevará automáticamente al **Detalle** de la transferencia recién creada, en la pantalla "En Curso".

### 4.3 Mensajes

| Situación | Mensaje |
|---|---|
| Lista vacía | "No hay transferencias pendientes." |
| Error al cargar la lista | "No se pudo cargar la lista de transferencias pendientes." |
| Error al recibir | "No se pudo recibir la transferencia." |

---

## 5. Transferencias en Curso

**Ruta:** Dashboard → **En Curso / Picking**

### 5.1 Descripción

Lista las transferencias que ya fueron recibidas y están en proceso de escaneo (picking), pendientes de confirmar.

### 5.2 Pasos

1. Use **Buscar por documento...** para filtrar dentro de los resultados visibles en la página actual.
2. En la tabla verá: Documento, Origen, Destino, Estado (ver [tabla de estados](#8-estados-de-una-transferencia)).
3. Pulse **Ver detalle** en la fila deseada para abrir el picking.

### 5.3 Mensajes

- Lista vacía: "No hay transferencias en curso."

---

## 6. Detalle de Transferencia (Picking)

**Ruta:** En Curso → **Ver detalle** (o llegando directo desde "Recibir" en Pendientes)

Esta es la pantalla más completa del módulo: acá se escanea la mercadería recibida, se registran diferencias y se confirma la transferencia.

### 6.1 Encabezado

- Título "Recepción" con la pastilla de **Estado** actual.
- Pastilla azul **"Procesando en SAP"**: aparece cuando la confirmación quedó encolada para reintento automático con SAP (no es un error, solo indica que el proceso sigue en segundo plano). Puede seguir visible aunque recargue la página.
- Dato de origen → destino y el documento SAP de referencia.
- Campo **GLPI**: número de ticket asociado (o "Sin ticket"). Con el ícono de lápiz puede editarlo y guardarlo.

### 6.2 Escanear mercadería

Hay dos formas de registrar lo recibido, según si la línea del pedido tiene código de barras o no:

**a) Escaneo por código de barras** (requiere permiso `recepcion.picking.scan`)

1. Escanee o escriba el código en el campo **"Código de barras"** (tiene el foco listo al entrar a la pantalla).
2. Indique la **Cantidad** (mínimo 1; por defecto 1).
3. Presione **Enter** o el botón **Agregar**.
4. El sistema le confirma el resultado:
   - `"{cantidad} escaneado(s) para {código de artículo}."` → coincide con lo solicitado.
   - `"{cantidad} escaneado(s) para {código}, {excedente} excedente(s) registrados como diferencia."` → escaneó más de lo pedido; el excedente queda como diferencia.
   - `"Código no reconocido — registrado como diferencia ({excedente})."` → el código no corresponde a ninguna línea del pedido; se registra igual como diferencia.

**b) Carga manual** (para líneas que **no tienen** código de barras)

1. En esas líneas, la columna **"Escaneados"** es un campo editable (marcado **"Carga manual"**).
2. Ingrese la cantidad recibida. Si escribe más de lo solicitado, no hay problema: el sistema funciona igual que el escaneo por código de barras — la línea queda con la cantidad solicitada y el excedente se registra automáticamente como diferencia.
3. Pulse **"Guardar escaneo"** para enviar los cambios. Tras guardar, el campo vuelve a mostrar la cantidad permitida (nunca queda mostrando el número de más que escribió).

Ambos métodos comparten dos campos opcionales: **Responsable** y **Guía courier** (obligatoria según convención para tiendas con prefijo LP-/YHD-).

### 6.3 Tabla de líneas

Columnas: N.°, Código de barras, Artículo, Cantidad (solicitada), Escaneados, Diferencia (Cantidad − Escaneados, resaltada en ámbar si no es cero).

### 6.4 Diferencias registradas

- Sección que aparece solo si existen diferencias: Código, Producto, Cantidad total, Fecha/Hora.
- Se agrupan por código de barras cuando vienen de un escaneo; las diferencias de **carga manual** (líneas sin código de barras) se agrupan por línea y la columna "Código de barras" muestra **"Manual (sin código)"**.
- Botón **Eliminar** por grupo — visible solo con permiso `recepcion.diferencias.gestionar`.

### 6.5 Confirmar / Confirmar parcial

| Botón | Requiere | Comportamiento |
|---|---|---|
| **Confirmar** | `recepcion.reception.confirm` | Exige que **todas** las líneas estén completas (escaneado = solicitado). |
| **Confirmar parcial** | `recepcion.reception.confirm.partial` | Permite confirmar con líneas incompletas, con un **reconteo forzado**. |

**Reconteo forzado en "Confirmar parcial":**

1. **Primer intento** con líneas incompletas: no se envía todavía. El sistema resetea a 0 el "Escaneados" de las líneas incompletas (quedan resaltadas en ámbar) y abre un diálogo: *"Es necesario volver a contar los ítems con diferencias antes de confirmar parcialmente. Vuelva a escanear las líneas marcadas o confirme la recepción directamente desde aquí."*, con opciones **"Confirmar parcial"** (continúa igual) o **"Volver a escanear"**.
2. **Segundo intento**: la confirmación parcial se envía sin pedir reconteo de nuevo.

**Mensajes relacionados con la confirmación:**

- Si falla la integración con SAP (no un rechazo, sino un problema de comunicación): *"No se pudo integrar la transferencia a SAP. Los escaneos se guardaron; vuelva a intentarlo cuando el servicio esté disponible."* Los datos escaneados no se pierden.
- Si la confirmación con SAP simplemente queda encolada (caso normal, no error), no verá ningún mensaje de error: la pantalla se actualiza y muestra la pastilla **"Procesando en SAP"**.
- Una vez confirmada, la transferencia pasa a estado **Confirmada** y usted es redirigido automáticamente al **Historial**.

### 6.6 Descargas disponibles

- **Descargar reporte de diferencias** → Excel con las diferencias de esta transferencia.
- **Exportar Picking** → Excel con el detalle completo del picking.

### 6.7 Mensajes de validación

Si una acción de esta pantalla (escanear, registrar una diferencia, confirmar) no cumple una regla del sistema, verá uno de estos mensajes cortos en español en lugar de un error técnico:

| Situación | Mensaje |
|---|---|
| Código de bodega vacío | "El código de bodega no puede estar vacío." |
| Cantidad escaneada negativa | "La cantidad escaneada no puede ser negativa." |
| El escaneo supera lo solicitado en la línea | "La cantidad escaneada supera lo solicitado en la línea." |
| La línea no pertenece a esta transferencia | "Esa línea no pertenece a esta transferencia." |
| La transferencia ya estaba confirmada | "Esta transferencia ya fue confirmada." |
| Faltan líneas y no tiene permiso de confirmación parcial | "Faltan líneas por completar y no tiene permiso para confirmar parcialmente." |
| Falta la guía courier (bodega LP-/YHD-) | "Debe ingresar la guía courier para esta bodega." |
| No se indicó código ni línea al registrar una diferencia | "Debe indicar un código de barras o una línea para registrar la diferencia." |
| Sin acceso a la bodega o recurso | "No tiene acceso a esta bodega o recurso." |
| La transferencia u otro recurso no existe | "No se encontró la transferencia u otro recurso solicitado." |

---

## 7. Transferencias en Tránsito

**Ruta:** Dashboard → **Transferencias en Tránsito** (requiere `recepcion.reception.transit.view`)

### 7.1 Descripción

Reporte de solo lectura de transferencias pendientes en SAP con destino a una bodega transitoria.

### 7.2 Pasos

1. Use **Buscar por N.° transferencia o destino...** para filtrar.
2. En la tabla verá: N.° Transferencia, Destino (transitoria), Cantidad, Fecha.
3. Pulse **Exportar Excel** para descargar el reporte completo (`transferencias-transito.xlsx`, con hojas de Documentos y Detalle). La exportación incluye todos los resultados, no solo lo visible en la página actual.

### 7.3 Mensajes

- Lista vacía: "No hay transferencias en tránsito."
- Error al cargar: "No se pudo cargar el listado de transferencias en tránsito."

---

## 8. Historial

**Ruta:** Dashboard → **Historial**

### 8.1 Descripción

Muestra las transferencias ya confirmadas. El modo se determina automáticamente según su permiso, no hay un selector manual:

- **Con `recepcion.history.view`**: ve solo las transferencias de **su propio almacén**.
- **Con `recepcion.history.viewall`** (o Admin): ve las de **todos los almacenes**, con una pastilla **"Administrador"** junto al título y una columna adicional de fecha de creación.

### 8.2 Filtros

- **Desde / Hasta**: rango de fechas (prellenado con la fecha de hoy).
- **N° transferencia** (solo en modo "todos los almacenes"): si lo completa, se ignora el rango de fechas.
- Botón **Buscar**.

### 8.3 Columnas de la tabla

Id, Transferencia, Nueva Transferencia (documento SAP generado), Cantidad, Escaneados, Diferencia, Sobrantes, Movimiento (origen → destino), Responsable, Guía courier, Ticket GLPI (editable), y en la columna Acción, por fila: el ícono del ojito (**Ver detalle**) y el botón **Exportar Diferencias**.

### 8.4 Ver detalle

Pulse el ícono del ojito en cualquier fila para abrir una ventana de solo lectura con la información completa de esa transferencia confirmada: origen, destino, fecha, responsable, guía courier, documento SAP y ticket GLPI, además de la tabla de productos (código de barras, artículo, cantidad, escaneados y diferencia). No requiere ningún permiso adicional a los ya usados para ver el Historial, y no permite editar nada.

### 8.5 Exportar

- **Exportar Excel**: descarga `historial-recepcion.xlsx` con el resultado filtrado actual completo.
- **Exportar Diferencias** (por fila): descarga las diferencias de esa transferencia puntual.

### 8.6 Mensajes

| Situación | Mensaje |
|---|---|
| Sin resultados | "No hay datos para el rango seleccionado." |
| Error al cargar (propio almacén) | "No se pudo cargar el historial." |
| Error al cargar (todos los almacenes) | "No se pudo cargar el historial de todos los almacenes." |
| Error al exportar Excel | "No se pudo exportar el archivo Excel." |
| Error al guardar ticket GLPI | "No se pudo guardar el ticket GLPI." |

---

## 9. Estados de una transferencia

| Estado | Significado |
|---|---|
| **Pendiente** | Recibida pero aún no se ha comenzado a escanear. |
| **En curso** | En proceso de picking/escaneo. |
| **Confirmada** | Confirmada; pasa a formar parte del Historial. |
| **Error** | Quedó en estado de error (por ejemplo, un fallo no resuelto con SAP). |

---

## 10. Consejos y buenas prácticas

1. **Escaneo primero, manual después:** use el lector de código de barras siempre que la línea lo tenga disponible; reserve la carga manual para líneas sin código.
2. **Confirmar parcial es definitivo tras el segundo intento:** al reconteo se le da una sola oportunidad de corrección automática; verifique bien las cantidades antes de confirmar la segunda vez.
3. **"Procesando en SAP" no es un error:** si ve esa pastilla azul, la recepción ya se guardó correctamente en SCNexus; solo falta que SAP procese el segundo tramo en segundo plano.
4. **Guía courier:** complétela siempre que la tienda destino tenga prefijo LP- o YHD-.
5. **Revise el Historial regularmente** para verificar diferencias y sobrantes de recepciones ya cerradas.

---

## 11. Resolución de problemas

| Problema | Posible solución |
|---|---|
| No veo ninguna tarjeta en el Dashboard | Su usuario no tiene permisos asignados en el módulo; contacte al administrador. |
| No veo el botón Confirmar o Confirmar parcial | Verifique que su usuario tenga el permiso correspondiente (`recepcion.reception.confirm` o `.confirm.partial`). |
| No puedo eliminar una diferencia | Requiere el permiso `recepcion.diferencias.gestionar`. |
| "Transferencias Pendientes" muestra "Próximamente" | La integración con SAP está temporalmente deshabilitada; espere a que se reactive. |
| Aparece "Procesando en SAP" y no cambia | Es normal mientras el proceso en segundo plano reintenta contra SAP; no requiere ninguna acción. |
| Error al confirmar por integración SAP | Los escaneos ya quedaron guardados; reintente confirmar más tarde. |
| No aparece una transferencia en el Historial | Revise el rango de fechas del filtro, o si corresponde a otro almacén (necesita `recepcion.history.viewall` para verlas todas). |

---

## 12. Glosario

| Término | Definición |
|---|---|
| **CD** | Centro de Distribución |
| **SAP** | Sistema ERP corporativo |
| **Picking** | Proceso de escaneo/verificación física de la mercadería recibida |
| **Diferencia** | Descuadre entre la cantidad solicitada y la cantidad realmente escaneada |
| **Bodega transitoria** | Bodega intermedia usada como destino temporal en SAP antes de llegar a la tienda final |
| **GLPI** | Sistema de tickets de soporte usado para referenciar incidencias asociadas a una recepción |

---

*Documento generado para el módulo Recepción de Mercadería de SCNexus. Consulte con el administrador del sistema ante dudas sobre permisos o configuración.*
