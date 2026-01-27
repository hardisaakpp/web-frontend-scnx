# Documentación Técnica - SCNexus Frontend

Índice completo de la documentación técnica del proyecto.

## 📚 Índice

### 🚀 Guías de Desarrollo

1. **[Guía de Desarrollo de Módulos](MODULOS.md)** ⭐
   - Estructura de un módulo
   - Cómo crear un módulo paso a paso
   - Tipos, servicios, stores y rutas
   - Ejemplos y mejores prácticas
   - Solución de problemas comunes

2. **[Guía de Modo Oscuro](DARK_MODE_GUIDE.md)** 🌙
   - Implementación de dark mode
   - Paleta de colores recomendada
   - Ejemplos de componentes
   - Uso del theme store
   - Mejores prácticas

3. **[Convenciones y flujos frontend](FRONTEND.md)**
   - Gestión del botón "Confirmar" en detalle del pedido (0.5.9.1)
   - Endpoint y persistencia de la confirmación
   - Cuándo deshabilitar el botón

### ⚙️ Optimizaciones y Mejoras

4. **[Optimización de Actualización de Estados ODC](optimizacion-estados-odc.md)** 
   - Sistema de retry inteligente
   - Optimización de carga paralela
   - Reducción de delays artificiales
   - Métricas de mejora

5. **[Polling Automático de Despachos](polling-automatico-despachos.md)**
   - Sistema de actualización automática
   - Indicadores visuales en tiempo real
   - Sincronización con proceso backend
   - Control de intervalo de polling

### 🔧 Refactorizaciones

6. **[Refactorización Pedido Detalle](REFACTORIZACION_PEDIDO_DETALLE.md)**
   - Mejoras en la vista de detalle de pedidos
   - Optimización de componentes
   - Separación de responsabilidades

### 📊 Análisis y Cambios Backend

7. **[Análisis HU-02 Frontend](ANALISIS_HU-02_FRONTEND.md)**
   - Análisis de historia de usuario 02
   - Cambios requeridos en frontend
   - Impacto en componentes

8. **[Cambios Backend - Procesado SAP](cambios-backend-procesado-sap.md)**
   - Integración con nuevo endpoint de SAP
   - Adaptación de componentes frontend
   - Manejo de respuestas SAP

## 🗂️ Estructura de Documentación

```
docs/
├── README.md (este archivo - índice)
│
├── 🚀 GUÍAS DE DESARROLLO
│   ├── MODULOS.md ⭐
│   └── DARK_MODE_GUIDE.md 🌙
│
├── ⚙️ OPTIMIZACIONES
│   ├── optimizacion-estados-odc.md
│   └── polling-automatico-despachos.md
│
├── 🔧 REFACTORIZACIONES
│   └── REFACTORIZACION_PEDIDO_DETALLE.md
│
└── 📊 ANÁLISIS Y BACKEND
    ├── ANALISIS_HU-02_FRONTEND.md
    └── cambios-backend-procesado-sap.md
```

## 🎯 Guía de Uso por Objetivo

### 🆕 Nuevo Desarrollador
1. [README principal](../README.md) - Visión general
2. [MODULOS.md](MODULOS.md) - Cómo crear módulos
3. [DARK_MODE_GUIDE.md](DARK_MODE_GUIDE.md) - Modo oscuro

### 🎨 Agregar Funcionalidad
1. [MODULOS.md](MODULOS.md) - Estructura y convenciones
2. Revisar módulos existentes como referencia
3. [DARK_MODE_GUIDE.md](DARK_MODE_GUIDE.md) - Soporte dark mode

### 🔧 Optimización y Mejoras
1. [optimizacion-estados-odc.md](optimizacion-estados-odc.md) - Patrones de optimización
2. [polling-automatico-despachos.md](polling-automatico-despachos.md) - Actualizaciones en tiempo real

### 🔌 Integración con Backend
1. [cambios-backend-procesado-sap.md](cambios-backend-procesado-sap.md) - Endpoints SAP
2. [ANALISIS_HU-02_FRONTEND.md](ANALISIS_HU-02_FRONTEND.md) - Análisis de cambios

## 📝 Convenciones de Documentación

### Símbolos Usados
- ⭐ - Documentación principal o esencial
- 🚀 - Guías de inicio rápido
- 🌙 - Guías de diseño y UI
- ⚙️ - Optimizaciones técnicas
- 🔧 - Refactorizaciones
- 📊 - Análisis y documentación de cambios

### Tipos de Documentos
1. **Guías** - Documentación paso a paso para desarrolladores
2. **Optimizaciones** - Documentación de mejoras de rendimiento
3. **Refactorizaciones** - Documentación de cambios arquitectónicos
4. **Análisis** - Documentación de requisitos y cambios

## 🔍 Búsqueda Rápida

### Por Tema
- **Desarrollo de módulos**: MODULOS.md
- **UI y diseño**: DARK_MODE_GUIDE.md
- **Performance**: optimizacion-*.md
- **Tiempo real**: polling-*.md
- **Backend**: cambios-backend-*.md, ANALISIS-*.md

### Por Módulo
- **MBA3 Consultas**: Todos los archivos de optimización y polling
- **Usuarios**: Ver [src/modules/usuarios/README.md](../src/modules/usuarios/README.md)
- **Contabilidad**: Ver [src/modules/contabilidad/README.md](../src/modules/contabilidad/README.md)

## 💡 Mejores Prácticas

1. **Documentar cambios importantes** - Crear archivos de análisis para cambios significativos
2. **Mantener guías actualizadas** - Revisar y actualizar guías con nuevos patrones
3. **Ejemplos de código** - Incluir ejemplos funcionales en documentación
4. **Referencias cruzadas** - Enlazar documentos relacionados
5. **Solución de problemas** - Documentar problemas comunes y soluciones

## 🚀 Empezando

Si eres nuevo en el proyecto:
1. Lee el [README principal](../README.md)
2. Sigue la [Guía de Módulos](MODULOS.md) para entender la arquitectura
3. Revisa la [Guía de Dark Mode](DARK_MODE_GUIDE.md) para estándares UI
4. Explora módulos existentes como referencia

## 📞 Soporte

Para dudas o sugerencias sobre la documentación:
1. Consulta primero esta documentación
2. Revisa módulos existentes como referencia
3. Contacta al equipo técnico

---

**Última actualización:** Enero 2026  
**Mantenido por:** Equipo de Desarrollo SCNexus
