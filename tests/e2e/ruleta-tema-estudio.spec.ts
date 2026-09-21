import { test, expect } from '@playwright/test'
import { installRecepcionAuth as installMockAuth } from './helpers/recepcionMocks'
import { PARTICULAS } from '../../src/modules/ruleta/constants/particulas.config'

const TEMA_DEFECTO_JSON = JSON.stringify({
  paleta_segmentos: ['#1a1a1a', '#e8e0cc', '#1a1a1a', '#e8e0cc', '#1a1a1a', '#e8e0cc', '#1a1a1a', '#e8e0cc'],
  color_texto_segmentos: '#ffffff',
  color_aro_primario: '#C9A84C',
  color_aro_secundario: '#8B6914',
  color_hub_fondo: '#111111',
  color_hub_acento: '#C9A84C',
  color_puntero: '#ffffff',
  color_fondo_inicio: '#0d0d0d',
  color_fondo_fin: '#1a1200',
  color_halo: '#C9A84C',
  color_boton: '#C9A84C',
})

test('hub vectorial, degradados y catálogo completo sin cargas de archivos', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/ruleta/admin/tema')
  await expect(page.getByText('Sincronizado con producción')).toBeVisible()
  await page.getByRole('button', { name: 'Branding y Hub', exact: true }).click()
  await expect(page.locator('input[type=file]')).toHaveCount(0)
  await page.getByLabel('Color de acento del hub').fill('#12ab34')
  await page.getByLabel('Escala del disco central').fill('1.5')
  await expect(page.locator('svg g[transform="translate(100 100) scale(1.5)"]')).toHaveCount(1)
  await expect(page.locator('svg path[fill="#12ab34"]')).toHaveCount(1)
  await page.getByRole('button', { name: 'Fondo y Atmósfera', exact: true }).click()
  await expect(page.locator('input[type=file]')).toHaveCount(0)
  await page.getByLabel('Ayuda sobre fondo').click()
  await expect(page.getByText('El degradado y colores configurados cubrirán toda la pantalla', { exact: false })).toBeVisible()
  for (const tipo of ['lineal', 'radial', 'mesh']) {
    await page.getByLabel('Estilo de degradado').selectOption(tipo)
  }
  const overlay = page.getByTestId('atmospheric-particles')
  for (const efecto of PARTICULAS) {
    await page.getByRole('button', { name: efecto.etiqueta, exact: true }).click()
    await expect(overlay).toHaveAttribute('data-efecto', efecto.id)
    await expect(overlay.locator('span')).toHaveCount(efecto.id === 'ninguno' ? 0 : 28)
    if (efecto.id !== 'ninguno') {
      await expect.poll(() => overlay.locator('span').first().evaluate(el => el.getAnimations().length)).toBe(1)
    }
  }
  for (const [intensidad, cantidad] of [['baja', 12], ['media', 28], ['alta', 48]] as const) {
    await page.getByRole('button', { name: intensidad, exact: true }).click()
    await expect(overlay.locator('span')).toHaveCount(cantidad)
  }
  await page.screenshot({ path: 'test-results/tema-vectorial-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  for (const dispositivo of ['Tablet horizontal', 'Tablet vertical', 'Kiosko Full HD']) {
    await page.getByRole('button', { name: dispositivo, exact: true }).click()
    const marco = await overlay.locator('..').boundingBox()
    const rueda = await overlay.locator('..').locator('.aspect-square').boundingBox()
    expect(marco).not.toBeNull()
    expect(rueda).not.toBeNull()
    expect(rueda!.y).toBeGreaterThan(marco!.y)
    expect(rueda!.y + rueda!.height).toBeLessThan(marco!.y + marco!.height)
    expect(rueda!.x).toBeGreaterThan(marco!.x)
    expect(rueda!.x + rueda!.width).toBeLessThan(marco!.x + marco!.width)
  }
  await page.screenshot({ path: 'test-results/tema-vectorial-mobile.png', fullPage: true })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(overlay.locator('span').first()).toBeHidden()
  await page.getByRole('button', { name: 'Publicar en tiendas', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar publicación', exact: true }).click()
  await expect(page.getByText('Sincronizado con producción')).toBeVisible()
  const config = JSON.parse(temaPublicado.configuracionJson) as Record<string, unknown>
  expect(config.hub).not.toHaveProperty('logo_url')
  expect(config.fondo).not.toHaveProperty('imagen_url')
  expect(config.fondo).toMatchObject({ tipo: 'gradiente', gradiente: { tipo: 'mesh' } })
  expect(config.particulas).toEqual({ tipo: 'luces_flotantes', intensidad: 'alta' })
})

let temaPublicado = {
  id: 'tema-global-1',
  nombre: 'Tema Global',
  configuracionJson: TEMA_DEFECTO_JSON,
  esGlobalPredeterminado: true,
  esPublicado: true,
  rowVersion: 'AAAAAAAAAAA=',
  updatedAt: new Date().toISOString(),
}

test.beforeEach(async ({ page }) => {
  temaPublicado = { ...temaPublicado, configuracionJson: TEMA_DEFECTO_JSON }
  // Ninguna operación de esta prueba llega al backend real de Temas ni a MinIO.
  await page.route('**/*', async (route) => {
    const request = route.request()
    if (!['fetch', 'xhr'].includes(request.resourceType())) return route.continue()
    const path = new URL(request.url()).pathname

    if (/\/api\/temas\/presets$/i.test(path)) return route.fulfill({ json: [] })

    if (/\/api\/temas\/global$/i.test(path)) {
      if (request.method() === 'PUT') {
        const body = request.postDataJSON() as { configuracionJson: string }
        temaPublicado = { ...temaPublicado, configuracionJson: body.configuracionJson }
        return route.fulfill({ json: temaPublicado })
      }
      return route.fulfill({ json: temaPublicado })
    }

    // Aísla también servicios del shell: un 401 real podría cerrar la sesión simulada.
    return route.fulfill({ json: [] })
  })
  await installMockAuth(page, { userName: 'e2e-ruleta-tema', permissions: ['ruleta.administrar'] })
})

test('editar un color, publicar con confirmación y ver el estado sincronizado', async ({ page }) => {
  await page.goto('/ruleta/admin/tema')

  await expect(page.getByText('Sincronizado con producción')).toBeVisible()

  // Cambiar el color del botón "Girar Ruleta" en la pestaña Paleta (activa por defecto).
  const colorBotonInput = page.locator('#color-color_boton')
  await colorBotonInput.evaluate((el: HTMLInputElement) => {
    el.value = '#00ff00'
    el.dispatchEvent(new Event('input'))
  })

  await expect(page.getByText('Cambios sin publicar')).toBeVisible()

  const publishRequest = page.waitForRequest(
    (req) => /\/api\/temas\/global$/i.test(new URL(req.url()).pathname) && req.method() === 'PUT'
  )

  await page.getByRole('button', { name: 'Publicar en tiendas' }).click()
  await expect(page.getByRole('button', { name: 'Confirmar publicación' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar publicación' }).click()

  const request = await publishRequest
  const body = request.postDataJSON() as { configuracionJson: string }
  expect(JSON.parse(body.configuracionJson).color_boton).toBe('#00ff00')

  await expect(page.getByText('Sincronizado con producción')).toBeVisible()
})

test('deshacer revierte el último cambio sin publicar', async ({ page }) => {
  await page.goto('/ruleta/admin/tema')

  const colorBotonInput = page.locator('#color-color_boton')
  await colorBotonInput.evaluate((el: HTMLInputElement) => {
    el.value = '#123456'
    el.dispatchEvent(new Event('input'))
  })
  await expect(page.getByText('Cambios sin publicar')).toBeVisible()

  await page.getByRole('button', { name: 'Deshacer' }).click()

  await expect(page.getByText('Sincronizado con producción')).toBeVisible()
})

