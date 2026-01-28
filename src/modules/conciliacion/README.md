# Módulo de Conciliación Tesorería

Módulo para gestionar procesos de conciliación de tesorería.

## Estructura

```
conciliacion/
├── components/          # Componentes reutilizables (futuro)
├── composables/         # Lógica reutilizable (futuro)
├── services/            # Servicios de API
│   └── conciliacionApi.ts
├── stores/              # Estado global (Pinia)
│   └── conciliacionStore.ts
├── types.ts             # Definiciones TypeScript
├── router.ts            # Configuración de rutas
├── views/               # Vistas principales
│   └── ConciliacionView.vue
└── README.md            # Este archivo
```

## Estado Actual

✅ Estructura básica creada
✅ Router configurado
✅ Store completo con CRUD
✅ Vista principal con funcionalidades de prueba
✅ Integración con router principal
✅ Integración con sidebar
✅ **Alineado con backend FastAPI**

## Configuración

### Variables de Entorno

```env
# URL del microservicio de conciliación tesorería
# Desarrollo (localhost):
VITE_CONCILIACION_API_BASE_URL=http://localhost:8002

# Producción (relativa - requiere API Gateway):
VITE_CONCILIACION_API_BASE_URL=/api/conciliacion

# Producción (absoluta - APIs separadas):
VITE_CONCILIACION_API_BASE_URL=https://tesoreria-api.production.com:8002/conciliacion-tesoreria
```

**Nota:** La URL se configura en `.env` (desarrollo) o `.env.production` (producción).

## Endpoints del Backend

### Públicos (sin autenticación)
- `GET /` - Información del módulo
- `GET /conciliacion-tesoreria/health` - Health check

### Protegidos (requieren JWT)
- `GET /conciliacion-tesoreria/info` - Información del módulo
- `GET /conciliacion-tesoreria/permisos` - Permisos del usuario actual

### CRUD de Conciliaciones
- `GET /conciliacion-tesoreria/conciliaciones` - Listar (permiso: `conciliacion-tesoreria.ver`)
- `POST /conciliacion-tesoreria/conciliaciones` - Crear (permiso: `conciliacion-tesoreria.crear`)
- `PUT /conciliacion-tesoreria/conciliaciones/{id}` - Actualizar (permiso: `conciliacion-tesoreria.editar`)
- `DELETE /conciliacion-tesoreria/conciliaciones/{id}` - Eliminar (permiso: `conciliacion-tesoreria.eliminar`)

### Upload de Documentos
- `POST /conciliacion-tesoreria/documentos/upload` - Subir documento (permiso: `conciliacion-tesoreria.crear`)
  - Tipos permitidos: `.xlsx`, `.xls`, `.csv`, `.pdf`
  - Tamaño máximo: 10 MB

## Permisos Requeridos

El módulo requiere los siguientes permisos (registrados en el Core SC2):

- `conciliacion-tesoreria.ver` - Ver conciliaciones
- `conciliacion-tesoreria.crear` - Crear conciliaciones
- `conciliacion-tesoreria.editar` - Editar conciliaciones
- `conciliacion-tesoreria.eliminar` - Eliminar conciliaciones

## Uso del Store

```typescript
import { useConciliacionStore } from '@/modules/conciliacion/stores/conciliacionStore'

const store = useConciliacionStore()

// Obtener permisos
await store.fetchPermisos()

// Listar conciliaciones
await store.fetchConciliaciones()

// Obtener una conciliación
await store.fetchConciliacion(id)

// Crear conciliación
await store.createConciliacion({
  fecha: '2024-01-01',
  descripcion: 'Descripción',
  monto: 1000
})

// Actualizar conciliación
await store.updateConciliacion(id, {
  descripcion: 'Nueva descripción'
})

// Eliminar conciliación
await store.deleteConciliacion(id)

// Subir documento
await store.uploadDocumento(file)
```

## Computed Properties del Store

- `hasData` - Indica si hay conciliaciones cargadas
- `hasError` - Indica si hay un error
- `tienePermisoVer` - Verifica permiso de lectura
- `tienePermisoCrear` - Verifica permiso de creación
- `tienePermisoEditar` - Verifica permiso de edición
- `tienePermisoEliminar` - Verifica permiso de eliminación

## Próximos Pasos

- [ ] Crear componente de tabla de conciliaciones
- [ ] Crear formulario de creación/edición
- [ ] Crear componente de upload de documentos
- [ ] Implementar filtros y búsqueda
- [ ] Agregar exportación de datos
- [ ] Implementar paginación
- [ ] Agregar validaciones de formularios

## Notas

- El backend está en desarrollo, algunos endpoints retornan respuestas mock
- La lógica de negocio está pendiente en el backend
- El frontend está listo para integrarse cuando el backend esté completo
