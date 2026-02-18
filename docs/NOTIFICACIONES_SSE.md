# Notificaciones SSE y escalabilidad por permiso

Documentación del contrato entre frontend y backend para notificaciones toast en tiempo real (SSE). Incluye el siguiente nivel de escalabilidad: notificar entre usuarios con el **mismo** permiso además del permiso opuesto.

---

## Comportamiento actual (cross-permission)

- Si un usuario con **mabel.view** realiza una acción → la notificación toast llega a usuarios con **odcsap.view**.
- Si un usuario con **odcsap.view** realiza una acción → la notificación llega a usuarios con **mabel.view**.

Esto está implementado y funcionando.

---

## Comportamiento deseado (mismo permiso + cross-permission)

Para escalar a varios usuarios por rol:

1. **Mismo permiso:** Si **andrea@outlook.com.ec** (mabel.view) realiza una acción → notificar también a **carlos@outlook.com.ec** y al resto de usuarios con **mabel.view** (excluyendo a andrea).
2. **Mismo permiso odcsap:** Si un usuario con **odcsap.view** realiza una acción → notificar a los demás usuarios con **odcsap.view** (excluyendo al autor).
3. **Permiso opuesto:** Mantener el comportamiento actual: notificar al otro permiso (mabel.view ↔ odcsap.view).

Resumen para el **backend** al emitir una notificación:

| Autor de la acción | Destinatarios del evento |
|-------------------|---------------------------|
| Usuario con `mabel.view` | (1) Todos los usuarios con `odcsap.view` y (2) todos los **demás** usuarios con `mabel.view` |
| Usuario con `odcsap.view` | (1) Todos los usuarios con `mabel.view` y (2) todos los **demás** usuarios con `odcsap.view` |

El frontend ya está preparado: solo muestra el toast si el usuario actual tiene el permiso indicado en `target_permission`. El backend debe enviar el evento a cada conexión SSE de los usuarios que deban recibirlo (mismo permiso + permiso opuesto, excluyendo al autor).

---

## Contrato técnico

- **Endpoint SSE:** `GET {VITE_MBA3_API_BASE_URL}/notificaciones/stream` con header `Authorization: Bearer <JWT>`.
- **Evento de notificación:** tipo `notification`, con payload que incluye al menos:
  - `id`, `type`, `title`, `message`, `timestamp`, `metadata`
  - **`target_permission`:** permiso al que va dirigida la notificación (`mabel.view` u `odcsap.view`). El frontend solo muestra el toast si el usuario tiene este permiso.

Implementación backend sugerida al emitir:

- Calcular conjunto de destinatarios: usuarios con el permiso opuesto + usuarios con el mismo permiso (excluyendo el `user_id` del autor).
- Para cada destinatario con conexión SSE abierta, enviar el evento con `target_permission` igual al permiso que corresponde a ese destinatario (si un destinatario tiene mabel.view, enviar con `target_permission: "mabel.view"`; si tiene odcsap.view, con `target_permission: "odcsap.view"`).

---

## Frontend

- **Filtro:** En `useNotificaciones.ts`, si la notificación tiene `target_permission`, solo se muestra el toast cuando `authStore.hasPermission(notification.target_permission)` es verdadero. Así se soporta tanto envío por conexión (backend envía solo a los destinatarios) como envío por permiso (backend envía a un canal y el frontend filtra).
- **Ref global:** `lastNotification` se actualiza solo cuando el usuario tiene el permiso; las vistas pueden seguir reaccionando (p. ej. recargar datos) a las notificaciones que sí se muestran.
