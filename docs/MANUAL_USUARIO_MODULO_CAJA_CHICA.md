# Manual de Usuario — Módulo de Caja Chica (SCNexus)

**Audiencia:** custodios de tienda, supervisores, contabilidad y administradores.
**Alcance:** creación y liquidación de gastos de caja chica, aprobación en dos niveles, integración a SAP y pantallas administrativas.
**Última actualización:** 31 de agosto de 2026.

---

## 1. ¿Qué hace este módulo?

Caja Chica gestiona el ciclo completo de una **liquidación de gastos menores**: la tienda (custodio) registra sus gastos con respaldos, un **supervisor** los revisa (nivel 1), **contabilidad** valida los montos finales (nivel 2) y, aprobada, la liquidación se **integra a SAP**.

Se entra desde el menú lateral: **Caja Chica** → pantalla con tarjetas de acceso según sus permisos:

| Tarjeta | Quién la usa | Para qué |
|---|---|---|
| **Crear liquidación** | Custodio | Registrar una nueva liquidación |
| **Liquidaciones pendientes** | Custodio | Ver sus solicitudes en revisión |
| **Liquidaciones aprobadas** | Custodio | Historial de sus aprobadas |
| **Aprobaciones pendientes** | Supervisor | Aprobar/negar gastos (nivel 1) |
| **Historial supervisor** | Supervisor | Sus decisiones realizadas |
| **Aprobaciones contabilidad** | Contabilidad | Validar montos finales (nivel 2) |
| **Historial contabilidad** | Contabilidad | Historial completo + **Integrar a SAP** |
| **Listado general** | Administración | Estado de TODAS las liquidaciones (incluye rechazadas y eliminadas) |
| **Configuración de aprobadores** | Administración | Aprobadores por grupo de almacenes |
| **Reasignar aprobador** | Administración | Cambiar el aprobador asignado a una liquidación pendiente |
| **Tipos de IVA** | Administración | Catálogo de IVA |

Todas las pantallas tienen el botón **← Volver**.

---

## 2. El ciclo de vida de una liquidación (concepto clave)

```
BORRADOR ──Enviar──► SUPERVISION ──todos los supervisores aprueban──► CONTABILIDAD ──uno de contabilidad aprueba──► APROBADO ──Integrar──► (INTEGRADA en SAP)
    ▲                     │                                                │
    └──── Devolver para corrección (badge "Devuelta") ◄────────────────────┘
                          │                                                │
                          └────────── Rechazar definitivamente ──► RECHAZADA (no editable, no reenviable)
```

- **BORRADOR** — el custodio la arma: cabecera + detalles de gasto + adjuntos. Editable y eliminable.
- **SUPERVISION (nivel 1)** — regla: **todos los supervisores del grupo deben aprobar** cada gasto.
- **CONTABILIDAD (nivel 2)** — regla: **basta que uno de contabilidad apruebe**. Contabilidad puede ajustar el monto final.
- **APROBADO** — lista para integrar a SAP desde Historial contabilidad. Integrar **no cambia el estado** de la liquidación; cambia su **estado de integración**: `PENDIENTE → ENCOLADO/PROCESANDO → INTEGRADO` (o `ERROR`, reintentar).
- **Negación** (supervisor o contabilidad), siempre con **comentario obligatorio**, dos caminos:
  - **Devolver para corrección** → vuelve a BORRADOR con el badge **"Devuelta"**; el custodio corrige y reenvía.
  - **Rechazar definitivamente** → queda **RECHAZADA**: no se puede editar ni reenviar.

---

## 3. Guía del CUSTODIO (tienda)

### 3.1 Crear una liquidación (`Liquidaciones`)

1. Abra **Crear liquidación** → panel **"Nueva liquidación"** (botón **Mostrar**).
2. Complete:
   - **Almacén asignado*** — sus tiendas asignadas.
   - **Cédula custodio*** — al salir del campo se valida contra proveedores SAP y se autocompletan **Nombre custodio** y **CardCode custodio (SAP)**. Si no existe: *"No se encontro custodio en proveedores SAP."* (contacte a sistemas/contabilidad para crearlo en SAP).
   - **Monto inicial recibido*** — el dinero entregado.
   - **Forma de pago*** — Transferencia o Cheque.
   - Empresa y Marca se completan solas (no editables).
3. **Crear liquidación** → aparece en **"Borradores"**.

### 3.2 Registrar los gastos (Detalles)

Desde Borradores → **Detalles** → pantalla **"Detalle de Liquidación #N"**:

1. Panel **"Agregar detalle"**: elija el **Gasto** del catálogo, **Fecha Consumo**, **RUC** (13 dígitos), **Proveedor**, **N° Comprobante**, **Tipo Documento** (Factura / Nota de Venta / Recibo), **Concepto**, **Tipo de IVA** y los **subtotales** (base gravada y base 0%). El **IVA** y el **Total** se calculan solos.
2. **Agregar detalle**.
3. En la tabla, columna **Adjuntos** → botón **"Adjuntar"** para subir el respaldo (foto/PDF de la factura). **Cada gasto necesita al menos un adjunto.**

> ⚠️ **Comprobante duplicado:** si el RUC + número de comprobante ya se usó antes, verá *"Ya se ingreso anteriormente este numero de comprobante. Revise y corrija o comuniquese con contabilidad."* (los de liquidaciones rechazadas no bloquean).

### 3.3 Enviar a aprobación

En Borradores → **Enviar** → confirmar en el modal (**"Confirmar envío"**). El sistema valida:

- Al menos un detalle registrado.
- El total de gastos debe ser **al menos el 50% del monto inicial**.
- **Cada detalle con al menos un adjunto.**
- Que el almacén tenga grupo y aprobadores configurados (si falla con *"El almacen no tiene un grupo asignado"* o *"El grupo no tiene supervisores/aprobadores de contabilidad configurados"* → reporte a sistemas).

Enviada, pasa a **SUPERVISION** y desaparece de Borradores.

### 3.4 Seguimiento

- **Liquidaciones pendientes** — sus liquidaciones en Supervisión o Contabilidad. Columna **Nivel** indica dónde está. Botones **Detalles** (solo lectura), **Reporte** (PDF) y **Descargar Excel**.
- **Liquidaciones aprobadas** — sus aprobadas, con filtros **Desde/Hasta** (últimos 3 días por defecto), montos aprobados por contabilidad, **Ver** el detalle y **PDF**.
- **Si se la devolvieron:** vuelve a Borradores con el badge **"Devuelta para corrección"** y el botón **"Ver motivo"** (comentario del aprobador). Corrija y reenvíe.
- **Si fue rechazada definitivamente:** aparece en el bloque **"Rechazadas"**, solo consulta (**Detalles** y **Ver motivo**), ya no se puede tocar.

---

## 4. Guía del SUPERVISOR (nivel 1)

### 4.1 Aprobar o negar (`Aprobaciones pendientes`)

- Verá los gastos **asignados a usted** agrupados por **"Liquidacion #N"** (tienda, custodio, total).
- Botón **"Columnas"** para elegir/ordenar qué columnas ver.
- En cada gasto → **"Ver detalle"** abre el panel lateral con toda la información, los **Adjuntos** (previsualización con zoom, **Descargar**) y el bloque **Aprobación**:
  - **Monto aprobado** (puede ajustarlo), **Comentario** y botones **"Aprobar"** / **"Negar"**.
  - Al negar: elija **"Devolver para corrección"** (el custodio corrige) o **"Rechazar definitivamente"** (queda cerrada) y confirme. El **comentario es obligatorio** para negar.

> La liquidación avanza a Contabilidad solo cuando **todos** los supervisores del grupo aprobaron **todos** los gastos.

### 4.2 Su historial (`Historial supervisor`)

Sus decisiones (APROBADO/RECHAZADO) con filtros **Fecha desde/hasta**, detalle por gasto, **PDF** por liquidación y resumen al pie (Total registros, Aprobados, Rechazados, Monto total aprobado). Cada supervisor ve **solo su propio** historial.

---

## 5. Guía de CONTABILIDAD (nivel 2)

### 5.1 Validar montos (`Aprobaciones contabilidad`)

- Gastos pendientes asignados a usted, agrupados por liquidación, con las columnas clave **"Antes integrar"** (lo solicitado) y **"Después integrar"** (el monto final que usted define) y la columna **Novedad** (Sí = un supervisor cambió monto o dejó observación).
- **"Ver detalle"** → panel con la información, lo que decidió cada **Supervisor**, los **Adjuntos** y el bloque **Aprobación contabilidad**:
  - **Después de integrar (monto final)** — editable. Si aprueba menos, el sistema descuenta automáticamente **primero de la base 0% y luego de la base 15%** (los campos de bases antes/después se muestran solo lectura).
  - **Aprobar** / **Negar** (mismas dos variantes de negación, comentario obligatorio).
- Basta que **uno** de contabilidad apruebe todos los gastos para que la liquidación pase a **APROBADO**.

### 5.2 Historial e integración a SAP (`Historial contabilidad`)

Pantalla de consulta e **integración**. Visible para **cualquier usuario con acceso a esta pantalla** (no solo el aprobador asignado).

- **Pestañas:** **Aprobadas** (pendientes de integrar por defecto), **Rechazadas** (definitivas), **Devueltas** (para corrección), **Cerradas (integradas)**.
- **Filtros:** Desde/Hasta (últimos 3 días por defecto), y en Aprobadas el selector **Integracion**: *Solo pendientes* / *Todos*. **Descargar Excel** exporta el listado.
- Cada liquidación muestra **"Integracion: {estado}"** y **"Ref: {DocNum}"** cuando ya existe documento SAP.

**Cómo integrar:**
1. En la pestaña **Aprobadas**, presione **"Integrar"** en la liquidación.
2. El sistema descarga un **respaldo JSON** a su equipo y muestra un resumen de montos (total aprobado, bases, IVA, total SAP) — si el total SAP difiere del aprobado verá una **ADVERTENCIA**. Confirme con **"Esta seguro de integrar y enviar?"**.
3. Resultado:
   - **INTEGRADO** — verá *"Liquidacion creada. DocEntry: X, DocNum: Y."* El DocNum es el documento en SAP.
   - **ENCOLADO / PROCESANDO** — SAP la recibió como trabajo en cola; use el botón **"Actualizar estado"** unos segundos después.
   - **ERROR** — *"El job de SAP fallo."* / *"Error en la integracion. Reintenta."* — puede reintentar con **Integrar**.
4. Las integradas quedan en la pestaña **Cerradas (integradas)**.

El botón **PDF** por liquidación genera el reporte completo (cabecera, detalle de gastos, aprobaciones y estado de integración).

---

## 6. Guía de ADMINISTRACIÓN

### 6.1 Listado General de Liquidaciones (`Listado general`)

Visión completa de **todas** las liquidaciones — incluidas **RECHAZADAS** y **ELIMINADAS** — para saber en qué estado está cada una.

- **Filtros:** **Desde/Hasta** (por defecto **últimos 15 días**), buscador por **#, almacén o custodio**, selector de **Estado**, selector de **Integración** (*Integradas* / *Sin integrar*) y checkbox **"Incluir eliminadas"**.
- **Columnas** (ordenables con clic): #, Almacén, Custodio, Valor, Creada, **Estado** (badge por color), **Supervisor** y **Contador** asignados con su avance (ej. *"3 pend."*), **Integración** (PENDIENTE / INTEGRADO · Doc N).
- Badge ámbar **"Devuelta"** = fue devuelta al menos una vez (histórico).
- Filas rojas **ELIMINADA** = liquidaciones borradas, con quién y cuándo las eliminó.
- Flecha **▸** al inicio de la fila = **historial de estados** (quién la devolvió/rechazó, cuándo y con qué observación).
- **"Descargar Excel"** exporta exactamente lo visible (filtros y orden incluidos).

> El alcance respeta sus accesos a almacenes: tipo **Administrador** ve todo; **Supervisor/Tienda** solo sus almacenes.

### 6.2 Aprobadores por Tienda (`Configuración de aprobadores`)

Define **quién aprueba** para cada **grupo de almacenes** (los grupos se crean en el módulo de Usuarios → Grupos de almacenes):

1. Elija el **Grupo de almacenes** → **Buscar**.
2. Tarjeta **"Supervisores (todos aprueban)"** — agregue por nombre, usuario o email (nivel 1).
3. Tarjeta **"Contabilidad (aprueba al menos uno)"** — agregue los usuarios de contabilidad (nivel 2).
4. **Guardar configuracion** (requiere al menos 1 supervisor y 1 de contabilidad).

> Aplica a las liquidaciones que se **envíen a partir de ese momento**; no cambia las que ya están en trámite (para eso: Reasignar).

### 6.3 Reasignar Aprobador (`Reasignar aprobador`)

Para liquidaciones **ya en trámite** cuyo aprobador está ausente:

1. Pestaña **"Supervisores"** (nivel 1) o **"Contadores"** (nivel 2).
2. Ubique la liquidación (**"Asignado a:"** muestra el actual).
3. En **"Cambiar a"** busque al nuevo usuario y selecciónelo. Verá *"Liquidación #N reasignada de X a Y."*

> Solo reasigna aprobaciones **pendientes**. Una liquidación ya aprobada no necesita reasignación para integrarse: el Historial contabilidad es visible para todos los que tengan acceso.

### 6.4 Tipos de IVA (`Tipos de IVA`)

Catálogo usado en los detalles de gasto:

- **Código** (ej. `IVA_12`), **Descripción**, **Porcentaje** (0–1, ej. `0.15`) o checkbox **"Es manual (sin porcentaje fijo)"** (el usuario digitará el IVA), y **TaxCode SAP** (el impuesto que se enviará a SAP al integrar).
- **Editar** y **Desactivar** (baja lógica; los inactivos dejan de aparecer al crear detalles).

---

## 7. Preguntas frecuentes

**"No puedo enviar la liquidación."**
Revise el mensaje: falta un detalle, el total no llega al **50% del monto inicial**, algún gasto está **sin adjunto**, o el almacén/grupo no tiene aprobadores configurados (esto último se reporta a sistemas).

**"Me sale comprobante duplicado."**
Ese RUC + número de comprobante ya se registró en otra liquidación. Verifique el número; si es un error histórico, comuníquese con contabilidad.

**"El supervisor no ve la liquidación."**
Verifique en **Reasignar Aprobador** a quién está asignada, y en **Aprobadores por Tienda** que el grupo del almacén tenga a esa persona como supervisor.

**"Aprobé como contabilidad pero ¿por qué mi compañero ya no la ve pendiente?"**
En nivel 2 basta que **uno** apruebe: las aprobaciones de los demás se cierran automáticamente.

**"¿Dónde integro a SAP?"**
**Historial contabilidad** → pestaña **Aprobadas** → botón **Integrar**. Si queda ENCOLADO, use **Actualizar estado**.

**"¿Qué significa el badge 'Devuelta'?"**
Que la liquidación fue devuelta para corrección **al menos una vez** en su historia. Es informativo; no afecta el flujo.

**"¿Puedo recuperar una liquidación RECHAZADA?"**
No. El rechazo definitivo la cierra. Si el gasto es válido, debe crearse una liquidación nueva (los comprobantes de una rechazada no bloquean el duplicado).

**"¿Quién eliminó una liquidación?"**
**Listado general** → active **"Incluir eliminadas"**: la fila muestra quién y cuándo la eliminó.
