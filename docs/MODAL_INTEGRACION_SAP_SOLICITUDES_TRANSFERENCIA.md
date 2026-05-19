# Modal de Integración SAP – Solicitudes de Transferencia (frontend)

Este documento describe cómo el frontend muestra las **Solicitudes de Transferencia (ITR)** en el modal de resultado de integración SAP, en paridad con la información que se envía por correo.

## Origen de los datos

- **API:** `POST /integrar-sap` (y flujos que devuelven el mismo contrato).
- Los datos de ITR vienen en **cada elemento** de `metadata.detalles[]` con la clave **`solicitudes_transferencia`** (misma estructura que usa el correo).
- En el frontend se usa el primer detalle: `const detalle = metadata.detalles[0]` y se pasa al modal:
  - `detalle` → prop `detalle` (Orden de Compra).
  - `detalle.solicitudes_transferencia` → prop `solicitudesTransferencia` (camelCase en Vue).

## Requisitos del modal (Implementación actual)

1. **Leer** `detalle.solicitudes_transferencia` de la respuesta (o `solicitudesTransferencia` en camelCase donde corresponda) y pasarlo al modal como prop `solicitudes-transferencia`.

2. **Mostrar siempre** el bloque de Solicitudes de Transferencia cuando exista `detalle` (resultado de integración), con el estilo:
   - `bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700`

3. **Si hay datos** (`solicitudesTransferencia` no nulo):
   - Resumen: "X de Y creadas exitosamente" (o mensaje de parcial con errores).
   - Lista por tienda: código, nombre, ITR # / DocEntry o mensaje de error.

4. **Si no hay datos** (`solicitudesTransferencia` nulo o no presente):
   - Mensaje: *"No hay información de Solicitudes de Transferencia para este resultado."*

Con esto, el modal ofrece la **misma información** que el correo y la UI no depende solo del email.

## Dónde se implementa

| Pieza | Ubicación |
|-------|-----------|
| Modal (siempre sección ITR, mensaje sin datos, resumen y lista) | `src/modules/mba3-consultas/components/IntegracionSAPModal.vue` |
| Después de `POST /integrar-sap` (Proceso completo) | `ProcesoCompletoView.vue`: `integracionSAPSolicitudes = detalle.solicitudes_transferencia \|\| null` |
| Redistribución → resultado pendiente en store | `MabelTradingRedistribucionView.vue`: `solicitudesTransferencia: response.envio_sap?.solicitudes_transferencia \|\| null` |
| Restauración del resultado pendiente | `ProcesoCompletoView.vue` (onMounted): lee `procesoStore.sapResultadoPendiente.solicitudesTransferencia` |
| Tipos | `types.ts`: `IntegracionSAPDetalle.solicitudes_transferencia`, `SolicitudesTransferencia`, `SolicitudTransferenciaResultado` |

## Referencia backend

En el repositorio del backend, el contrato y los casos de uso del modal están documentados en **`docs/FRONTEND_MODAL_INTEGRACION_SAP.md`**.

## Timeouts y errores de red

Si el envío a SAP tarda más de lo que el navegador espera, ver [timeout-sincronizado-frontend-backend.md](./timeout-sincronizado-frontend-backend.md) (toast amarillo, refresh de ODC, límites 120–300 s en `integrar-sap`).
