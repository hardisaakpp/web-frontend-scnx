# Manual de Usuario — Integraciones (SAP / HITELL)

**Módulo Integraciones — SCNexus**

---

## 1. Introducción

Este manual describe el uso del módulo **Integraciones** dentro de SCNexus. El módulo está dirigido al equipo de soporte y sistemas, y permite ver qué pasó con cada integración que los demás módulos (Caja Chica, Transferencias de Stock, Recepción de Mercadería, Reposiciones) envían a **SAP** y a **HITELL (WEBPOS)** a través del middleware, sin necesidad de entrar a la base de datos ni pedir revisiones al área técnica.

Tiene tres pestañas:

| Pestaña | Para qué sirve |
|---|---|
| **HITELL (WEBPOS)** | Ver si cada transferencia de stock o entrada de mercadería que SAP confirmó llegó a HITELL, y **reintegrar** las que HITELL rechazó |
| **Cola SAP** | Ver las peticiones a SAP que quedaron en cola porque SAP no respondió a tiempo, con su estado final y sus reintentos |
| **Bitácora de peticiones** | Ver toda petición que pasó por el middleware, con lo que se envió y lo que se respondió |

### 1.1 Permisos

El acceso al módulo depende de los permisos asignados a su usuario. Un usuario con rol **Admin** tiene acceso completo sin necesidad de estos permisos.

| Permiso | Habilita |
|---|---|
| `integraciones.view` | Ver el módulo en el menú y las tres pestañas: HITELL, Cola SAP y Bitácora |
| `integraciones.hitell.retry` | Usar el botón **Reintegrar** en la pestaña HITELL sobre los documentos rechazados |

Recomendación de asignación:

| Perfil | Permisos |
|---|---|
| Soporte de primer nivel, solo consulta | `integraciones.view` |
| Soporte de sistemas, puede reintegrar | `integraciones.view` + `integraciones.hitell.retry` |

Si su usuario no tiene ninguno de estos permisos, la opción **Integraciones** no aparece en el menú lateral y al escribir la dirección directamente se muestra la pantalla de acceso denegado.

### 1.2 Cómo habilitar la opción a un usuario (administradores)

Los permisos se administran en SCNexus Core, igual que los del resto de módulos:

1. Verificar que las dos claves existan en el catálogo de permisos de Core, módulo `integraciones`. La primera vez hay que crearlas con la clave exacta de la tabla anterior. El procedimiento por API está en [ARQUITECTURA_Y_NUEVOS_MODULOS.md — Crear permisos para un nuevo módulo](ARQUITECTURA_Y_NUEVOS_MODULOS.md#crear-permisos-para-un-nuevo-módulo).
2. Asignar los permisos al **rol** del equipo de soporte desde el menú **Usuarios → Roles** de SCNexus, o directamente al usuario desde **Usuarios**.
3. Pedir al usuario que **cierre sesión y vuelva a ingresar**. Los permisos viajan en el token de sesión, así que hasta que no inicie sesión de nuevo no verá la opción.

Referencia técnica del esquema de permisos: [SISTEMA_PERMISOS.md](SISTEMA_PERMISOS.md).

---

## 2. Acceso al módulo

1. Inicie sesión en SCNexus con su usuario y contraseña.
2. En el menú lateral, pulse **Integraciones**.
3. Se abre la pestaña **HITELL (WEBPOS)**. Las otras dos pestañas están en la parte superior de la pantalla.

Todas las pestañas comparten el mismo comportamiento:

- Al abrir se muestran los **últimos 3 días**. Puede cambiar el rango con los campos **Desde** y **Hasta** y pulsar **Filtrar**.
- Las tablas se cargan **por páginas de 20 filas**. Use la paginación al pie de la tabla para avanzar.
- El botón **Actualizar**, arriba a la derecha, vuelve a consultar con los filtros actuales.
- El botón **Ver detalle** de cada fila abre una ventana con toda la información del registro.

---

## 3. Pestaña HITELL (WEBPOS)

### 3.1 Descripción

Cada vez que SAP confirma una **transferencia de stock** o una **entrada de mercadería** cuyos almacenes están habilitados para WEBPOS, el middleware avisa a HITELL el nuevo stock. Esta pestaña muestra el resultado de ese aviso por documento.

| Resultado | Significado | Qué hacer |
|---|---|---|
| **Integrado** | HITELL aceptó la actualización de stock | Nada |
| **No corresponde** | Ningún almacén del documento usa WEBPOS, no había que integrar | Nada |
| **Rechazado** | HITELL rechazó el movimiento | Corregir la causa en HITELL y **Reintegrar** |

El rechazo más común es **"Producto no existe en HITELL"**: el artículo aún no está creado en la tienda o negocio correspondiente. En ese caso la fila indica el o los códigos de artículo afectados.

### 3.2 Filtros

| Filtro | Uso |
|---|---|
| Resultado | Todos, Rechazados, Integrados o No corresponde |
| Tipo de documento | Transferencia de stock o Entrada de mercadería |
| Tipo de rechazo | Producto no existe en HITELL, u Otro rechazo. Al elegir uno, el resultado pasa automáticamente a Rechazados |
| N.º documento SAP | Búsqueda puntual por el número de documento (DocNum) que se ve en SAP |
| Desde / Hasta | Rango de fechas de la última actualización del documento |

### 3.3 Columnas de la tabla

| Columna | Contenido |
|---|---|
| Documento SAP | Número de documento SAP. Debajo, el tipo de documento y su DocEntry interno |
| Resultado | Integrado, No corresponde o Rechazado, y el tipo de rechazo si aplica |
| Motivo | Explicación del rechazo o el mensaje de HITELL |
| Intentos | Cuántas veces se intentó integrar el documento |
| Última actualización | Fecha y hora del último intento |
| Acciones | **Ver detalle** y, en los rechazados, **Reintegrar** |

Si un documento muestra **"N.º no registrado"**, fue notificado por una versión anterior del middleware que no guardaba el número de documento. Al reintegrarlo, el número se completa.

### 3.4 Ver detalle

Muestra el resultado, el estado interno, los intentos, las fechas del primer y último intento y, en los rechazados, una tabla con cada artículo afectado, su negocio y el mensaje exacto de HITELL. Al final aparece la **respuesta cruda de HITELL** con un botón **Copiar**, útil para reportar el caso.

### 3.5 Reintegrar un documento rechazado

Disponible solo para usuarios con el permiso `integraciones.hitell.retry` o rol Admin, y solo en documentos con resultado **Rechazado**.

1. Corrija primero la causa en HITELL. Por ejemplo, cree el producto en la tienda indicada.
2. En la fila del documento, pulse **Reintegrar**. También está disponible dentro de **Ver detalle**.
3. Confirme en la ventana emergente. El sistema vuelve a leer el documento desde SAP y reenvía el stock a HITELL. **No crea ni modifica nada en SAP.**
4. Espere el aviso con el resultado. La tabla se actualiza sola.

| Aviso | Significado |
|---|---|
| Documento integrado en HITELL | Listo. El documento pasa a Integrado |
| No corresponde integrar | Ningún almacén del documento usa WEBPOS |
| HITELL volvió a rechazar el documento | La causa sigue. Revise el motivo, corrija en HITELL y reintente |
| HITELL no respondió a tiempo; el reintento quedó encolado | El sistema seguirá intentando solo. Consulte más tarde |
| Error al notificar a HITELL | Falla técnica. Reintente más tarde y, si persiste, reporte a sistemas |

Se puede reintegrar tantas veces como haga falta. Cada intento suma uno en la columna **Intentos** y actualiza el motivo.

---

## 4. Pestaña Cola SAP

### 4.1 Descripción

Cuando un módulo envía algo a SAP y SAP **no responde en 10 segundos** o está saturado, el middleware no devuelve error: guarda la petición en una cola y la sigue intentando en segundo plano con esperas crecientes. Esta pestaña muestra esas peticiones encoladas.

Las peticiones que SAP atendió de inmediato **no pasan por la cola**. Para verlas, use la pestaña **Bitácora de peticiones**.

| Estado | Significado |
|---|---|
| **Encolado** | Esperando el próximo reintento |
| **Procesando** | Intentándose en este momento |
| **Completado** | SAP la aceptó. En el detalle está la respuesta de SAP |
| **Error** | Se agotaron los reintentos, o SAP devolvió un error de negocio que no se resuelve esperando |

El registro de cada petición es permanente. La misma fila va cambiando de estado hasta terminar en Completado o Error, así que aquí se ve también en qué terminaron los reintentos.

### 4.2 Filtros

| Filtro | Uso |
|---|---|
| Estado | Todos, Error, Encolado, Procesando o Completado |
| Endpoint contiene | Texto que busca en la operación, por ejemplo `liquidaciones` o `stock-transfers` |
| Desde / Hasta | Rango de fechas de creación de la petición |

### 4.3 Columnas de la tabla

| Columna | Contenido |
|---|---|
| Creado | Fecha de entrada a la cola y, debajo, la de la última actualización |
| Endpoint | Operación enviada a SAP y el tipo de petición |
| Estado | Encolado, Procesando, Completado o Error |
| HTTP | Código de respuesta final |
| Intentos | Reintentos realizados |
| Error | Motivo, cuando terminó en Error |

### 4.4 Ver detalle

Muestra el **payload enviado a SAP** y el **resultado de SAP**, ambos con botón **Copiar**, además del mensaje de error si lo hubo. Es la información que hay que adjuntar cuando se reporta un caso al área técnica.

---

## 5. Pestaña Bitácora de peticiones

### 5.1 Descripción

Registro completo de **toda** petición que llegó al middleware desde cualquier módulo de SCNexus, haya ido a la cola o no: qué operación, quién la hizo, qué se envió, qué se respondió y cuánto tardó.

Diferencia con la Cola SAP: la bitácora es el registro de todas las llamadas; la cola solo tiene las que no pudieron completarse de inmediato. Una petición encolada aparece en ambas: en la bitácora con respuesta 202 y el identificador del job, y en la cola con su evolución.

### 5.2 Filtros

| Filtro | Uso |
|---|---|
| Endpoint contiene | Texto que busca en la operación, por ejemplo `goods-receipts` |
| Usuario | Usuario registrado en la petición. Las llamadas entre sistemas aparecen como `system` |
| Código HTTP | Código exacto, por ejemplo `400` |
| Solo errores | Deja únicamente las respuestas con código 400 o superior |
| Desde / Hasta | Rango de fechas |

### 5.3 Columnas de la tabla

| Columna | Contenido |
|---|---|
| Fecha | Fecha y hora de la petición, en hora de Ecuador |
| Endpoint | Método y ruta de la operación |
| Usuario | Quién la originó |
| HTTP | Código de respuesta. Verde correcto, ámbar error del cliente, rojo error del servidor |
| Duración | Tiempo de respuesta en milisegundos |

### 5.4 Ver detalle

Muestra el **Request** y el **Response** tal como se registraron, con botón **Copiar**. Tenga en cuenta:

- Los cuerpos se guardan recortados a 2000 caracteres.
- En las consultas exitosas de solo lectura no se guarda la respuesta, para no llenar la bitácora.

---

## 6. Consejos y buenas prácticas

- **Revise la pestaña HITELL con el filtro Rechazados** al menos una vez al día. Un documento rechazado significa que una tienda tiene stock en SAP que HITELL no conoce.
- Antes de reintegrar, **corrija la causa en HITELL**. Reintegrar sin corregir solo suma un intento con el mismo rechazo.
- Si varios documentos fallan por el mismo artículo, filtre por **Producto no existe en HITELL**: la columna Motivo lista los códigos que hay que crear.
- Para investigar una operación de otro módulo, busque en la **Bitácora** por endpoint y fecha, y abra el detalle para ver el request y la respuesta.
- Al reportar un caso al área técnica, copie el **Request** y el **Response** del detalle, o el identificador del job en la Cola SAP.

---

## 7. Resolución de problemas

| Situación | Causa probable | Qué hacer |
|---|---|---|
| No aparece **Integraciones** en el menú | El usuario no tiene `integraciones.view` | Pedir al administrador que asigne el permiso y volver a iniciar sesión |
| No aparece el botón **Reintegrar** | El usuario no tiene `integraciones.hitell.retry`, o el documento no está Rechazado | Verificar permiso y resultado del documento |
| "No se pudo consultar…" en cualquier pestaña | El middleware no está disponible | Reintentar en unos minutos; si persiste, reportar a sistemas |
| Un documento aparece con "N.º no registrado" | Fue notificado por una versión anterior del middleware | Al reintegrarlo se completa el número |
| HITELL vuelve a rechazar tras corregir | La corrección no aplica al negocio o tienda indicados en el detalle | Revisar el campo Negocio de cada artículo en el detalle |

---

## 8. Glosario

| Término | Significado |
|---|---|
| **Middleware** | Servicio intermedio por el que SCNexus se comunica con SAP y con HITELL |
| **HITELL / WEBPOS** | Sistema de punto de venta de las tiendas que recibe el stock desde SAP |
| **DocNum** | Número de documento visible en SAP |
| **DocEntry** | Identificador interno del documento en SAP |
| **Job** | Petición a SAP que quedó en cola de reintentos |
| **Integrado** | HITELL aceptó la actualización de stock |
| **No corresponde** | El documento no involucra almacenes con WEBPOS |
| **Rechazado** | HITELL no aceptó el movimiento; requiere corrección y reintegración |
