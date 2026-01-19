# 📦 Guía de Desarrollo de Módulos - SCNexus

Esta guía explica cómo crear y trabajar con módulos en el proyecto SCNexus Frontend.

## 📁 Estructura de un Módulo

Cada módulo debe seguir esta estructura dentro de `src/modules/[nombre-modulo]/`:

```
src/modules/[nombre-modulo]/
├── views/                    # Vistas/Páginas del módulo
│   └── [Nombre]View.vue
├── components/               # Componentes específicos del módulo
│   └── [Componente].vue
├── services/                 # Servicios API
│   └── [nombre]Api.ts
├── stores/                   # Estado global del módulo (Pinia)
│   └── [nombre]Store.ts
├── router.ts                 # Rutas del módulo
└── types.ts                  # Tipos TypeScript
```

## 🚀 Crear un Nuevo Módulo

### 1. Crear la estructura de carpetas

```bash
mkdir -p src/modules/mi-modulo/{views,components,services,stores}
```

### 2. Definir los tipos (`types.ts`)

```typescript
// src/modules/mi-modulo/types.ts
export interface MiEntidad {
  id: number
  nombre: string
  descripcion: string
  fechaCreacion: string
}

export interface MiModuloState {
  items: MiEntidad[]
  loading: boolean
  error: string | null
}
```

### 3. Crear el servicio API (`services/miModuloApi.ts`)

```typescript
import axios from 'axios'
import type { MiEntidad } from '../types'

const API_URL = '/api/mi-modulo'

export const miModuloService = {
  async getItems(): Promise<MiEntidad[]> {
    const response = await axios.get(`${API_URL}/items`)
    return response.data
  },

  async getItem(id: number): Promise<MiEntidad> {
    const response = await axios.get(`${API_URL}/items/${id}`)
    return response.data
  },

  async createItem(data: Omit<MiEntidad, 'id'>): Promise<MiEntidad> {
    const response = await axios.post(`${API_URL}/items`, data)
    return response.data
  },

  async updateItem(id: number, data: Partial<MiEntidad>): Promise<MiEntidad> {
    const response = await axios.put(`${API_URL}/items/${id}`, data)
    return response.data
  },

  async deleteItem(id: number): Promise<void> {
    await axios.delete(`${API_URL}/items/${id}`)
  }
}
```

### 4. Crear el store Pinia (`stores/miModuloStore.ts`)

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { MiEntidad } from '../types'
import { miModuloService } from '../services/miModuloApi'

export const useMiModuloStore = defineStore('miModulo', () => {
  // State
  const items = ref<MiEntidad[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      items.value = await miModuloService.getItems()
    } catch (e: any) {
      error.value = e.message || 'Error al cargar items'
    } finally {
      loading.value = false
    }
  }

  async function createItem(data: Omit<MiEntidad, 'id'>) {
    loading.value = true
    try {
      const newItem = await miModuloService.createItem(data)
      items.value.unshift(newItem)
      return newItem
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem
  }
})
```

### 5. Crear la vista principal (`views/MiModuloView.vue`)

```vue
<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Mi Módulo</h1>
        <p class="mt-1 text-sm text-gray-500">Descripción del módulo</p>
      </div>
      <button 
        @click="handleCreate"
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Nuevo Item
      </button>
    </div>

    <div v-if="loading" class="text-center py-12">
      <p class="text-gray-500">Cargando...</p>
    </div>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <!-- Contenido del módulo -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMiModuloStore } from '../stores/miModuloStore'

const store = useMiModuloStore()

onMounted(() => {
  store.fetchItems()
})

const handleCreate = () => {
  // Lógica para crear
}
</script>
```

### 6. Configurar las rutas (`router.ts`)

```typescript
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/mi-modulo',
    name: 'mi-modulo',
    component: () => import('./views/MiModuloView.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Mi Módulo',
      icon: 'HomeIcon'
    }
  }
]

export default routes
```

### 7. Registrar el módulo en el router principal

Editar `src/router/index.ts`:

```typescript
// Agregar import
import miModuloRoutes from '../modules/mi-modulo/router'

// Agregar en children del MainLayout
children: [
  // ... otras rutas
  ...miModuloRoutes,
]
```

### 8. Agregar al menú del sidebar

Editar `src/layouts/MainLayout.vue`:

```vue
<!-- Agregar link en el nav -->
<router-link
  to="/mi-modulo"
  class="flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors"
  :class="{ 'bg-gray-700': $route.path === '/mi-modulo' }"
>
  <HomeIcon class="h-5 w-5 flex-shrink-0" />
  <span v-show="!isSidebarCollapsed">Mi Módulo</span>
</router-link>
```

## 🎨 Componentes Reutilizables

Los componentes compartidos entre módulos deben estar en `src/components/`. Los componentes específicos del módulo van en `src/modules/[nombre]/components/`.

## 🔌 Servicios API

- Usar axios configurado en `src/plugins/axios.ts`
- Para apuntar a diferentes microservicios, crear instancias específicas:

```typescript
import axios from 'axios'

const apiMiModulo = axios.create({
  baseURL: 'https://api-mi-modulo.com'
})
```

## 📊 Estado Global (Stores)

- Usar Pinia para el estado del módulo
- Cada módulo tiene su propio store
- El store auth es compartido: `useAuthStore()`

## ✅ Buenas Prácticas

1. **Aislamiento**: Cada módulo debe ser lo más independiente posible
2. **Nombres**: Usar nombres descriptivos y consistentes
3. **TypeScript**: Definir todos los tipos en `types.ts`
4. **Lazy Loading**: Las rutas usan import dinámico para carga perezosa
5. **Error Handling**: Siempre manejar errores en servicios y stores
6. **Responsiveness**: Usar Tailwind CSS con clases responsive (sm:, md:, lg:)

## 🔐 Permisos

Agregar permisos en las rutas con meta:

```typescript
{
  path: '/mi-modulo',
  meta: { 
    requiresAuth: true,
    role: 'Admin',  // Solo admins
    permissions: ['mi-modulo.view']
  }
}
```

## 📚 Módulos de Ejemplo

Revisa estos módulos como referencia:
- `src/modules/contabilidad/` - Ejemplo completo con CRUD
- `src/modules/depositos/` - Ejemplo básico
- `src/modules/reportes/` - Ejemplo con generación de archivos
- `src/modules/conciliacion/` - Módulo de conciliación (duplicado de reportes con arquitectura completa)

## 🤝 Colaboración

1. Cada desarrollador trabaja en su módulo
2. Hacer commits frecuentes
3. Nombres de ramas: `feature/mi-modulo-funcionalidad`
4. Pull requests con descripción clara

## 📝 Notas de Implementación

### Módulo Conciliación

El módulo de Conciliación fue creado como duplicado del módulo Reportes siguiendo la arquitectura completa:

1. **Estructura creada:**
   - `src/modules/conciliacion/router.ts` - Rutas con permisos
   - `src/modules/conciliacion/types.ts` - Tipos TypeScript
   - `src/modules/conciliacion/services/conciliacionApi.ts` - Servicio API
   - `src/modules/conciliacion/stores/conciliacionStore.ts` - Store Pinia
   - `src/modules/conciliacion/views/ConciliacionView.vue` - Vista principal

2. **Registro en router:**
   - Agregado en `src/router/index.js` (archivo activo)
   - También disponible en `src/router/index.ts` (para migración futura)

3. **Menú del sidebar:**
   - Agregado en `src/composables/useMenu.js`
   - Permiso requerido: `conciliacion.view`

4. **Ruta:** `/conciliacion`

### ⚠️ Problema Común: Rutas no aparecen en la pantalla

**Síntoma:**
- Al navegar a la ruta del módulo, la pantalla aparece en blanco
- En la consola del navegador aparece el warning: `[Vue Router warn]: No match found for location with path "/ruta-del-modulo"`

**Causa:**
El proyecto tiene dos archivos de router:
- `src/router/index.js` - Archivo activo que se está usando
- `src/router/index.ts` - Archivo TypeScript (posible migración futura)

Si solo se registra la ruta en `index.ts` pero el proyecto usa `index.js`, Vue Router no encontrará la ruta.

**Solución:**
1. Verificar qué archivo de router se está usando (revisar `src/main.ts` o `src/main.js`)
2. Registrar la ruta en el archivo correcto:
   ```javascript
   // En src/router/index.js (o index.ts según corresponda)
   import conciliacionRoutes from '../modules/conciliacion/router'
   
   // En el array de children del MainLayout
   children: [
     // ... otras rutas
     ...conciliacionRoutes,
   ]
   ```
3. Si hay dos archivos de router, registrar en ambos para evitar problemas futuros
4. Reiniciar el servidor de desarrollo para asegurar que los cambios se carguen

**Prevención:**
- Siempre verificar en qué archivo de router se están registrando las otras rutas del proyecto
- Si hay dudas, registrar en ambos archivos (`index.js` e `index.ts`)
- Después de agregar rutas, verificar en la consola del navegador que aparezcan en el log de debug (si está habilitado)

## 📞 Soporte

Si tienes dudas sobre la estructura, consulta con el equipo líder o revisa los módulos existentes.
