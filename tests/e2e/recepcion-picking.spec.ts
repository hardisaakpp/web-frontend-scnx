import { test, expect } from '@playwright/test'
import { installRecepcionAuth, installPickingMocks, type MockTransfer } from './helpers/recepcionMocks'

/**
 * E2E del flujo de picking de Recepción de Mercadería: en-curso → detalle → escaneo →
 * confirmación, incluyendo el error conocido de SAP (api-middleware-sap) en confirm.
 * api-recepcion-mercaderia/api-middleware-sap están mockeados vía page.route — no
 * dependen de backends en vivo.
 */

const transferFixture: MockTransfer = {
  transferId: 501,
  documentNumber: 'DOC-501',
  originWarehouseCode: 'CD01',
  destinationWarehouseCode: 'D001',
  status: 'in-progress',
  glpiTicket: null,
  createdAtUtc: '2026-07-10T09:00:00Z',
  materializedAtUtc: null,
  lines: [{ lineId: 1, itemCode: 'SKU-001', itemName: 'Producto E2E', quantity: 5, scanned: 0 }],
}

test.describe('Recepción — picking (en-curso → detalle → scan → confirm)', () => {
  test.beforeEach(async ({ page }) => {
    await installRecepcionAuth(page, {
      permissions: [
        'recepcion.reception.view',
        'recepcion.picking.scan',
        'recepcion.reception.confirm',
        'recepcion.reception.confirm.partial',
        'recepcion.diferencias.gestionar',
      ],
    })
  })

  test('escanea un artículo, recomputa Diferencia y confirma; SAP-500 se muestra sin crashear y queda reintentable', async ({
    page,
  }) => {
    const mocks = await installPickingMocks(page, { transfer: transferFixture, confirmBehavior: 'sap-500' })

    await page.goto('/recepcion-mercaderia/en-curso')
    await expect(page.getByRole('heading', { name: /transferencias en curso/i })).toBeVisible()
    await expect(page.getByText('DOC-501')).toBeVisible()

    await page.getByRole('link', { name: /ver detalle/i }).click()
    await expect(page).toHaveURL(/\/recepcion-mercaderia\/en-curso\/501$/)
    await expect(page.getByRole('heading', { name: 'DOC-501' })).toBeVisible()

    const row = page.locator('tbody tr').filter({ hasText: 'SKU-001' })
    // Cantidad=5, Escaneados=0 → Diferencia = Cantidad - Escaneados = 5, computado en frontend.
    await expect(row.locator('td').nth(1)).toHaveText('5')
    await expect(row.locator('td').nth(2)).toHaveText('0')
    await expect(row.locator('td').nth(3)).toHaveText('5')

    await page.getByTestId('scan-itemcode-input').fill('SKU-001')
    await page.getByTestId('scan-quantity-input').fill('2')
    await page.getByRole('button', { name: 'Escanear' }).click()

    // Escaneados=2, Diferencia recomputada a 3 tras el scan exitoso.
    await expect(row.locator('td').nth(2)).toHaveText('2')
    await expect(row.locator('td').nth(3)).toHaveText('3')
    expect(mocks.getScanCalls()).toBe(1)

    await page.getByTestId('confirm-btn').click()

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible()
    await expect(alert).toContainText('No se pudo integrar la transferencia a SAP')
    await expect(alert).toContainText('Los escaneos se guardaron')
    await expect(alert).toContainText('reintentá cuando el servicio esté disponible')

    // No crash / sin navegación fuera de la vista; el traslado queda en estado pre-confirm
    // y reintentable (el botón Confirmar sigue presente y habilitado).
    await expect(page).toHaveURL(/\/recepcion-mercaderia\/en-curso\/501$/)
    await expect(page.getByTestId('confirm-btn')).toBeVisible()
    await expect(page.getByTestId('confirm-btn')).toBeEnabled()
    expect(mocks.getConfirmCalls()).toBe(1)
  })

  test('confirmación exitosa (sin degradación SAP) no muestra alerta de error', async ({ page }) => {
    await installPickingMocks(page, { transfer: transferFixture, confirmBehavior: 'success' })

    await page.goto('/recepcion-mercaderia/en-curso/501')
    await expect(page.getByRole('heading', { name: 'DOC-501' })).toBeVisible()

    await page.getByTestId('confirm-btn').click()

    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})
