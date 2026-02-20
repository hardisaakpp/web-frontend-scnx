# 🔐 Sistema de Permisos - SCNexus Frontend

> **Guía completa sobre cómo funciona el control de acceso basado en permisos**

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Formato de Permisos](#formato-de-permisos)
4. [Cómo se Cargan los Permisos](#cómo-se-cargan-los-permisos)
5. [Control de Acceso en el Menú](#control-de-acceso-en-el-menú)
6. [Control de Acceso en Rutas](#control-de-acceso-en-rutas)
7. [Control de Acceso en Componentes](#control-de-acceso-en-componentes)
8. [Ejemplos Prácticos](#ejemplos-prácticos)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Introducción

El sistema de permisos de SCNexus utiliza un modelo **granular** que permite controlar el acceso a nivel de módulo y acción. Los permisos se almacenan en el JWT y se validan tanto en el backend como en el frontend.

### Principios Fundamentales

1. **JWT Stateless**: Los permisos viajan en el token JWT
2. **Control Granular**: Permisos específicos por acción (`modulo.accion`)
3. **Admin Override**: Los usuarios Admin tienen acceso a todo
4. **Frontend + Backend**: Validación en ambos lados

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                       FLUJO DE PERMISOS                      │
└─────────────────────────────────────────────────────────────┘

1. Usuario hace LOGIN
         ↓
2. Core API genera JWT con claims:
   - role: ["User", "Gerente"]
   - permission: ["depositos.view", "depositos.create", "cajachica.view"]
         ↓
3. Frontend guarda en localStorage:
   - token: "eyJhbG..."
   - user: { roles: [...], permissions: [...] }
         ↓
4. authStore carga permisos:
   - userRoles: ["User", "Gerente"]
   - userPermissions: ["depositos.view", "depositos.create", "cajachica.view"]
         ↓
5. Validación en 3 niveles:
   a) Menú de navegación (MainLayout.vue)
   b) Router (beforeEach guard)
   c) Componentes individuales (v-if)
```

---

## 📝 Formato de Permisos

Los permisos siguen el formato:

```
modulo.accion
```

### Ejemplos

| Permiso | Descripción | Permite |
|---------|-------------|---------|
| `depositos.view` | Ver depósitos | Listar y ver detalles de depósitos |
| `depositos.create` | Crear depósitos | Botón "Nuevo Depósito" |
| `depositos.edit` | Editar depósitos | Botón "Editar" en tabla |
| `depositos.delete` | Eliminar depósitos | Botón "Eliminar" en tabla |
| `depositos.approve` | Aprobar depósitos | Botón "Aprobar" para gerentes |
| `cajachica.view` | Ver liquidaciones | Acceder al módulo Caja Chica |
| `cajachica.approve` | Aprobar liquidaciones | Aprobar liquidaciones pendientes |

### Convenciones

- **Módulo**: Siempre en singular y minúsculas
- **Acción**: Verbos en inglés (view, create, edit, delete, approve, export)
- **Separador**: Punto (`.`)

---

## 🔄 Cómo se Cargan los Permisos

### 1. Login y Almacenamiento

**Archivo**: `src/stores/auth.ts`

```typescript
async login(credentials: LoginCredentials): Promise<boolean> {
  const response = await api.post<LoginResponse>('/Auth/login', requestBody)
  const { token, user } = response.data

  // user contiene:
  // - roles: ["User", "Gerente"]
  // - permissions: ["depositos.view", "depositos.create", ...]
  
  this.token = token
  this.userData = user
  
  // Guardar en localStorage
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
  
  return true
}
```

### 2. Getters para Acceder a Permisos

**Archivo**: `src/stores/auth.ts`

```typescript
getters: {
  // Lista de permisos del usuario
  userPermissions: (state): string[] => {
    if (state.userData?.permissions) {
      return state.userData.permissions
    }
    // Fallback a localStorage
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr) as User
        return user.permissions || []
      }
    } catch {
      return []
    }
    return []
  },
  
  // Lista de roles del usuario
  userRoles: (state): string[] => {
    if (state.userData?.roles) {
      return state.userData.roles
    }
    // Fallback a localStorage
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr) as User
        return user.roles || []
      }
    } catch {
      return []
    }
    return []
  }
}
```

### 3. Métodos de Validación

```typescript
actions: {
  // Verifica si tiene UN permiso específico
  hasPermission(permission: string): boolean {
    return this.userPermissions.includes(permission)
  },

  // Verifica si tiene AL MENOS UNO de los permisos
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.userPermissions.includes(p))
  },

  // Verifica si tiene TODOS los permisos
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.userPermissions.includes(p))
  },

  // Verifica si tiene un rol específico
  hasRole(role: string): boolean {
    return this.userRoles.includes(role)
  }
}
```

---

## 🎨 Control de Acceso en el Menú

### Función Helper para Módulos

**Archivo**: `src/layouts/MainLayout.vue`

```typescript
// Función helper para verificar si el usuario tiene algún permiso de un módulo
const hasModuleAccess = (moduleName: string): boolean => {
  // Admin tiene acceso a todo
  if (authStore.userRoles?.includes('Admin')) {
    return true
  }
  
  // Verificar si tiene algún permiso del módulo (modulo.*)
  const permissions = authStore.userPermissions || []
  return permissions.some(permission => permission.startsWith(`${moduleName}.`))
}
```

### Uso en el Menú

```vue
<!-- Solo se muestra si tiene algún permiso de "depositos" -->
<router-link
  v-if="hasModuleAccess('depositos')"
  to="/depositos"
  class="..."
>
  <BuildingLibraryIcon class="h-5 w-5" />
  <span>Depósitos</span>
</router-link>

<!-- Solo se muestra si tiene algún permiso de "cajachica" -->
<router-link
  v-if="hasModuleAccess('cajachica')"
  to="/caja-chica"
  class="..."
>
  <DocumentCheckIcon class="h-5 w-5" />
  <span>Caja Chica</span>
</router-link>
```

### Lógica del Helper

```
hasModuleAccess('depositos') devuelve TRUE si:
  ✓ Usuario es Admin
  ✓ Tiene permiso "depositos.view"
  ✓ Tiene permiso "depositos.create"
  ✓ Tiene permiso "depositos.edit"
  ✓ Tiene cualquier otro permiso que empiece con "depositos."

hasModuleAccess('depositos') devuelve FALSE si:
  ✗ No es Admin
  ✗ No tiene ningún permiso que empiece con "depositos."
```

---

## 🛣️ Control de Acceso en Rutas

### Router Guard Global

**Archivo**: `src/router/index.ts`

```typescript
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredPermissions = to.matched.find(record => record.meta.permissions)?.meta.permissions as string[] | undefined

  // 1. Verificar autenticación
  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  // 2. Verificar permisos (si están definidos)
  if (requiredPermissions && requiredPermissions.length > 0) {
    // Admin tiene acceso automático
    const isAdmin = authStore.userRoles?.includes('Admin') || false
    
    if (!isAdmin) {
      // Verificar si tiene al menos uno de los permisos requeridos
      const hasPermission = authStore.hasAnyPermission(requiredPermissions)
      
      if (!hasPermission) {
        return next({ name: 'forbidden' })
      }
    }
  }

  next()
})
```

### Definir Permisos en Rutas

**Archivo**: `src/modules/depositos/router.ts`

```typescript
export default [
  {
    path: '/depositos',
    name: 'depositos',
    component: () => import('./views/DepositosView.vue'),
    meta: { 
      requiresAuth: true,
      permissions: ['depositos.view'], // ⚠️ Requiere este permiso
      title: 'Depósitos'
    }
  },
  {
    path: '/depositos/nuevo',
    name: 'depositos-nuevo',
    component: () => import('./views/DepositosForm.vue'),
    meta: { 
      requiresAuth: true,
      permissions: ['depositos.create'], // ⚠️ Requiere permiso de creación
      title: 'Nuevo Depósito'
    }
  }
]
```

---

## 🧩 Control de Acceso en Componentes

### Uso de v-if en Templates

**Ejemplo**: Vista de Depósitos

```vue
<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold">Depósitos</h1>
      
      <!-- Botón solo visible si tiene permiso de crear -->
      <button
        v-if="authStore.hasPermission('depositos.create')"
        @click="crearDeposito"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg"
      >
        Nuevo Depósito
      </button>
    </div>

    <!-- Tabla de depósitos -->
    <table>
      <tbody>
        <tr v-for="deposito in depositos" :key="deposito.id">
          <td>{{ deposito.numero }}</td>
          
          <td>
            <!-- Botón editar solo si tiene permiso -->
            <button
              v-if="authStore.hasPermission('depositos.edit')"
              @click="editarDeposito(deposito)"
            >
              Editar
            </button>

            <!-- Botón eliminar solo si tiene permiso -->
            <button
              v-if="authStore.hasPermission('depositos.delete')"
              @click="eliminarDeposito(deposito)"
              class="text-red-600"
            >
              Eliminar
            </button>

            <!-- Botón aprobar solo para gerentes/admin -->
            <button
              v-if="authStore.hasPermission('depositos.approve')"
              @click="aprobarDeposito(deposito)"
              class="text-green-600"
            >
              Aprobar
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// También puedes usar en la lógica
const puedeEditar = authStore.hasPermission('depositos.edit')
const puedeEliminar = authStore.hasPermission('depositos.delete')

if (puedeEditar) {
  // Lógica específica
}
</script>
```

### Permisos Múltiples (OR)

```vue
<!-- Mostrar si tiene AL MENOS UNO de los permisos -->
<button
  v-if="authStore.hasAnyPermission(['depositos.edit', 'depositos.approve'])"
>
  Modificar Estado
</button>
```

### Permisos Múltiples (AND)

```vue
<script setup lang="ts">
// Verificar que tenga TODOS los permisos
const puedeGestionarCompletamente = computed(() => {
  return authStore.hasAllPermissions([
    'depositos.view',
    'depositos.create',
    'depositos.edit',
    'depositos.delete'
  ])
})
</script>

<template>
  <div v-if="puedeGestionarCompletamente">
    Panel completo de gestión
  </div>
</template>
```

### Verificar Roles

```vue
<!-- Mostrar solo para Admin -->
<div v-if="authStore.userRoles?.includes('Admin')">
  Panel de administrador
</div>

<!-- Mostrar para varios roles -->
<div v-if="authStore.hasRole('Gerente') || authStore.hasRole('Admin')">
  Panel de gerencia
</div>
```

---

## 💡 Ejemplos Prácticos

### Caso 1: Usuario "User" con permisos limitados

**Permisos asignados**:
```json
{
  "roles": ["User"],
  "permissions": [
    "depositos.view",
    "cajachica.view"
  ]
}
```

**Resultado en el menú**:
- ✅ Dashboard (visible para todos)
- ✅ Depósitos (tiene `depositos.view`)
- ✅ Caja Chica (tiene `cajachica.view`)
- ❌ Contabilidad (no tiene permisos)
- ❌ Reportes (no tiene permisos)
- ❌ Usuarios (solo Admin)

**Resultado en componentes**:
- ✅ Ver lista de depósitos
- ❌ Botón "Nuevo Depósito" (no tiene `depositos.create`)
- ❌ Botón "Editar" (no tiene `depositos.edit`)
- ❌ Botón "Eliminar" (no tiene `depositos.delete`)

---

### Caso 2: Usuario "Gerente" con más permisos

**Permisos asignados**:
```json
{
  "roles": ["Gerente"],
  "permissions": [
    "depositos.view",
    "depositos.create",
    "depositos.edit",
    "depositos.approve",
    "cajachica.view",
    "cajachica.approve",
    "reportes.view",
    "reportes.export"
  ]
}
```

**Resultado en el menú**:
- ✅ Dashboard
- ✅ Depósitos (tiene varios permisos de depósitos)
- ✅ Caja Chica (tiene permisos de caja chica)
- ✅ Reportes (tiene permisos de reportes)
- ❌ Contabilidad (no tiene permisos)
- ❌ Usuarios (solo Admin)

**Resultado en componentes**:
- ✅ Ver lista de depósitos
- ✅ Botón "Nuevo Depósito" (tiene `depositos.create`)
- ✅ Botón "Editar" (tiene `depositos.edit`)
- ❌ Botón "Eliminar" (no tiene `depositos.delete`)
- ✅ Botón "Aprobar" (tiene `depositos.approve`)

---

### Caso 3: Usuario "Admin"

**Permisos**:
```json
{
  "roles": ["Admin"],
  "permissions": []  // No necesita permisos específicos
}
```

**Resultado**: ✅ **Acceso total a todo el sistema**

La función `hasModuleAccess()` siempre devuelve `true` para Admin.

---

## 🔧 Troubleshooting

### Problema 1: No veo ningún módulo en el menú

**Síntomas**: Después de login, solo veo Dashboard

**Causas posibles**:
1. El usuario no tiene permisos asignados
2. Los permisos no están en el JWT
3. El formato de permisos es incorrecto

**Solución**:
```typescript
// 1. Verificar permisos en consola del navegador
console.log('Permisos:', authStore.userPermissions)
console.log('Roles:', authStore.userRoles)

// 2. Verificar localStorage
const user = JSON.parse(localStorage.getItem('user'))
console.log('User data:', user)

// 3. Si está vacío, crear permisos en el Core:
// Ver documento ARQUITECTURA_Y_NUEVOS_MODULOS.md sección "Sistema de Permisos"
```

---

### Problema 2: Soy Admin pero no veo todo

**Causa**: El rol no se detecta correctamente

**Solución**:
```typescript
// Verificar que el rol sea exactamente "Admin" (case-sensitive)
console.log('Roles:', authStore.userRoles)

// Si muestra ["admin"] en lugar de ["Admin"], el Core está
// devolviendo el rol en minúsculas. Contactar al equipo del Core.
```

---

### Problema 3: Veo el módulo en el menú pero no puedo acceder

**Causa**: La ruta tiene permisos más específicos

**Solución**:
```typescript
// El menú usa: hasModuleAccess('depositos') → TRUE si tiene cualquier permiso
// La ruta puede requerir: permissions: ['depositos.view'] → Específico

// Verificar router:
// src/modules/depositos/router.ts
meta: { 
  permissions: ['depositos.view'] // ← Este permiso específico se requiere
}
```

---

### Problema 4: Después de asignar permisos sigo sin ver el módulo

**Causa**: El token JWT es viejo, no tiene los permisos nuevos

**Solución**:
```typescript
// Los permisos están en el JWT, que se genera en el LOGIN
// Si asignaste permisos después del login, debes:

// 1. Hacer LOGOUT
authStore.logout()

// 2. Hacer LOGIN nuevamente
// El nuevo token tendrá los permisos actualizados
```

---

## 📚 Resumen de Métodos Disponibles

| Método | Parámetros | Retorna | Uso |
|--------|-----------|---------|-----|
| `hasPermission(permission)` | `string` | `boolean` | Verifica un permiso específico |
| `hasAnyPermission(permissions)` | `string[]` | `boolean` | Verifica si tiene al menos uno |
| `hasAllPermissions(permissions)` | `string[]` | `boolean` | Verifica si tiene todos |
| `hasRole(role)` | `string` | `boolean` | Verifica un rol específico |
| `hasModuleAccess(module)` | `string` | `boolean` | Verifica acceso al módulo |

---

## 🎯 Buenas Prácticas

### 1. Permisos en 3 Niveles

```
✅ CORRECTO: Validar en los 3 niveles

1. Menú (MainLayout.vue)
   → Ocultar módulo si no tiene acceso
   
2. Router (router/index.ts)
   → Bloquear navegación si no tiene permiso
   
3. Componente (Vista individual)
   → Ocultar botones/acciones específicas

✗ INCORRECTO: Solo validar en el frontend
   → El backend SIEMPRE debe validar permisos
```

### 2. Nomenclatura Consistente

```
✅ CORRECTO:
- depositos.view
- depositos.create
- cajachica.approve

✗ INCORRECTO:
- Depositos.View
- depositos_create
- CAJACHICA.APPROVE
```

### 3. Admin Override

```typescript
// ✅ CORRECTO: Siempre verificar Admin primero
if (authStore.userRoles?.includes('Admin')) {
  return true // Admin tiene acceso a todo
}

// ✗ INCORRECTO: No considerar Admin
return authStore.hasPermission('depositos.delete')
```

### 4. Logging de Acceso Denegado

```typescript
// ✅ Buena práctica: Registrar intentos de acceso denegado
if (!authStore.hasPermission('depositos.delete')) {
  console.warn(`Usuario ${authStore.userName} intentó eliminar sin permiso`)
  return
}
```

---

## 📞 Soporte

Para dudas sobre:
- **Permisos del Core**: Equipo de Core API
- **Permisos en Frontend**: Esta documentación
- **Crear nuevos permisos**: Ver `ARQUITECTURA_Y_NUEVOS_MODULOS.md`

---

**Última actualización**: Febrero 2026  
**Versión**: 1.0  
**Autor**: Equipo SCNexus Development
