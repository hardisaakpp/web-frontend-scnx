# Cambios Backend: Estado PROCESADO_SAP

## Resumen

Se requiere agregar el estado `PROCESADO_SAP` al flujo de estados del pedido para indicar que el pedido ha sido procesado por SAP después de confirmar la redistribución.

## Cambios Requeridos en el Backend

### 1. Definir el estado `PROCESADO_SAP`

El estado `PROCESADO_SAP` debe ser agregado como un estado válido en el modelo de `Pedido` o en la enumeración de estados.

**Ubicación sugerida:** Modelo `Pedido` o archivo de constantes de estados.

**Valor:** `"PROCESADO_SAP"`

**Descripción:** Indica que el pedido ha sido procesado por SAP después de confirmar la redistribución. Este estado se alcanza cuando:
- El pedido está en estado `CONFIRMADO_PROVEEDOR`
- Se confirma la redistribución (`confirmarRedistribucion`)
- El backend procesa la información SAP y guarda en `pedido_sap_procesamiento_detalle`

### 2. Actualizar el estado después de confirmar redistribución

**Endpoint:** `POST /api/pedidos/{numero_pedido}/redistribucion/confirmar`

**Cambio requerido:**

Después de procesar la información SAP y guardar en `pedido_sap_procesamiento_detalle`, el backend debe actualizar el estado del pedido a `PROCESADO_SAP`.

**Flujo actual:**
```
confirmarRedistribucion()
  → Procesa información SAP
  → Guarda en pedido_sap_procesamiento_detalle
  → Actualiza pedido.estado = "PEDIDO_CONFIRMADO" ✅
```

**Nota:** El backend actualmente establece el estado a `PEDIDO_CONFIRMADO` después de confirmar la redistribución. Este estado indica que el pedido ha sido procesado por SAP y está listo para generar OC.

### 3. Validación en endpoint de crear OC

**Endpoint:** `POST /api/pedidos/{pedido_id}/crear-orden-compra`

**Validación requerida:**

El endpoint debe aceptar pedidos en estado `CONFIRMADO_PROVEEDOR`, `PEDIDO_CONFIRMADO` o `PROCESADO_SAP` para generar la orden de compra.

**Código sugerido:**
```python
# Validar que el pedido esté en un estado válido para generar OC
estados_validos = ['CONFIRMADO_PROVEEDOR', 'PEDIDO_CONFIRMADO', 'PROCESADO_SAP']
if pedido.estado not in estados_validos:
    raise HTTPException(
        status_code=400,
        detail=f"El pedido debe estar en estado CONFIRMADO_PROVEEDOR, PEDIDO_CONFIRMADO o PROCESADO_SAP para generar OC. Estado actual: {pedido.estado}"
    )
```

**⚠️ IMPORTANTE:** El estado `PEDIDO_CONFIRMADO` es el estado actual que el backend establece después de confirmar la redistribución. Este estado debe ser aceptado para generar OC.

## Orden de Estados del Pedido

El flujo completo de estados es:

1. `PENDIENTE_CONFIRMACION_PROVEEDOR` - Pedido inicial cargado
2. `RESPUESTA_PROVEEDOR_CARGADA` - Proveedor carga respuesta (opcional)
3. `CONFIRMADO_PROVEEDOR` - Pedido confirmado por proveedor
4. `PEDIDO_CONFIRMADO` - **ACTUAL** - Redistribución confirmada y procesada por SAP (estado actual del backend)
5. `PROCESADO_SAP` - **FUTURO** - Estado alternativo para indicar procesamiento SAP (opcional)
6. `CONFIRMADO_ENVIADO` - OC generada y enviada a SAP

## Impacto

### Frontend (Ya implementado ✅)

- ✅ Tipos actualizados en `types.ts` (incluye `PEDIDO_CONFIRMADO`)
- ✅ Formatter agregado en `formatters.ts` (incluye `PEDIDO_CONFIRMADO`)
- ✅ Estilos agregados en `styleHelpers.ts` (incluye `PEDIDO_CONFIRMADO`)
- ✅ Validación en `ProcesamientoSAPView.vue` acepta `CONFIRMADO_PROVEEDOR`, `PEDIDO_CONFIRMADO` y `PROCESADO_SAP`

### Backend (Pendiente ⚠️)

- ✅ El estado `PEDIDO_CONFIRMADO` ya se establece después de `confirmarRedistribucion()`
- ⚠️ **CRÍTICO:** Validar que el endpoint `crear-orden-compra` acepte pedidos en estado `PEDIDO_CONFIRMADO`
- ⚠️ Opcional: Definir estado `PROCESADO_SAP` en modelo/enum (si se desea usar en el futuro)

## Notas

- El estado `PROCESADO_SAP` es más específico que `CONFIRMADO_PROVEEDOR` y permite diferenciar entre:
  - Pedidos confirmados pero aún no procesados por SAP
  - Pedidos que ya fueron procesados por SAP y están listos para generar OC

- La validación en el frontend ya acepta ambos estados para mantener compatibilidad durante la transición.

## Testing

Después de implementar los cambios en el backend, verificar:

1. ✅ Al confirmar redistribución, el pedido cambia a estado `PEDIDO_CONFIRMADO` (ya funciona)
2. ⚠️ **CRÍTICO:** El endpoint `crear-orden-compra` acepta pedidos en estado `PEDIDO_CONFIRMADO`
3. ✅ El frontend muestra correctamente el estado "Pedido Confirmado" con el estilo teal
4. ✅ El botón "Generar ODC" aparece cuando el pedido está en `PEDIDO_CONFIRMADO` (ya funciona en frontend)
