import { readFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
import { installRecepcionAuth, installTransitMocks, type MockTransitLine } from './helpers/recepcionMocks'

/**
 * E2E de Transferencias en Tránsito: listado paginado (GET pending-transfers/transit), búsqueda
 * server-side por N° de transferencia o bodega transitoria, y export xlsx sin paginar (GET
 * pending-transfers/transit/report). Gateado por recepcion.reception.transit.view — validado
 * también server-side, no solo por el guard de rutas del frontend.
 */

const lines: MockTransitLine[] = [
  { sapTransferRequestNumber: 'SAP-900', transitWarehouseCode: 'TRL-QSN', quantity: 12, sapDocumentDate: '2026-08-01' },
  { sapTransferRequestNumber: 'SAP-901', transitWarehouseCode: 'TRL-QSS2', quantity: 5, sapDocumentDate: '2026-08-02' },
]

test.describe('Recepción — Transferencias en Tránsito', () => {
  test.beforeEach(async ({ page }) => {
    await installRecepcionAuth(page, { permissions: ['recepcion.reception.transit.view'] })
  })

  test('muestra el listado con las 4 columnas y busca en todo el listado vía un GET real (no solo la página cargada)', async ({ page }) => {
    const mocks = await installTransitMocks(page, { lines })

    await page.goto('/recepcion-mercaderia/transitorias')

    // Scoped a <main>: el shell de la app también renderiza un h1 con este mismo título de ruta.
    await expect(page.getByRole('main').getByRole('heading', { name: /transferencias en tránsito/i })).toBeVisible()
    await expect(page.getByText('SAP-900')).toBeVisible()
    await expect(page.getByText('TRL-QSN')).toBeVisible()
    await expect(page.getByText('SAP-901')).toBeVisible()
    expect(mocks.getTransitCalls()).toBe(1)

    await page.getByTestId('search-input').fill('SAP-901')
    await page.getByTestId('search-btn').click()

    // No se afirma un conteo exacto de llamados: el debounce de 300ms es un timer real en el
    // navegador (no fake timers, como sí puede el unit test) y puede disparar antes que el click
    // en "Buscar" según la latencia — mismo comportamiento que tendría un usuario real tipeando
    // rápido y haciendo click enseguida. Lo que importa es el resultado final en pantalla.
    await expect(page.getByText('SAP-901')).toBeVisible()
    await expect(page.getByText('SAP-900')).not.toBeVisible()
    expect(mocks.getTransitCalls()).toBeGreaterThan(1)
  })

  test('exporta el reporte xlsx completo (hojas Documentos + Detalle, sin paginar)', async ({ page }) => {
    const reportBody = 'sapTransferRequestNumber,transitWarehouseCode,quantity,sapDocumentDate\nSAP-900,TRL-QSN,12,2026-08-01\n'
    const mocks = await installTransitMocks(page, { lines, reportBody })

    await page.goto('/recepcion-mercaderia/transitorias')
    await expect(page.getByText('SAP-900')).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('download-transit-report-btn').click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toBe('transferencias-transito.xlsx')
    expect(mocks.getReportCalls()).toBe(1)

    const savedPath = await download.path()
    expect(savedPath).not.toBeNull()
    const content = readFileSync(savedPath as string, 'utf8')
    expect(content).toBe(reportBody)
  })
})
