# Módulo de Personal de Tiendas

Módulo base para centralizar funcionalidades relacionadas con la gestión de usuarios.

## Estructura

```text
gestion-usuarios/
├── views/
│   └── GestionUsuariosView.vue   # Vista principal del módulo
├── services/
│   └── storeEmployeesApi.ts      # CRUD + catálogo de cargos
├── types/
│   └── cargo.ts                  # Valores permitidos de `cargo`
├── router.ts                     # Rutas del módulo
└── README.md                     # Documentación del módulo
```

## Estado Actual

- ✅ Módulo creado y registrado en el router principal
- ✅ Vista inicial disponible (`GestionUsuariosView.vue`)
- ✅ Acceso desde sidebar en la sección `Módulos`
- ✅ Control de acceso por permisos

## Rutas

El módulo expone actualmente la siguiente ruta:

- `/gestion-usuarios`

Configuración en `router.ts`:

- `name`: `gestion-usuarios`
- `meta.requiresAuth`: `true`
- `meta.permissions`: `['gestionusuarios.view', 'staff.view']`
- `meta.title`: `Personal de Tiendas`

## Backend Integrado

Este módulo consume la API REST .NET usando el prefijo interno `/employees-api`:

- `GET /api/v1/store-employees` (listado paginado y filtros)
- `GET /api/v1/store-employees/{id}` (detalle)
- `GET /api/v1/store-employees/meta/cargos` → `{ ok: true, data: string[] }`
- `GET /api/v1/store-employees/meta/almacenes` → catálogo de tiendas
- `GET /api/v1/store-employees/health` (disponibilidad del servicio)
- `POST /api/v1/store-employees`
- `PUT|PATCH /api/v1/store-employees/{id}`
- `DELETE /api/v1/store-employees/{id}` (soft delete, `estado=0`)

### Orden estándar de columnas (grid)

En la tabla principal de `GestionUsuariosView.vue`, el orden estándar definido para columnas es:

1. Cédula
2. Nombre
3. Tienda
4. Cargo
5. Correo
6. Encargado
7. Estado

### Valores de `cargo` (obligatorios)

Solo se envían y filtran estos valores exactos (ortografía y mayúsculas):

- `Administrador de tienda`
- `Jefe de tienda`
- `Director de tienda`
- `Asesor de ventas`

El backend responde `422` si `cargo` no coincide. El formulario usa el catálogo anterior; si un registro antiguo tiene otro texto, aparece en el combo para poder corregirlo y guardar.

### Campo `encargado` (BIT)

- Listados y detalle incluyen `encargado` como `0` / `1`.
- Filtro opcional en listado: `?encargado=0` o `?encargado=1`.
- `POST` / `PATCH`: se envía `encargado` como `0` o `1`.
- Si **`estado`** es inactivo (`0`), la UI deshabilita “Encargado” y fuerza **No** (`0`); el payload envía siempre `encargado: 0` en ese caso.

**Nota:** hace falta ejecutar el script SQL en la base (`store_employees_add_encargado.sql`) antes de usar el módulo; sin la columna el listado fallará en el servidor.

Servicio frontend:

- `src/modules/gestion-usuarios/services/storeEmployeesApi.ts`

Vista principal:

- `src/modules/gestion-usuarios/views/GestionUsuariosView.vue`

### Variable de entorno recomendada

Definir en `.env.development` (o entorno correspondiente):

```env
VITE_STORE_EMPLOYEES_API_URL=/employees-api/api/v1/store-employees
VITE_STORE_EMPLOYEES_PROXY_TARGET=https://localhost:8015
```

Si no se define, el módulo usa `/employees-api/api/v1/store-employees` como fallback.
El proxy elimina `/employees-api` y redirige la ruta restante a la API .NET.

## Permisos

Para ver el módulo se requiere al menos uno de:

- `gestionusuarios.view`
- `staff.view`

Notas:

- El botón en el sidebar se muestra si el usuario tiene al menos un permiso que inicie con `gestionusuarios.` o si tiene `staff.view`.
- Usuarios con rol `Admin` mantienen acceso total por la lógica global de autorización.

## Integración en Sidebar

El acceso se encuentra en la sección **Módulos** del sidebar con:

- Etiqueta: `Personal de Tiendas`
- Ruta: `/gestion-usuarios`
- Ícono: `IdentificationIcon`

## Consideraciones de Desarrollo

- Tras **PATCH/PUT**, el servicio fusiona el registro devuelto por el API en la fila (columnas de auditoría **última actualización** / **usuario**). Patrón global del monorepo: [docs/MUTACIONES_API_SINCRONIZACION_UI.md](../../../docs/MUTACIONES_API_SINCRONIZACION_UI.md).
- Mantener este módulo desacoplado de `usuarios`, `roles` y `permisos` mientras se define el alcance funcional.
- Si se agregan nuevas pantallas, registrarlas en `router.ts` y documentarlas en este archivo.
- Seguir la convención de permisos `modulo.accion` (ejemplo: `gestionusuarios.create`).

## Próximos Pasos Sugeridos

- [ ] Definir alcance funcional (catálogo, perfiles, auditoría, etc.)
- [ ] Crear store de módulo (`stores/gestionUsuariosStore.ts`) si aplica
- [ ] Integrar servicios API (`services/gestionUsuariosApi.ts`)
- [ ] Agregar pruebas de navegación y autorización
