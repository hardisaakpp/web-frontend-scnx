**Manual de Usuario — Inventario**  
   
 **Módulo Inventario — SCNexus**![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsScYxpg/jkFMYQKvNrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4EGBc18GWY+AAAAAElFTkSuQmCC)  
   
 **1. Introducción**  
   
 Este manual describe el uso del módulo **Inventario** de SCNexus: planificación y ejecución de tomas físicas, conteo (por escaneo o manual), reconteo de diferencias, revisión y ajuste de resultados, y envío del ajuste final a SAP.  
   
 **1.1 Flujo general**  
   
 Planificar (opcional)  →  Toma Física (Abierta)  →  Contar artículos  
   
                                                            │  
   
                                                      Cerrar toma  
   
                                                              │  
   
                            ┌─────────────────────────────────┴─────────────────────┐  
   
                                │                                                        │  
   
                       Sin diferencias                              Con diferencias  
   
                                │                                                        │  
   
                            CERRADA                                  RECONTEO  
   
                      (snapshot inmutable)                 (reparto entre usuarios)  
   
                                                                                         │  
   
                                                                                Cerrar reconteo  
   
                                                                                         │  
   
                                                                                     CERRADA  
   
                                                                              (snapshot inmutable)  
   
                                                                                         │  
   
                                                                            Bandeja de Ajustes → SAP  
   
    
   
 Si una toma no se cierra antes de su **fecha de cierre estimada**, el sistema la bloquea automáticamente como   **No realizada** — ver [sección 7.5.  
   
    
   
 **1.2 Roles y permisos**  
   
 El acceso a cada pantalla depende del permiso asignado en CORE. Un usuario puede tener varios.  
   
 | | |  
   
 |-|-|  
   
 | **Permiso** |  **Da acceso a** |  
   
 | inventario.planificar | Crear y ejecutar planes de inventario |  
   
 | inventario.generar | Crear tomas físicas directas ("Nueva Toma") |  
   
 | inventario.toma | Ver el listado de Toma Física y contar artículos |  
   
 | inventario.estado_sesion | Ver el resumen de supervisor de una toma |  
   
 | inventario.snapshot | Ver el detalle/snapshot de una toma cerrada |  
   
 | inventario.bandeja_ajustes | Ver y trabajar la Bandeja de Ajustes |  
   
 | inventario.gestion_scans | Eliminar escaneos de cualquier usuario (auditoría) |  
   
 | inventario.edicion_ajuste | Editar líneas de un ajuste (mientras está en Draft) |  
   
 | inventario.revision | Enviar a revisión / aprobar un ajuste |  
   
 | inventario.integracion_sap | Descargar el informe final y marcar envío a SAP |  
   
    
   
 Un usuario **Administrador** siempre tiene acceso a todo.  
   
 Los **pickers invitados** a una toma puntual (sin ningún permiso inventario.*) igual pueden contar en esa toma específica — el sistema los reconoce por estar asignados como picker de la sesión, no por permiso.  
   
 El acceso por bodega/almacén (Tienda / Supervisor / Administrador) se valida aparte y determina qué bodegas ve cada usuario, independientemente de estos permisos de pantalla.  
   
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNBCkLfEmYYmVDBhAU2QtIq6DIzW7UHAMBfnGt1V8fXEwAAXrse/xsF7SNlq6EAAAAASUVORK5CYII=)  
   
 **2. Acceso al módulo**](#anchor-1 "#anchor-1")  
1. Inicie sesión en SCNexus.  
2. En el menú lateral, pulse **Inventario**.  
3. Verá el **Dashboard** con 4 accesos:  
   
 | | | |  
   
 |-|-|-|  
   
 | **Tarjeta** |  **Ruta** |  **Para qué sirve** |  
   
 | **Mis Inventarios** | /inventario/mis-inventarios | Ver sus tomas de conteo abiertas asignadas |  
   
 | **Planes de inventario** | /inventario/planes | Crear y ejecutar planificaciones por bodega |  
   
 | **Toma Física** | /inventario/sesiones | Ejecutar planes pendientes o crear tomas directas |  
   
 | **Bandeja de Ajustes** | /inventario/ajustes | Revisar snapshots cerrados, aprobar y enviar a SAP |  
   
    
   
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OQQmAABRAsSd4NoCpTCQ/pwmMYQVvImwJtszMXp0BAPAX91pt1fH1BACA164HosMEPiBLnfkAAAAASUVORK5CYII=)  
   
 ** **  
 **3. Mis Inventarios (autoservicio)**  
 **Ruta:** Dashboard →   **Mis Inventarios**  
   
 Lista las tomas físicas **abiertas** asignadas a su bodega o a usted como picker. No requiere permiso especial.  
 **3.1 Qué muestra cada tarjeta**  
   
 Estado (Abierta/Reconteo), bodega, código de plan o "Toma directa", nombre de bodega, descripción, fecha de apertura, cierre estimado (si se definió) y quién la generó.  
 **3.2 Acciones disponibles**  
   
 | | | |  
   
 |-|-|-|  
   
 | **Botón** |  **Cuándo aparece** |  **Qué hace** |  
   
 | **Contar artículos** | Solo bodegas tipo Tienda | Abre la pantalla completa de conteo (tabla con todos los artículos) |  
   
 | **Iniciar picking** | Siempre | Abre un diálogo para indicar su  **ubicación** (opcional, máx. 10 caracteres, ej. PASILLO3) y lo lleva a la pantalla de conteo rápido por escaneo |  
   
    
   
 La ubicación que ingrese aquí es la que ve el supervisor en la columna **Ubicación** de la tabla "Conteo por usuario" del Resumen de Supervisor.  
 **Mi Historial** (botón arriba de la lista) lo lleva a su historial de conteos — ver [sección 5.  
   
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNBCzrfFis6mJHAjAU2QtIq6DIzW7UHAMBfnGt1V8fXEwAAXrsexOUF3zlnnqsAAAAASUVORK5CYII=)  
 **4. Toma Física — gestión (supervisores y administradores)**  
 **Ruta:** Dashboard →   **Toma Física** (requiere inventario.toma)  
   
 Listado completo de todas las tomas físicas, con filtros y acciones administrativas.  
 **4.1 Filtros**](#anchor-2 "#anchor-2")  
- Chips de estado: **Todas**,   **Abiertas**,   **Reconteo**,   **Cerradas** (cada uno muestra la cantidad entre paréntesis).  
- Rango de fechas de apertura (Desde/Hasta), con botón **✕** para limpiar.  
 **4.2 Crear una toma nueva**  
   
 Botón **Nueva Toma** (visible solo con permiso inventario.generar) abre el modal   **Nueva Toma Física**:  
   
 | | | |  
   
 |-|-|-|  
   
 | **Campo** |  **Obligatorio** |  **Notas** |  
   
 | Fecha inicio | — | Automática (hoy) |  
   
 | **Fecha cierre estimada** |  **Sí** | No puede ser anterior a hoy. Si la toma no se cierra antes de esta fecha, el sistema la bloquea sola como  **No realizada** |  
   
 | Descripción | No | Ej: "Toma express almacén central" |  
   
 | Código de referencia | No | Máx. 10 caracteres alfanuméricos, se muestra como etiqueta en el listado |  
   
 | Bodegas | Sí | Puede seleccionar varias — se crea una toma por cada bodega elegida |  
   
 | Filtros de artículos | No | Nivel 1/2/3, Género, Material, Pack, Colección — limita qué artículos entran en la toma |  
   
    
   
 Botón **Generar toma** (o   **Generar N tomas** si eligió varias bodegas).  
   
   
 **4.3 Menú de acciones (⋮ Más opciones)**  
   
 Por cada toma, el botón **⋮** abre:  
   
 | | | |  
   
 |-|-|-|  
   
 | **Opción** |  **Cuándo aparece** |  **Qué hace** |  
   
 | **Ver detalle** | Siempre | Abre el snapshot/detalle con categorías y descargas (ver [sección 9) |  
   
 | **Resumen** | Siempre | Abre el Resumen de Supervisor (ver ](#anchor-3 "#anchor-3")[sección 8) |  
   
 | **Contar artículos** | Si no está Cerrada | Pantalla completa de conteo |  
   
 | **Gestionar usuarios de picking** | Si no está Cerrada | Invitar/quitar pickers a esta toma puntual |  
   
 | **Cerrar toma** | Si no está Cerrada | Ver ](#anchor-4 "#anchor-4")[sección 7 |  
   
 | **Eliminar toma** | Solo si está  **Abierta** | Borra la toma y todos sus conteos —  **no se puede deshacer** |  
   
    
   
 📷 [Captura: menú ⋮ desplegado con todas las opciones]  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAOElEQVR4nO3OQQ2AMAAAsSPBDC6nA0lImANeSAAL/AhJq6DLGGOrjgAA+IO7mmt1VfvHGQAA3jsfLo0GxEjjf40AAAAASUVORK5CYII=)  
 **5. Contar Artículos**  
 **Ruta:** desde el menú   **⋮ → Contar artículos**, o desde Mis Inventarios.  
   
 Pantalla completa con la tabla de todos los artículos de la toma (o, en Reconteo, solo los que tienen diferencia — ver ](#anchor-5 "#anchor-5")[nota abajo).  
 **5.1 Filtros y búsqueda**  
   
 Filtro por **Nivel 2** y buscador de texto libre (código, código de barras, nombre, o usuario asignado en reconteo).  
 **5.2 Registrar el conteo**](#anchor-6 "#anchor-6")  
- **Escaneados**: se suman automáticamente los escaneos hechos desde la pantalla de picking.  
- **Cant. Manual** (o   **Reconteo** en la segunda vuelta): input numérico por fila; se guarda solo al salir del campo (blur). El color del borde indica el estado: amarillo = pendiente de guardar, azul = guardando, verde = guardado, rojo = error.  
- El **Total** de cada fila se colorea: verde si coincide con el stock del sistema, ámbar si es menor, azul si es mayor.  
- En Reconteo se muestra además **Asignado a** (quién debe recontar ese artículo) y   **Diferencia** contra el stock.  
   
 📷 [Captura: tabla de Contar Artículos con columnas y colores de estado]  
 **5.3 Cerrar la toma desde aquí**  
   
 Al final de la página hay una tarjeta **Cerrar Toma** /   **Cerrar Reconteo** con el mismo flujo que en las demás pantallas — ver [sección 7. Incluye advertencia de que la acción es irreversible y un campo de descripción opcional.  
   
 📷 [Captura: tarjeta de cierre al final de Contar Artículos, con la advertencia en ámbar]  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNhwAQ20PcjJhnxgQU2QtIq6DIze3UGAMBf3Gu1VcfXEwAAXrseS2IEK0DSwRkAAAAASUVORK5CYII=)  
 **6. Conteo por Picking (celular, escaneo rápido)**  
 **Ruta:** botón   **Iniciar picking** desde Mis Inventarios, o link compartido de la toma.  
   
 Pantalla optimizada para celular, pensada para escanear muchos artículos seguidos sin ver la tabla completa.  
 **6.1 Escanear código de barras**  
   
 Campo de cantidad + campo de código de barras (Enter para registrar). Cada envío aparece en la lista **Enviados** con   **OK** en verde, o   **NO EXISTE CÓDIGO** en rojo si el código no se reconoce.  
 **6.2 Ingresar por código de artículo**  
   
 Sección desplegable para escribir directamente el código de artículo (sin escáner) + cantidad + botón **Agregar**.  
 **6.3 Reenviar errores**  
   
 Si algún envío falla (sin conexión, error de red), aparece en el panel **Errores** con botón   **Reenviar** individual o   **Reenviar todo**.  
 **6.4 Ver Resumen**  
   
 Botón **Ver Resumen** lleva al   **Resumen de Conteo**: totales por Nivel 1 y por Nivel 1/Nivel 2, y sus   **últimos 30 ingresos** con opción de eliminar un registro propio (ícono de basura, sin confirmación — se borra al instante).  
   
 📷 [Captura: pantalla de escaneo en celular]  
   
    
   
  📷 [Captura: Resumen de Conteo con totales por nivel]  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OMQ0AIAwAwZJgBKe1gjR8dGDBABMhuZt+/JaZIyJmAADwi9VP1NMNAABu1AaU4AUheyiM2gAAAABJRU5ErkJggg==)  
 **7. Cerrar una toma**  
   
 El cierre está disponible desde el menú **⋮ → Cerrar toma** (listado), desde el Resumen de Supervisor, o desde la propia pantalla de Contar Artículos. En todos los casos aparece la misma advertencia:  
 ***Se generará el snapshot inmutable. No se puede deshacer.***  
 **7.1 Sin diferencias**  
   
 Si todos los artículos cuadran contra el stock del sistema, la toma pasa directo a **Cerrada** y se genera el snapshot inmutable de resultados.  
 **7.2 Con diferencias → Reconteo**  
   
 Si algún artículo no cuadra (incluyendo artículos que **nunca se contaron** — cuentan como faltante total), la toma pasa a   **Reconteo** para una segunda vuelta, y automáticamente se abre el reparto (siguiente punto).  
 **7.3 Reparto de Reconteo**  
   
 Al pasar a Reconteo se abre el modal **Reparto de reconteo**: una propuesta agrupada por Nivel 2 de quién debería recontar cada artículo (por defecto, alguien que   **no** lo contó la primera vez, balanceando la carga entre los usuarios que participaron).](#anchor-5 "#anchor-5")  
- Puede **reasignar** cualquier artículo a otro usuario desde el selector de esa fila (se marca en ámbar si la persona seleccionada ya lo contó antes).  
- Puede **quitar un usuario** (✕ en su chip) — sus artículos se redistribuyen automáticamente entre los demás.  
- Botón **Confirmar reparto** guarda las asignaciones.  
   
 Si se cierra el modal sin confirmar, puede volver a abrirlo cerrando y reabriendo el flujo de cierre, o coordinando el reparto manualmente en la pantalla de Contar Artículos.  
   
 📷 [Captura: modal "Reparto de reconteo" con la propuesta por Nivel 2]  
 **Nota — alcance del reconteo**  
   
 En Reconteo, la pantalla de Contar Artículos solo muestra los artículos con diferencia contra el stock — **incluidos los que nadie contó en la primera vuelta**, ya que un artículo nunca contado es, por definición, una diferencia (faltante total).  
 **7.4 Cerrar el reconteo**  
   
 Al cerrar una toma que está en **Reconteo**, la toma queda   **Cerrada de forma definitiva**, sin importar si aún quedan diferencias — es el cierre final, ya no hay una tercera vuelta.  
 **7.5 Fecha de cierre obligatoria y bloqueo automático**  
   
 Toda toma nueva requiere una **fecha de cierre estimada** (ver [sección 4.2). Si esa fecha pasa y la toma sigue Abierta o en Reconteo sin haberse cerrado, el sistema la bloquea automáticamente como   **No realizada** — ya no admite más conteos ni se puede cerrar manualmente. El badge se muestra en rojo con la etiqueta   **No realizado**.  
   
 📷 [Captura: badge "No realizado" en el listado de Toma Física]  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OUQmAABBAsSeIMcSol8GM5hAr+CfClmDLzOzVGQAAf3Gt1VYdH0cAAHjvfgAulwQ+/PA0twAAAABJRU5ErkJggg==)  
 **8. Resumen de Supervisor**  
 **Ruta:** menú   **⋮ → Resumen**  
 **8.1 Progreso y estado de cuadre**  
   
 Dos tarjetas con un selector **Por artículos** /   **Por unidades**:](#anchor-7 "#anchor-7")  
- **Progreso de conteo**: Total, Contados, Faltan.  
- **Estado de cuadre**: Cuadraron, Descuadraron, Items nuevos.  
 **8.2 Valorizado Mabeltrading**  
- **Total inventario**: valor a costo de   **todo** el almacén, sin filtrar.  
- **Cuánto se auditó**: valor a costo del alcance filtrado de esta toma (lo que el plan/sesión decidió inventariar) — no depende de cuánto se ha contado, por eso normalmente es menor al total.  
 **8.3 Conteo por usuario**  
   
 Tabla con Usuario, **Ubicación** (la que cada picker indicó al iniciar), Entradas, Artículos únicos y Último registro.  
   
 📷 [Captura: Resumen de Supervisor completo — progreso, cuadre, valorizado y tabla por usuario]  
 **8.4 Actualizar Stock desde SAP**  
   
 Botón **Actualizar Stock SAP** (solo visible mientras la toma no está Cerrada) — sincroniza el stock del sistema desde SAP para esa bodega. Puede tardar según el tamaño de la bodega; al terminar recarga la pantalla.  
 **8.5 Cerrar Toma Física desde aquí**  
   
 Mismo flujo descrito en la [sección 7: botón inicial → confirmación con nota opcional → resultado (Cerrada o pasa a Reconteo, abriendo el reparto automáticamente).  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAABRAsSeYxKQ/jMEMIR7FCt5E2BJsmZmt2gMA4C+Otbqr8+sJAACvXQ85TAYU+XLD1wAAAABJRU5ErkJggg==)  
 **9. Detalle de Toma Física**  
 **Ruta:** menú   **⋮ → Ver detalle** (requiere inventario.snapshot)  
   
 Vista de resultados por categoría, para tomas en cualquier estado.  
 **9.1 Categorías**  
   
 | | |  
   
 |-|-|  
   
 | **Tarjeta** |  **Qué agrupa** |  
   
 | **Consolidado ↓** | Descarga todo el detalle sin filtrar |  
   
 | **Cerrados** | Artículos donde el conteo coincidió con el stock |  
   
 | **Diferencias** | Artículos con diferencia |  
   
 | **Otros Códigos** | Artículos nuevos/no esperados que se escanearon |  
   
 | **No contados** | Artículos del alcance que nadie contó |  
   
    
   
 Al elegir una categoría se abre la tabla de líneas (columnas ordenables: Nivel 1/2/3, Género, Cód. Barras, Item Code, Descripción, Stock, Scan, Diferencia), con buscador y descarga filtrada.  
   
 📷 [Captura: Detalle de Toma con las 5 tarjetas de categoría]  
 **9.2 Descargas**  
   
 Todas las descargas (Consolidado, por categoría, y las de "Scans por usuario") son archivos **Excel (.xlsx)**.  
 **9.3 Scans por usuario**  
   
 Sección inferior con pestañas **Resumen** /   **Detalle** (misma información que en ](#anchor-5 "#anchor-5")[Gestión de Scans, pero de solo lectura, sin poder eliminar).  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsScYxpg/khHMYQKvNrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4DmBdF2VlroAAAAAElFTkSuQmCC)  
 **10. Gestión de Scans**  
 **Ruta:** botón   **Gestión de Scans** desde el Detalle de Toma (requiere inventario.gestion_scans)  
   
 Herramienta de auditoría para **eliminar escaneos de cualquier usuario** dentro de la toma.](#anchor-8 "#anchor-8")  
- **Resumen por usuario**: Usuario, Scans, Artículos únicos, Primer/Último scan; clic en una fila filtra el detalle a ese usuario (  **Ver solo este usuario** /   **Quitar filtro**).  
- **Detalle de escaneos**: tabla completa con buscador, y botón   **Eliminar** por fila (solo donde aplica). Pide confirmación:  
- *¿Eliminar el escaneo de * ***{artículo}*** * registrado por *  ***{usuario}*** *? Esta acción no se puede deshacer.*  
   
 📷 [Captura: Gestión de Scans, tabla de detalle con el botón Eliminar]  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAM0lEQVR4nO3OMQ0AIAwAwZJgBKeVgjWMNCwYYCIkd9OP3zJzRMQMAAB+sfqJeroBAMCN2pTaBSQLg92+AAAAAElFTkSuQmCC)  
 **11. Planificación de Inventario**  
 **Ruta:** Dashboard →   **Planes de inventario** (requiere inventario.planificar)  
 **11.1 Crear un plan**  
   
 Botón **Nuevo plan** abre un modal con: Fecha apertura *, Fecha cierre *, Descripción, Bodegas * (una o varias — se crea un plan por bodega), y los mismos filtros de artículos que en Nueva Toma. Botón   **Crear plan** /   **Crear N planes**.  
 **11.2 Ejecutar un plan pendiente**  
   
 En el listado de **Planes Pendientes**, botón   **Ejecutar ahora** por fila — genera la toma física correspondiente. También se puede eliminar un plan pendiente con   **Eliminar** (pide confirmación, no se puede deshacer).  
   
 📷 [Captura: listado de Planes Pendientes]  
   
    
   
  📷 [Captura: modal "Crear plan de inventario"]  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OMQ2AABAAsSNBACvm0MH4NpGACyywEZJWQZeZ2aszAAD+4l6rrTq+ngAA8Nr1AL/OBEc29LleAAAAAElFTkSuQmCC)  
 **12. Bandeja de Ajustes**  
 **Ruta:** Dashboard →   **Bandeja de Ajustes** (requiere inventario.bandeja_ajustes)  
   
 Donde se revisan y aprueban las diferencias de una toma ya **Cerrada**, antes de enviarlas a SAP.  
 **12.1 Listado de ajustes**  
   
 Filtro por rango de fechas (por defecto, últimos 15 días — ajustable). Cada fila muestra fecha, bodega, estado, líneas totales/con diferencia, y el valorizado.  
 **12.2 Crear un ajuste**  
   
 Con el SessionId de una toma cerrada, botón **Crear Ajuste** (requiere inventario.edicion_ajuste) — genera un ajuste en estado   **Draft** con una línea por artículo de esa toma.  
   
 📷 [Captura: listado de la Bandeja de Ajustes]  
 **12.3 Detalle de un ajuste**  
   
 Botón **Detalle** en cualquier fila. Muestra cabecera (bodega, estado, líneas, valorizado) y la tabla de líneas.  
- Checkbox **Ver solo diferencias** (activado por defecto) — oculta las líneas balanceadas, que no suman al valorizado.  
- Mientras el ajuste está en **Draft**, cada línea permite editar la   **Adjusted Diff** (diferencia ajustada) y una nota de auditor, con botón   **Guardar** por fila.  
- Fuera de Draft, la edición queda bloqueada y se muestra un aviso indicando el estado actual.  
   
 📷 [Captura: detalle de ajuste con checkbox "Ver solo diferencias" y edición de línea]  
 **12.4 Valorización del informe final**  
   
 Selector **Modo**: Costo, PVP, o PVP menos descuento (con campo de porcentaje). Se puede cambiar mientras el ajuste no esté Aprobado — una vez aprobado, el informe final es inmutable y el selector se bloquea.  
 **12.5 Flujo de aprobación**  
   
 Draft → Submit → InReview → Approve → Approved → SentToSap  
   
 | | | |  
   
 |-|-|-|  
   
 | **Botón** |  **Requiere** |  **Efecto** |  
   
 | **Submit** | inventario.revision, ajuste en Draft | Pasa a InReview |  
   
 | **Approve** | inventario.revision, ajuste en InReview | Pasa a Approved y genera el informe final |  
   
 | **Descargar informe final** | inventario.integracion_sap, Approved o SentToSap | Descarga el Excel definitivo |  
   
    
 **12.6 Informe final (Excel)**  
   
 Al aprobar se genera un Excel con tres hojas: **DIFERENCIAS**,   **CERRADOS** y   **RESUMEN** (totales, participación por usuario con nombre resuelto, y el valorizado según el modo elegido).  
   
 📷 [Captura: hoja RESUMEN del informe final en Excel]  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OMQ2AABAAsSNBCzrfFQ5QwYwEZiywEZJWQZeZ2ao9AAD+4lyruzq+ngAA8Nr1AMTVBeHjZ7ejAAAAAElFTkSuQmCC)  
 **13. Estados de una toma física**  
   
 | | | |  
   
 |-|-|-|  
   
 | **Estado** |  **Etiqueta en pantalla** |  **Significado** |  
   
 | Open | **Abierta** | Aceptando conteos |  
   
 | Recount | **Reconteo** | Segunda vuelta sobre las diferencias encontradas |  
   
 | Closed | **Cerrada** | Snapshot inmutable generado, ya no admite conteos |  
   
 | Expired | **No realizado** | Se venció la fecha de cierre sin cerrarse — bloqueada automáticamente |  
   
    
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OUQmAABBAsSeYxKSXxlxGEAOIFfwTYUuwZWa2ag8AgL841uquzq8nAAC8dj05WAYOJzduCAAAAABJRU5ErkJggg==)  
 **14. Consejos y buenas prácticas**  
1. **Defina bien la fecha de cierre** al crear la toma — si se le pasa, el sistema la bloquea sola como No realizada y hay que empezar de nuevo.  
2. **Use "Ver solo diferencias"** en la Bandeja de Ajustes para revisar rápido lo que realmente importa; el total valorizado no cambia con el filtro.  
3. **Revise el reparto de reconteo** apenas se abra — reasigne a alguien que no haya contado el artículo la primera vez para que el reconteo sea realmente independiente.  
4. **Indique su ubicación al iniciar picking**: ayuda al supervisor a coordinar el reconteo por zona.  
5. **No cierre una toma en Reconteo sin revisar** — ese cierre es definitivo, no hay una tercera vuelta.  
6. Los conteos manuales se guardan **al salir del campo** (blur), no al escribir — espere a ver el borde verde antes de pasar al siguiente artículo.  
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OMQ2AABAAsSNhYEUALhD4K0LxgQU2QtIq6DIzR3UFAMBf3Gu1VefXEwAAXtsfSp4DXi4fyswAAAAASUVORK5CYII=)  
 **15. Resolución de problemas**  
   
 | | |  
   
 |-|-|  
   
 | **Problema** |  **Posible causa / solución** |  
   
 | No veo el botón "Nueva Toma" / "Cerrar toma" | Verifique que su usuario tenga el permiso inventario.generar / inventario.toma. |  
   
 | La toma aparece como "No realizado" | Se venció la fecha de cierre sin cerrarse. Debe crear una toma nueva. |  
   
 | No puedo editar una línea en la Bandeja de Ajustes | El ajuste ya no está en Draft — revise el aviso ámbar arriba de la tabla, indica el estado actual. |  
   
 | El conteo manual no se guarda | Confirme que salió del campo (blur), no solo que escribió el número; revise el color del borde (rojo = error). |  
   
 | Demora al guardar el conteo manual | Si persiste, repórtelo — puede ser un problema de conexión con el sistema de stock (SAP). |  
   
 | No veo "Reparto de reconteo" | Solo aparece automáticamente cuando el cierre de una toma resulta en Reconteo; no hay botón para abrirlo manualmente. |  
   
 | No puedo eliminar una toma | Solo se puede eliminar mientras está **Abierta** (no en Reconteo ni Cerrada). |  
   
    
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OUQmAABBAsSfYxZqXS2xiAAsYwAr+ibAl2DIzW3UEAMBfnGt1V/vXEwAAXrsep8IF2UErR/MAAAAASUVORK5CYII=)  
 **16. Glosario**  
   
 | | |  
   
 |-|-|  
   
 | **Término** |  **Definición** |  
   
 | **Toma física** | Sesión de conteo de inventario para una bodega |  
   
 | **Snapshot** | Fotografía inmutable de los resultados al cerrar una toma |  
   
 | **Reconteo** | Segunda vuelta de conteo sobre los artículos con diferencia |  
   
 | **Reparto** | Asignación de qué usuario recuenta cada artículo en el Reconteo |  
   
 | **Picker** | Usuario que cuenta físicamente los artículos (por escaneo o item code) |  
   
 | **Ajuste** | Registro de auditoría/aprobación de las diferencias de una toma cerrada, antes de enviarlas a SAP |  
   
 | **Valorizado** | Diferencia de inventario expresada en dinero (Costo, PVP o PVP con descuento) |  
   
 | **SKU** | Código único de artículo |  
   
    
 ![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OMQ0AIAwAwZJgBKe1gjR8dGDBABMhuZt+/JaZIyJmAADwi9VP1NMNAABu1AaU4AUheyiM2gAAAABJRU5ErkJggg==)  
 *Documento generado para el módulo Inventario de SCNexus. Complete las capturas de pantalla marcadas antes de distribuir. Ante dudas sobre permisos, consulte con el administrador del sistema.*  
