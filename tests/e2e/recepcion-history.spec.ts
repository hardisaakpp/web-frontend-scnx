import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { installRecepcionAuth, installHistoryMocks, type MockHistoryRow } from './helpers/recepcionMocks'

/**
 * E2E del historial de Recepción de Mercadería: filtro por rango de fechas
 * (MaterializedAtUtc) + número de transferencia, ambos client-side (sin nuevo GET),
 * y export CSV admin (GET history/all/export) vía descarga axios-blob.
 * api-recepcion-mercaderia mockeado vía page.route — determinístico, sin backend en vivo.
 */

const rows: MockHistoryRow[] = [
  { transferId: 1, documentNumber: 'DOC-100', warehouseCode: 'D001', materializedAtUtc: '2026-07-01T09:00:00Z', differencesCount: 0 },
  { transferId: 2, documentNumber: 'DOC-200', warehouseCode: 'D001', materializedAtUtc: '2026-07-10T09:00:00Z', differencesCount: 3 },
  { transferId: 3, documentNumber: 'DOC-300', warehouseCode: 'D001', materializedAtUtc: '2026-07-20T09:00:00Z', differencesCount: 1 },
]

test.describe('Recepción — historial de almacén (filtros client-side)', () => {
  test.beforeEach(async ({ page }) => {
    await installRecepcionAuth(page, { permissions: ['recepcion.history.view'] })
  })

  test('filtra por rango de fechas y por número de transferencia sin disparar un nuevo GET history', async ({ page }) => {
    const mocks = await installHistoryMocks(page, { rows })

    await page.goto('/recepcion-mercaderia/historial')
    await expect(page.getByRole('heading', { name: /historial de recepciones/i })).toBeVisible()
    await expect(page.getByText('DOC-100')).toBeVisible()
    await expect(page.getByText('DOC-200')).toBeVisible()
    await expect(page.getByText('DOC-300')).toBeVisible()

    // differencesCount viene directo de la respuesta de GET history, no se recalcula.
    const docRow200 = page.locator('tbody tr').filter({ hasText: 'DOC-200' })
    await expect(docRow200.locator('td').nth(3)).toHaveText('3')

    expect(mocks.getHistoryCalls()).toBe(1)

    // Rango que sólo cubre DOC-200 (2026-07-10) — DOC-100 (07-01) y DOC-300 (07-20) quedan fuera.
    await page.getByTestId('date-from-input').fill('2026-07-05')
    await page.getByTestId('date-from-input').dispatchEvent('change')
    await page.getByTestId('date-to-input').fill('2026-07-15')
    await page.getByTestId('date-to-input').dispatchEvent('change')

    await expect(page.getByText('DOC-200')).toBeVisible()
    await expect(page.getByText('DOC-100')).not.toBeVisible()
    await expect(page.getByText('DOC-300')).not.toBeVisible()

    // El filtro de fecha fue 100% client-side: sigue habiendo un único GET history.
    expect(mocks.getHistoryCalls()).toBe(1)

    // Limpiar rango y filtrar ahora por número de transferencia.
    await page.getByTestId('date-from-input').fill('')
    await page.getByTestId('date-from-input').dispatchEvent('change')
    await page.getByTestId('date-to-input').fill('')
    await page.getByTestId('date-to-input').dispatchEvent('change')
    await expect(page.getByText('DOC-100')).toBeVisible()

    await page.getByTestId('transfer-number-input').fill('300')

    await expect(page.getByText('DOC-300')).toBeVisible()
    await expect(page.getByText('DOC-100')).not.toBeVisible()
    await expect(page.getByText('DOC-200')).not.toBeVisible()

    expect(mocks.getHistoryCalls()).toBe(1)
  })
})

test.describe('Recepción — historial global admin (CSV export, vía toggle "Todas las tiendas")', () => {
  test.beforeEach(async ({ page }) => {
    await installRecepcionAuth(page, { permissions: ['recepcion.history.viewall'] })
  })

  test('exporta xlsx: dispara una descarga con el nombre y contenido esperados', async ({ page }) => {
    const exportBody = 'transferId,documentNumber,warehouseCode,materializedAtUtc,differencesCount\n1,DOC-100,D001,2026-07-01T09:00:00Z,0\n2,DOC-200,D001,2026-07-10T09:00:00Z,3\n'
    const mocks = await installHistoryMocks(page, { rows: [], allRows: rows, exportBody })

    await page.goto('/recepcion-mercaderia/historial')
    await expect(page.getByRole('heading', { name: /historial de recepciones/i })).toBeVisible()
    await expect(page.getByTestId('export-csv-btn')).toHaveCount(0)

    await page.getByTestId('mode-toggle-all').click()

    await expect(page.getByRole('heading', { name: /historial global de recepciones/i })).toBeVisible()
    await expect(page.getByText('DOC-100')).toBeVisible()
    await expect(page.getByText('DOC-200')).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('export-csv-btn').click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('historial-recepcion.xlsx')
    expect(mocks.getExportCalls()).toBe(1)

    const savedPath = await download.path()
    expect(savedPath).not.toBeNull()
    const content = readFileSync(savedPath as string, 'utf8')
    expect(content).toBe(exportBody)

    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('export Excel con error del backend no presenta una descarga falsa/vacía; el error se muestra inline', async ({ page }) => {
    await installHistoryMocks(page, { rows: [], allRows: rows, exportBehavior: 'error' })

    await page.goto('/recepcion-mercaderia/historial')
    await page.getByTestId('mode-toggle-all').click()
    await expect(page.getByText('DOC-100')).toBeVisible()

    await page.getByTestId('export-csv-btn').click()

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText(/no se pudo exportar el archivo excel/i)
  })
})
