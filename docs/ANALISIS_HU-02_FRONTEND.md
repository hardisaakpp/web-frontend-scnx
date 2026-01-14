# Análisis de Implementación HU-02 - Frontend

## HU-02: Listado de Pedidos con Filtros

**Descripción:** "Una Pantalla Web que permita visualizar el estado de los pedidos y distribución a tiendas ingresados, con filtros y actualizaciones - Dar seguimiento a los pedidos pendientes que requieren acción del usuario de MabelTrading"

---

## ✅ Estado Actual de Implementación

### Backend
- ✅ **COMPLETO** - Todos los endpoints necesarios están implementados

### Frontend
- ✅ **BASICAMENTE COMPLETO** - Falta polling automático y posible mejora de visualización

---

## 📋 Componentes Implementados

### 1. Vista de Listado (`PedidosListView.vue`)
**Ruta:** `/mba3-consultas/pedidos`  
**Permiso requerido:** `mba3-consultas.facturas.view`

#### Funcionalidades Implementadas ✅

1. **Filtros de Búsqueda:**
   - ✅ Estado del pedido (dropdown con todos los estados)
   - ✅ Fecha desde/hasta
   - ✅ Nombre de proveedor (búsqueda por texto)
   - ✅ Número de pedido (búsqueda por texto)
   - ✅ Botones "Buscar" y "Limpiar"

2. **Visualización de Estado:**
   - ✅ Badges de estado con colores diferenciados
   - ✅ Etiquetas legibles (ej: "Pendiente Confirmación", "Confirmado", etc.)
   - ✅ Estados soportados:
     - PENDIENTE_CONFIRMACION_PROVEEDOR
     - RESPUESTA_PROVEEDOR_CARGADA
     - CONFIRMADO_PROVEEDOR
     - ORDEN_COMPRA_CREADA
     - ENVIADA_SAP
     - CONFIRMADO_ENVIADO
     - CERRADO
     - CANCELADO

3. **Tabla de Pedidos:**
   - ✅ Columnas mostradas:
     - Número de Pedido
     - Fecha
     - Proveedor
     - Estado (con badge visual)
     - Comprador
     - Fecha de creación
     - Acciones (Ver Detalle)
   - ✅ Estados de carga (loading, error, empty)
   - ✅ Paginación (anterior/siguiente)
   - ✅ Información de resultados (Mostrando X - Y de Z)

4. **Navegación:**
   - ✅ Botón "Ver Detalle" que navega a `PedidoDetalleView`
   - ✅ Botón "Actualizar" para refrescar manualmente

5. **Integración con Backend:**
   - ✅ Uso de `mba3ConsultasService.getPedidosListado()`
   - ✅ Manejo de errores con toast notifications
   - ✅ Paginación con offset/limit

### 2. Vista de Detalle (`PedidoDetalleView.vue`)
**Ruta:** `/mba3-consultas/pedidos/:id`  
**Permiso requerido:** `mba3-consultas.facturas.view`

#### Funcionalidades Implementadas ✅

1. **Distribución a Tiendas:**
   - ✅ Componente `RedistribucionTiendas` muestra distribución completa
   - ✅ Visualización por producto y tienda
   - ✅ Cantidades solicitadas, confirmadas y distribuidas
   - ✅ Validación de diferencias

2. **Información Completa del Pedido:**
   - ✅ Cabecera del pedido
   - ✅ Lista de productos con detalles
   - ✅ Distribución a tiendas por producto
   - ✅ Reporte de diferencias (si aplica)

---

## ⚠️ Funcionalidades Faltantes o a Mejorar

### 1. Polling Automático / Actualizaciones en Tiempo Real ⚠️
**Estado:** No implementado

**Descripción:** La HU-02 menciona "actualizaciones", lo cual podría interpretarse como:
- Actualizaciones automáticas periódicas del listado
- Notificaciones cuando un pedido cambia de estado

**Recomendación:**
- Implementar polling opcional cada 30-60 segundos
- Agregar indicador visual cuando hay actualizaciones disponibles
- Permitir activar/desactivar el polling

### 2. Información de Distribución en el Listado (Opcional) 💡
**Estado:** No implementado

**Descripción:** Actualmente, la distribución a tiendas solo se ve en el detalle. Podría agregarse información resumida en el listado:
- Número de tiendas con distribución
- Estado de redistribución (pendiente, confirmada, etc.)

**Nota:** Esta es una mejora opcional. La HU-02 se puede cumplir mostrando la distribución en el detalle, pero podría ser útil en el listado para identificar rápidamente pedidos que requieren acción.

### 3. Filtro por "Creado Por" ⚠️
**Estado:** Backend soportado, Frontend no implementado

**Descripción:** El backend acepta el parámetro `creado_por` en los filtros, pero la interfaz no tiene un campo para filtrar por usuario creador.

**Recomendación:**
- Agregar campo de filtro "Creado Por" en la interfaz

### 4. Indicador de Pedidos que Requieren Acción ⚠️
**Estado:** No implementado

**Descripción:** La HU-02 menciona "Dar seguimiento a los pedidos pendientes que requieren acción del usuario de MabelTrading". Podría agregarse:
- Badge o indicador visual para pedidos que requieren acción
- Filtro específico "Requiere Acción"
- Ordenamiento prioritario

**Estados que podrían requerir acción:**
- `PENDIENTE_CONFIRMACION_PROVEEDOR` - Esperando respuesta del proveedor
- `RESPUESTA_PROVEEDOR_CARGADA` - Requiere confirmación/redistribución
- `CONFIRMADO_PROVEEDOR` - Listo para generar OC

### 5. Exportación de Listado (Opcional) 💡
**Estado:** No implementado

**Descripción:** Podría ser útil exportar el listado filtrado a Excel/CSV para análisis externo.

---

## 📊 Resumen de Cumplimiento

| Requerimiento | Estado | Detalle |
|---------------|--------|---------|
| Listado de pedidos | ✅ Completo | Vista funcional con tabla y paginación |
| Visualización de estado | ✅ Completo | Badges con colores y etiquetas |
| Filtros | ✅ Completo | Estado, fechas, proveedor, número pedido |
| Distribución a tiendas | ✅ Completo | Visible en detalle completo |
| Actualizaciones | ⚠️ Parcial | Solo manual, falta polling automático |
| Seguimiento de pendientes | ⚠️ Parcial | Falta indicador visual de "requiere acción" |

---

## 🎯 Recomendaciones de Implementación Prioritaria

### Prioridad Alta
1. **Polling automático opcional** - Mejora la experiencia de seguimiento
2. **Filtro "Creado Por"** - Backend ya lo soporta, solo falta UI

### Prioridad Media
3. **Indicador de "Requiere Acción"** - Cumple específicamente el objetivo de la HU-02
4. **Filtro "Requiere Acción"** - Facilita el seguimiento de pendientes

### Prioridad Baja
5. **Información resumida de distribución en listado** - Mejora opcional
6. **Exportación de listado** - Funcionalidad adicional

---

## 🔍 Archivos Relevantes

- **Vista:** `src/modules/mba3-consultas/views/PedidosListView.vue`
- **Servicio:** `src/modules/mba3-consultas/services/mba3ConsultasApi.ts`
- **Tipos:** `src/modules/mba3-consultas/types.ts`
- **Router:** `src/modules/mba3-consultas/router.ts`

---

## ✅ Conclusión

**La HU-02 está básicamente implementada en el frontend.** Los requerimientos principales están cumplidos:

- ✅ Listado de pedidos con filtros
- ✅ Visualización de estado
- ✅ Distribución a tiendas (en detalle)
- ✅ Filtros funcionales

**Pendientes menores:**
- Polling automático para actualizaciones
- Indicadores visuales para pedidos que requieren acción
- Filtro "Creado Por"

La funcionalidad core está completa y operativa. Las mejoras sugeridas son para optimizar la experiencia de usuario y cumplir más completamente con el objetivo de "dar seguimiento a pedidos pendientes".
