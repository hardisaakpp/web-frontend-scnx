# Sistema de Timeout Sincronizado Frontend-Backend

## 📋 Resumen

Sistema implementado para sincronizar los timeouts entre frontend y backend, evitando que las conexiones se corten antes de que el proceso del backend termine.

## ✅ Cambios Implementados en Frontend

### 1. Interceptor de Respuesta Mejorado

El interceptor de respuesta ahora lee headers HTTP del backend que indican el timeout recomendado:

- **`X-Request-Timeout`**: Tiempo en segundos que el backend recomienda para esta operación
- **`X-Request-Timeout-Min`**: Tiempo mínimo en segundos (fallback seguro)

**Ubicación:** `src/modules/mba3-consultas/services/mba3ConsultasApi.ts`

### 2. Timeout Dinámico en `integrarSAP`

La función `integrarSAP` ahora calcula el timeout dinámicamente basado en:

- **Número de ODCs a procesar**: Más ODCs = más tiempo necesario
- **Timeout base**: 120 segundos para 1 ODC (definido en `utils/integrarSapTimeout.ts`)
- **Timeout adicional**: +30 segundos por cada ODC adicional
- **Límites de seguridad**: 
  - Mínimo: 120 segundos
  - Máximo: 300 segundos (5 minutos)
- **Errores de red/timeout**: mensaje unificado (`SAP_MAY_STILL_PROCESSING_MESSAGE`) + refresco de lista de ODC
- **Proceso completo SAP (async)**: polling hasta 10 min vía `utils/pollAsyncJob.ts`

**Ejemplo de cálculo:**
- 1 ODC: 120 segundos
- 2 ODCs: 150 segundos
- 3 ODCs: 180 segundos
- 10 ODCs: 390 segundos → limitado a 300 segundos (máximo)

## 🔧 Implementación en Backend (Recomendado)

Para una sincronización completa, el backend debería enviar headers HTTP en las respuestas del endpoint `/integrar-sap`.

### Ejemplo en Python/FastAPI

```python
from fastapi import Response
from fastapi.responses import JSONResponse

@app.post("/integrar-sap")
async def integrar_sap(
    referencia_despacho: list[str] | None = None,
    almacen_destino: str | None = None
):
    # Calcular tiempo estimado basado en:
    # - Número de ODCs a procesar
    # - Número de tiendas/bodegas
    # - Complejidad del proceso
    
    num_ordenes = len(referencia_despacho) if referencia_despacho else 0
    
    # Timeout base: 60s para 1 ODC, +30s por cada ODC adicional
    estimated_timeout = 60  # segundos base
    if num_ordenes > 1:
        estimated_timeout += (num_ordenes - 1) * 30
    
    # Agregar headers a la respuesta
    response_data = {
        "status": "success",
        "metadata": {...}
    }
    
    response = JSONResponse(content=response_data)
    response.headers["X-Request-Timeout"] = str(estimated_timeout)
    response.headers["X-Request-Timeout-Min"] = "60"  # Mínimo seguro
    
    return response
```

### Ejemplo en Node.js/Express

```javascript
app.post('/integrar-sap', async (req, res) => {
  const { referencia_despacho, almacen_destino } = req.query;
  
  const numOrdenes = Array.isArray(referencia_despacho) 
    ? referencia_despacho.length 
    : (referencia_despacho ? 1 : 0);
  
  // Calcular timeout estimado
  let estimatedTimeout = 60; // segundos base
  if (numOrdenes > 1) {
    estimatedTimeout += (numOrdenes - 1) * 30;
  }
  
  // Agregar headers
  res.setHeader('X-Request-Timeout', estimatedTimeout.toString());
  res.setHeader('X-Request-Timeout-Min', '60');
  
  // ... procesar lógica ...
  
  res.json({
    status: 'success',
    metadata: {...}
  });
});
```

## 📊 Ventajas del Sistema

1. **Sincronización**: Frontend y backend trabajan con los mismos valores de timeout
2. **Adaptativo**: Se ajusta automáticamente según la carga de trabajo
3. **Escalable**: Funciona con 1 ODC o múltiples ODCs
4. **Seguro**: Tiene límites mínimo y máximo para evitar timeouts extremos
5. **Retrocompatible**: Funciona aunque el backend no envíe headers (usa cálculo dinámico)

## 🔍 Debugging

El sistema incluye logs de debugging:

```
⏱️ [integrarSAP] Timeout calculado: 60s para 1 ODC(s)
⏱️ [MBA3 API] Backend recomienda timeout: 90s (mín: 60s)
```

Estos logs aparecen en la consola del navegador para facilitar el debugging.

## 📝 Notas Importantes

- El frontend **ya está implementado** y funcionando con cálculo dinámico
- El backend puede implementar los headers **opcionalmente** para una sincronización más precisa
- Si el backend no envía headers, el frontend usa el cálculo dinámico basado en el número de ODCs
- Los headers son **recomendaciones**, el frontend siempre aplica sus límites de seguridad (min/max)

## 🚀 Próximos Pasos (Opcional)

Para operaciones muy largas (>5 minutos), considerar implementar:

1. **Server-Sent Events (SSE)**: Para operaciones asíncronas con progreso en tiempo real
2. **Polling**: Para verificar el estado de operaciones largas
3. **WebSockets**: Para comunicación bidireccional en tiempo real

El sistema actual de timeout sincronizado es suficiente para operaciones que toman menos de 5 minutos.
