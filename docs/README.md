# Documentación Técnica - SCNexus Frontend

Índice completo de la documentación técnica del proyecto.

## 📚 Índice

### 🖥️ Despliegue

- **[Guía de despliegue](DEPLOYMENT.md)** — Servidor de pruebas (DESA), script `nexus_frontend.sh`, producción (Nginx/build)

### 🚀 Guías de Desarrollo

1. **[Guía de Desarrollo de Módulos](MODULOS.md)** ⭐
   - Estructura de un módulo
   - Cómo crear un módulo paso a paso
   - Tipos, servicios, stores y rutas
   - Ejemplos y mejores prácticas
   - Solución de problemas comunes
   - Permisos nuevos en código: registrar la misma clave en Core — ver [SISTEMA_PERMISOS.md](SISTEMA_PERMISOS.md#registro-en-scnexus-core-al-agregar-permisos)

2. **[Sistema de Permisos](SISTEMA_PERMISOS.md)** 🔐 — **documento canónico** para permisos
   - JWT, rutas, menú y componentes
   - **Backend + frontend:** misma clave en Core (catálogo, roles, JWT) y en el código del front; resumen en [Configuracion en dos capas](SISTEMA_PERMISOS.md#configuracion-permisos-backend-frontend)
   - **Registro obligatorio en SCNexus Core** cada vez que aparezca una clave nueva en el frontend (misma string en catálogo y roles; re-login)
   - Política global y checklist de PR: [Registro en SCNexus Core al agregar permisos](SISTEMA_PERMISOS.md#registro-en-scnexus-core-al-agregar-permisos)

3. **[Guía de Modo Oscuro](DARK_MODE_GUIDE.md)** 🌙
   - Implementación de dark mode
   - Paleta de colores recomendada
   - Ejemplos de componentes
   - Uso del theme store
   - Mejores prácticas

4. **[Convenciones y flujos frontend](FRONTEND.md)**
   - Gestión del botón "Confirmar" en detalle del pedido (§2)
   - Endpoint y persistencia de la confirmación
   - Cuándo deshabilitar el botón

5. **[Sincronización UI tras mutaciones API](MUTACIONES_API_SINCRONIZACION_UI.md)** ⭐
   - Estándar del proyecto: fusionar la respuesta PATCH/PUT/POST en el estado local
   - Auditoría (última modificación, usuario) sin refetch obligatorio
   - Patrones en servicio y vista; referencia en `gestion-usuarios`
   - Alcance incremental en el resto de módulos

6. **[Funcionalidades Estandarizadas (Escalables)](FUNCIONALIDADES_ESTANDARIZADAS.md)** ⭐
   - Toast estandarizado reusable por módulo
   - SSE y reacción por `metadata.accion`
   - Sincronización frontend-backend reutilizable
   - Checklist de implementación transversal

### ⚙️ Optimizaciones y Mejoras

7. **[Timeouts y envío a SAP (frontend ↔ backend)](timeout-sincronizado-frontend-backend.md)** ⭐
   - `integrarSAP` 120–300 s, proceso async con polling hasta 10 min
   - Errores transitorios (toast amarillo + refresh sin `ERROR` local)
   - Checklist de validación y alineación con proxy/Celery

8. **[Optimización de Actualización de Estados ODC](optimizacion-estados-odc.md)** 
   - Sistema de retry inteligente
   - Optimización de carga paralela
   - Reducción de delays artificiales
   - Métricas de mejora

9. **[Polling Automático de Despachos](polling-automatico-despachos.md)**
   - Sistema de actualización automática
   - Indicadores visuales en tiempo real
   - Sincronización con proceso backend
   - Control de intervalo de polling

### 🔧 Refactorizaciones

10. **[Refactorización Pedido Detalle](REFACTORIZACION_PEDIDO_DETALLE.md)**
   - Mejoras en la vista de detalle de pedidos
   - Optimización de componentes
   - Separación de responsabilidades

### 📊 Análisis y Cambios Backend

11. **[Análisis HU-02 Frontend](ANALISIS_HU-02_FRONTEND.md)**
   - Análisis de historia de usuario 02
   - Cambios requeridos en frontend
   - Impacto en componentes

12. **[Cambios Backend - Procesado SAP](cambios-backend-procesado-sap.md)**
   - Integración con nuevo endpoint de SAP
   - Adaptación de componentes frontend
   - Manejo de respuestas SAP

## 🗂️ Estructura de Documentación

```
docs/
├── README.md (este archivo - índice)
│
├── 🖥️ DESPLIEGUE
│   └── DEPLOYMENT.md (pruebas DESA + producción)
│
├── 🚀 GUÍAS DE DESARROLLO
│   ├── MODULOS.md ⭐
│   ├── SISTEMA_PERMISOS.md 🔐 (canónico: permisos + Core)
│   ├── DARK_MODE_GUIDE.md 🌙
│   ├── FRONTEND.md
│   ├── MUTACIONES_API_SINCRONIZACION_UI.md ⭐
│   └── FUNCIONALIDADES_ESTANDARIZADAS.md ⭐
│
├── ⚙️ OPTIMIZACIONES
│   ├── timeout-sincronizado-frontend-backend.md ⭐
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
2. [SISTEMA_PERMISOS.md](SISTEMA_PERMISOS.md#registro-en-scnexus-core-al-agregar-permisos) - Si introduces permisos nuevos, registrar en Core (misma clave) y documentar en el PR
3. [MUTACIONES_API_SINCRONIZACION_UI.md](MUTACIONES_API_SINCRONIZACION_UI.md) - Guardar y refrescar filas desde la respuesta API
4. [FUNCIONALIDADES_ESTANDARIZADAS.md](FUNCIONALIDADES_ESTANDARIZADAS.md) - Patrones transversales reutilizables
5. Revisar módulos existentes como referencia
6. [DARK_MODE_GUIDE.md](DARK_MODE_GUIDE.md) - Soporte dark mode

### 🔧 Optimización y Mejoras
1. [timeout-sincronizado-frontend-backend.md](timeout-sincronizado-frontend-backend.md) - Envío a SAP y timeouts
2. [optimizacion-estados-odc.md](optimizacion-estados-odc.md) - Patrones de optimización
3. [polling-automatico-despachos.md](polling-automatico-despachos.md) - Actualizaciones en tiempo real

### 🔌 Integración con Backend
1. [timeout-sincronizado-frontend-backend.md](timeout-sincronizado-frontend-backend.md) - Timeouts SAP, polling async, errores transitorios
2. [cambios-backend-procesado-sap.md](cambios-backend-procesado-sap.md) - Endpoints SAP
3. [ANALISIS_HU-02_FRONTEND.md](ANALISIS_HU-02_FRONTEND.md) - Análisis de cambios

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
- **Permisos: backend + frontend (dos capas)**: [SISTEMA_PERMISOS.md](SISTEMA_PERMISOS.md#configuracion-permisos-backend-frontend)
- **Permisos nuevos (código frontend + alta en Core)**: [SISTEMA_PERMISOS.md — Registro en Core](SISTEMA_PERMISOS.md#registro-en-scnexus-core-al-agregar-permisos)
- **Despliegue (pruebas y producción)**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Desarrollo de módulos**: MODULOS.md
- **Mutaciones API y estado local**: MUTACIONES_API_SINCRONIZACION_UI.md
- **Patrones estandarizados reutilizables**: FUNCIONALIDADES_ESTANDARIZADAS.md
- **UI y diseño**: DARK_MODE_GUIDE.md
- **Performance**: optimizacion-*.md
- **Tiempo real**: polling-*.md
- **Backend**: cambios-backend-*.md, ANALISIS-*.md

### Por Módulo
- **MBA3 Consultas**: Todos los archivos de optimización y polling
- **Usuarios**: Ver [src/modules/usuarios/README.md](../src/modules/usuarios/README.md)
- **Gestión empleados / tienda (referencia mutaciones)**: `src/modules/gestion-usuarios/`
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

**Última actualización:** Mayo 2026  
**Mantenido por:** Equipo de Desarrollo SCNexus
