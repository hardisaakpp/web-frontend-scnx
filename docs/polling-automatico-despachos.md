# Sistema de Polling Automático para Despachos

## 📋 Resumen

Sistema de **polling automático** para la tabla de despachos disponibles que actualiza los datos cada 5 minutos sin necesidad de refrescar la página manualmente.

## ✅ Características

### Funcionalidades Principales

1. **Actualización Automática**
   - Refresca la tabla cada 5 minutos automáticamente
   - Sincroniza con el proceso backend que corre cada 15 minutos
   - No requiere intervención del usuario

2. **Indicador Visual en Tiempo Real**
   - Muestra cuándo fue la última actualización
   - Se actualiza automáticamente cada 30 segundos
   - Formato amigable: "Hace 2 min", "Hace 1h 15min"

3. **Gestión Inteligente**
   - Solo activo en la pestaña "Importar despachos"
   - Se pausa automáticamente al cambiar de pestaña
   - Se reanuda al volver a la pestaña
   - Se detiene completamente al desmontar el componente

4. **Prevención de Conflictos**
   - No ejecuta polling si ya hay una carga en proceso
   - Verifica la pestaña activa antes de actualizar
   - Limpia recursos al salir

## 🔧 Configuración

### Ajustar el Intervalo de Polling

Para cambiar el intervalo de actualización, modifica la constante `POLLING_INTERVAL`:

```typescript
// Para 3 minutos
const POLLING_INTERVAL = 3 * 60 * 1000

// Para 10 minutos  
const POLLING_INTERVAL = 10 * 60 * 1000

// Para 1 minuto (útil para desarrollo/testing)
const POLLING_INTERVAL = 1 * 60 * 1000
```

## 📊 Sincronización con Proceso Backend

El proceso backend ejecuta una sincronización con MBA3 cada **15 minutos**:

- **T+0**: Backend sincroniza y guarda nuevos despachos
- **T+5**: Frontend refresca (1era actualización)
- **T+10**: Frontend refresca (2da actualización)
- **T+15**: Backend sincroniza nuevamente
- **T+15**: Frontend refresca casi inmediatamente

**Resultado:** El usuario verá los datos actualizados en un máximo de **5 minutos** después de que el backend los guarde.

## 🎨 Experiencia de Usuario

### Antes
- ❌ Usuario debe refrescar la página manualmente (F5)
- ❌ No sabe cuándo fueron actualizados los datos
- ❌ Puede perder trabajo al refrescar

### Después
- ✅ Actualización automática cada 5 minutos
- ✅ Indicador claro de última actualización
- ✅ Actualización al entrar o cambiar de pestaña
- ✅ Sin pérdida de trabajo (no refresca la página)
- ✅ F5 del navegador disponible para actualización manual

## 💡 Recomendaciones

1. **Intervalo de 5 minutos es óptimo** para un proceso backend que corre cada 15 minutos
2. **No reducir a menos de 1 minuto** para evitar sobrecarga del servidor
3. **El indicador visual ayuda** a que los usuarios sepan que el sistema está actualizado

## 📝 Notas Técnicas

- El polling usa `setInterval` para mayor precisión
- Hay **dos intervals separados**: uno para el polling de datos (5 min) y otro para actualizar el display (30 seg)
- Ambos intervalos se limpian automáticamente para evitar memory leaks
- Compatible con todos los navegadores modernos

---

**Archivo modificado:** `src/modules/mba3-consultas/views/ProcesoCompletoView.vue`


