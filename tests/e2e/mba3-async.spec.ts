import { test, expect } from '@playwright/test'
import { installMba3HomologacionesAndCruceMocks } from './helpers/mba3Mocks'

/**
 * E2E del checklist async (ítem 6: cruce MBA3/SAP) con API mockeada.
 * Valida UI + poll sin depender de Celery/SAP/SQL.
 *
 * Requiere `npm run dev` (proxy /api/mba3 → localhost:8000); Playwright lo levanta vía webServer.
 */
test.describe('MBA3 async — cruce productos (mocked API)', () => {
  test.setTimeout(120_000)

  test.beforeEach(async ({ page }) => {
    await installMba3HomologacionesAndCruceMocks(page)
  })

  test('homologaciones: carga lista y completa cruce con toast de éxito', async ({ page }) => {
    await page.goto('/mba3-consultas/homologaciones')

    await expect(page.getByRole('heading', { name: /homologaciones de sku/i })).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByText('SKU-E2E')).toBeVisible({ timeout: 20_000 })

    const cruceBtn = page.getByRole('button', { name: /cruce mba3\/sap/i })
    await expect(cruceBtn).toBeEnabled()
    await cruceBtn.click()

    await expect(page.getByRole('heading', { name: /cruce de productos mba3/i })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(/cruce completado/i).first()).toBeVisible({ timeout: 45_000 })
  })

  test('homologaciones: muestra progreso mientras poll está en processing', async ({ page }) => {
    await installMba3HomologacionesAndCruceMocks(page, {
      processId: 'cruce-e2e-slow',
      processingPolls: 2,
    })

    await page.goto('/mba3-consultas/homologaciones')
    await expect(page.getByText('SKU-E2E')).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /cruce mba3\/sap/i }).click()

    await expect(page.getByText(/procesando cruce/i)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/cruce completado/i).first()).toBeVisible({ timeout: 45_000 })
  })
})
