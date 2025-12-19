# SCNexus Frontend

Frontend de la aplicación SCNexus construido con Vue 3, TypeScript y Vite.

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+ 
- npm o yarn

### Instalación

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

## 📦 Estructura del Proyecto

```
src/
├── modules/              # Módulos de la aplicación
│   ├── contabilidad/    # Módulo de contabilidad
│   ├── depositos/       # Módulo de depósitos
│   ├── mba3-consultas/  # Consultas MBA3
│   ├── reportes/        # Módulo de reportes
│   └── usuarios/        # Gestión de usuarios, roles y permisos
├── components/          # Componentes compartidos
├── layouts/            # Layouts de la aplicación
├── router/             # Configuración de rutas
├── services/           # Servicios compartidos
├── stores/             # Stores Pinia globales
└── views/              # Vistas compartidas
```

## 🎯 Módulos Principales

### Usuarios, Roles y Permisos
Sistema completo de gestión de usuarios con control de acceso basado en roles (RBAC).

- **Rutas:** `/usuarios`, `/roles`, `/permisos`
- **Documentación:** Ver [src/modules/usuarios/README.md](src/modules/usuarios/README.md)

### MBA3 Consultas
Módulo para consultas y gestión de órdenes de compra, despachos y remisiones.

- **Rutas:** `/dashboard`, `/ordenes-compra`, `/remisiones`, `/homologaciones`, `/proceso-completo`
- **Características:**
  - Integración con SAP
  - Polling automático de despachos
  - Optimización de actualización de estados

### Contabilidad
Módulo de ejemplo que muestra la estructura recomendada para nuevos módulos.

- **Ruta:** `/contabilidad`
- **Documentación:** Ver [src/modules/contabilidad/README.md](src/modules/contabilidad/README.md)

## 📚 Documentación

- **[Guía de Desarrollo de Módulos](MODULOS.md)** - Cómo crear nuevos módulos
- **[Documentación Técnica](docs/)** - Documentación técnica detallada
  - [Optimización de Estados ODC](docs/optimizacion-estados-odc.md)
  - [Polling Automático de Despachos](docs/polling-automatico-despachos.md)

## 🛠️ Tecnologías

- **Vue 3** - Framework frontend
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Pinia** - Gestión de estado
- **Vue Router** - Enrutamiento
- **Tailwind CSS** - Estilos
- **Axios** - Cliente HTTP

## 🔐 Autenticación

La aplicación utiliza JWT para autenticación. El token se almacena y se envía automáticamente en las peticiones HTTP.

## 📝 Desarrollo

### Crear un Nuevo Módulo

Ver la [Guía de Desarrollo de Módulos](MODULOS.md) para instrucciones detalladas.

### Estructura de un Módulo

Cada módulo debe seguir esta estructura:

```
src/modules/[nombre-modulo]/
├── views/          # Vistas del módulo
├── components/     # Componentes específicos
├── services/       # Servicios API
├── stores/         # Stores Pinia
├── router.ts       # Rutas del módulo
└── types.ts        # Tipos TypeScript
```

## 📄 Licencia

Este proyecto es privado y de uso interno.
