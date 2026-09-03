# Manual de Usuario — Transferencias de Stock (SCNexus)

**Audiencia:** Tiendas, Planificadores, Administradores  
**Alcance:** Creación, aprobación, integración automática con SAP Business One, reglas de envío, matriz de aprobaciones según la tienda/bodega de origen y destino.  

---

## 1. ¿Qué hace este módulo?

El módulo de **Transferencias de Stock** gestiona el ciclo completo de una solicitud de traslado de mercadería: la tienda origen la registra, un planificador la revisa y aprueba según el grupo de almacenes al que pertenece, y una vez aprobada se envía automáticamente a SAP Business One para generar el documento de transferencia de stock. En caso de que la solicitud sea rechazada por el planificador, esta solicitud no se envía a SAP.

Para acceder al módulo, el usuario debe contar con los permisos correspondientes. Se ingresa desde el menú lateral: **Transferencias de Stock** $\rightarrow$ pantalla con tarjetas de acceso según sus permisos:

| Tarjeta | Quién la usa | Para qué |
| :--- | :--- | :--- |
| **Crear Transferencia** | Tienda | Solicitar una nueva transferencia de mercadería. |
| **Bandeja de Aprobación** | Planificador / Administrador | Ver y resolver las solicitudes pendientes de aprobación. Puede aprobar o rechazar únicamente si tiene el permiso para hacerlo; caso contrario solo podrá visualizar que solicitudes están por resolverse. |
| **Historial de Transferencias** | Todos | Consultar el historial de solicitudes enviadas y su estado. En caso de un planificador, podrá visualizar únicamente las solicitudes que hayan sido resueltas o enviadas a SAP. |
| **Configuración de Envíos** | Administrador | Definir qué marcas origen pueden enviar a qué marcas destino. |
| **Configuración Matriz de Aprobación** | Administrador | Definir reglas de aprobación por marca y almacén destino. |

> La tarjeta **Bandeja de Aprobación** muestra un contador con el número de solicitudes pendientes.  
> El **Historial** es visible para todos los roles, pero cada uno ve un alcance distinto: tienda ve solo sus propias solicitudes; planificador ve según su grupo de almacenes y administrador de forma global (ver sección 2).

---

## 2. Roles y Permisos

En esta sección se describen los roles que pueden acceder al módulo **Transferencias de Stock** y el alcance de las funciones disponibles para cada uno:

| Rol | Descripción | Funciones disponibles |
| :--- | :--- | :--- |
| **Tienda** | Usuarios de tiendas encargados de solicitar transferencias de mercadería. | • Crear solicitudes, seleccionar productos y cantidades.<br>• Guardar en **Borrador** o enviar a **Aprobación**.<br>• Consultar el **Historial** de sus propias solicitudes generadas. |
| **Planificador** | Supervisores o responsables de revisar y decidir sobre los pedidos de transferencias. | • Visualizar la **Bandeja de Aprobación** de las tiendas pertenecientes a su grupo de almacenes asignado.<br>• **Aprobar o rechazar** solicitudes (con motivo obligatorio).<br>• Consultar el **Historial** de solicitudes procesadas en su grupo. |
| **Administrador** | Perfil de gestión general y configuración del módulo. | • **Visibilidad global** de todas las solicitudes del sistema (en cualquier estado o tienda).<br>• Configurar las **Reglas de Envío entre Marcas**.<br>• Configurar la **Matriz de Aprobación** por marcas y bodegas. |

> ⚠️ **NOTA SOBRE PERMISOS DE APROBACIÓN Y AUDITORÍA:**
> 
> * **Regla General:** Las solicitudes deben ser aprobadas o rechazadas únicamente por los usuarios con el perfil de **Planificador** (que cuentan con el permiso `aprobar`).
> * **Perfil Administrador:** El Administrador puede consultar todas las solicitudes del sistema a nivel global. Si no tiene asignado el permiso de aprobación, únicamente podrá visualizar las solicitudes pendientes sin modificarlas.
> * **Recomendación:** Se sugiere **no otorgar el permiso de aprobación al perfil Administrador** para preservar la trazabilidad operativa del flujo. No obstante, si por alguna excepción un Administrador aprueba una solicitud, la acción se ejecutará correctamente y quedará registrada en los **logs de auditoría del sistema** para consulta posterior.

---

## 3. El ciclo de vida de una solicitud (concepto clave)

```text
                               ┌── (Enviar directo al crear) ──┐
                               │                               ▼
[ CREACIÓN ] ──► (Guardar) ──► BORRADOR ──(Enviar desde lista)─► PENDIENTE APROBACIÓN
                                                                      │
                                       ┌──────────────────────────────┴──────────────────────────────┐
                                       ▼                                                             ▼
                                   RECHAZADO                                              APROBADO (automático)
                           (Comentario obligatorio)                                                  │
                                                                                     [ Envío automático a SAP ]
                                                                                                     │
                                                                                                     ▼
                                                                                   PENDIENTE ENVÍO SAP / PROCESANDO
                                                                                   (Encolado a Middleware / Worker)
                                                                                                     │
                                                                            ┌────────────────────────┴────────────────────────┐
                                                                            ▼                                                 ▼
                                                                   ENVIADO A SAP                                       ERROR ENVÍO SAP
                                                                (DocNum en SAP B1)                                (Clic para ver detalle)
                                                                                                                      │
                                                                                                      [ Reintentar envío a SAP ]
                                                                                                      (Mismo día de 10:00 a 22:00)
```

### 3.1 Descripción Detallada de los Estados:

* **BORRADOR:** La tienda arma la solicitud definiendo la tienda origen (no editable, se toma por defecto la tienda asignada al usuario logueado), tienda destino y el detalle de productos. Aún no ha sido enviada a revisión (se puede editar).
* **PENDIENTE APROBACIÓN:** La solicitud ingresó a la Bandeja de Aprobación del planificador correspondiente, según su acceso de almacén (tienda propia, grupo de almacenes a su cargo, o todas si es administrador) (no se puede editar).
* **RECHAZADO:** El planificador rechazó la solicitud, ingresando siempre un **comentario obligatorio**. La solicitud queda cerrada definitivamente: no se puede editar ni reenviar.
* **APROBADO $\rightarrow$ envío automático:** El planificador aprueba la solicitud. Al aprobarla, **el sistema la envía automáticamente a la cola de SAP** (no requiere ninguna acción adicional del usuario de Tienda); de inmediato pasa a los estados transitorios de envío.
* **PENDIENTE ENVÍO SAP / PROCESANDO / CREANDO TRANSFERENCIA:** Estados transitorios del sistema:
  * **Pendiente Envío SAP:** La solicitud ingresó a la cola del *middleware*, a la espera de que el worker la tome.
  * **Procesando / Creando:** El servicio en segundo plano (*worker*) está ejecutando la creación del documento en SAP.  
  *(Son de muy corta duración y no requieren acción del usuario)*.
* **ENVIADO A SAP / TRANSFERENCIA CREADA:** La transferencia fue procesada con éxito y existe como un documento oficial (`StockTransfer`) en **SAP Business One**, con su DocEntry/DocNum asociado.
* **ERROR ENVÍO SAP:** El envío a SAP falló (por ejemplo, faltante de stock en SAP, errores de precios o productos no existentes en SAP). El badge de estado es clicable y abre una ventana con el detalle del error devuelto por SAP. Puede reintentarse el envío el mismo día en que ocurrió el error, de 10:00 a 22:00.

> El botón **"Reintentar envío a SAP"** solo es visible para quien tiene permiso de solicitar (tienda), y únicamente cuando el propio sistema habilita el reintento.

---

## 4. Prerrequisitos y Configuración Inicial (Exclusivo Administrador)

Para que los usuarios de tienda y planificadores puedan operar el módulo, se debe contar con las siguientes configuraciones previas. Sin ellas, la tienda no podrá seleccionar destino ni existirá quién apruebe sus solicitudes.

### 4.1 Configuración de Envíos (marca origen $\rightarrow$ marcas destino)

Define qué marcas de origen tienen permitido enviar mercadería a qué marcas destino. **Si una marca origen no tiene configuración, sus usuarios de tienda no podrán seleccionar ningún destino** (esta restricción no aplica al perfil Administrador, que siempre ve todos los destinos disponibles).

Se accede desde la tarjeta **Configuración de Envíos**:

* El listado muestra, por cada marca origen ya configurada, sus **Marcas Destino** habilitadas (como chips) y una columna de Acciones.
* Botón **"Nuevo"** $\rightarrow$ abre el modal "Nueva configuración":
  * **Marca Origen** — lista desplegable que solo ofrece marcas que **aún no tienen** ninguna configuración (evita duplicados desde el origen).
  * **Marcas Destino** — lista de casillas de verificación, una por cada marca del sistema; se deben marcar todas las que puedan recibir mercadería desde la marca origen seleccionada.
  * El botón **"Guardar"** permanece deshabilitado hasta elegir una marca origen y al menos un destino.
* Ícono de lápiz (**Editar**) por fila $\rightarrow$ permite agregar o quitar marcas destino de una configuración existente. Desmarcar un destino ya guardado lo desactiva (no lo elimina físicamente).
* No existe botón de eliminar independiente; la desactivación de un destino se hace desde Editar.

### 4.2 Matriz de Aprobación (reglas por marca y bodega destino)

Define, para cada combinación de marca origen $\rightarrow$ marca destino $\rightarrow$ bodega destino, si una solicitud de transferencia **requiere aprobación** antes de enviarse a SAP.

Se accede desde la tarjeta **Configuración Matriz de Aprobación**. El listado muestra: Marca Origen, Marca Destino, Bodega Destino (Tránsito), ¿Requiere Aprobación? (Sí/No), Rol Aprobador y Estado (Activo/Inactivo). Las reglas inactivas se muestran atenuadas.

**¿Cómo elige el sistema qué regla aplicar?**  
Cuando una solicitud pasa a aprobación, el sistema busca la regla más específica para esa marca origen/destino y bodega, en este orden:

1. **Regla puntual:** existe una regla para esa marca destino **y** esa bodega destino exacta $\rightarrow$ se usa esa.
2. **Regla por marca:** si no hay una puntual, se busca una regla para esa marca destino que aplique a "Todas las Bodegas" $\rightarrow$ se usa esa.
3. **Regla general:** si tampoco existe, se busca una regla configurada como "Todas las Marcas" y "Todas las Bodegas" desde esa marca origen $\rightarrow$ se usa esa.
4. Si no hay ninguna regla que coincida, el sistema **exige aprobación por defecto** (comportamiento más seguro).

En otras palabras: mientras más puntual sea una regla (marca + bodega exactas), más prioridad tiene sobre una regla general.

* Botón **"Nuevo"** $\rightarrow$ abre el modal "Nueva Regla":
  * **Marca Origen** — lista desplegable.
  * **Marca Destino** — lista desplegable; incluye la opción **"Todas las Marcas"**.
  * **Bodega Destino (Tránsito)** — lista desplegable; incluye la opción **"Todas las Bodegas"**. Se recomienda dejarla en "Todas las Bodegas" si eligió "Todas las Marcas" como destino, ya que en ese caso no aplica distinguir por bodega puntual.
  * Casilla **"¿Requiere aprobación?"** — marcada por defecto. Es el único valor de la regla que efectivamente cambia el comportamiento del sistema.
  * **Rol Aprobador (opcional)** — campo de texto libre (ej. "Planificación", "Gerencia Comercial"), **únicamente informativo**: sirve para dejar anotado, a modo de referencia, qué área suele encargarse de aprobar ese tipo de transferencia. **No restringe ni determina quién puede aprobar**: cualquier usuario con permiso de aprobación en el sistema puede aprobar o rechazar la solicitud, independientemente de lo que diga este campo.
  * El botón **"Guardar"** exige al menos Marca Origen y Marca Destino.
* Ícono de lápiz (**Editar**) $\rightarrow$ permite modificar la regla; en este modo aparece además la casilla **"Regla activa"**.
* Ícono de papelera (**Eliminar**, solo visible en reglas activas) $\rightarrow$ confirma con *"¿Eliminar esta regla?"* / *"La regla se desactivará y dejará de aplicarse a nuevas transferencias. ¿Deseas continuar?"*. Es una **desactivación lógica**, no un borrado físico: la regla puede reactivarse luego desde Editar.

> **Importante:** los cambios en ambas configuraciones aplican a las solicitudes que se **creen o envíen a partir de ese momento**; no afectan a las que ya están en trámite.

---

## 5. Guía de TIENDA

### 5.1 Crear una solicitud (`Crear Transferencia`)

Complete el formulario "Nueva Transferencia":

* **Almacén Origen** — fijo, no editable: se toma automáticamente de la tienda asignada a su usuario.
* **Almacén Destino (Tránsito o Transitoria)** — seleccione de la lista. Solo aparecen los destinos habilitados según la Configuración de Envíos de su marca (ver sección 4.1); si no ve ningún destino, repórtelo a Sistemas.
* **Responsable del Envío\*** — nombre de quien despacha la mercadería.
* **Guía Courier\*** — exactamente 10 caracteres alfanuméricos (ej. `AB12CD34EF`); se convierte automáticamente a mayúsculas y descarta cualquier carácter que no sea letra o número.
* **Observaciones** — campo opcional, máximo 100 caracteres.

### 5.2 Agregar productos al detalle

En el buscador de productos:

* Busque por **Código de Barras**, **Código de Producto** o **Nombre del Producto**. Con código de barras puede "pistolear": si hay una sola coincidencia, se agrega directo al presionar Enter.
* Ingrese la **Cantidad** con las flechas de más o escribiéndola directamente: solo acepta números enteros positivos, sin decimales ni signos, con un máximo de **99,999** unidades (si escribe más, se ajusta automáticamente a ese tope). Si deja el campo vacío o con un valor inválido, al salir del campo se restaura el último valor válido.
* Si agrega un producto que ya está en el detalle, el sistema **suma** la cantidad a la fila existente en vez de duplicarla.
* Para quitar un producto, use el ícono de basura en la columna Acciones.

> El buscador no muestra el stock disponible: la validación de stock la realiza el sistema al momento de enviar la solicitud (ver 5.5).

### 5.3 Cambiar el almacén origen después de agregar productos (Solo usuarios con permisos de ver todas las tiendas sin restricciones)

Si ya agregó productos y cambia el Almacén Origen, el sistema le advertirá:

> **"Cambiar tienda origen"**  
> *"Los productos agregados se eliminarán, ya que el stock disponible corresponde a la tienda anterior. ¿Desea continuar?"*

Si confirma con **"Cambiar"**, el detalle de productos se vacía por completo y debe volver a armarlo.

### 5.4 Guardar como borrador o enviar a aprobación

Botones disponibles:

* **Limpiar** — vacía el formulario (solo al crear).
* **Cancelar** — sale sin guardar.
* **Guardar Borrador** — guarda la solicitud sin enviarla, queda editable.
* **Enviar a Aprobación** — guarda y la envía de inmediato a la Bandeja de Aprobación del planificador.

Ambos botones de guardado validan lo mismo antes de continuar:
* Debe seleccionar el Almacén Destino.
* Debe ingresar el Responsable del Envío.
* La Guía Courier debe estar completa y con el formato correcto (En caso de no disponer guía, puede colocar ceros).
* Debe haber al menos un producto agregado.

Si falta algo, el sistema marca el campo como error.

> **Si "Enviar a Aprobación" tarda demasiado o no responde**, puede usar **"Guardar Borrador"** como alternativa: la solicitud queda guardada y editable, y luego puede enviarla desde la lista de Borradores cuando el sistema se normalice.

> **El sistema no guarda automáticamente.** Mientras arma la solicitud (cabecera y detalle de productos), toda la información vive solo en la pantalla. Si cierra la ventana, se apaga el equipo o sale de la pantalla sin haber presionado **Guardar Borrador** o **Enviar a Aprobación**, perderá todo el avance y deberá armar la solicitud nuevamente desde cero.

### 5.5 Mientras se procesa el envío

Al presionar Enviar a Aprobación, la pantalla se bloquea con un mensaje **"Validando stock con SAP… Esto puede tardar unos segundos. Por favor, no cierres esta ventana."** Esto evita que modifique la solicitud mientras el sistema termina de procesarla.

> **Si la respuesta tarda y tiene dudas de si ya se envió:** no cierre la ventana ni recargue la página. Puede volver a presionar el botón con confianza — el sistema reconoce que es el mismo intento y **no genera una solicitud duplicada**. Si aun así prefiere confirmar antes de reintentar, revise el Historial de Transferencias para ver si la solicitud ya aparece registrada.

---

## 6. Guía de PLANIFICADOR

### 6.1 Aprobar o rechazar (`Bandeja de Aprobación`)

Al ingresar verá únicamente las solicitudes en estado **Pendiente Aprobación** correspondientes a su grupo de almacenes asignado. La tabla muestra: ID, Tienda Origen, Tienda Destino (Tránsito), Fecha de Creación, Estado, Cantidad de Productos, Guía Courier, DocNum SAP y Observaciones.

> La tarjeta **Bandeja de Aprobación** del menú principal muestra un contador con el total de solicitudes pendientes.

Para revisar una solicitud, use el ícono de detalle. Se abre un panel con: Responsable, Fecha, Almacén Origen, Almacén Destino, Guía Courier, Observaciones y el detalle completo de productos (código, nombre, código de barras y cantidad solicitada).

> A diferencia de la vista de tienda, aquí **sí se muestra el stock disponible** si el sistema detecta que no alcanza — usted lo necesita para decidir si aprueba, ajusta o rechaza.

**Aprobar:**
1. Presione **"Aprobar"**.
2. Opcionalmente escriba una **Observación**.
3. Presione **"Confirmar aprobación"**.

Al aprobar, la solicitud pasa automáticamente a la cola de envío a SAP — no requiere ninguna acción adicional de su parte ni de la tienda.

**Rechazar:**
1. Presione **"Rechazar"**.
2. Escriba el **Motivo del rechazo** — es obligatorio; si lo deja vacío, el botón "Confirmar rechazo" permanece deshabilitado.
3. Presione **"Confirmar rechazo"**.

La solicitud rechazada queda cerrada de forma definitiva: la tienda no puede editarla ni reenvirarla; debe crear una solicitud nueva si el pedido sigue siendo válido.

> **Si el sistema detecta falta de stock al momento de aprobar** (por ejemplo, porque otra solicitud ya consumió el stock disponible), verá el detalle de los productos afectados con las columnas Producto, Solicitado y Disponible, y el mensaje: *"Reduce la cantidad de estos productos en la solicitud, o gestiona un ajuste de inventario mediante GLPI."* En ese caso no podrá aprobar hasta que exista el ajuste en stock.

### 6.2 Historial de transferencias

Una vez que aprueba o rechaza, la solicitud sale de la Bandeja y pasa a formar parte del **Historial de Transferencias** general, donde puede consultarla junto con las demás solicitudes ya resueltas de su grupo de almacenes.

---

## 7. Historial de Transferencias

Pantalla de consulta disponible para los tres roles, con distinto alcance según su perfil:

* **Tienda**: ve únicamente las solicitudes de su propio almacén, incluyendo las que aún están en **Borrador** o **Pendiente Aprobación**.
* **Planificador**: ve las solicitudes de su grupo de almacenes asignado, mostrando su historial de decisiones ya resueltas (Pendiente Aprobación no se ven aquí porque esos casos viven en la Bandeja de Aprobación).
* **Administrador**: ve todas las solicitudes de todos los almacenes, en todos los estados, sin restricción.

### 7.1 Filtros
* **Tienda Origen** — solo visible si su perfil tiene alcance sobre más de un almacén (planificador o administrador).
* **Tienda Destino (Tránsito)** — con opción "Todas".
* **Fecha Desde / Fecha Hasta** — sin rango por defecto.
* **Estado** — con opción "Todos".
* **DocNum SAP** — busca por el número de documento generado en SAP.

Use **Buscar** para aplicar los filtros o **Limpiar filtros** para reiniciarlos.

### 7.2 Columnas de la tabla
ID, Tienda Origen, Tienda Destino (Tránsito), Fecha Creación, Estado, Cantidad de Productos, Guía Courier, DocNum SAP, Observaciones y Acciones.

### 7.3 Acciones disponibles según el estado
* **Ver** (todos los estados) — abre el detalle completo de la solicitud.
* **Borrador** — además puede **Editar** la solicitud o **Enviar a aprobación** directamente desde aquí (Visible únicamente para tiendas con permiso de solicitar).
* **Pendiente Aprobación** — el ícono de Ver cambia a "Revisar y aprobar" si su perfil también puede aprobar.
* **Pendiente Envío SAP / Procesando** — sin acciones adicionales (estados transitorios).
* **Error Envío SAP** — el estado es clicable y abre el detalle del error devuelto por SAP. Si el sistema lo permite, aparece el botón **"Reintentar envío a SAP"**.

### 7.4 Descargar Excel
El botón **"Descargar Excel"** exporta en base a los filtros aplicados:
* **Resumen por solicitud** — una fila por transferencia (formato por defecto).
* **Detalle por unidad** — una fila por cada unidad de producto.

---

## 8. Preguntas frecuentes

* **"No aparece ningún almacén y me aparece deshabilitado"**  
  No se ha configurado la tienda a la que pertenece. Reporte a soporte para que le ayuden a verificar.

* **"No puedo seleccionar ningún almacén destino."**  
  Su marca de origen aún no tiene configurada una regla de envío hacia otras marcas. Reporte esto a un Administrador para que la registre en Configuración de Envíos.

* **"No puedo enviar la solicitud a aprobación."**  
  Revise el mensaje que marca el sistema: puede faltar el Almacén Destino, el Responsable del Envío, la Guía Courier (debe tener exactamente 10 caracteres alfanuméricos), o no haber agregado ningún producto al detalle.

* **"Cambié el almacén origen y se borraron los productos que ya había agregado."**  
  Es el comportamiento esperado: el stock que agregó corresponde a la tienda anterior, por lo que el sistema limpia el detalle al confirmar el cambio.

* **"Se cerró la ventana / se fue la luz mientras armaba la solicitud y perdí todo."**  
  El sistema no guarda automáticamente. Solo se guarda algo cuando presiona **Guardar Borrador** o **Enviar a Aprobación**.

* **"Presioné Enviar a Aprobación pero no responde, o tarda mucho."**  
  No cierre la ventana ni la recargue. Puede volver a presionar el botón con confianza o usar **Guardar Borrador** y enviarla luego desde la lista de Borradores.

* **"Me sale que no hay stock suficiente."**  
  El producto no tiene stock disponible en la cantidad solicitada. Reduzca la cantidad en la solicitud o gestione un ajuste de inventario mediante GLPI.

* **"El planificador no ve mi solicitud en su Bandeja de Aprobación."**  
  Verifique en Configuración Matriz de Aprobación que el almacén y la marca de destino tengan una regla activa con un aprobador definido.

* **"Aprobé la solicitud, ¿tengo que hacer algo más para que llegue a SAP?"**  
  No. Al aprobar, el envío a SAP se encola automáticamente.

* **"La solicitud quedó en 'Error Envío SAP'."**  
  Haga clic sobre el estado para ver el detalle del error devuelto por SAP. Si el problema fue corregido, use el botón **Reintentar envío a SAP** (disponible el mismo día de 10:00 a 22:00).

* **"¿Puedo recuperar una solicitud Rechazada?"**  
  No. El rechazo es definitivo: no se puede editar ni reenviar.

* **"¿Dónde veo todas las solicitudes de todas las tiendas?"**  
  Ese alcance completo solo lo tiene el perfil Administrador desde el Historial de Transferencias.

* **"No me aparece en el menú la opción de 'Transferencias de Stock'"**  
  No tiene el permiso asignado. Reporte a soporte para que le ayuden con los permisos necesarios.

---

## 9. NOTA IMPORTANTE: CONFIGURACIÓN DE PERMISOS EN PANEL DE ADMIN

> ⚠️ **REQUISITO OBLIGATORIO DE DATOS ADICIONALES:**  
> 
> * **Usuarios de tipo Tienda:** Deben tener obligatoriamente asignado el permiso de tipo **"tienda"** desde el *Panel de Admin $\rightarrow$ Datos Adicionales*.  
> * **Usuarios de tipo Planificador:** Deben tener obligatoriamente asignado el permiso de tipo **"Supervisor"** desde el *Panel de Admin $\rightarrow$ Datos Adicionales*, conjuntamente con el **Grupo de Almacenes** sobre el cual pueden aprobar o rechazar solicitudes.  
> 
> *Si no se realizan estas asignaciones previas en Datos Adicionales, el sistema generará errores por falta de permisos o mantendrá deshabilitados los selectores de almacén.*
