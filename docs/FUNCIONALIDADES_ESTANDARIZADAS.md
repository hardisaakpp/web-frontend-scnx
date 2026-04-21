# Funcionalidades Estandarizadas (Escalables a Módulos)

Guía única para implementar funcionalidades reutilizables entre módulos del frontend SCNexus.

Este documento centraliza los estándares transversales que ya existen en el proyecto para evitar duplicación de lógica y mantener consistencia de UX y de integración con backend.

---

## 1) Objetivo y alcance

Aplicar en cualquier módulo que requiera:

- notificaciones visuales homogéneas (toast),
- reacción a eventos en tiempo real (SSE),
- sincronización de UI tras mutaciones de API,
- manejo uniforme de errores y estados de carga.

Este documento no reemplaza guías específicas; las referencia y las organiza.

---

## 2) Notificaciones Toast estandarizadas

### 2.1 Base global

- Store/composable base: `src/composables/useToast.ts`
- Contenedor global visual: `src/components/ToastContainer.vue`
- Montaje global: `src/layouts/MainLayout.vue`

Implicación: cualquier módulo puede emitir toasts sin montar nada extra en su vista.

### 2.2 Wrapper recomendado por módulo

- Composable estandarizado: `src/composables/useModuleNotifications.ts`

Uso:

```ts
import { useModuleNotifications } from '@/composables/useModuleNotifications'

const notifier = useModuleNotifications('PYG')

notifier.success({ title: 'Carga completada', message: 'Se procesó correctamente.' })
notifier.warning({ title: 'Validación', message: 'Revisa el archivo.' })
notifier.error({ title: 'Error al subir', message: 'No se pudo completar la carga.' })
notifier.info({ title: 'Actualización', message: 'Se refrescó el historial.' })
```

### 2.3 Regla de estandarización

- No usar `useToast` directo en nuevas vistas de negocio.
- Usar `useModuleNotifications('<MODULO>')` para homogeneidad de formato y prefijo.

---

## 3) Notificaciones en tiempo real (SSE)

### 3.1 Capa global

- Composable SSE: `src/composables/useNotificaciones.ts`
- Estado compartido para vistas: `lastNotification`

Flujo:

1. Se abre stream SSE autenticado.
2. Llega evento `notification`.
3. Se muestra toast (si aplica).
4. Se actualiza `lastNotification` para que las vistas reaccionen.

### 3.2 Regla de consumo en vistas

En cada módulo, reaccionar a `lastNotification` por `metadata.accion` (acción de negocio), no por lógica frágil de texto.

Ejemplo recomendado:

```ts
watch(lastNotification, (notification) => {
  if (!notification) return
  if (notification.metadata?.accion !== 'mi_accion_finalizada') return
  void recargarDatos()
})
```

### 3.3 Caso PYG (referencia implementada)

En PYG ya se aplica este patrón:

- Acción SSE: `pyg_upload_completed`
- Reacción: `loadUploads()` para refrescar historial automáticamente.
- Toast informativo de actualización.

---

## 4) Sincronización UI tras mutaciones API

Estándar del proyecto:

- Si el backend devuelve entidad actualizada en `POST/PUT/PATCH`, fusionar esa respuesta en estado local.
- Evitar refetch completo cuando no sea necesario.
- Usar refetch cuando el proceso sea asíncrono o afecte colecciones amplias.

Referencia detallada:

- `docs/MUTACIONES_API_SINCRONIZACION_UI.md`

---

## 5) Contrato frontend-backend para escalabilidad

Para cada nueva funcionalidad estándar, definir explícitamente:

1. Endpoint(s), método(s) y permisos requeridos.
2. Payload request/response tipado en servicio TS.
3. Estados funcionales (`success`, `warning`, `error`, `processing`).
4. Errores esperados (400/401/403/404/409/500) y mensaje UI.
5. Evento SSE asociado (`metadata.accion`) y acción de UI al recibirlo.

---

## 6) Checklist de implementación por módulo

1. Crear/usar servicio API tipado del módulo.
2. Integrar `useModuleNotifications('<MODULO>')`.
3. Mapear toasts en eventos clave:
   - éxito de operación,
   - validación/bloqueo,
   - error de integración,
   - info de actualización.
4. Si hay tiempo real:
   - consumir `lastNotification`,
   - filtrar por `metadata.accion`,
   - refrescar datos (`loadXxx()`).
5. Validar linter y flujo manual end-to-end.
6. Documentar acción SSE y comportamiento esperado.

---

## 7) Referencias relacionadas

- `docs/NOTIFICACIONES_SSE.md`
- `docs/MUTACIONES_API_SINCRONIZACION_UI.md`
- `docs/FRONTEND.md`
- `docs/MODULOS.md`
- `docs/ARQUITECTURA_Y_NUEVOS_MODULOS.md`

---

## 8) Convenciones de mantenimiento

- Cualquier nuevo patrón transversal debe agregarse aquí primero.
- Si una guía específica cambia (SSE, mutaciones, módulos), actualizar enlaces y resumen de este documento.
- Evitar crear lógica estándar aislada en un solo módulo sin registrarla en esta guía.

