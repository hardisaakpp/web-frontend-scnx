# Implementación de Códigos de Error Específicos en Frontend

## 📝 Resumen

Se implementó el manejo específico de los nuevos códigos de error del backend en el frontend, proporcionando experiencia de usuario mejorada con mensajes claros y acciones específicas para cada tipo de error.

## ✅ Códigos de Error Implementados

### 1. **FORMATO_EXCEL_INVALIDO**
- **Color:** Amarillo/Ámbar
- **Icono:** Documento
- **Mensaje:** Indica que el archivo debe contener las hojas 'cabecera' y 'detalle'
- **Acciones sugeridas:**
  - Descargar la plantilla oficial
  - Verificar nombres de hojas exactos
  - No eliminar ni renombrar hojas
  - Usar formato .xlsx o .xls

### 2. **ARCHIVO_SIN_DATOS**
- **Color:** Ámbar/Naranja
- **Icono:** Archivo vacío
- **Mensaje:** El archivo está vacío o sin productos válidos
- **Acciones sugeridas:**
  - Verificar hoja 'detalle' con productos
  - Asegurar que cada producto tenga código, cantidad y distribución
  - Revisar filas vacías entre productos
  - Confirmar cantidades numéricas válidas

### 3. **FORMATO_RESPUESTA_PROVEEDOR_INVALIDO**
- **Color:** Rojo/Rosa
- **Icono:** Documento con error
- **Mensaje:** Archivo de respuesta sin hoja RESUMEN
- **Acciones sugeridas:**
  - Verificar hoja 'RESUMEN' (mayúsculas)
  - Solicitar formato correcto al proveedor
  - Contactar sistemas si persiste

### 4. **NUMERO_PEDIDO_DUPLICADO** (Ya existente - mejorado)
- **Color:** Naranja
- **Icono:** Advertencia
- **Mensaje:** Número de pedido ya existe
- **Acciones sugeridas:**
  - Verificar número en Excel
  - Cambiar por uno único
  - Volver a subir

## 🔧 Cambios Técnicos Realizados

### 1. `UploadErrorModal.vue`

#### Nuevas Propiedades Computed

```typescript
/**
 * Determina los estilos del modal según el tipo de error
 */
const getErrorStyle = computed(() => {
  const errorCode = props.uploadErrorInfo?.error_code
  
  // Retorna objeto con:
  // - header: clases CSS para el encabezado
  // - iconBg: clases CSS para fondo del icono
  // - iconColor: clases CSS para color del icono
  // - titleColor: clases CSS para color del título
})

/**
 * Determina si se debe ocultar el mensaje genérico
 */
const shouldHideGenericMessage = computed(() => {
  const errorCode = props.uploadErrorInfo?.error_code
  // Retorna true si hay mensaje específico
})
```

#### Nuevas Secciones UI

Se agregaron 3 nuevas secciones específicas en el template:
1. Sección para `FORMATO_EXCEL_INVALIDO`
2. Sección para `ARCHIVO_SIN_DATOS`
3. Sección para `FORMATO_RESPUESTA_PROVEEDOR_INVALIDO`

Cada sección incluye:
- Diseño con gradiente de colores apropiado
- Icono representativo
- Mensaje descriptivo
- Lista de acciones sugeridas
- Diseño responsive y compatible con modo oscuro

### 2. `useFileUpload.ts` (Composable)

#### Mejoras en `processUploadError`

```typescript
// Extracción temprana del error_code
const errorCode = e.response?.data?.error_code || 
                  e.response?.data?.data?.error_code ||
                  e.response?.data?.error_tipo

// Títulos y mensajes específicos por código
if (errorCode === 'FORMATO_EXCEL_INVALIDO') {
  errorTitle = 'Formato Excel Inválido'
  errorMessage = '...' // Mensaje específico
}
else if (errorCode === 'ARCHIVO_SIN_DATOS') {
  errorTitle = 'Archivo Sin Datos Válidos'
  errorMessage = '...' // Mensaje específico
}
else if (errorCode === 'FORMATO_RESPUESTA_PROVEEDOR_INVALIDO') {
  errorTitle = 'Formato de Respuesta Proveedor Inválido'
  errorMessage = '...' // Mensaje específico
}
```

## 🎨 Diseño de UI

### Paleta de Colores por Error

| Código de Error | Color Principal | Uso |
|----------------|-----------------|-----|
| `FORMATO_EXCEL_INVALIDO` | Amarillo (#FBBF24) | Advertencia de formato |
| `ARCHIVO_SIN_DATOS` | Ámbar (#F59E0B) | Advertencia de contenido |
| `FORMATO_RESPUESTA_PROVEEDOR_INVALIDO` | Rojo (#EF4444) | Error crítico |
| `NUMERO_PEDIDO_DUPLICADO` | Naranja (#F97316) | Advertencia de duplicado |

### Estructura del Modal

```
┌─────────────────────────────────────────┐
│ [Icono] Título del Error                │  ← Header con color específico
├─────────────────────────────────────────┤
│ 🛡️ Protección de datos (opcional)       │
│ 📄 Archivo rechazado: nombre.xlsx       │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ [Icono Grande]                      │ │
│ │                                     │ │
│ │ Título Específico del Error         │ │
│ │                                     │ │
│ │ Descripción detallada...            │ │
│ │                                     │ │
│ │ ¿Qué hacer?                         │ │
│ │ ▸ Acción 1                          │ │
│ │ ▸ Acción 2                          │ │
│ │ ▸ Acción 3                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│                 [Descartar]             │
└─────────────────────────────────────────┘
```

## 🧪 Flujo de Detección de Errores

```
Usuario sube archivo
        ↓
Backend valida formato
        ↓
    ¿Válido?
     ↙    ↘
   SÍ     NO
   ↓      ↓
Procesa   Retorna BusinessException
          con error_code específico
          ↓
Frontend intercepta en useFileUpload
          ↓
processUploadError() extrae error_code
          ↓
Genera UploadErrorInfo con:
  - title (específico por código)
  - message (detallado)
  - error_code
  - fileName
          ↓
UploadErrorModal recibe info
          ↓
getErrorStyle computed determina colores
          ↓
Muestra sección específica según error_code
          ↓
Usuario ve mensaje claro con acciones
```

## 📊 Comparación: Antes vs Después

### Antes
```
❌ Error al cargar plantilla
Mensaje genérico del backend
[Descartar]
```

### Después
```
📄 Formato Excel Inválido

El archivo debe contener:
✓ cabecera (Información del pedido)
✓ detalle (Productos y distribuciones)

¿Cómo solucionarlo?
▸ Descarga la plantilla oficial
▸ Verifica nombres exactos de hojas
▸ No elimines ni renombres hojas
▸ Usa formato .xlsx o .xls

[Descartar]
```

## 🔄 Compatibilidad

### Retrocompatibilidad
La implementación mantiene compatibilidad con:
- Versiones anteriores del backend (fallback por detección de texto)
- Errores sin `error_code` (usa título y mensaje genérico)
- Códigos de error futuros (estilo por defecto)

### Prioridad de Detección
1. **error_code específico** (más confiable)
2. **Detección por título** (fallback)
3. **Estilo genérico** (por defecto)

## 🎯 Beneficios

### Para el Usuario
- ✅ Mensajes claros y específicos
- ✅ Acciones concretas para resolver
- ✅ Diseño visual que diferencia tipos de error
- ✅ Menos frustración al cargar archivos

### Para el Equipo
- ✅ Menos consultas de soporte
- ✅ Usuarios pueden auto-resolver problemas
- ✅ Mejor experiencia de usuario
- ✅ Código mantenible y escalable

## 📝 Notas de Implementación

### Archivos Modificados
1. ✏️ `src/modules/mba3-consultas/components/UploadErrorModal.vue`
   - Agregadas propiedades computed
   - Agregadas 3 secciones específicas
   - Actualizado encabezado dinámico

2. ✏️ `src/modules/mba3-consultas/composables/useFileUpload.ts`
   - Mejorada función `processUploadError`
   - Agregada lógica para códigos específicos
   - Eliminada duplicación de código

### Testing Recomendado

#### Escenarios a Probar
1. ✅ Subir archivo sin hojas 'cabecera'/'detalle' → `FORMATO_EXCEL_INVALIDO`
2. ✅ Subir archivo vacío → `ARCHIVO_SIN_DATOS`
3. ✅ Subir respuesta proveedor sin 'RESUMEN' → `FORMATO_RESPUESTA_PROVEEDOR_INVALIDO`
4. ✅ Subir con número de pedido duplicado → `NUMERO_PEDIDO_DUPLICADO`
5. ✅ Verificar modo oscuro en todos los casos
6. ✅ Verificar responsive en móviles

#### Comandos de Testing
```bash
# Development
npm run dev

# Build
npm run build

# Linter
npm run lint
```

## 🚀 Próximos Pasos

### Opcional - Mejoras Futuras
1. Agregar animaciones de entrada/salida del modal
2. Implementar "Descargar plantilla" directo desde modal
3. Agregar tooltips en acciones específicas
4. Implementar analytics para tracking de errores
5. Agregar botón "¿Necesitas ayuda?" con enlace a documentación

## 📚 Referencias

- Documentación Backend: `docs/CAMBIOS_VALIDACION_FORMATO_EXCEL.md`
- Componente Modal: `src/modules/mba3-consultas/components/UploadErrorModal.vue`
- Composable: `src/modules/mba3-consultas/composables/useFileUpload.ts`
- Tipos: `src/modules/mba3-consultas/types.ts`

---

**Fecha de implementación:** 2026-02-13  
**Versión:** 1.0.0  
**Estado:** ✅ Completado
