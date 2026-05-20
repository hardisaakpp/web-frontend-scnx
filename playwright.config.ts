import { defineConfig, devices } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/** Carga `.env.test` si existe (TEST_USERNAME, E2E_LIVE, etc.). */
function loadEnvTest(): void {
  const path = resolve(process.cwd(), '.env.test')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadEnvTest()

const useDevServer = process.env.E2E_WEB_SERVER !== 'preview'
const baseURL = useDevServer ? 'http://localhost:3000' : 'http://localhost:4173'

/**
 * Configuración de Playwright para tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directorio donde están los tests E2E
  testDir: './tests/e2e',
  
  // Tiempo máximo por test (flujos async pueden usar test.setTimeout mayor)
  timeout: 60 * 1000,
  
  // Reintentos en caso de fallo (útil para CI)
  retries: process.env.CI ? 2 : 0,
  
  // Paralelismo: ejecutar tests en paralelo
  // Un worker evita carreras entre specs que comparten mocks y el dev server.
  workers: 1,
  
  // Reporter: 'html' genera un reporte visual
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }]
  ],
  
  // Configuración compartida para todos los tests
  use: {
    // Dev server (proxy /api/mba3 → :8000) por defecto; preview con E2E_WEB_SERVER=preview
    baseURL,
    
    // Capturar trazas solo en fallos
    trace: 'on-first-retry',
    
    // Capturar screenshots solo en fallos
    screenshot: 'only-on-failure',
    
    // Capturar videos solo en fallos
    video: 'retain-on-failure',
  },

  // Configuración de proyectos (navegadores)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Opcional: descomentar para probar en Firefox y Safari
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Opcional: tests en mobile
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Servidor de desarrollo (opcional)
  // Playwright puede levantar el servidor automáticamente antes de los tests
  webServer: {
    command: useDevServer ? 'npm run dev' : 'npm run preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
})
