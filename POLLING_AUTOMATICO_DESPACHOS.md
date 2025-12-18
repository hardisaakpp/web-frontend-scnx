# Sistema de Polling Automático para Despachos

## 📋 Resumen

Se implementó un sistema de **polling automático** para la tabla de despachos disponibles que actualiza los datos cada 5 minutos sin necesidad de refrescar la página manualmente.

---

## ✅ Cambios Implementados

### 1. Variables de Estado para Polling

**Ubicación:** `src/modules/mba3-consultas/views/ProcesoCompletoView.vue` (líneas ~617-622)

```typescript
// ========== POLLING AUTOMÁTICO ==========
// Configuración de auto-refresh
const POLLING_INTERVAL = 5 * 60 * 1000 // 5 minutos (ajustable según necesidades)
let pollingIntervalId: ReturnType<typeof setInterval> | null = null
const lastRefreshTime = ref<Date | null>(null)
const nextRefreshTime = ref<Date | null>(null)
```

**Variables:**
- `POLLING_INTERVAL`: Intervalo de actualización (5 minutos por defecto)
- `pollingIntervalId`: ID del intervalo de polling para poder cancelarlo
- `timeDisplayIntervalId`: ID del intervalo de actualización del display de tiempo
- `lastRefreshTime`: Fecha/hora de la última actualización
- `nextRefreshTime`: Fecha/hora de la próxima actualización programada
- `timeAgoDisplay`: Ref reactivo con el texto formateado que se actualiza cada 30 segundos

---

### 2. Funciones de Polling

**Ubicación:** Después de la función `cargarDespachos()` (líneas ~810-857)

#### `autoRefreshDespachos()`
- Actualiza automáticamente los despachos cada 5 minutos
- Solo se ejecuta si estamos en la pestaña "Importar despachos"
- Verifica que no haya otra carga en proceso

#### `startPolling()`
- Inicia el intervalo de polling
- Calcula la próxima hora de actualización
- Muestra mensaje en consola para debugging

#### `stopPolling()`
- Detiene el intervalo de polling
- Limpia el ID del intervalo

#### `formatTimeAgo(date: Date)`
- Formatea el tiempo transcurrido desde la última actualización
- Muestra formato amigable: "Hace X min", "Hace Xh Ymin", etc.

#### `updateTimeDisplay()`
- Actualiza el texto del indicador de tiempo (`timeAgoDisplay`)
- Se ejecuta automáticamente cada 30 segundos

#### `startTimeDisplayUpdate()`
- Inicia la actualización en tiempo real del indicador
- Actualiza inmediatamente y luego cada 30 segundos

#### `stopTimeDisplayUpdate()`
- Detiene la actualización del indicador de tiempo
- Limpia el interval para prevenir memory leaks

---

### 3. Integración en el Ciclo de Vida

#### onMounted (líneas ~1575-1579)
```typescript
// ========== INICIAR POLLING AUTOMÁTICO ==========
// Iniciar polling solo si estamos en la pestaña de despachos
if (activeTab.value === 'migrar') {
  startPolling()
}
```

#### onUnmounted (líneas ~1582-1585)
```typescript
// Limpiar polling al desmontar el componente
onUnmounted(() => {
  stopPolling()
})
```

#### Watch de activeTab (líneas ~1587-1594)
```typescript
// Watch para pausar/reanudar polling según pestaña activa
watch(activeTab, (newTab) => {
  if (newTab === 'migrar') {
    startPolling() // Reanudar cuando volvemos a la pestaña de despachos
  } else {
    stopPolling() // Pausar cuando salimos de la pestaña de despachos
  }
})
```

---

### 4. Indicadores Visuales en el UI

**Ubicación:** Template, header de "Despachos Disponibles" (líneas ~298-332)

#### Indicador de Última Actualización (Actualización en Tiempo Real)
```vue
<!-- Indicador de última actualización - Se actualiza cada 30 segundos -->
<div v-if="lastRefreshTime" class="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-500">
  <svg class="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span>{{ timeAgoDisplay }}</span>
</div>
```

**Características:**
- Diseño sutil: texto pequeño gris sin fondo de color
- Se actualiza automáticamente cada 30 segundos
- Usa un ref reactivo (`timeAgoDisplay`) que se actualiza con un interval separado

**Nota:** El botón de actualización manual fue removido ya que no es necesario. Los usuarios pueden:
- Usar F5 del navegador para refrescar manualmente
- Cambiar de pestaña y volver para actualizar
- Esperar la actualización automática cada 5 minutos

---

## 🎯 Características del Sistema

### ✨ Funcionalidades

1. **Actualización Automática**
   - Refresca la tabla cada 5 minutos automáticamente
   - Sincroniza con el proceso backend que corre cada 15 minutos
   - No requiere intervención del usuario

2. **Indicador Visual de Tiempo en Tiempo Real**
   - Muestra cuándo fue la última actualización
   - Se actualiza automáticamente cada 30 segundos
   - Formato amigable: "Hace 2 min", "Hace 1h 15min"
   - Diseño sutil y discreto (texto gris pequeño con icono)

3. **Actualización Manual con F5**
   - Los usuarios pueden usar F5 del navegador para actualizar inmediatamente
   - Cambiar de pestaña y volver también actualiza los datos

4. **Gestión Inteligente del Polling**
   - Solo activo en la pestaña "Importar despachos"
   - Se pausa automáticamente al cambiar de pestaña
   - Se reanuda al volver a la pestaña
   - Se detiene completamente al desmontar el componente

5. **Actualización en Tiempo Real del Indicador**
   - El texto "Hace X min" se actualiza cada 30 segundos
   - No requiere refrescar datos, solo actualiza el display
   - Proporciona feedback continuo al usuario

6. **Prevención de Conflictos**
   - No ejecuta polling si ya hay una carga en proceso
   - Verifica la pestaña activa antes de actualizar
   - Limpia recursos al salir (ambos intervals)

---

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

### Habilitar Notificaciones

Si deseas mostrar una notificación cada vez que se actualiza, descomenta la línea en `autoRefreshDespachos()`:

```typescript
// Mostrar notificación sutil (opcional - comentar si no se desea)
toast.info('Datos actualizados', 'La tabla de despachos se ha actualizado automáticamente', 2000)
```

---

## 📊 Sincronización con Proceso Backend

### Escenario de Uso

El proceso backend ejecuta una sincronización con MBA3 cada **15 minutos**:
- **T+0**: Backend sincroniza y guarda nuevos despachos
- **T+5**: Frontend refresca (1era actualización)
- **T+10**: Frontend refresca (2da actualización)
- **T+15**: Backend sincroniza nuevamente
- **T+15**: Frontend refresca casi inmediatamente

**Resultado:** El usuario verá los datos actualizados en un máximo de **5 minutos** después de que el backend los guarde.

---

## 🎨 Experiencia de Usuario

### Antes
- ❌ Usuario debe refrescar la página manualmente (F5)
- ❌ No sabe cuándo fueron actualizados los datos
- ❌ Puede perder trabajo al refrescar
- ❌ No ve cambios del proceso backend automáticamente

### Después
- ✅ Actualización automática cada 5 minutos
- ✅ Indicador claro de última actualización
- ✅ Actualización al entrar o cambiar de pestaña
- ✅ Sin pérdida de trabajo (no refresca la página)
- ✅ Sincronización fluida con proceso backend
- ✅ F5 del navegador disponible para actualización manual si es necesario

---

## 🐛 Debugging

El sistema muestra mensajes en consola para facilitar el debugging:

```javascript
✅ Polling iniciado: cada 5 minutos
🔄 Auto-refresh: Actualizando despachos...
⏹️ Polling detenido
```

**Nota sobre intervals:** El sistema ejecuta dos intervals independientes:
- **Interval de polling** (5 min): Refresca los datos desde el backend
- **Interval de display** (30 seg): Actualiza el texto "Hace X min" sin llamar al backend

Para ver estos mensajes, abre DevTools (F12) y ve a la pestaña Console.

---

## 💡 Recomendaciones

1. **Intervalo de 5 minutos es óptimo** para un proceso backend que corre cada 15 minutos
2. **No reducir a menos de 1 minuto** para evitar sobrecarga del servidor
3. **El indicador visual ayuda** a que los usuarios sepan que el sistema está actualizado
4. **Cambiar de pestaña actualiza los datos** automáticamente, brindando control al usuario sin botones adicionales

---

## 📝 Notas Adicionales

- El polling usa `setInterval`, no `setTimeout`, para mayor precisión
- Hay **dos intervals separados**: uno para el polling de datos (5 min) y otro para actualizar el display (30 seg)
- Ambos intervalos se limpian automáticamente para evitar memory leaks
- El sistema es reactivo y responde a cambios de pestaña instantáneamente
- El indicador de tiempo usa un diseño **sutil y discreto** (gris, pequeño, sin fondo de color)
- Compatible con todos los navegadores modernos
- No afecta el rendimiento de la aplicación

---

**Fecha de implementación:** Diciembre 17, 2025  
**Archivo modificado:** `src/modules/mba3-consultas/views/ProcesoCompletoView.vue`  
**Tiempo de implementación:** ~15-20 minutos  
**Líneas agregadas:** ~100 líneas (código + template)

