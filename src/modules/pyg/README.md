# Modulo PYG - Notas tecnicas

## Estandar de actualizacion de historial

En el modulo PYG, el historial de cargas debe seguir el estandar del proyecto de **actualizacion automatica sin boton manual de refresco**.

### Regla aplicada en `PygUploadView`

- El historial se carga al abrir la vista.
- El historial se recarga automaticamente despues de una subida exitosa de Excel.
- El historial se recarga al recibir una notificacion SSE relevante (`target_permission = pyg.edit`).
- Existe polling de respaldo para mantener sincronia cuando no llegue el evento en tiempo real.
- No se usa boton `Refrescar` para esta tabla.

## Referencias

- Estandar global: `docs/MODULOS.md` (seccion de actualizacion automatica de listas e historiales).
- Implementacion actual: `src/modules/pyg/views/PygUploadView.vue`.

## Mapeo API → etiquetas UI (auditoria)

- Historial de cargas (`GET /uploads`): columnas finales alineadas al estandar SCNexus: **Fecha ingreso** = `uploadedAt`; **Última actualización** = no aplica en el DTO de batch (se muestra **—**); **Usuario últ. act.** = `uploadedBy`.
- Porcentajes matriz/bodega: `createdAt` → **Fecha ingreso**; `updatedAt` → **Última actualización**; `lastUpdatedBy` → **Usuario últ. act.** No hay columna **Acciones**: la edicion es por doble clic en los campos de datos (como en gestion de usuarios), Enter guardar y Esc cancelar.
