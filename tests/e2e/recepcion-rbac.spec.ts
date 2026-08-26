import { test, expect } from '@playwright/test'
import {
  installRecepcionAuth,
  installHistoryMocks,
  installPendingMocks,
  type MockHistoryRow,
  type MockPendingLine,
} from './helpers/recepcionMocks'

/**
 * E2E de control de acceso de Recepción de Mercadería:
 * - `history.viewall` gatea, dentro de HistoryView.vue, si la vista es la del propio almacén o
 *   la consolidada — decidido una sola vez al montar (fixed per session), sin toggle en pantalla.
 *   La vieja ruta /historial/admin sigue siendo un redirect a /historial (compatibilidad de
 *   bookmarks/links viejos).
 * - Pending-transfers está en vivo (featureReadiness.pendingTransfersReady=true, ver
 *   config/featureReadiness.ts) — el banner "Próximamente" es un kill switch manual que hoy no
 *   se alcanza; ese estado degradado ya está cubierto a nivel unitario
 *   (pendingStore.test.ts/PendingTransfersView.test.ts togglean el flag directamente).
 */

const adminRows: MockHistoryRow[] = [
  { transferId: 1, documentNumber: 'DOC-100', warehouseCode: 'D001', materializedAtUtc: '2026-07-01T09:00:00Z', differencesCount: 0 },
]

test.describe('Recepción — RBAC historial admin (history.viewall)', () => {
  test('usuario sin history.viewall ve la vista de su propio almacén, sin N° transferencia ni export', async ({ page }) => {
    await installRecepcionAuth(page, { roles: ['User'], permissions: ['recepcion.history.view'] })
    await installHistoryMocks(page, { rows: [], allRows: adminRows })

    await page.goto('/recepcion-mercaderia/historial')

    await expect(page.getByRole('heading', { name: /historial de recepciones/i })).toBeVisible()
    await expect(page.getByTestId('date-from-input')).toBeVisible()
    await expect(page.getByTestId('date-to-input')).toBeVisible()
    await expect(page.getByTestId('transfer-number-input')).toHaveCount(0)
    await expect(page.getByTestId('export-csv-btn')).toHaveCount(0)
  })

  test('el bookmark viejo /historial/admin redirige a /historial y el usuario con history.viewall accede al historial global directamente', async ({ page }) => {
    await installRecepcionAuth(page, { roles: ['User'], permissions: ['recepcion.history.viewall'] })
    await installHistoryMocks(page, { rows: [], allRows: adminRows })

    await page.goto('/recepcion-mercaderia/historial/admin')

    await expect(page).toHaveURL(/\/recepcion-mercaderia\/historial$/)
    // Con el permiso viewall, la vista consolidada se muestra directamente al montar — no hay
    // toggle ni estado intermedio (fixed per session, ver HistoryView.vue).
    await expect(page.getByTestId('export-csv-btn')).toBeVisible()

    // La vista abre filtrando por "hoy" por defecto — ampliar el rango para ver el fixture (julio 2026).
    await page.getByTestId('date-from-input').fill('2026-01-01')
    await page.getByTestId('date-from-input').dispatchEvent('change')
    await page.getByTestId('date-to-input').fill('2026-12-31')
    await page.getByTestId('date-to-input').dispatchEvent('change')

    await expect(page.getByText('DOC-100')).toBeVisible()
  })
})

const pendingLines: MockPendingLine[] = [
  {
    sapTransferRequestNumber: 'PT-900',
    itemCode: 'SKU-900',
    description: 'Producto pendiente E2E',
    openQuantity: 8,
    originWarehouseCode: 'CD01',
    destinationWarehouseCode: 'D001',
    sapBaseDocEntry: 1,
    sapBaseLineNum: 0,
    sapDocumentDate: '2026-08-01',
  },
]

test.describe('Recepción — pending-transfers (vista en vivo)', () => {
  test('usuario con permiso ve la lista de pendientes y puede iniciar la recepción de una línea', async ({ page }) => {
    await installRecepcionAuth(page, { permissions: ['recepcion.reception.view'] })
    const mocks = await installPendingMocks(page, { lines: pendingLines, materializedTransferId: 901 })

    await page.goto('/recepcion-mercaderia/pendientes')

    // Scoped a <main>: el shell de la app también renderiza un h1 con este mismo título de ruta.
    await expect(page.getByRole('main').getByRole('heading', { name: /transferencias pendientes/i })).toBeVisible()
    await expect(page.getByText('PT-900')).toBeVisible()
    await expect(page.getByTestId('materialize-btn')).toBeVisible()
    expect(mocks.getPendingCalls()).toBe(1)

    await page.getByTestId('materialize-btn').click()
    await page.getByTestId('confirm-dialog-confirm-btn').click()

    // receive() materializa y navega al detalle de la nueva transferencia (en-curso/:id).
    expect(mocks.getMaterializeCalls()).toBe(1)
    await expect(page).toHaveURL(/\/recepcion-mercaderia\/en-curso\/901$/)
  })
})
