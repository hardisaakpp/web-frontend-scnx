# Instrucciones de Copilot — SCNexus Frontend

Vue 3 (`<script setup lang="ts">`) + Vite + TypeScript + Pinia + Tailwind. Arquitectura de
microservicios (APIs .NET vía proxy de Vite). Alias `@` → `src/`. **La UI es en español.**

## Convenciones obligatorias

- **Locale/formato**: nunca hardcodear un locale (`'es-EC'`, `'en-US'`, …). Fechas →
  `toLocaleDateString(APP_LOCALE, …)`; números/montos → `new Intl.NumberFormat(NUMBER_LOCALE, …)`.
  Importar de `@/plugins/locale` (`APP_LOCALE='es-EC'`, `NUMBER_LOCALE='en-US'` → formato USD `"1,234.56"`).
- **Permisos**: convención `modulo.accion`; `meta.permissions` en el router;
  `authStore.hasPermission('modulo.accion')` o la directiva `v-permission`.
- **Axios microservicios**: no usar `attachUnauthorizedRedirect` en instancias de microservicios.
- **Nuevos módulos**: seguir `docs/ARQUITECTURA_Y_NUEVOS_MODULOS.md`.

Detalle completo de convenciones: ver [`AGENTS.md`](../AGENTS.md).
