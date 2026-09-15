# AGENTS.md — SCNexus Frontend

Convenciones para **agentes de IA** que trabajen en este repo (Antigravity/Gemini,
Claude Code, Cursor, Copilot). Este archivo es la **fuente única de convenciones**.
El detalle de arquitectura y creación de módulos está en
[`docs/ARQUITECTURA_Y_NUEVOS_MODULOS.md`](docs/ARQUITECTURA_Y_NUEVOS_MODULOS.md).

## Stack

Vue 3 (`<script setup lang="ts">`) + Vite + TypeScript + Pinia + Tailwind CSS.
Arquitectura de **microservicios**: el frontend habla con varias APIs .NET a través
del proxy de Vite. Alias de imports: `@` → `src/`. **La UI es en español.**

## Comandos

- `npm run dev` — servidor de desarrollo (Vite, puerto 3000)
- `npm run build` — type-check (`vue-tsc --noEmit`) + build de producción
- `npm run test` — unit tests (Vitest)
- `npm run test:e2e` — end-to-end (Playwright)

No hay linter configurado; el chequeo de tipos es `npx vue-tsc --noEmit` (corrélo antes
de dar por terminado un cambio amplio).

## Convenciones OBLIGATORIAS

### 1. Idioma y formato (locale)

La app es en español y el formato de fechas/números **NO debe depender del navegador**.

- **NUNCA hardcodear un locale** (`'es-EC'`, `'en-US'`, `'es-PA'`, …) en llamadas de formato.
- Fechas → `fecha.toLocaleDateString(APP_LOCALE, { … })`
- Números / montos → `new Intl.NumberFormat(NUMBER_LOCALE, { … })` o `valor.toLocaleString(NUMBER_LOCALE, { … })`
- Importar de `@/plugins/locale`:
  - `APP_LOCALE = 'es-EC'` → fechas (español)
  - `NUMBER_LOCALE = 'en-US'` → números/montos, **formato USD** (`"1,234.56"`, coma miles / punto decimales; Ecuador usa dólar)
- Cambiar el idioma/formato base es **una sola línea** en `src/plugins/locale.ts`.

### 2. Permisos

- Convención `modulo.accion` (p. ej. `transacciones.view`).
- Rutas: `meta.permissions` en el router del módulo, registrado en el router principal.
- En vistas y acciones: `authStore.hasPermission('modulo.accion')` y/o la directiva `v-permission`.

### 3. Microservicios / Axios

- **NO** adjuntar `attachUnauthorizedRedirect` a las instancias de axios de microservicios;
  la redirección de sesión la maneja únicamente el cliente del Core.

### 4. Nuevos módulos

- Seguir el checklist de [`docs/ARQUITECTURA_Y_NUEVOS_MODULOS.md`](docs/ARQUITECTURA_Y_NUEVOS_MODULOS.md)
  (router con `meta.permissions`, servicio API, store opcional, vistas con validación de
  permisos, entrada en el menú de `src/layouts/MainLayout.vue`).
- Aplicar **siempre** las convenciones de locale y permisos de arriba.

### 5. Reutilización de componentes / eliminar duplicación

- Antes de copiar-pegar un patrón de UI o lógica a un segundo archivo, o al encontrar
  código ya duplicado en 2+ archivos: seguir el proceso obligatorio de
  [`docs/FUNCIONALIDADES_ESTANDARIZADAS.md` §8](docs/FUNCIONALIDADES_ESTANDARIZADAS.md#8-reutilización-de-componentes-y-eliminación-segura-de-duplicación)
  (leer el código real de todos los consumidores, no promediar variantes con
  comportamiento distinto, nunca mezclar presentación con lógica de datos/permisos, rama
  dedicada, verificar tipos antes y después, revisar cada diff a mano).
- **`src/components/` ya está estandarizado por categoría** (`navegacion/`, `paginacion/`,
  `feedback/`, `modales/`, `datos/` — ver §8.6 del documento de arriba) con un contrato
  mínimo para componentes nuevos (TSDoc de cabecera, dark mode obligatorio, sintaxis de
  tupla en `defineEmits`). **Antes de crear un componente de UI genérico dentro de un
  módulo** (`src/modules/*/components/`), revisar primero si ya existe algo equivalente ahí
  — y si el módulo en el que se está trabajando tiene un componente que resulta ser copia
  (o casi copia) de uno de `src/components/`, es responsabilidad de quien toca ese código
  migrarlo al compartido en vez de perpetuar la copia. El backlog de duplicados ya
  detectados (por módulo, con nivel de riesgo) está en §8.7 del mismo documento — revisarlo
  antes de asumir que un patrón es nuevo.
