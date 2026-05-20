import { test, expect } from '@playwright/test'

const liveEnabled =
  process.env.E2E_LIVE === '1' &&
  !!process.env.TEST_USERNAME &&
  !!process.env.TEST_PASSWORD

/**
 * Checklist E2E contra backend real (Docker `app` en :8000).
 * Omitido por defecto: definir E2E_LIVE=1, TEST_USERNAME y TEST_PASSWORD.
 */
test.describe('MBA3 async — live (backend real)', () => {
  test.skip(!liveEnabled, 'Requiere E2E_LIVE=1, TEST_USERNAME y TEST_PASSWORD')

  test.setTimeout(180_000)

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.locator('#username').fill(process.env.TEST_USERNAME!)
    await page.locator('#password').fill(process.env.TEST_PASSWORD!)
    await page.getByRole('button', { name: /iniciar sesión/i }).click()
    await page.waitForURL(/\/(dashboard|mba3-consultas)/, { timeout: 30_000 })
  })

  test('homologaciones: página carga con backend real', async ({ page }) => {
    await page.goto('/mba3-consultas/homologaciones')
    await expect(page.getByRole('heading', { name: /homologaciones de sku/i })).toBeVisible({
      timeout: 20_000,
    })
    // Sin click en cruce (evita job largo en CI); smoke de auth + proxy + GET lista
    await expect(page.locator('body')).not.toContainText(/error al cargar homologaciones/i)
  })

  test('proceso completo: pestaña accesible', async ({ page }) => {
    await page.goto('/mba3-consultas/proceso')
    await expect(page).toHaveURL(/proceso/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('cargar plantilla: pantalla accesible', async ({ page }) => {
    await page.goto('/mba3-consultas/cargar-plantilla')
    await expect(page).toHaveURL(/cargar-plantilla/)
    await expect(page.locator('body')).toBeVisible()
  })
})
