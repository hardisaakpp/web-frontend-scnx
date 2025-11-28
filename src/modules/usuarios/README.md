# Módulo de Usuarios, Roles y Permisos

Sistema completo para gestionar usuarios, roles y permisos con control de acceso basado en roles (RBAC).

## 📋 Estructura

```
usuarios/
├── views/
│   ├── UsuariosView.vue      # Gestión de usuarios
│   ├── RolesView.vue          # Gestión de roles
│   └── PermisosView.vue       # Gestión de permisos
├── components/
│   ├── UsuarioModal.vue       # Modal crear/editar usuario
│   ├── AsignarRolesModal.vue  # Modal asignar roles a usuario
│   └── AsignarPermisosModal.vue # Modal asignar permisos a rol
├── services/
│   └── usuariosApi.ts         # API services completos
├── stores/
│   ├── usuariosStore.ts       # Estado usuarios
│   ├── rolesStore.ts          # Estado roles
│   └── permisosStore.ts       # Estado permisos
├── router.ts
└── types.ts
```

## 🎯 Funcionalidades

### Usuarios
- ✅ CRUD completo de usuarios
- ✅ Asignar/remover roles
- ✅ Activar/desactivar usuarios
- ✅ Filtrado por nombre, email, rol, estado
- ✅ Paginación
- ✅ Ver permisos derivados de roles

### Roles
- ✅ CRUD completo de roles
- ✅ Asignar/remover permisos a roles
- ✅ Ver usuarios asignados
- ✅ Agrupación de permisos por módulo

### Permisos
- ✅ CRUD completo de permisos
- ✅ Organización por módulos
- ✅ Key format: `modulo.accion` (ej: `depositos.view`, `users.create`)
- ✅ Creación dinámica de módulos

## 🔑 Conceptos Clave

### Diferencia entre Roles y Permisos

**Roles:**
- Grupos de usuarios con responsabilidades similares
- Ejemplos: Admin, Gerente, Contador, Operador
- Un usuario puede tener múltiples roles
- Parte de ASP.NET Identity

**Permisos:**
- Acciones específicas que se pueden realizar
- Ejemplos: `depositos.view`, `users.create`, `reportes.export`
- Se asignan a roles, no directamente a usuarios
- Personalizados para tu aplicación

**Flujo:** Usuario → tiene Roles → cada Rol tiene Permisos

## 📡 API Endpoints

### Usuarios
```
GET    /api/Users                    # Listar usuarios
GET    /api/Users/{id}               # Obtener usuario
POST   /api/Users                    # Crear usuario
PUT    /api/Users/{id}               # Actualizar usuario
DELETE /api/Users/{id}               # Eliminar usuario
POST   /api/Users/{id}/roles         # Asignar rol
DELETE /api/Users/{id}/roles/{role}  # Remover rol
GET    /api/Users/{id}/roles         # Obtener roles de usuario
GET    /api/Users/{id}/permissions   # Obtener permisos derivados
```

### Roles
```
GET    /api/Roles                    # Listar roles
GET    /api/Roles/{id}               # Obtener rol
GET    /api/Roles/name/{name}        # Obtener rol por nombre
POST   /api/Roles                    # Crear rol
PUT    /api/Roles/{id}               # Actualizar rol
DELETE /api/Roles/{id}               # Eliminar rol
GET    /api/Roles/{name}/permissions # Obtener permisos de rol
```

### Permisos
```
GET    /api/Permissions              # Listar permisos
GET    /api/Permissions/{id}         # Obtener permiso
GET    /api/Permissions/module/{mod} # Permisos por módulo
POST   /api/Permissions              # Crear permiso
PUT    /api/Permissions/{id}         # Actualizar permiso
DELETE /api/Permissions/{id}         # Eliminar permiso
POST   /api/Permissions/assign       # Asignar permiso a rol
POST   /api/Permissions/remove       # Remover permiso de rol
```

## 🚀 Ejemplo de Uso

### 1. Crear un Permiso
```typescript
import { usePermisosStore } from '@/modules/usuarios/stores/permisosStore'

const permisosStore = usePermisosStore()

await permisosStore.createPermiso({
  key: 'depositos.view',
  description: 'Ver depósitos',
  module: 'depositos'
})
```

### 2. Asignar Permiso a un Rol
```typescript
import { useRolesStore } from '@/modules/usuarios/stores/rolesStore'

const rolesStore = useRolesStore()

await rolesStore.asignarPermiso('Gerente', 5) // permisoId = 5
```

### 3. Asignar Rol a un Usuario
```typescript
import { useUsuariosStore } from '@/modules/usuarios/stores/usuariosStore'

const usuariosStore = useUsuariosStore()

await usuariosStore.asignarRol('abc123', 'Gerente')
```

### Resultado
El usuario `abc123` ahora tiene el rol `Gerente`, que incluye el permiso `depositos.view`.

## 🔐 Proteger Rutas con Permisos

En el router, puedes agregar permisos requeridos:

```typescript
{
  path: '/depositos',
  meta: { 
    requiresAuth: true,
    permissions: ['depositos.view']
  }
}
```

## 🎨 Componentes Reutilizables

### UsuarioModal
```vue
<UsuarioModal
  :is-open="showModal"
  :usuario="selectedUsuario"
  :loading="loading"
  @close="closeModal"
  @submit="handleSubmit"
/>
```

### AsignarRolesModal
```vue
<AsignarRolesModal
  :is-open="showModal"
  :usuario="usuario"
  :roles="roles"
  @asignar-rol="handleAsignarRol"
  @remover-rol="handleRemoverRol"
/>
```

### AsignarPermisosModal
```vue
<AsignarPermisosModal
  :is-open="showModal"
  :rol="rol"
  :permisos="permisos"
  @asignar-permiso="handleAsignarPermiso"
  @remover-permiso="handleRemoverPermiso"
/>
```

## 📝 Tipos TypeScript

Todos los tipos están definidos en `types.ts`:
- `Usuario`, `CreateUsuarioDto`, `UpdateUsuarioDto`
- `Rol`, `CreateRolDto`, `UpdateRolDto`
- `Permiso`, `CreatePermisoDto`, `UpdatePermisoDto`
- `AsignarRolDto`, `AsignarPermisoDto`, `RemoverPermisoDto`

## 🔒 Seguridad

- Solo usuarios con rol `Admin` pueden acceder a este módulo
- Todas las acciones requieren autenticación
- Las rutas están protegidas con guards
- Los permisos se validan en el backend

## 📚 Acceso

Las rutas del módulo son:
- `/usuarios` - Gestión de usuarios
- `/roles` - Gestión de roles
- `/permisos` - Gestión de permisos

Aparecen en el sidebar solo para usuarios administradores.
