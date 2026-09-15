# Manual de Usuario — Módulo de Usuarios (SCNexus)

**Audiencia:** administradores del sistema y personal de soporte.
**Alcance:** gestión de usuarios, roles, permisos, accesos a almacenes, grupos de almacenes y personal de tiendas.
**Última actualización:** 31 de agosto de 2026.

---

## 1. ¿Qué hace este módulo?

El módulo de Usuarios controla **quién puede entrar a SCNexus y qué puede ver y hacer** cada persona. Se compone de cinco pantallas de administración más el catálogo de Personal de Tiendas:

| Pantalla | Para qué sirve |
|---|---|
| **Usuarios** | Traer usuarios desde Active Directory y asignarles roles |
| **Permisos** | Definir las llaves de acceso del sistema (`modulo.accion`) |
| **Roles** | Agrupar permisos en perfiles (ej. "Contabilidad", "Supervisor") |
| **Datos adicionales** | Dar acceso a almacenes por usuario (Tienda / Supervisor) |
| **Grupos de almacenes** | Crear los grupos de almacenes que usan los Supervisores |
| **Personal de Tiendas** | Catálogo de empleados de tienda (no son cuentas de acceso) |

### Cómo se llega

- En el menú lateral: **Panel de Admin** → abre la pantalla **"Gestión de Usuarios"** con 5 tarjetas de acceso rápido: **Usuarios**, **Permisos**, **Roles**, **Datos adicionales** y **Grupos de almacenes**. (Visible solo para administradores.)
- En el menú lateral: **Personal de Tiendas** (visible con el permiso correspondiente).
- Todas las pantallas tienen un botón **"Volver"** que regresa al Panel de Administración.

> ⚠️ **Regla de oro del módulo:** cualquier cambio de roles, permisos o accesos a almacenes **NO surte efecto hasta que el usuario afectado cierre sesión y vuelva a entrar**. Los accesos viajan dentro de la sesión que se crea al iniciar sesión; recargar la página no es suficiente.

---

## 2. Usuarios (`/usuarios/users`)

Pantalla para **traer usuarios desde Active Directory (AD)** y **asignarles roles**.

> En SCNexus **no se crean usuarios a mano**: las cuentas vienen del Active Directory de la empresa. Tampoco se editan datos personales, contraseñas ni se eliminan cuentas desde esta pantalla.

### 2.1 Importar usuarios de AD

Abra el panel **"IMPORTAR USUARIOS DE AD"** (clic en el encabezado):

- **Sincronizar AD** — trae/actualiza todos los usuarios del directorio. Al terminar verá: *"Sincronización completada. Los usuarios de AD han sido sincronizados."*
- **Importar un usuario específico** — escriba en **"Buscar por usuario, email o nombre"** y presione **Importar** (o Enter). Al terminar, el usuario aparece en la lista.

### 2.2 Buscar usuarios

- Búsqueda por **usuario, nombre o email** (la lista se filtra sola mientras escribe).
- Tamaño de página: 5 / 10 / 20 / 50. Navegación con **Anterior / Siguiente**.

### 2.3 Asignar o quitar roles

1. Ubique al usuario y presione **"Ver roles"**.
2. En el modal **"Roles del usuario"**:
   - Para asignar: escriba el **nombre exacto del rol** en "Nombre del rol" y presione **Asignar**. Verá *"Rol asignado correctamente."*
   - Para quitar: presione **"Quitar"** junto al rol. **Se aplica de inmediato, sin confirmación.**
3. Recuerde: el usuario debe **cerrar sesión y volver a entrar** para que el cambio aplique.

> Si ve *"No tienes permisos para ver/asignar/quitar roles de usuarios. Se requiere el rol \"Admin\"."*, su propia cuenta no es administradora.

---

## 3. Permisos (`/permisos`)

Aquí se definen las **llaves de acceso** del sistema. Cada permiso tiene el formato **`modulo.accion`** (ej. `users.create`, `depositos.view`, `cajachica.liquidaciones.view`). *Solo administradores.*

- Los permisos se muestran **agrupados por módulo** en tarjetas, con columnas **Key · Descripción · Acciones**.
- **Crear:** botón **"+ Nuevo Permiso"** (arriba a la derecha). Complete:
  - **Key** — formato `modulo.accion` (obligatorio).
  - **Descripción** — qué habilita (obligatorio).
  - **Módulo** — elija uno existente o use **"+ Crear nuevo módulo"**.
- **Editar:** ícono de lápiz en la fila.
- **Eliminar:** ícono de papelera; pide confirmación (*"¿Eliminar permiso \"{key}\"?"*).

> Un permiso por sí solo no hace nada: hay que **asignarlo a un rol** (siguiente pantalla) y ese rol a los usuarios.

---

## 4. Roles (`/roles`)

Los roles agrupan permisos. Aquí se **consulta y modifica qué permisos tiene cada rol**. *Solo administradores.*

En la tarjeta **"Consultar permisos por rol"**:

1. Elija el rol en el desplegable y presione **Buscar**.
2. **"Permisos asignados:"** — muestra los permisos actuales como etiquetas verdes.
   - Para **quitar** uno: clic en la **×** de la etiqueta. **Se quita al instante, sin confirmación.**
3. **"Asignar nuevo permiso:"** — elija del desplegable (formato `[módulo] key - descripción`; solo aparecen los que el rol aún no tiene) y presione **Asignar**.

> **La creación de roles nuevos no se hace desde esta pantalla** — los roles existentes se administran a nivel de sistema. Si necesita un rol nuevo, solicítelo al área de sistemas.

---

## 5. Datos adicionales — Accesos a almacenes (`/datos-adicionales`)

Define **a qué almacenes puede acceder cada usuario** y con qué alcance. Es lo que controla, por ejemplo, qué bodegas ve alguien en Inventario o qué liquidaciones ve en Caja Chica.

### 5.1 Tipos de acceso (concepto clave)

| Tipo | Qué ve el usuario | Requisitos |
|---|---|---|
| **Tienda** | Solo **su almacén** (el del campo "Cód. almacén") | Almacén obligatorio |
| **Supervisor** | **Todos los almacenes de sus grupos** asignados | Almacén obligatorio **y al menos un grupo con almacenes**. Ojo: su almacén propio **no** queda incluido automáticamente — inclúyalo dentro de alguno de sus grupos si debe verlo |
| **Administrador** | **Todos los almacenes** del sistema | Este tipo no aparece en el desplegable de esta pantalla; si se requiere, solicitarlo a sistemas |

> Si un Supervisor queda **sin grupos** (o con grupos vacíos), el sistema le negará el acceso con un mensaje de configuración — asigne siempre al menos un grupo con almacenes.

### 5.2 Crear una asignación

Abra el panel **"Nueva asignación"**:

1. **Usuario** — busque por nombre o email. *Nota:* si el usuario **ya tiene una asignación, no aparecerá aquí** — modifíquelo con **"Editar"** en la tabla.
2. **Cód. almacén** — busque la tienda por nombre o código.
3. **Permiso** — **Tienda** o **Supervisor**.
4. **Grupo de almacenes** — (opcional para Tienda, necesario para Supervisor) marque uno o varios grupos.
5. Presione **Asignar**. Verá *"Asignación creada correctamente."*

### 5.3 Editar o eliminar

- **Editar** — la fila se vuelve editable (usuario, almacén, permiso y grupos); termine con **Guardar** o **Cancelar**.
- **Eliminar** — pide confirmación: *"¿Está seguro de eliminar la asignación de \"{usuario}\" al almacén \"{almacén}\"? Esta acción no se puede deshacer."*
- La tabla tiene búsqueda por **usuario, almacén, permiso o grupo** y botón **Recargar**.

> Después de cualquier cambio aquí, el usuario debe **cerrar sesión y volver a entrar**.

---

## 6. Grupos de almacenes (`/grupos-almacenes`)

Los grupos agrupan almacenes para asignarlos en bloque a los Supervisores (ej. "Roland Sierra Norte", "Lili Pink Costa"). *Solo administradores.*

### Crear un grupo

Abra **"Nuevo grupo"**:

1. **Nombre del grupo** — obligatorio y único (ej. "Tiendas Norte").
2. **Descripción** — opcional.
3. **Almacenes** — multi-selección con buscador por código o nombre; los elegidos aparecen como etiquetas con **×** para quitarlos. Obligatorio al menos uno.
4. **Bodega central** — opcional, selección única.
5. **Agregar grupo**.

### Editar / eliminar

- **Editar** — edición en la propia fila (nombre, descripción, almacenes, bodega central) con **Guardar** / **Cancelar**.
- **Eliminar** — confirmación: *"¿Está seguro de eliminar el grupo \"{nombre}\"? Esta acción no se puede deshacer."*

> Cambiar los almacenes de un grupo afecta a **todos los Supervisores** que tengan ese grupo (tras su próximo inicio de sesión).

---

## 7. Personal de Tiendas (`/gestion-usuarios`)

Catálogo de **empleados de tienda** (asesores, jefes, directores). **No son cuentas de acceso a SCNexus** — es un registro de personal. Se accede desde el menú lateral.

### Crear / editar empleado

Panel **"Nuevo empleado"** (botón **Mostrar/Ocultar**):

- **Cédula**, **Nombre completo**, **Correo** (obligatorios).
- **Tienda** — buscador por nombre o código.
- **Cargo** — uno de: **Administrador de tienda**, **Jefe de tienda**, **Director de tienda**, **Asesor de ventas**.
- **Encargado: Sí/No** — un empleado **Inactivo no puede ser encargado**.
- **Estado: Activo/Inactivo** — la "baja" de un empleado se hace poniéndolo **Inactivo** (no se elimina).

### Listado

- Filtros por texto (nombre, cédula o correo), **Tiendas**, **Cargos**, **Encargado** y **Estado**, con **Filtrar** y **Limpiar**. Paginación de 10.
- **Edición rápida con doble clic** en Cédula, Nombre, Tienda, Cargo y Correo (Enter guarda, Esc cancela).
- **Encargado** y **Estado** se cambian con un clic directo sobre el valor en la fila.

---

## 8. Flujo recomendado para dar de alta a alguien nuevo

1. **`Permisos`** — verifique que existan los permisos que necesitará (o créelos).
2. **`Roles`** — verifique que el rol tenga esos permisos asignados.
3. **`Usuarios`** — **Sincronizar AD** o **Importar** al usuario → **Ver roles** → **Asignar** el rol.
4. **`Grupos de almacenes`** — si será Supervisor, verifique que exista su grupo con los almacenes correctos.
5. **`Datos adicionales`** — cree la asignación de almacén (**Tienda** o **Supervisor** + grupos).
6. Pida al usuario **cerrar sesión y volver a entrar**. Listo.

---

## 9. Preguntas frecuentes / soporte

**"Le asigné un rol/permiso/almacén y dice que no ve nada nuevo."**
Debe **cerrar sesión y volver a entrar**. Recargar la página no basta.

**"No encuentro al usuario en 'Nueva asignación' de Datos adicionales."**
Si ya tiene una asignación, no aparece en ese buscador: úselo solo para usuarios sin asignaciones. Para modificar, use **Editar** en la tabla.

**"Un Supervisor no puede entrar a Inventario / le sale error de configuración."**
Verifique que tenga: (1) un Cód. almacén asignado y (2) al menos un grupo **con almacenes dentro**. Ambos son obligatorios para el tipo Supervisor.

**"El Supervisor no ve su propia tienda."**
El almacén del campo "Cód. almacén" **no se incluye automáticamente** en lo que ve — agregue esa tienda dentro de alguno de sus grupos.

**"Necesito que alguien vea TODOS los almacenes."**
Eso es el tipo **Administrador**, que no se asigna desde la pantalla de Datos adicionales — solicítelo al área de sistemas.

**"¿Cómo creo un usuario que no está en AD?" / "¿Cómo cambio una contraseña?"**
No se puede desde SCNexus: las cuentas y contraseñas se administran en **Active Directory**. Contacte al área de sistemas.

**"¿Cómo elimino un empleado de tienda?"**
No se elimina: cámbielo a **Estado: Inactivo** en Personal de Tiendas.
