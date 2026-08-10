import { test, expect } from '@playwright/test'
import { installRecepcionAuth, installHistoryMocks, installRecepcionApiTripwire, type MockHistoryRow } from './helpers/recepcionMocks'

/**
 * E2E de control de acceso de Recepción de Mercadería:
 * - `history.viewall` ya no gatea una ruta separada: gatea, dentro de HistoryView.vue,
 *   la presencia del toggle "Mi almacén" / "Todas las tiendas" — UI-only per design.md, no
 *   es un boundary de seguridad server-side. La vieja ruta /historial/admin ahora es un
 *   redirect a /historial (compatibilidad de bookmarks/links viejos).
 * - Pending-transfers se muestra en estado deshabilitado ("Próximamente") mientras
 *   featureReadiness.pendingTransfersReady es false, sin disparar ningún llamado en vivo.
 */

const adminRows: MockHistoryRow[] = [
  { transferId: 1, documentNumber: 'DOC-100', warehouseCode: 'D001', materializedAtUtc: '2026-07-01T09:00:00Z', differencesCount: 0 },
]

test.describe('Recepción — RBAC historial admin (history.viewall)', () => {
  test('usuario sin history.viewall no ve el toggle "Todas las tiendas" en /historial', async ({ page }) => {
    await installRecepcionAuth(page, {
      roles: ['User'],
      permissions: ['recepcion.history.view'], // tiene el permiso de historial de almacén, NO viewall
    })
    await installHistoryMocks(page, { rows: [], allRows: adminRows })

    await page.goto('/recepcion-mercaderia/historial')

    await expect(page.getByRole('heading', { name: /historial de recepciones/i })).toBeVisible()
    await expect(page.getByTestId('mode-toggle-all')).toHaveCount(0)
    await expect(page.getByTestId('mode-toggle-own')).toHaveCount(0)
    await expect(page.getByTestId('export-csv-btn')).toHaveCount(0)
  })

  test('el bookmark viejo /historial/admin redirige a /historial y el usuario con history.viewall ve el toggle y accede al historial global', async ({ page }) => {
    await installRecepcionAuth(page, {
      roles: ['User'],
      permissions: ['recepcion.history.viewall'],
    })
    await installHistoryMocks(page, { rows: [], allRows: adminRows })

    await page.goto('/recepcion-mercaderia/historial/admin')

    await expect(page).toHaveURL(/\/recepcion-mercaderia\/historial$/)
    await expect(page.getByTestId('mode-toggle-all')).toBeVisible()

    await page.getByTestId('mode-toggle-all').click()

    await expect(page.getByRole('heading', { name: /historial global de recepciones/i })).toBeVisible()
    await expect(page.getByText('DOC-100')).toBeVisible()
  })
})

test.describe('Recepción — pending-transfers estado deshabilitado', () => {
  test('vista pendientes se muestra bloqueada por SAP, sin acción de materializar y sin llamado en vivo', async ({ page }) => {
    await installRecepcionAuth(page, { permissions: ['recepcion.reception.view'] })
    const tripwire = await installRecepcionApiTripwire(page)

    await page.goto('/recepcion-mercaderia/pendientes')

    await expect(page.getByRole('heading', { name: /transferencias pendientes/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /próximamente/i })).toBeVisible()
    await expect(page.getByText(/bloqueada por la integración con sap/i)).toBeVisible()

    await expect(page.getByTestId('materialize-btn')).toHaveCount(0)

    // featureReadiness.pendingTransfersReady=false → fetchPending() retorna temprano; cero llamados reales.
    expect(tripwire.getCallCount()).toBe(0)
  })
})
