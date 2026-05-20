import { test, expect, type Page } from '@playwright/test'

/**
 * Test E2E para el flujo de Login
 * 
 * Estos tests verifican:
 * - Login exitoso con credenciales válidas
 * - Login fallido con credenciales inválidas
 * - Redirección al dashboard después del login
 */

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Navegar a la página de login antes de cada test
    await page.goto('/login')
  })

  test('should display login form', async ({ page }: { page: Page }) => {
    // Verificar que el formulario de login está visible
    await expect(page.getByRole('heading', { name: /iniciar sesión|login/i })).toBeVisible()
    
    // Verificar que los campos de email y password existen
    await expect(page.locator('#username')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    
    // Verificar botón de submit
    await expect(page.getByRole('button', { name: /iniciar sesión|login/i })).toBeVisible()
  })

  test('should show error with invalid credentials', async ({ page }: { page: Page }) => {
    // Llenar el formulario con credenciales inválidas
    await page.locator('#username').fill('usuario-invalido')
    await page.locator('#password').fill('password-incorrecta')
    
    // Click en el botón de login
    await page.getByRole('button', { name: /iniciar sesión|login/i }).click()
    
    // Esperar a que aparezca el mensaje de error
    // Nota: Ajusta el selector según tu implementación real
    await expect(page.getByText(/credenciales inválidas|error|incorrecto/i)).toBeVisible({ timeout: 5000 })
    
    // Verificar que seguimos en la página de login
    await expect(page).toHaveURL(/.*login/)
  })

  test('should login successfully with valid credentials', async ({ page }: { page: Page }) => {
    // ⚠️ IMPORTANTE: Estos valores deben ser credenciales de un usuario de TEST
    // En producción, usar variables de entorno o un usuario de pruebas dedicado
    const testUsername = process.env.TEST_USERNAME || 'test-user'
    const testPassword = process.env.TEST_PASSWORD || 'test-password'
    
    // Llenar el formulario con credenciales válidas
    await page.locator('#username').fill(testUsername)
    await page.locator('#password').fill(testPassword)
    
    // Click en el botón de login
    await page.getByRole('button', { name: /iniciar sesión|login/i }).click()
    
    // Esperar redirección al dashboard
    await page.waitForURL(/.*\/(dashboard|home|main)/, { timeout: 10000 })
    
    // Verificar que estamos en el dashboard
    await expect(page).toHaveURL(/.*\/(dashboard|home|main)/)
    
    // Verificar que hay elementos del dashboard visible (ajustar según tu UI)
    // Por ejemplo: verificar que el nombre del usuario aparece, o un menú, etc.
    await expect(page.locator('body')).toContainText(/dashboard|inicio/i)
  })

  test('should persist session after page reload', async ({ page }: { page: Page }) => {
    const testUsername = process.env.TEST_USERNAME || 'test-user'
    const testPassword = process.env.TEST_PASSWORD || 'test-password'
    
    // Login
    await page.locator('#username').fill(testUsername)
    await page.locator('#password').fill(testPassword)
    await page.getByRole('button', { name: /iniciar sesión|login/i }).click()
    
    // Esperar a estar en dashboard
    await page.waitForURL(/.*\/(dashboard|home|main)/, { timeout: 10000 })
    
    // Recargar la página
    await page.reload()
    
    // Verificar que seguimos autenticados (no fuimos redirigidos a /login)
    await expect(page).not.toHaveURL(/.*login/)
  })

  test('should logout successfully', async ({ page }: { page: Page }) => {
    const testUsername = process.env.TEST_USERNAME || 'test-user'
    const testPassword = process.env.TEST_PASSWORD || 'test-password'
    
    // Login primero
    await page.locator('#username').fill(testUsername)
    await page.locator('#password').fill(testPassword)
    await page.getByRole('button', { name: /iniciar sesión|login/i }).click()
    await page.waitForURL(/.*\/(dashboard|home|main)/, { timeout: 10000 })
    
    // Buscar y hacer click en el botón de logout
    // Ajustar selector según tu implementación (puede estar en un menú desplegable)
    await page.getByRole('button', { name: /cerrar sesión|logout|salir/i }).click()
    
    // Verificar redirección a login
    await expect(page).toHaveURL(/.*login/, { timeout: 5000 })
  })
})

/**
 * NOTAS DE CONFIGURACIÓN:
 * 
 * 1. Variables de entorno:
 *    Crear archivo .env.test con:
 *    TEST_USERNAME=usuario-de-prueba
 *    TEST_PASSWORD=password-de-prueba
 * 
 * 2. Usuario de pruebas:
 *    Crear un usuario dedicado para tests con permisos conocidos
 * 
 * 3. Ajustar selectores:
 *    Los selectores (getByLabel, getByRole) deben coincidir con tu UI real.
 *    Revisar src/views/Login.vue o LoginView.vue para los labels exactos.
 * 
 * 4. Backend de pruebas:
 *    Idealmente, estos tests deben ejecutarse contra un backend de STAGING
 *    con datos controlados, no contra producción.
 */
