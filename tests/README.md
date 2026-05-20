# Testing Infrastructure

Este proyecto utiliza **Vitest** para tests unitarios y de componentes, y **Playwright** para tests E2E.

## 🧪 Tests Unitarios y de Componentes (Vitest)

### Ejecutar tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (desarrollo)
npm run test:watch

# Ejecutar con UI interactiva
npm run test:ui

# Generar reporte de cobertura
npm run test:coverage
```

### Estructura de tests unitarios

```
tests/unit/
├── stores/           # Tests de Pinia stores
│   └── theme.test.ts
├── composables/      # Tests de composables (próximamente)
├── services/         # Tests de servicios (próximamente)
└── components/       # Tests de componentes Vue (próximamente)
```

### Escribir tests unitarios

**Ejemplo: Test de Store**
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

describe('Theme Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should toggle theme', () => {
    const store = useThemeStore()
    store.toggleTheme()
    expect(store.isDark).toBe(true)
  })
})
```

**Ejemplo: Test de Componente**
```typescript
import { render, screen } from '@testing-library/vue'
import { describe, it, expect } from 'vitest'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(MyComponent, {
      props: { title: 'Test' }
    })
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Configuración

- **Archivo de config**: `vitest.config.ts`
- **Entorno**: jsdom (simula DOM del navegador)
- **Globals**: `describe`, `it`, `expect` disponibles sin imports

---

## 🎭 Tests E2E (Playwright)

### Ejecutar tests E2E

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Ejecutar con UI de Playwright
npm run test:e2e:ui

# Ejecutar en modo debug
npm run test:e2e:debug

# Ver reporte HTML de última ejecución
npm run test:e2e:report
```

### Estructura de tests E2E

```
tests/e2e/
├── helpers/mba3Mocks.ts   # Mocks API MBA3 para E2E sin Celery/SAP
├── login.spec.ts          # Tests del flujo de login
├── mba3-async.spec.ts           # Cruce async (poll/SSE mock) — `npm run test:e2e:mba3`
├── mba3-plantilla-async.spec.ts # Plantilla upload-async — `npm run test:e2e:mba3`
├── mba3-async-live.spec.ts      # Smoke live (requiere E2E_LIVE + credenciales)
└── permissions.spec.ts    # Tests de permisos (próximamente)
```

### Escribir tests E2E

```typescript
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should login successfully', async ({ page }) => {
    await page.getByLabel('Usuario').fill('test-user')
    await page.getByLabel('Contraseña').fill('test-password')
    await page.getByRole('button', { name: 'Iniciar sesión' }).click()
    
    await expect(page).toHaveURL(/.*dashboard/)
  })
})
```

### Pre-requisitos para E2E

1. **Build de producción**
   ```bash
   npm run build
   ```

2. **Variables de entorno** (opcional)
   Crear `.env.test` con:
   ```env
   TEST_USERNAME=usuario-de-prueba
   TEST_PASSWORD=password-de-prueba
   ```

3. **Backend de pruebas**
   - Los tests E2E requieren un backend funcional
   - Idealmente usar un entorno de STAGING con datos controlados

### Configuración

- **Archivo de config**: `playwright.config.ts`
- **Base URL**: `http://localhost:3000` (vite dev con proxy a MBA3 en `:8000`)
- **Preview**: `E2E_WEB_SERVER=preview` → `http://localhost:4173` (sin proxy; no usar para MBA3)
- **Navegadores**: Chromium (Firefox y Webkit opcionales)
- **Web server**: Playwright levanta `npm run dev` por defecto
- **MBA3 async**: `npm run test:e2e:mba3` (plantilla + cruce, mocks); OpenAPI: `npm run sync:openapi` (API en `:8000`); live: `.env.test` + `E2E_LIVE=1` → `npm run test:e2e:mba3:live` (ver `.env.test.example`)
- **Contrato async:** [docs/ALINEACION_FRONT_ASYNC.md](../docs/ALINEACION_FRONT_ASYNC.md)

---

## 📋 Próximos Tests a Implementar

### Alta Prioridad

- **Auth Store** (unitario)
  - Login con respuesta mock
  - Manejo de token expirado
  - Capabilities y permisos

- **Composables MBA3** (unitario)
  - `usePedidoDetalle`: carga desde backend/sessionStorage
  - `useRedistribucion`: lógica de cálculo

- **Componentes críticos** (componente)
  - `PedidoDetalleView`: botones habilitados según estado
  - `RedistribucionTiendas`: validaciones

### Media Prioridad

- **E2E: Flujos MBA3**
  - Cargar plantilla
  - Confirmar pedido
  - Redistribución de tiendas
  - Integración SAP

- **E2E: Permisos**
  - Visibilidad de botones según capabilities
  - Redirección a Forbidden

### Baja Prioridad

- **Servicios de dominio** (unitario)
  - Mocks de axios para cada endpoint
  - Manejo de errores 404/500

- **Cobertura de código**
  - Objetivo: 60% en módulos críticos

---

## 🔧 Herramientas y Librerías

- **Vitest**: Framework de testing (compatible con Vite)
- **Vue Test Utils**: Utilidades oficiales para tests de componentes Vue
- **Testing Library**: Tests centrados en el usuario
- **Playwright**: Framework E2E con soporte multi-navegador
- **jsdom**: Simulación del DOM para tests unitarios

---

## 💡 Best Practices

### Tests Unitarios

✅ **Hacer:**
- Probar una unidad lógica a la vez
- Usar mocks para dependencias externas (axios, localStorage, etc.)
- Nombres descriptivos de tests: `should ... when ...`
- Casos felices Y casos de error

❌ **Evitar:**
- Tests que dependen de otros tests
- Tests que requieren backend real
- Asertar implementación interna (black box testing)

### Tests E2E

✅ **Hacer:**
- Probar flujos completos de usuario
- Usar selectores semánticos (`getByRole`, `getByLabel`)
- Usuario de prueba dedicado con permisos conocidos
- Ejecutar contra STAGING, no producción

❌ **Evitar:**
- Selectores frágiles (IDs generados, clases de CSS)
- Datos de producción en tests
- Tests que modifican datos reales sin rollback

---

## 🚀 Integración en CI/CD

### GitHub Actions (ejemplo)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

### Política de Merge

- ✅ Tests unitarios deben pasar antes de merge a `main`
- ⚠️ Tests E2E pueden ejecutarse en nightly/release (opcional)

---

## 📚 Referencias

- [Vitest Docs](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Testing Library](https://testing-library.com/docs/vue-testing-library/intro)
- [Playwright Docs](https://playwright.dev/)
