# Manual de Usuario — Gestión ODC SAP

**Módulo MBA3 Consultas — SCNexus**

---

## 1. Introducción

Este manual describe el uso del módulo **Gestión ODC SAP** dentro de SCNexus. Este módulo permite gestionar pedidos, cargar plantillas Excel, distribuir cantidades por tienda, generar órdenes de compra y enviarlas a SAP.

### 1.1 Tipos de usuario

Hay dos perfiles principales según los permisos asignados:

| Perfil | Permiso | Descripción |
|--------|---------|-------------|
| **EL RAYO** | `odcsap.view` | Gestionar pedidos, ver listados, revisar redistribución (solo lectura) y generar ODC |
| **MABEL TRADING** | `mabel.view` | Flujo completo: cargar plantillas, redistribuir, procesamiento SAP, homologaciones, órdenes de compra, etc. |

Algunos usuarios pueden tener ambos permisos y ver todas las opciones.

---

## 2. Acceso al módulo

1. Inicie sesión en SCNexus con su usuario y contraseña.
2. En el menú lateral (sidebar), pulse **Gestión ODC SAP**.
3. Se mostrará el **Dashboard** del módulo.

---

## 3. Dashboard de Gestión ODC SAP

El dashboard es la pantalla principal con botones de acceso rápido a cada funcionalidad. Los botones que ve dependen de su permiso.

### 3.1 Botones principales (visibles según permiso)

#### Para EL RAYO (`odcsap.view`)

| Botón | Descripción |
|-------|-------------|
| **Listado de Pedidos** | Ver todos los pedidos con filtros |
| **Revisar Redistribución** | Ver la distribución por tienda (solo lectura) |
| **ODC a SAP** | Generar órdenes de compra y enviar a SAP |

#### Para MABEL TRADING (`mabel.view`)

| Botón | Descripción |
|-------|-------------|
| **Cargar Plantilla** | Gestionar y cargar plantillas Excel |
| **Redistribución** | Distribuir cantidades por tienda |
| **ODC a SAP** | Procesos de integración |
| **Procesamiento SAP** | Ver pedidos confirmados y generar ODC (por número de pedido) |
| **Homologaciones** | Administrar SKUs no coincidentes MBA3-SAP |

#### Compartidos (ambos perfiles)

| Botón | Descripción |
|-------|-------------|
| **ODC a SAP** | Generar ODC y enviar a SAP |

### 3.2 Sección "Información Pedidos y ODC"

Al hacer clic en **"Información Pedidos y ODC"** se expande un grupo de opciones:

| Opción | Permiso | Descripción |
|--------|---------|-------------|
| **Órdenes de Compra** | MABEL TRADING | Historial completo de órdenes |
| **ODC con Errores** | MABEL TRADING | Corregir SKUs de órdenes con error |
| **Reporte de Diferencias** | MABEL TRADING | Ver diferencias pedido vs confirmado |
| **Listado Pedidos Originales** | MABEL / EL RAYO | Archivos Excel originales en storage |
| **Procesamiento SAP** | MABEL TRADING | Buscar pedido por número para ver su procesamiento SAP |
| **Homologaciones** | MABEL / EL RAYO | SKUs no homologados entre MBA3 y SAP |

---

## 4. Gestionar Pedido (EL RAYO)

**Ruta:** Dashboard → **Gestionar Pedido**

### 4.1 Descripción

Permite buscar un pedido por número, ver su detalle, editar cantidades, costos y fechas, y confirmar la respuesta del proveedor.

### 4.2 Pasos

1. Escriba el número de pedido en el campo de búsqueda (ej: `P-12.48 - 12 - 2025`).
2. Presione **Enter** o haga clic en el botón de buscar.
3. Verá la cabecera del pedido (proveedor, fechas, estado) y la tabla de productos.
4. Puede:
   - **Editar cantidades y costos** en los campos editables.
   - **Modificar fechas** de pedido y entrega.
   - **Confirmar** (cuando aplique) para crear la respuesta del proveedor.
   - **Volver** al listado de pedidos.

### 4.3 Redistribución en detalle (EL RAYO)

En el detalle del pedido puede ver la **Redistribución por tienda** en modo **solo lectura**. No puede modificar las cantidades; solo revisar lo que MABEL TRADING ha configurado.

---

## 5. Listado de Pedidos (EL RAYO)

**Ruta:** Dashboard → **Listado de Pedidos**

### 5.1 Descripción

Muestra todos los pedidos con filtros por estado, fechas, proveedor y número de pedido.

### 5.2 Uso de filtros

1. Haga clic en **Filtros de Búsqueda** para expandir.
2. Opciones:
   - **Solo pedidos que requieren acción**: muestra pedidos pendientes de confirmación.
   - **Estado**: filtro por estado del pedido.
   - **Fecha Desde / Fecha Hasta**: rango de fechas.
   - **Proveedor**: nombre de proveedor.
   - **Número de Pedido**: búsqueda directa.
3. Use **Actualizar** para refrescar los resultados.
4. Opción **Auto-actualizar**: recarga periódicamente la lista.

### 5.3 Acciones en la tabla

- **Ver detalle**: clic en el número de pedido o en la fila para abrir el detalle completo.

### 5.4 Estados del pedido (referencia)

| Estado | Significado |
|--------|-------------|
| Borrador | Pedido en edición |
| Gestionar Pedido | Disponible para EL RAYO |
| Pendiente Confirmación | Pendiente de confirmación del proveedor |
| Respuesta Cargada | Respuesta del proveedor cargada |
| Confirmado por Proveedor | Confirmado por proveedor |
| Redistribución | En redistribución por tienda |
| Confirmado redistribución | Redistribución confirmada |
| Pedido Confirmado | Pedido confirmado |
| Procesado SAP | Procesado en SAP |
| Confirmado y Enviado | Confirmado y enviado |
| Despachar y Facturar | Listo para despacho |
| Finalizado | Proceso terminado |
| Cancelado | Pedido cancelado |

---

## 6. Revisar Redistribución (EL RAYO)

**Ruta:** Dashboard → **Revisar Redistribución**

### 6.1 Descripción

Lista pedidos con redistribución confirmada para revisar la distribución por tienda en **modo solo lectura**. No se pueden editar cantidades.

### 6.2 Pasos

1. Use los filtros (fechas, proveedor, número de pedido) para localizar el pedido.
2. Haga clic en el pedido para ver su **redistribución por tienda**.
3. Verá las cantidades asignadas a cada tienda sin posibilidad de modificación.

---

## 7. Cargar Plantilla (MABEL TRADING)

**Ruta:** Dashboard → **Cargar Plantilla**

### 7.1 Descripción

Permite seleccionar un pedido para cargar una plantilla Excel, editarla o continuar el flujo. Incluye pedidos en estado Borrador y con plantilla ya cargada.

### 7.2 Pasos para cargar una plantilla

1. En el listado, localice el pedido o use los filtros.
2. Haga clic en el pedido para abrir su detalle.
3. Arrastre el archivo Excel al área de carga o selecciónelo con **"Seleccionar archivo"**.
4. Espere a que termine el proceso (subida, validación, guardado).
5. Una vez cargado, podrá editar cantidades y continuar hacia Redistribución.

### 7.3 Listado de pedidos en Cargar Plantilla

- Filtros por **Estado**, **Fecha**, **Proveedor**, **Número de pedido**.
- Indicador de **pedidos pendientes de acción**.
- Opción **Auto-actualizar** para refrescar automáticamente.

---

## 8. Redistribución (MABEL TRADING)

**Ruta:** Dashboard → **Redistribución**

### 8.1 Descripción

Distribuir las cantidades de productos por tienda a partir de la respuesta del proveedor. El pedido debe estar en estado **RESPUESTA_PROVEEDOR_CARGADA** (Respuesta Cargada).

### 8.2 Pasos

1. Al entrar, el sistema puede redirigir automáticamente al **último pedido** listo para redistribuir.
2. Si no hay uno, use el buscador o la **lista de pedidos confirmados** para elegir un pedido.
3. En la pantalla de redistribución verá:
   - Cabecera del pedido.
   - Tabla con productos y columnas por tienda.
4. Puede:
   - **Editar cantidades** por tienda manualmente.
   - **Distribuir proporcionalmente**: repartir automáticamente según la plantilla original.
   - **Copiar distribución original**: usar las cantidades originales.
   - **Resetear distribución**: volver al estado inicial.
5. Haga clic en **Confirmar Redistribución** para guardar los cambios.
6. Tras confirmar, el pedido pasa a estado **PEDIDO_CONFIRMADO** y podrá seguir el flujo de Procesamiento SAP.

### 8.3 Filtros en Redistribución

- **Solo pedidos que requieren acción**
- Estado, fechas, proveedor, número de pedido

---

## 9. ODC a SAP (ambos perfiles)

**Ruta:** Dashboard → **ODC a SAP**

### 9.1 Descripción

Pantalla con varias pestañas para gestionar pedidos confirmados, despachos y envío a SAP. Aquí se genera la orden de compra (ODC) y se envía a SAP.

### 9.2 Pestañas principales

#### Pedidos Confirmados

- Lista de pedidos con redistribución confirmada y listos para generar ODC.
- Botón **Generar ODC** por pedido.
- Botón **Actualizar** para recargar la lista.

#### Despachos / Procesos de integración

- Gestión de despachos y envío a SAP.
- Selección de despachos pendientes.
- Ejecución del proceso de integración para enviar a SAP.

### 9.3 Flujo típico

1. Ir a **Pedidos Confirmados**.
2. Localizar el pedido deseado.
3. Hacer clic en **Generar ODC**.
4. Esperar a que se genere la orden de compra.
5. En la pestaña de **Procesos**, enviar la ODC a SAP si corresponde.

---

## 10. Procesamiento SAP (MABEL TRADING)

**Ruta:** Dashboard → Información Pedidos y ODC → **Procesamiento SAP**

### 10.1 Descripción

Se abre un modal para buscar un pedido por número y ver su procesamiento SAP (productos homologados, errores, etc.).

### 10.2 Pasos

1. Haga clic en **Procesamiento SAP** en el dashboard.
2. Ingrese el **número de pedido** (ej: `P-12.48 - 12 - 2025`).
3. Presione **Enter** o **Buscar**.
4. Se mostrará la pantalla con:
   - Cabecera del pedido.
   - Tabla de productos procesados con estado (homologados, no homologados, con error).
   - Botón **Generar ODC** si aplica.

### 10.3 Filtros en la tabla

- **Todos**, **Homologados**, **No Homologados**, **Con Errores**.
- Selector de **Columnas** para mostrar u ocultar columnas.

---

## 11. Homologaciones (MABEL TRADING / EL RAYO)

**Ruta:** Dashboard → **Homologaciones** o Información Pedidos y ODC → **Homologaciones**

### 11.1 Descripción

Administra las homologaciones de SKU que no coinciden entre MBA3 y SAP. Permite vincular un SKU MBA3 con un SKU SAP.

### 11.2 Pasos

1. Use **Buscar SKU** para localizar un SKU específico.
2. Use los filtros: **Estado** (Pendiente, Homologado, Error), **Tiene Diferencias**, **Tiene Datos SAP**.
3. En la tabla verá:
   - SKU MBA3.
   - SKU SAP (si existe).
   - Estado.
   - Acciones para homologar o editar.
4. Use **Sincronizar** para actualizar las homologaciones desde el backend.

---

## 12. Órdenes de Compra (MABEL TRADING)

**Ruta:** Dashboard → Información Pedidos y ODC → **Órdenes de Compra**

### 12.1 Descripción

Historial completo de órdenes de compra generadas: pendientes, enviadas y con error.

### 12.2 Uso

- Filtro por estado: **Todos**, **Pendientes**, **Enviadas**, **Con Error**.
- **Exportar CSV** para descargar los datos.
- **Actualizar** para refrescar.
- Paginación para navegar por las páginas.

---

## 13. ODC con Errores (MABEL TRADING)

**Ruta:** Dashboard → Información Pedidos y ODC → **ODC con Errores**

### 13.1 Descripción

Lista de órdenes de compra que no se pudieron enviar a SAP, generalmente por SKUs no homologados o errores de SAP.

### 13.2 Pasos para corregir

1. Revise la tabla: OC ID, Proveedor, Fecha, Mensaje de error, Código de error.
2. Resuelva el problema en **Homologaciones** si el error es de SKU.
3. Vuelva a intentar el envío desde **ODC a SAP** o **Procesos de integración**.

---

## 14. Reporte de Diferencias (MABEL TRADING)

**Ruta:** Dashboard → Información Pedidos y ODC → **Reporte de Diferencias**

### 14.1 Descripción

Muestra las diferencias entre lo solicitado en el pedido y lo confirmado por el proveedor.

### 14.2 Pasos

1. Ingrese el **número de pedido**.
2. Presione **Enter** o haga clic en **Buscar**.
3. Verá el reporte con:
   - Diferencias por producto.
   - Cantidades solicitadas vs confirmadas.
4. Use **Exportar** (si está disponible) para descargar.

---

## 15. Listado Pedidos Originales (MABEL / EL RAYO)

**Ruta:** Dashboard → Información Pedidos y ODC → **Listado Pedidos Originales**

### 15.1 Descripción

Muestra los archivos Excel originales cargados en el sistema (storage).

### 15.2 Acciones

- Ver la lista de archivos.
- Descargar.
- Eliminar (según permisos).

---

## 16. Detalle del Pedido — Acciones comunes

En el detalle de un pedido (accesible desde Listado, Gestionar Pedido, Redistribución, etc.) encontrará:

### 16.1 Botones frecuentes

| Botón | Cuándo aparece | Acción |
|-------|----------------|--------|
| **Confirmar** | EL RAYO, pedido en estado apropiado | Crear respuesta del proveedor |
| **Generar ODC** | Pedido con redistribución confirmada | Generar orden de compra |
| **Confirmar Redistribución** | MABEL, pedido con redistribución editable | Guardar redistribución |
| **Despachar y Facturar** | Pedido en CONFIRMADO_ENVIADO | Marcar para despacho |
| **Finalizar** | Pedido en Despachar y Facturar | Marcar como finalizado |
| **Descargar Plano MBA** | Según permisos | Descargar archivo de exportación |
| **Descargar Pedido** | Según permisos | Descargar datos del pedido |
| **Descargar CSV** | Según permisos | Exportar a CSV |

### 16.2 Información mostrada

- **Cabecera**: número de pedido, proveedor, fechas, estado.
- **Productos**: SKU, descripción, cantidades, costos.
- **Redistribución por tienda**: cantidades por tienda (editable para MABEL, solo lectura para EL RAYO).

---

## 17. Consejos y buenas prácticas

1. **Auto-actualizar**: Active esta opción en listados largos para mantener la información actualizada.
2. **Filtros**: Use "Solo pedidos que requieren acción" para centrarse en lo pendiente.
3. **Número de pedido**: El formato típico es `P-12.48 - 12 - 2025`; respete espacios y guiones al buscar.
4. **Homologaciones**: Revise periódicamente ODC con Errores y Homologaciones para evitar bloqueos en el envío a SAP.
5. **Redistribución**: Confirme la redistribución solo cuando las cantidades por tienda estén correctas.

---

## 18. Resolución de problemas

| Problema | Posible solución |
|----------|------------------|
| No veo el botón X | Verifique que su usuario tiene el permiso adecuado (EL RAYO o MABEL TRADING). |
| Error al cargar plantilla | Verifique formato Excel esperado y que el archivo no esté corrupto. |
| ODC con error de SKU | Vaya a Homologaciones y complete la homologación del SKU. |
| Pedido no aparece en listado | Revise filtros (estado, fechas). Pruebe con "Solo pedidos que requieren acción" desmarcado. |
| Botón Confirmar deshabilitado | El pedido puede estar ya confirmado; revise el estado. |

---

## 19. Glosario

| Término | Definición |
|---------|------------|
| **ODC** | Orden de Compra |
| **SAP** | Sistema ERP corporativo |
| **MBA3** | Sistema de gestión de pedidos |
| **SKU** | Código único de producto |
| **Homologación** | Correspondencia entre un SKU MBA3 y un SKU SAP |
| **Redistribución** | Asignación de cantidades por tienda |

---

*Documento generado para el módulo MBA3-consultas de SCNexus. Consulte con el administrador del sistema ante dudas sobre permisos o configuración.*
