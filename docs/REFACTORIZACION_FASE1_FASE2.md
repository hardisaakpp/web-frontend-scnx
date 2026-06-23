# Refactorización Frontend — Fase 1 y Fase 2

**Fecha:** 2026-06-23  
**Rama:** `refactorizacion-frontend`  
**Estado:** Completado ✅

---

## Contexto

Se realizó una auditoría completa del frontend para identificar código muerto, duplicados y violaciones de arquitectura. Este documento registra los cambios ejecutados en las dos primeras fases del plan de limpieza.

---

## Fase 1 — Limpieza rápida ✅

### Objetivo
Eliminar archivos zombie, placeholders sin uso y resolver ambigüedades entre archivos con nombres similares.

### Cambios realizados

#### 1. `src/stores/auth.js` — Eliminado

**Qué era:** Archivo de re-export que redirigía `@/stores/auth` a `auth.ts` como shim de compatibilidad para archivos `.js`.

**Por qué se eliminó:** La implementación real siempre estuvo en `auth.ts`. Vite y TypeScript resuelven `.ts` antes que `.js`, por lo que el shim nunca fue necesario. Era código zombie sin consumidores reales.

---

#### 2. `src/services/authService.js` — Eliminado

**Qué era:** Servicio legacy de autenticación con métodos `login`, `logout`, `hasPermission`, `getUser`, etc., usando `localStorage` directamente.

**Por qué se eliminó:** Su único consumidor era `src/directives/permission.js`. Toda la lógica que implementaba ya existe en `src/stores/auth.ts` con soporte TypeScript, Pinia y JWT.

**Acción previa necesaria:** Antes de eliminar, se migró `permission.js` → `permission.ts` para que use `useAuthStore()` directamente en lugar de `authService`.

```
src/directives/permission.js  →  src/directives/permission.ts
```

---

#### 3. `src/views/LoginView.vue` — Eliminado

**Qué era:** Versión antigua del formulario de login, sin dark mode y con diseño desactualizado.

**Por qué se eliminó:** El router siempre importó `Login.vue` (no `LoginView.vue`):

```ts
// src/router/index.ts
import LoginView from '../views/Login.vue'  // ← este es el activo
```

`Login.vue` tiene dark mode, toggle de tema, logo y diseño moderno. `LoginView.vue` era código muerto.

---

#### 4. `src/modules/depositos/` — Eliminado (3 archivos)

**Qué era:** Módulo con `router.ts`, `types.ts` y `views/DepositosView.vue` (placeholder con texto "Contenido del módulo de depósitos").

**Por qué se eliminó:** Nunca estuvo registrado en `src/router/index.ts`. Era código inaccesible desde la aplicación.

---

#### 5. `src/modules/reportes/` — Eliminado (3 archivos)

**Qué era:** Módulo con `router.ts`, `types.ts` y `views/ReportesView.vue` (placeholder con texto "Contenido del módulo de reportes").

**Por qué se eliminó:** Igual que depositos, nunca estuvo en el router principal. El módulo de reportes real vive dentro de `mba3-consultas/` (con servicios y vistas funcionales).

---

#### 6. `src/views/Dashboard.vue` — Refactorizado

**Qué se hizo:** Se eliminó el wrapper `<Layout>` y el import de `@/components/Layout.vue`. La vista ahora es un componente limpio sin layout propio, ya que `MainLayout.vue` lo envuelve vía `<router-view>`.

**Antes:**
```vue
<template>
  <Layout>
    <div class="px-4 py-6">...</div>
  </Layout>
</template>
<script setup>
import Layout from '@/components/Layout.vue'
```

**Después:**
```vue
<template>
  <div class="px-4 py-6">...</div>
</template>
<script setup>
// sin import de Layout
```

---

#### 7. `src/components/Layout.vue` — Eliminado

**Qué era:** Navbar simplificado (sin sidebar, sin dark mode, sin notificaciones) que envolvía vistas manualmente.

**Por qué se eliminó:** `MainLayout.vue` ya provee el layout completo para todas las rutas autenticadas. `Layout.vue` era una versión reducida y desactualizada que causaba layouts anidados cuando una vista lo usaba dentro de `MainLayout`.

---

#### 8. `src/components/HelloWorld.vue` — Eliminado

**Qué era:** Componente de ejemplo generado por Vite al crear el proyecto.

**Por qué se eliminó:** Nunca fue importado ni usado. Código muerto desde el inicio del proyecto.

---

#### 9. `src/pages/LiquidacionesList.vue` — Eliminado (junto con `src/pages/`)

**Qué era:** Vista de listado de liquidaciones inacabada, en una carpeta `pages/` con un solo archivo.

**Por qué se eliminó en lugar de moverse:** El módulo `caja-chica` ya tiene `LiquidacionesView.vue`, `LiquidacionesPendientesView.vue` y `LiquidacionesAprobadasView.vue` propias y funcionales. El archivo era una versión incompleta que usaba `fetch()` crudo (sin axios), referenciaba rutas inexistentes (`CrearLiquidacion`, `VerLiquidacion`) y no estaba importado en ningún lado.

---

### Archivos eliminados en Fase 1

| Archivo | Motivo |
|---------|--------|
| `src/stores/auth.js` | Shim zombie, innecesario |
| `src/services/authService.js` | Duplicado del auth store |
| `src/directives/permission.js` | Reemplazado por `permission.ts` |
| `src/views/LoginView.vue` | Versión antigua, router usa `Login.vue` |
| `src/views/Depositos.vue` | Placeholder sin ruta en router |
| `src/views/Reportes.vue` | Placeholder sin ruta en router |
| `src/views/Contabilidad.vue` | Placeholder sin ruta en router |
| `src/components/Layout.vue` | Reemplazado por `MainLayout.vue` |
| `src/components/HelloWorld.vue` | Ejemplo de Vite sin uso |
| `src/modules/depositos/router.ts` | Módulo placeholder no registrado |
| `src/modules/depositos/types.ts` | Módulo placeholder no registrado |
| `src/modules/depositos/views/DepositosView.vue` | Placeholder vacío |
| `src/modules/reportes/router.ts` | Módulo placeholder no registrado |
| `src/modules/reportes/types.ts` | Módulo placeholder no registrado |
| `src/modules/reportes/views/ReportesView.vue` | Placeholder vacío |
| `src/pages/LiquidacionesList.vue` | Código muerto, caja-chica ya tiene vistas propias |

### Archivos creados en Fase 1

| Archivo | Descripción |
|---------|-------------|
| `src/directives/permission.ts` | Migración de `permission.js` a TypeScript usando `useAuthStore` |

---

## Fase 2 — Componentes globales ✅

### Objetivo
Mover componentes que vivían dentro de módulos específicos pero eran usados por otros módulos a `src/components/` (la carpeta de componentes globales), eliminando el acoplamiento entre módulos.

### Problema que resuelve

Antes de esta fase, un módulo importaba directamente de otro módulo:

```ts
// inventario importando de mba3-consultas
import OdcSapVolverButton from '@/modules/mba3-consultas/components/OdcSapVolverButton.vue'

// pyg importando de mba3-consultas  
import QuickTablePagination from '@/modules/mba3-consultas/components/QuickTablePagination.vue'

// promocion-sobres importando de articulo-scaner
import ScannerPanel from '@/modules/articulo-scaner/components/ScannerPanel.vue'

// usuarios importando de articulo-scaner
import WarehouseSelect from '@/modules/articulo-scaner/components/WarehouseSelect.vue'
```

Este patrón viola el principio de que los módulos deben ser independientes entre sí. Un refactor en `mba3-consultas` podría romper `inventario`, `pyg` y `promocion-sobres` sin que sea obvio.

---

### Cambios realizados

#### 1. `OdcSapVolverButton.vue` → `src/components/`

**Origen:** `src/modules/mba3-consultas/components/OdcSapVolverButton.vue`

**Consumidores (12 archivos actualizados):**
- `src/layouts/MainLayout.vue`
- `src/modules/inventario/views/UserSettingsView.vue`
- `src/modules/inventario/views/InventoryDetailView.vue`
- `src/modules/inventario/views/GeneratedInventoriesView.vue`
- `src/modules/inventario/views/InventoryPlanningsView.vue`
- `src/modules/mba3-consultas/views/CargarPlantillaListadoView.vue`
- `src/modules/mba3-consultas/views/MabelTradingRedistribucionView.vue`
- `src/modules/mba3-consultas/views/RedistribucionListadoView.vue`
- `src/modules/mba3-consultas/views/PedidosListView.vue`
- `src/modules/mba3-consultas/views/ProcesoCompletoView.vue`
- `src/modules/mba3-consultas/views/RevisarRedistribucionListadoView.vue`
- `src/modules/mba3-consultas/components/PedidoHeaderActions.vue`

---

#### 2. `QuickTablePagination.vue` → `src/components/`

**Origen:** `src/modules/mba3-consultas/components/QuickTablePagination.vue`

**Qué hace:** Paginación reutilizable con botones de navegación, ellipsis y panel "Otra página" con input numérico.

**Consumidores (11 archivos actualizados):**
- `src/modules/pyg/views/PygUploadView.vue`
- `src/modules/mba3-consultas/views/CargarPlantillaListadoView.vue`
- `src/modules/mba3-consultas/views/HomologacionesView.vue`
- `src/modules/mba3-consultas/views/ODCErroresView.vue`
- `src/modules/mba3-consultas/views/OrdenesCompraView.vue`
- `src/modules/mba3-consultas/views/ProcesamientoSAPListadoView.vue`
- `src/modules/mba3-consultas/views/RedistribucionListadoView.vue`
- `src/modules/mba3-consultas/views/RemisionesView.vue`
- `src/modules/mba3-consultas/views/PedidosListView.vue`
- `src/modules/mba3-consultas/views/ProcesoCompletoView.vue`
- `src/modules/mba3-consultas/views/RevisarRedistribucionListadoView.vue`

---

#### 3. `ScannerPanel.vue` → `src/components/`

**Origen:** `src/modules/articulo-scaner/components/ScannerPanel.vue`

**Qué hace:** Modal de escaneo de códigos de barras/QR con cámara, soporte multi-cámara, motor nativo (`BarcodeDetector`) con fallback a ZXing.

**Ajuste interno:** El import relativo de `useBarcodeScanner` se actualizó de ruta relativa a path absoluto:
```ts
// Antes (ruta relativa desde articulo-scaner/components/)
import { useBarcodeScanner } from '../composables/useBarcodeScanner'

// Después (path absoluto, funciona desde src/components/)
import { useBarcodeScanner } from '@/modules/articulo-scaner/composables/useBarcodeScanner'
```

**Consumidores (2 archivos actualizados):**
- `src/modules/articulo-scaner/views/ArticuloScanerView.vue`
- `src/modules/promocion-sobres/views/EntregaView.vue`

---

#### 4. `WarehouseSelect.vue` → `src/components/`

**Origen:** `src/modules/articulo-scaner/components/WarehouseSelect.vue`

**Qué hace:** Campo de búsqueda de almacenes con datalist nativo, soporte de búsqueda por código o nombre, y botón de limpieza.

**Ajuste interno:** El import del tipo `WarehouseDto` se actualizó:
```ts
// Antes
import type { WarehouseDto } from '../types'

// Después
import type { WarehouseDto } from '@/modules/articulo-scaner/types'
```

**Consumidores (2 archivos actualizados):**
- `src/modules/articulo-scaner/views/ArticuloScanerView.vue`
- `src/modules/usuarios/views/DatosAdicionalesGeneralView.vue`

> **Nota:** `src/modules/inventario/views/UserSettingsView.vue` tiene su propio `WarehouseSelect` definido inline con `defineComponent` — es una variante local con API distinta (`value`/`update:value` vs `modelValue`/`update:modelValue`). No se tocó.

---

#### 5. `VolverButton.vue` — Consolidado en `src/components/`

**Orígenes:** Existían dos versiones distintas:

| Versión | Módulo | Props | Estilo |
|---------|--------|-------|--------|
| A | `src/modules/ruleta/components/VolverButton.vue` | `to`, `label?` | Link de texto minimalista |
| B | `src/modules/usuarios/components/VolverButton.vue` | `to`, `title?` | Botón con borde y shadow |

**Consolidación:** Se creó un único componente en `src/components/VolverButton.vue` que soporta las props de ambas versiones:

```ts
defineProps<{
  to: string      // requerido — destino del router-link
  label?: string  // texto del botón (default: 'Volver') — usado por ruleta
  title?: string  // tooltip accesible — usado por usuarios
}>()
```

El estilo adoptado es el de botón (versión usuarios), más prominente y consistente con el resto de la UI. La prop `label` permite que los archivos de ruleta (`label="Ruleta One Card"`, `label="Administración"`) sigan funcionando sin cambios en sus templates.

**Consumidores (18 archivos actualizados):**

*Módulo ruleta (11 archivos):*
- `views/SupervisorView.vue`
- `views/ListadoView.vue`
- `views/EnroladorView.vue`
- `views/AdminView.vue`
- `views/admin/EnroladoresRankingView.vue`
- `views/admin/DashboardGlobalView.vue`
- `views/admin/CampanasView.vue`
- `views/admin/TemaRuletaView.vue`
- `views/admin/ReportesView.vue`
- `views/admin/PremiosView.vue`
- `views/admin/InventarioView.vue`

*Módulo usuarios (7 archivos):*
- `views/DatosAdicionalesGeneralView.vue`
- `views/UsuariosView.vue`
- `views/UsersView.vue`
- `views/RolesView.vue`
- `views/PermisosView.vue`
- `views/DatosAdicionalesView.vue`
- `views/GruposAlmacenesView.vue`

---

### Estado de `src/components/` después de Fase 2

```
src/components/
├── OdcSapVolverButton.vue     ← movido desde mba3-consultas
├── QuickTablePagination.vue   ← movido desde mba3-consultas
├── ScannerPanel.vue           ← movido desde articulo-scaner
├── ToastContainer.vue         ← ya existía (sin cambios)
├── VolverButton.vue           ← consolidado de ruleta + usuarios
└── WarehouseSelect.vue        ← movido desde articulo-scaner
```

---

### Verificación

Tras completar cada fase se ejecutó:

```bash
npx vue-tsc --noEmit
```

Resultado: **0 errores de TypeScript** en ambas fases.

Se verificó también que no quedaron referencias a los paths originales:

```bash
grep -r "modules/mba3-consultas/components/OdcSapVolverButton" src/
grep -r "modules/articulo-scaner/components/WarehouseSelect" src/
# (sin resultados)
```

---

## Próximas fases planificadas

### Fase 3 — Infraestructura compartida
- Crear `src/utils/apiErrorMapper.ts` centralizado (actualmente duplicado en 3 módulos)
- Crear `src/plugins/axiosFactory.ts` (actualmente 3 configs de axios separadas)
- Migrar `useMenu.js` → `useMenu.ts`

### Fase 4 — Router y títulos
- Agregar `meta.title` a cada ruta en todos los módulos
- Refactorizar `pageTitle` en `MainLayout.vue` para leer `route.meta.title`
- Agregar breadcrumbs para rutas anidadas

### Fase 5 — Módulos incompletos
- `caja-chica`: extraer lógica de API de las vistas a `service` + `store`
- `usuarios`: consolidar `Users.vue` y `UserView.vue` al módulo
- `mba3-consultas`: fragmentar composables gigantes

### Fase 6 — Migración TypeScript completa
- Migrar `api.js` y composables/directivas restantes en JavaScript
