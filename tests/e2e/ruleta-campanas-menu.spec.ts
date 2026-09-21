import { test, expect } from '@playwright/test'
import { installRecepcionAuth as installMockAuth } from './helpers/recepcionMocks'

const campanas = Array.from({ length: 25 }, (_, index) => ({
  id: String(index + 1), nombre: `Campaña de prueba ${index + 1}`, descripcion: 'Prueba de menú contextual',
  fechaInicio: '2026-01-01', fechaFin: '2026-12-31', estado: 'Borrador', estadoOperativo: 'borrador',
  estaVigente: true, disponibleParaGiro: false, diasEntreGiros: 15, maxGirosPorCliente: 1,
  segmentosPermitidos: [], requiereValidacionOneCard: true, premios: [],
}))

test.beforeEach(async ({ page }) => {
  // Ninguna operación de esta prueba llega a los backends reales.
  await page.route('**/*', async route => {
    const request = route.request()
    if (!['fetch', 'xhr'].includes(request.resourceType())) return route.continue()
    const path = new URL(request.url()).pathname
    await route.fulfill({ json: /\/api\/Campanas$/i.test(path) ? campanas : [] })
  })
  await installMockAuth(page, { userName: 'e2e-ruleta-menu', permissions: ['ruleta.administrar'] })
})

for (const viewport of [
  { width: 1920, height: 1080 }, { width: 1366, height: 768 },
  { width: 768, height: 1024 }, { width: 390, height: 844 },
]) {
  test(`menú visible en primera, intermedia y última fila a ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/ruleta/admin/campanas')
    const buttons = page.getByRole('button', { name: 'Más opciones', exact: true })
    await expect(buttons).toHaveCount(25)
    for (const index of [0, 12, 24]) {
      const button = buttons.nth(index)
      await button.scrollIntoViewIfNeeded()
      await button.click()
      const menu = page.getByRole('menu')
      await expect(menu).toBeVisible()
      await expect(menu).toHaveCSS('visibility', 'visible')
      await expect(menu).toHaveCSS('opacity', '1')
      const box = (await menu.boundingBox())!
      const anchor = (await button.boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(11.5)
      expect(box.y).toBeGreaterThanOrEqual(11.5)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 11.5)
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - 11.5)
      const gap = Math.min(Math.abs(box.y - anchor.y - anchor.height - 6), Math.abs(anchor.y - box.y - box.height - 6))
      expect(gap).toBeLessThanOrEqual(1)
      if (index === 24) {
        const scroll = await button.evaluate(el => {
          let offset = window.scrollY
          for (let parent = el.parentElement; parent; parent = parent.parentElement) offset = Math.max(offset, parent.scrollTop)
          return offset
        })
        expect(scroll).toBeGreaterThan(500)
        await page.screenshot({ path: testInfo.outputPath('ultima-fila.png') })
      }
      await page.keyboard.press('Escape')
      await expect(menu).toHaveCount(0)
      await expect(button).toBeFocused()
      await expect(button).toHaveAttribute('aria-expanded', 'false')
    }
  })
}

test('scroll interno, cierre por scroll externo y resize, teclado y click externo', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 300 })
  await page.goto('/ruleta/admin/campanas')
  const button = page.getByRole('button', { name: 'Más opciones', exact: true }).nth(12)
  await button.scrollIntoViewIfNeeded()
  await button.click()
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible()
  expect(await menu.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true)
  await menu.evaluate(el => { el.scrollTop = el.scrollHeight })
  await expect(menu).toBeVisible()
  await page.keyboard.press('End')
  await expect(page.getByRole('menuitem', { name: 'Eliminar', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toHaveCount(0)

  await button.click()
  await page.setViewportSize({ width: 641, height: 301 })
  await expect(menu).toHaveCount(0)

  await button.click()
  const moved = await button.evaluate(el => {
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      const before = parent.scrollTop
      parent.scrollTop += before > 0 ? -40 : 40
      if (parent.scrollTop !== before) return true
    }
    const before = window.scrollY
    window.scrollBy(0, before > 0 ? -40 : 40)
    return window.scrollY !== before
  })
  expect(moved).toBe(true)
  await expect(menu).toHaveCount(0)

  await button.click()
  await page.locator('body > [aria-hidden="true"].fixed').click({ position: { x: 1, y: 1 } })
  await expect(menu).toHaveCount(0)
})
