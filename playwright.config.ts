import { defineConfig, devices } from '@playwright/test'

/**
 * Configuración de Playwright para tests E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directorio donde están los tests E2E
  testDir: './tests/e2e',
  
  // Tiempo máximo por test
  timeout: 30 * 1000,
  
  // Reintentos en caso de fallo (útil para CI)
  retries: process.env.CI ? 2 : 0,
  
  // Paralelismo: ejecutar tests en paralelo
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter: 'html' genera un reporte visual
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }]
  ],
  
  // Configuración compartida para todos los tests
  use: {
    // URL base del frontend (se usa en las navegaciones)
    // Por defecto apunta al build de producción servido con `npm run preview`
    baseURL: 'http://localhost:4173',
    
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
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
