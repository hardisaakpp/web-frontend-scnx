# SCNexus Frontend

Frontend de la aplicación SCNexus construido con Vue 3, TypeScript y Vite.

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+
- npm o yarn

### Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

**Servidor de desarrollo:** http://localhost:3000

## 📦 Estructura del Proyecto

```
src/
├── modules/              # Módulos de la aplicación
│   ├── mba3-consultas/  # Consultas MBA3, pedidos, ODC
│   ├── usuarios/        # Gestión de usuarios, roles y permisos
│   ├── contabilidad/    # Módulo de contabilidad
│   ├── conciliacion/    # Módulo de conciliación
│   ├── depositos/       # Módulo de depósitos
│   └── reportes/        # Módulo de reportes
├── components/          # Componentes compartidos
├── composables/         # Composables reutilizables
├── layouts/            # Layouts de la aplicación
├── router/             # Configuración de rutas
├── services/           # Servicios compartidos (API, auth)
├── stores/             # Stores Pinia globales
└── views/              # Vistas compartidas
```

## 🎯 Módulos Principales

### MBA3 Consultas
Sistema completo de gestión de pedidos, órdenes de compra y despachos.

- **Rutas:** `/dashboard`, `/ordenes-compra`, `/pedidos`, `/remisiones`, `/homologaciones`
- **Características:**
  - Creación y validación de pedidos
  - Integración con SAP
  - Polling automático de despachos
  - Gestión de homologaciones SKU
  - Procesamiento de órdenes de compra

### Usuarios, Roles y Permisos
Sistema completo de gestión de acceso (RBAC).

- **Rutas:** `/usuarios`, `/roles`, `/permisos`
- **Documentación:** [src/modules/usuarios/README.md](src/modules/usuarios/README.md)

### Otros Módulos
- **Contabilidad** - `/contabilidad`
- **Conciliación** - `/conciliacion`
- **Depósitos** - `/depositos`
- **Reportes** - `/reportes`

## 📚 Documentación

### Guías de Desarrollo
- **[Guía de Desarrollo de Módulos](docs/MODULOS.md)** 🚀 - Cómo crear nuevos módulos paso a paso
- **[Guía de Modo Oscuro](docs/DARK_MODE_GUIDE.md)** 🌙 - Implementar dark mode en componentes
- **[Índice de Documentación](docs/README.md)** - Documentación técnica completa

### Documentación Técnica
- [Optimización de Estados ODC](docs/optimizacion-estados-odc.md)
- [Polling Automático de Despachos](docs/polling-automatico-despachos.md)
- [Refactorización Pedido Detalle](docs/REFACTORIZACION_PEDIDO_DETALLE.md)
- [Análisis HU-02 Frontend](docs/ANALISIS_HU-02_FRONTEND.md)

## 🛠️ Tecnologías

- **Vue 3** - Framework progresivo de JavaScript
- **TypeScript** - Tipado estático
- **Vite** - Build tool ultrarrápido
- **Pinia** - Gestión de estado
- **Vue Router** - Enrutamiento
- **Tailwind CSS** - Framework CSS utility-first
- **Axios** - Cliente HTTP
- **Chart.js** - Gráficos y visualizaciones

## ✨ Características

### Generales
- ✅ Autenticación JWT con tokens persistentes
- ✅ Modo oscuro con persistencia de preferencias
- ✅ Sistema de permisos granular (RBAC)
- ✅ Componentes reutilizables y modulares
- ✅ Responsive design (mobile-first)
- ✅ Lazy loading de módulos y rutas

### MBA3 Consultas
- ✅ Creación de pedidos desde Excel
- ✅ Validación en tiempo real de SKUs
- ✅ Sistema de homologaciones MBA3 ↔ SAP
- ✅ Procesamiento de órdenes de compra
- ✅ Integración bidireccional con SAP
- ✅ Dashboard con métricas en tiempo real
- ✅ Exportación a Excel

## 🎨 Desarrollo

### Crear un Nuevo Módulo

Ver la [Guía de Desarrollo de Módulos](docs/MODULOS.md) para instrucciones detalladas.

**Estructura básica:**
```
src/modules/[nombre-modulo]/
├── views/          # Vistas del módulo
├── components/     # Componentes específicos
├── services/       # Servicios API
├── stores/         # Stores Pinia
├── router.ts       # Rutas del módulo
└── types.ts        # Tipos TypeScript
```

### Modo Oscuro

Ver la [Guía de Modo Oscuro](docs/DARK_MODE_GUIDE.md) para implementar dark mode en tus componentes.

**Ejemplo:**
```vue
<div class="bg-white dark:bg-gray-800">
  <h1 class="text-gray-900 dark:text-white">Título</h1>
  <p class="text-gray-600 dark:text-gray-300">Descripción</p>
</div>
```

### Buenas Prácticas

1. **Modularidad** - Cada módulo debe ser independiente
2. **TypeScript** - Definir todos los tipos explícitamente
3. **Composables** - Reutilizar lógica común
4. **Lazy Loading** - Cargar módulos bajo demanda
5. **Error Handling** - Manejar errores en servicios
6. **Responsive** - Diseñar mobile-first

## 🔐 Autenticación y Seguridad

- Autenticación JWT con renovación automática
- Tokens almacenados en `localStorage`
- Interceptores Axios para agregar tokens
- Redirección automática al login si no está autenticado
- Control de permisos a nivel de ruta y componente

**Ejemplo de ruta protegida:**
```typescript
{
  path: '/admin',
  meta: { 
    requiresAuth: true,
    permissions: ['admin.view']
  }
}
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén configurados)
npm run test

# Tests unitarios
npm run test:unit

# Tests e2e
npm run test:e2e
```

## 🚀 Deploy

```bash
# Build para producción
npm run build

# Los archivos compilados estarán en /dist
```

### Variables de Entorno

Configurar en `.env.production`:
```env
# Patrón 1: URLs relativas (API Gateway/Proxy) - RECOMENDADO
VITE_API_URL=/api
VITE_MBA3_API_BASE_URL=/api/mba3
VITE_CONCILIACION_API_BASE_URL=/api/conciliacion
VITE_PREFERENCES_API_URL=/api/mba3

# Patrón 2: URLs absolutas (APIs en hosts separados)
# VITE_MBA3_API_BASE_URL=https://api.production.com:8000
# VITE_CONCILIACION_API_BASE_URL=https://api.production.com:8002/conciliacion-tesoreria

VITE_APP_NAME=SCNexus
```

**📖 Referencia completa:** [docs/PRODUCTION_ENV_CHECKLIST.md](docs/PRODUCTION_ENV_CHECKLIST.md)

## 🤝 Colaboración

1. Cada desarrollador trabaja en su módulo
2. Hacer commits frecuentes con mensajes descriptivos
3. Nombres de ramas: `feature/modulo-funcionalidad`
4. Pull requests con descripción clara
5. Code review antes de merge

## 📝 Convenciones

### Nombres de Archivos
- Componentes: `PascalCase.vue` (ej: `UserModal.vue`)
- Composables: `camelCase.ts` con prefijo `use` (ej: `useAuth.ts`)
- Stores: `camelCase.ts` con sufijo `Store` (ej: `authStore.ts`)
- Tipos: `types.ts` o `[nombre].types.ts`

### Estilo de Código
- 2 espacios de indentación
- Comillas simples
- Punto y coma opcional
- Usar Composition API con `<script setup>`

## 📞 Soporte

Para dudas sobre desarrollo o arquitectura, consulta:
1. [Guía de Módulos](docs/MODULOS.md)
2. [Documentación técnica](docs/README.md)
3. Módulos existentes como referencia

## 📄 Licencia

Este proyecto es privado y de uso interno.

---

**Versión:** 2.0  
**Última actualización:** Enero 2026  
**Documentación completa:** [docs/README.md](docs/README.md)
