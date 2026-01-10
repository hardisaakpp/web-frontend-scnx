# Plan de Refactorización - PedidoDetalleView.vue

## Análisis del Archivo
- **Tamaño actual:** ~3061 líneas
- **Problemas identificados:**
  - Archivo monolítico muy grande
  - Muchas responsabilidades mezcladas
  - Funciones de formato y utilidades mezcladas con lógica de negocio
  - Componentes grandes en el template

## Estrategia de Refactorización Segura (Paso a Paso)

### Fase 1: Extraer Utilidades (Más Seguro) ✅
- [x] Eliminar funciones duplicadas
- [x] Extraer constantes mágicas
- [ ] Crear `utils/formatters.ts` - Funciones de formato
- [ ] Crear `utils/validators.ts` - Funciones de validación

### Fase 2: Extraer Composables (Seguro)
- [ ] Crear `composables/usePedidoDetalle.ts` - Lógica principal del pedido
- [ ] Crear `composables/useRedistribucion.ts` - Lógica de redistribución
- [ ] Crear `composables/useFileUpload.ts` - Lógica de carga de archivos
- [ ] Crear `composables/useColumnManagement.ts` - Gestión de columnas

### Fase 3: Extraer Componentes (Requiere más cuidado)
- [ ] `PedidoHeaderActions.vue` - Header con botones de acción
- [ ] `PedidoCabecera.vue` - Información de cabecera del pedido
- [ ] `RespuestaProveedor.vue` - Sección de respuesta del proveedor
- [ ] `RedistribucionTiendas.vue` - Componente completo de redistribución
- [ ] `TablaProductos.vue` - Tabla principal de productos
- [ ] `ReporteDiferencias.vue` - Sección de reporte de diferencias

### Fase 4: Extraer Tipos (Seguro)
- [ ] Crear `types/pedido-detalle.ts` - Interfaces locales

## Orden de Ejecución Recomendado

1. **Primero:** Extraer utilidades (formatters, validators)
2. **Segundo:** Extraer composables
3. **Tercero:** Extraer tipos locales
4. **Cuarto:** Extraer componentes pequeños primero
5. **Quinto:** Extraer componentes grandes

## Ventajas de Este Enfoque

- **Seguro:** Cada paso es independiente y testeable
- **Incremental:** Se puede parar en cualquier fase
- **Reversible:** Cambios pequeños son fáciles de revertir
- **Testeable:** Cada extracción puede probarse individualmente
