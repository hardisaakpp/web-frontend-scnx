# Manual de Usuario — Módulo Validación de Artículos (SCNexus)

**Audiencia:** personal de tiendas, supervisores y usuarios que consultan artículos.
**Alcance:** consulta de artículos por código de barras o referencia (cámara o ingreso manual).
**Última actualización:** 31 de agosto de 2026.

---

## 1. ¿Qué hace este módulo?

**Validación de Artículos** permite verificar un producto en el sistema leyendo su código de barras (con la cámara del dispositivo o una pistola lectora) o escribiéndolo a mano. Para el almacén elegido muestra:

- **Identificación:** referencia, descripción, código de barras, marca y categoría.
- **Ventas:** unidades vendidas en los últimos 30 y 90 días, promedio diario y fecha del último ingreso de mercadería.
- **Stock:** desglosado en tienda, bodega, tránsito y total general.
- **Precios:** precio de venta siempre; último costo y margen solo para usuarios autorizados.

Es una pantalla **solo de consulta**: no modifica datos, no muestra tallas/variantes ni imágenes, y no exporta información.

### Cómo se llega

- Menú lateral → **Validación de Artículos** (ícono de código QR). Abre la pantalla **"Validación de artículos"**.
- Todo ocurre en una sola pantalla con dos ventanas emergentes: la de **cámara** y la de **información del artículo**.

### Quién puede entrar

Se necesita uno de estos permisos en el rol (o ser Administrador):

| Permiso | Qué habilita |
|---|---|
| `articuloscaner.view` | Acceso al módulo **viendo costos y margen** |
| `articuloscaner.hide-cost` | Acceso al módulo **sin ver costos ni margen** (solo precio de venta) |

> Si un usuario tiene `articuloscaner.hide-cost`, **no verá costos aunque también sea administrador**: la restricción gana siempre.

---

## 2. Pantalla "Validación de artículos" (`/articulo-scaner`)

### 2.1 Paso 1 — Elegir el almacén

Campo **"Almacén de consulta"** con placeholder *"Buscar tienda por nombre o código"*:

- Escriba el **código** de la tienda (se selecciona solo) o parte del **nombre** (al salir del campo se completa).
- El botón **×** ("Limpiar almacén") borra la selección.
- Si aparece *"No se pudieron cargar los almacenes"*, use el enlace **Reintentar**.

> **El almacén es obligatorio y va primero.** Sin almacén, el campo de código muestra *"Primero elegí un almacén"* y tanto el botón de cámara como **Consultar artículo** quedan deshabilitados.

### 2.2 Paso 2 — Leer el código

Campo **"Lectura del código"** (*"Manual o cámara"*), placeholder *"Código de barras o referencia"* (máx. 50 caracteres). Tres formas de consultar:

1. **Cámara** — botón azul con ícono de cámara a la derecha del campo. Abre la ventana **"Escanear código"** (ver sección 3).
2. **Manual** — escriba o pegue el código y presione **Consultar artículo** (o Enter).
3. **Pistola lectora USB/Bluetooth** — apunte al campo y dispare: la pistola "teclea" el código y el Enter final ejecuta la consulta de corrido.

**Recientes:** al hacer clic en el campo se despliega la lista **"Recientes"** con los últimos 10 códigos consultados manualmente en ese dispositivo (se filtra mientras escribe; clic para reutilizar). Es un historial local del navegador: no viaja con el usuario a otros equipos.

---

## 3. Ventana "Escanear código" (cámara)

- La cámara **arranca sola** al abrir la ventana; la primera vez el navegador pedirá permiso de cámara — acéptelo.
- Instrucción en pantalla: *"Centra el código en el marco"* / *"Alinea el código dentro del marco"*. Mantenga el código estable dentro del marco verde.
- Al detectar el código suena un **beep**, la ventana se cierra sola y se abre la información del artículo automáticamente.
- Si el dispositivo tiene **varias cámaras**, aparece un selector para elegirla (por defecto se usa la trasera).
- Para cancelar: botón **×** o clic fuera de la ventana. La cámara se apaga al cerrar.

**Códigos que lee:** EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF y Codabar (los códigos de barras habituales de retail).

**Si la cámara no funciona:**

- *"Este navegador no permite usar la cámara para escanear. Usa el ingreso manual."* — el navegador no soporta cámara o la página no está en conexión segura (HTTPS). Use el ingreso manual o la pistola.
- Si **denegó el permiso** de cámara, el navegador puede mostrar un mensaje en inglés (ej. *"Permission denied"*). Habilite la cámara en la configuración del sitio (ícono de candado en la barra de direcciones) y vuelva a abrir la ventana de escaneo.
- Un mismo código no se dispara dos veces seguidas: hay una pausa de ~1,5 segundos entre lecturas.

---

## 4. Ventana "Información del artículo"

Se abre al consultar (manual o por cámara). Primero muestra *"Buscando información del artículo…"* y luego uno de estos resultados:

### 4.1 Artículo encontrado — 4 tarjetas

**Detalle producto:** Referencia, Descripción, Código barras, Marca y Categoría. Los datos ausentes se muestran como `N/A`.

**Ventas:**

| Fila | Significado |
|---|---|
| Promedio 30 días | unidades vendidas por día (promedio del último mes) |
| Total 30 días | unidades vendidas en los últimos 30 días |
| Total 90 días | unidades vendidas en los últimos 90 días |
| Último ingreso | fecha de la última entrada de mercadería |

**Stock** (del almacén seleccionado, en unidades enteras):

| Fila | Significado |
|---|---|
| Stock tienda | unidades en el piso de venta |
| Stock bodega | unidades en la bodega de la tienda |
| Stock tránsito | unidades en traslado hacia la tienda |
| Stock total general | total consolidado |
| Almacén | código y nombre de la tienda consultada |

**Precios:**

- **Precio de venta** — visible para todos.
- **Último costo** y **Margen** — visibles **solo** para usuarios con permiso de ver costos. Con `articuloscaner.hide-cost` estas filas no aparecen; si el sistema no autoriza el valor, se muestra *"No autorizado"*.

### 4.2 Artículo no encontrado

Bloque ámbar: *"Artículo no encontrado — No se encontró el código {código} en el almacén seleccionado."* Verifique que el código sea correcto y que la tienda elegida sea la que corresponde.

### 4.3 Consultar otro código sin salir

En la cabecera de la ventana hay tres botones:

- **Escribir código** (ícono de cubo, a la izquierda) — se convierte en un campo de texto: escriba el nuevo código y presione **Enter** para consultarlo sin cerrar la ventana (Esc cancela).
- **Consultar otro código** (botón verde) — cierra la ventana, limpia el código y **reabre la cámara** para escanear el siguiente artículo. Es el flujo rápido para validar varios productos seguidos.
- **×** — cierra la ventana (también se cierra con clic fuera).

---

## 5. Mensajes de error frecuentes

| Mensaje | Qué significa / qué hacer |
|---|---|
| *"Demasiadas consultas. Espera un momento e intenta de nuevo."* | Se superó el límite de 30 consultas cada 10 segundos. Espere unos segundos y reintente. |
| *"Solicitud inválida. Verifica almacén y código."* | Falta el almacén o el código tiene un formato no válido. |
| *"Artículo no encontrado en el almacén seleccionado."* | El código no existe para esa tienda. Pruebe con otra tienda o revise el código. |
| *"El servidor tardó demasiado. Intenta nuevamente."* | La consulta superó los 12 segundos. Reintente; si persiste, avise a soporte. |
| *"Error interno del servidor. Intentá más tarde."* | Falla del servicio. Si persiste, contacte a soporte. |
| Mensajes que mencionan HTML, JSON, Nginx o proxy | Problema de configuración/conexión del sistema — contacte al área de sistemas. |

---

## 6. Preguntas frecuentes

**"No veo 'Validación de Artículos' en el menú."**
Su rol no tiene ninguno de los permisos del módulo (`articuloscaner.view` o `articuloscaner.hide-cost`). Solicítelo al administrador y recuerde **cerrar sesión y volver a entrar** después del cambio.

**"No veo el costo ni el margen del artículo."**
Su rol tiene el permiso `articuloscaner.hide-cost` (acceso sin costos). Es intencional: solo los usuarios autorizados ven costo y margen.

**"El botón de cámara está deshabilitado."**
Falta elegir el almacén: es el primer paso obligatorio.

**"La cámara no abre o el navegador dice 'Permission denied'."**
Habilite el permiso de cámara para el sitio en el navegador (candado en la barra de direcciones → Cámara → Permitir) y vuelva a abrir la ventana de escaneo. La cámara solo funciona en conexión segura (HTTPS).

**"El escáner no lee mi código."**
Los códigos QR no están soportados por el lector rápido — este módulo está pensado para códigos de barras de retail (EAN, UPC, Code 128, etc.). Acerque o aleje el código, mejore la iluminación, o escríbalo a mano.

**"¿Puedo usar una pistola lectora?"**
Sí: haga clic en el campo de código y dispare la pistola; la consulta se ejecuta sola.

**"¿Queda registro de lo que consulto?"**
Sí. Cada consulta se registra en el sistema con el usuario, la tienda, el código y si fue por cámara o manual.

**"¿El stock que muestra está en tiempo real?"**
Muestra el stock registrado en el sistema al momento de la consulta para la tienda elegida (tienda, bodega y tránsito por separado).
