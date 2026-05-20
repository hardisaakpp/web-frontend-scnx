import { test, expect } from '@playwright/test'
import { installMba3PlantillaMocks } from './helpers/mba3Mocks'

/**
 * E2E checklist ítem 1: plantilla Excel async (upload-async + poll).
 */
test.describe('MBA3 async — plantilla Excel (mocked API)', () => {
  test.setTimeout(120_000)

  test.beforeEach(async ({ page }) => {
    await installMba3PlantillaMocks(page)
  })

  test('cargar plantilla: modal de progreso y toast de éxito', async ({ page }) => {
    await page.goto('/mba3-consultas/cargar-plantilla')

    await expect(page.getByRole('heading', { name: /cargar plantilla/i })).toBeVisible({
      timeout: 20_000,
    })

    const uploadBtn = page.getByRole('button', { name: /cargar plantillas excel/i })
    await expect(uploadBtn).toBeEnabled()

    const fileChooserPromise = page.waitForEvent('filechooser')
    await uploadBtn.click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: 'e2e-plantilla.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('PK\x03\x04e2e-mock-xlsx'),
    })

    await expect(page.getByRole('heading', { name: /cargando plantilla excel/i })).toBeVisible({
      timeout: 10_000,
    })

    await expect(page.getByText(/plantilla procesada exitosamente/i).first()).toBeVisible({
      timeout: 45_000,
    })

    await expect(page).toHaveURL(/cargar-plantilla\/PED-E2E-001/i, { timeout: 15_000 })
  })

  test('cargar plantilla: muestra mensaje de servidor durante processing', async ({ page }) => {
    await installMba3PlantillaMocks(page, {
      processId: 'plantilla-e2e-slow',
      processingPolls: 2,
    })

    await page.goto('/mba3-consultas/cargar-plantilla')
    await expect(page.getByRole('button', { name: /cargar plantillas excel/i })).toBeEnabled({
      timeout: 20_000,
    })

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: /cargar plantillas excel/i }).click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles({
      name: 'e2e-plantilla.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('PK\x03\x04e2e-mock-xlsx'),
    })

    await expect(page.getByText(/validando plantilla/i)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/plantilla procesada exitosamente/i).first()).toBeVisible({
      timeout: 45_000,
    })
    await expect(page).toHaveURL(/cargar-plantilla\/PED-E2E-001/i, { timeout: 15_000 })
  })
})
