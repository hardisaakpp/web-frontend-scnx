# Plan de Implementación: Fase 1 - Frontend (Nexus)

> **Archivado.** Este documento se llamaba originalmente `PLAN_FASE2_FRONTEND.md`, pero su contenido corresponde al plan de la fase 1 (migración del legacy a Nexus). Se renombró para que el nombre coincida con el hito real. Ver [HISTORIAL.md](HISTORIAL.md) para el registro histórico de fases del módulo.

Este documento guía el desarrollo del módulo de Reposiciones en el frontend `scnexus-front`, migrando la lógica de `sc22` a una arquitectura moderna en Vue 3.

## 1. Estructura del Módulo
El módulo vivirá en `src/modules/reposiciones/`. Se debe replicar la estructura estándar de Nexus:

```text
reposiciones/
├── components/          # Componentes internos del módulo
├── services/            # Llamadas a la API (.NET 8)
├── stores/              # Estado Global (Pinia)
├── views/               # Pantallas principales
├── router.ts            # Definición de rutas
└── types.ts             # Interfaces TypeScript (DTOs)
```

## 2. Definición de Tipos (`types.ts`)
Basado en los DTOs de C#, definiremos:
*   `ArticuloCatalogo`: Datos del producto + stock + sugerido.
*   `SolicitudCabecera`: Datos de la orden del día.
*   `SolicitudDetalle`: Items agregados a la solicitud actual.
*   `FiltrosCatalogo`: Estructura para la paginación y búsqueda.

## 3. Servicio API (`services/reposicionApi.ts`)
Implementar cliente Axios apuntando al proxy `/reposicion-api`:
*   `getCatalogo(filtros, page, pageSize)`: Obtener catálogo paginado.
*   `getSolicitudHoy()`: Obtener o inicializar cabecera del día.
*   `upsertLinea(itemCode, cantidad, comentario)`: Guardar cambios en tiempo real.
*   `getHistorial(params)`: Consultar solicitudes pasadas.

## 4. Estado Global (`stores/reposicionStore.ts`)
Usar Pinia para manejar la reactividad:
*   **State**: `items`, `loading`, `solicitudActual`, `filtros`.
*   **Actions**: `fetchCatalogo`, `updateCantidad`, `limpiarFiltros`.
*   **Getters**: `totalSolicitado`, `hasChanges`.

## 5. Vistas y Componentes Clave

### A. `SolicitarView.vue` (Reemplaza repC.php)
*   **Tabla Paginada**: Implementar "Infinite Scroll" o paginación tradicional para los +10k artículos.
*   **Validaciones en Caliente**: 
    *   Múltiplos de embalaje (uso de `blur` y corrección automática).
    *   Input de cantidad con colores (Rojo: > Stock Bodega, Amarillo: > Sugerido).
*   **Filtros Dinámicos**: Unidad, Línea, Marca y Categoría.

### B. `CarritoView.vue` (Reemplaza repS.php)
*   **Resumen**: Vista filtrada de items con `cantidad > 0`.
*   **Confirmación**: Botón final (opcional, según flujo de negocio) y exportación a PDF.

### C. `HistorialView.vue` (Reemplaza repH.php)
*   Uso de `DataTable` avanzado.
*   Modales de detalle para ver lo enviado a SAP (`rep_log`).

## 6. Integración en el Sistema Principal
1.  **Vite Proxy**: Asegurar que en `vite.config.ts` el proxy `/reposicion-api` apunte al puerto `8010`.
2.  **Router**: Registrar las rutas en `src/router/index.ts`.
3.  **Permissions**: Enlazar con las capabilities del usuario (Tienda vs Admin).

---
## ⚡ Mejoras con respecto al Legacy
*   **Velocidad**: Al usar paginación real server-side, la carga inicial será instantánea (no más carga de 10k filas al inicio).
*   **UX**: Feedback visual inmediato sin refrescar la página.
*   **Seguridad**: Validaciones críticas duplicadas en el backend (.NET).
