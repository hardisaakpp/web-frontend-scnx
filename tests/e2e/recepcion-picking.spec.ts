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
  lines: [{ lineId: 1, itemCode: 'SKU-001', itemName: 'Producto E2E', quantity: 5, scanned: 0, barcode: '7501234567890' }],
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
    // Scoped to <main>: the app shell's own header also renders an h1 with this same route
    // title, so an unscoped getByRole('heading') here would match both and fail strict mode.
    await expect(page.getByRole('main').getByRole('heading', { name: /transferencias en curso/i })).toBeVisible()
    await expect(page.getByText('DOC-501')).toBeVisible()

    await page.getByRole('link', { name: /ver detalle/i }).click()
    await expect(page).toHaveURL(/\/recepcion-mercaderia\/en-curso\/501$/)
    // The detail view's own h1 is the static "Recepción" label, not the document number — the
    // document number is shown in the subtitle text ("Basado en transferencia DOC-501...").
    await expect(page.getByText(/DOC-501/)).toBeVisible()

    const row = page.locator('tbody tr').filter({ hasText: 'SKU-001' })
    // Columnas actuales: N.°(0), Código de barras(1), Artículo(2), Cantidad(3), Escaneados(4), Diferencia(5).
    // Cantidad=5, Escaneados=0 → Diferencia = Cantidad - Escaneados = 5, computado en frontend.
    await expect(row.locator('td').nth(3)).toHaveText('5')
    await expect(row.locator('td').nth(4)).toHaveText('0')
    await expect(row.locator('td').nth(5)).toHaveText('5')

    // La línea tiene código de barras, así que se escanea vía el lector (barcode-scan-*), no
    // el fallback manual (que solo aplica a líneas sin barcode).
    await page.getByTestId('barcode-scan-input').fill('7501234567890')
    await page.getByTestId('barcode-scan-quantity-input').fill('2')
    await page.getByTestId('barcode-scan-add-btn').click()

    // Escaneados=2, Diferencia recomputada a 3 tras el scan exitoso.
    await expect(row.locator('td').nth(4)).toHaveText('2')
    await expect(row.locator('td').nth(5)).toHaveText('3')
    expect(mocks.getScanCalls()).toBe(1)

    await page.getByTestId('confirm-btn').click()

    // Confirm/scan failures surface via ErrorDialog (data-testid="error-dialog"), not a
    // role="alert" element — see ErrorDialog.vue.
    const errorDialog = page.getByTestId('error-dialog')
    await expect(errorDialog).toBeVisible()
    await expect(errorDialog).toContainText('No se pudo integrar la transferencia a SAP')
    await expect(errorDialog).toContainText('Los escaneos se guardaron')
    await expect(errorDialog).toContainText('vuelva a intentarlo cuando el servicio esté disponible')

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
    await expect(page.getByText(/DOC-501/)).toBeVisible()

    await page.getByTestId('confirm-btn').click()

    await expect(page.getByTestId('error-dialog')).toHaveCount(0)
  })
})
