import { expect, test, type Page } from '@playwright/test'
import { installRecepcionAuth } from './helpers/recepcionMocks'
import type { DepositoDto } from '../../src/modules/tesoreria/types/tesoreria.types'

// Datos aislados de prueba: todas las peticiones de Tesorería se interceptan aquí.
const deposito: DepositoDto = {
  id: 101, empresaId: 1, almacenId: 47, codigoAlmacen: 'T047', fechaCierreCaja: '2026-09-18',
  fechaDepositoBanco: '2026-09-19', cuentaFinancieraId: 9, numeroComprobante: '12345678', montoDepositado: 100,
  moneda: 'USD', tipoDeposito: 'dtCash', responsable: 'Cajero de prueba', esSobrante: false,
  estado: 1, creadoSAP: false, docEntrySAP: null, fechaIntegracionSAP: null, nombreArchivoOriginal: 'recibo.png'
}
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aM1sAAAAASUVORK5CYII=', 'base64')

async function instalar(page: Page, options: { detalleListo?: Promise<void>; bloqueado?: boolean; sinCatalogo?: boolean } = {}) {
  await installRecepcionAuth(page, {
    userName: 'tesoreria-e2e', roles: ['User'],
    permissions: ['Consultar', 'Crear', 'Eliminar', 'ConfigurarBloqueos'].map(permiso => `Tesoreria.Depositos.${permiso}`),
    warehouseAccesses: [{ codAlmacen: 'T047', warehouseGroups: [{ almacenes: ['T047', 'T052'] }] }]
  })
  await page.addInitScript(() => {
    window.CONFIG = { VITE_API_CORE_URL: '/api', VITE_TESORERIA_API_URL: '/tesoreria-api', VITE_REPOSICIONES_API_URL: '/api/reposicion-api' }
  })
  await page.route('**/api/reposicion-api/Almacen**', route => route.fulfill({ json: {
    items: options.sinCatalogo ? [] : [{ id: 47, code: 'T047', name: 'Tienda 47' }, { id: 52, code: 'T052', name: 'Tienda 52' }]
  } }))
  let contactosGet = 0
  const payloads: string[] = []
  await page.route('**/tesoreria-api/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/tesoreria-api', '')
    if (path === '/depositos/resumen') {
      await route.fulfill({ json: [{ fechaCierre: '2026-09-18', codigoAlmacen: url.searchParams.get('codigoAlmacen'), totalEfectivo: 100.2, totalDepositado: 100, diferencia: 0.2, pendientesSAP: 1 }] })
    } else if (path.startsWith('/depositos/detalle/')) {
      await options.detalleListo
      await route.fulfill({ json: { codigoAlmacen: path.split('/')[3], fechaCierreCaja: '2026-09-18', depositos: [deposito], permitirNuevoDeposito: !options.bloqueado, motivoBloqueo: options.bloqueado ? 'Plazo vencido' : null } })
    } else if (path.startsWith('/cuentas-financieras')) {
      await route.fulfill({ json: [{ id: 9, codigoCuentaSAP: '1101', codigoFormateado: '1101', nombreCuenta: 'Banco de prueba', habilitadaParaTiendas: true, activa: true }] })
    } else if (path === '/depositos' && request.method() === 'POST') {
      payloads.push(request.postData() ?? '')
      await route.fulfill(payloads.length === 1
        ? { status: 409, json: { status: 409, title: 'Conflict', detail: 'El comprobante 12345678 ya existe' } }
        : { status: 201, json: { ...deposito, numeroComprobante: '87654321' } })
    } else if (path.endsWith('/comprobante/url')) {
      await route.fulfill({ json: { url: 'data:image/png;base64,' + pixel.toString('base64'), nombreArchivo: 'recibo.png' } })
    } else if (path === '/contactos-notificacion') {
      contactosGet++
      await route.fulfill({ json: [{ id: 1, nombreCompleto: 'Contabilidad de prueba', email: 'prueba@mabeltrading.com.ec', cargo: null, activo: true }] })
    } else if (path === '/configuracion') {
      await route.fulfill({ json: { bloqueoNuevoActivo: false, diasMaximoNuevo: 10, bloqueoDepositoActivo: false, diasMaximoDeposito: 10, horaLimiteCorte: '14:00:00', notificacionesActivas: true, usarRangoCalendarioNotificacion: false, diasVentanaNotificacion: 10, fechaInicioNotificacion: null, fechaFinNotificacion: null } })
    } else {
      await route.fulfill({ status: 404, json: { title: 'Endpoint no previsto en la prueba' } })
    }
  })
  return { payloads, contactosGet: () => contactosGet }
}

async function abrirDrawer(page: Page) {
  await page.goto('/tesoreria/mis-depositos')
  await page.getByRole('button', { name: 'Ver papeletas' }).click()
  return page.locator('dialog.drawer-panel-dialog')
}

async function completarDatos(page: Page) {
  await page.getByRole('button', { name: 'Registrar Nuevo Depósito' }).click()
  const modal = page.getByRole('dialog', { name: 'Registrar depósito bancario' })
  await modal.getByLabel('Cuenta bancaria receptora').selectOption('9')
  await modal.locator('#numeroComprobante').fill('12345678')
  await modal.getByLabel('Monto depositado').fill('0.20')
  await modal.locator('input[type="file"]').setInputFiles({ name: 'recibo.png', mimeType: 'image/png', buffer: pixel })
  await expect(modal.getByText('supera el efectivo pendiente', { exact: false })).toHaveCount(0)
  await modal.getByRole('button', { name: 'Continuar al Paso 2' }).click()
  await modal.getByLabel('Confirmar N.º de papeleta').fill('12345678')
  await modal.getByRole('button', { name: 'Continuar al Resumen' }).click()
  return modal
}

test('Top Layer: centrado, foco, Escape y backdrop conservan el drawer', async ({ page }, info) => {
  await instalar(page)
  const drawer = await abrirDrawer(page)
  const abrir = drawer.getByRole('button', { name: 'Registrar Nuevo Depósito' })
  await abrir.click()
  const modal = page.getByRole('dialog', { name: 'Registrar depósito bancario' })
  await expect(modal).toBeVisible()
  expect(await modal.evaluate(element => element.matches(':modal'))).toBe(true)
  expect(await drawer.evaluate(element => getComputedStyle(element, '::backdrop').backgroundColor)).toBe('rgba(0, 0, 0, 0)')
  const bounds = await modal.boundingBox()
  const viewport = page.viewportSize()!
  expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2)).toBeLessThan(2)
  expect(Math.abs(bounds!.y + bounds!.height / 2 - viewport.height / 2)).toBeLessThan(2)
  await modal.getByLabel('Cuenta bancaria receptora').focus()
  for (let index = 0; index < 16; index++) {
    await page.keyboard.press('Tab')
    // El diálogo nativo permite acceder a la barra del navegador (activeElement=body),
    // pero ningún control del drawer o de la página debe recibir el foco.
    expect(await modal.evaluate(element => element.contains(document.activeElement) || document.activeElement === document.body)).toBe(true)
  }
  await modal.getByLabel('Cuenta bancaria receptora').focus()
  await page.screenshot({ path: info.outputPath('registro-sobre-drawer.png') })
  await page.keyboard.press('Escape')
  await expect(modal).not.toBeVisible()
  await expect(drawer).toBeVisible()
  await expect(abrir).toBeFocused()
  await abrir.click()
  await page.mouse.click(8, 8)
  await expect(modal).not.toBeVisible()
  await expect(drawer).toBeVisible()
  await drawer.getByRole('button', { name: 'Ver comprobante adjunto' }).click()
  const visor = page.getByRole('dialog', { name: 'recibo.png' })
  await expect(visor).toBeVisible()
  expect(await visor.evaluate(element => element.matches(':modal'))).toBe(true)
  await page.keyboard.press('Escape')
  await drawer.getByRole('button', { name: 'Anular papeleta', exact: true }).click()
  const anular = page.getByRole('dialog', { name: 'Anular papeleta 12345678' })
  await expect(anular.getByLabel('Motivo de la anulación')).toBeFocused()
  expect(await anular.evaluate(element => element.matches(':modal'))).toBe(true)
  await page.keyboard.press('Escape')
  await expect(drawer).toBeVisible()
})

test('wizard, saldo exacto, ID real, conflicto 409 y reenvío correcto', async ({ page }) => {
  const requests = await instalar(page)
  await abrirDrawer(page)
  const modal = await completarDatos(page)
  await modal.getByRole('button', { name: 'Corregir Datos' }).click()
  await expect(modal.locator('#numeroComprobante')).toBeVisible()
  await modal.getByRole('button', { name: 'Continuar al Paso 2' }).click()
  await modal.getByLabel('Confirmar N.º de papeleta').fill('12345678')
  await modal.getByRole('button', { name: 'Continuar al Resumen' }).click()
  await modal.getByRole('button', { name: 'Confirmar y Registrar Depósito' }).click()
  await expect(modal.getByRole('alert')).toHaveText('El comprobante 12345678 ya existe')
  await expect(modal.locator('#numeroComprobante')).toBeFocused()
  expect(requests.payloads[0]).toMatch(/name="AlmacenId"\r\n\r\n47\r\n/)
  expect(requests.payloads[0]).toMatch(/name="MontoDepositado"\r\n\r\n0.2\r\n/)
  await modal.locator('#numeroComprobante').fill('87654321')
  await modal.getByRole('button', { name: 'Continuar al Paso 2' }).click()
  await modal.getByLabel('Confirmar N.º de papeleta').fill('87654321')
  await modal.getByRole('button', { name: 'Continuar al Resumen' }).click()
  await modal.getByRole('button', { name: 'Confirmar y Registrar Depósito' }).click()
  await expect(modal).not.toBeVisible()
  expect(requests.payloads).toHaveLength(2)
  await expect(page.getByText('Depósito registrado', { exact: true })).toBeAttached()
})

test('el período de gracia permanece bloqueado durante la carga y al vencer', async ({ page }) => {
  let responder!: () => void
  const detalleListo = new Promise<void>(resolve => { responder = resolve })
  await instalar(page, { detalleListo, bloqueado: true })
  const drawer = await abrirDrawer(page)
  await expect(drawer.getByRole('button', { name: 'Registrar Nuevo Depósito' })).toBeDisabled()
  responder()
  await expect(drawer.getByText('Plazo vencido', { exact: false })).toBeVisible()
  await expect(drawer.getByRole('button', { name: 'Registrar Nuevo Depósito' })).toBeDisabled()
})

test('el drawer de contactos reutiliza los datos cargados por la vista', async ({ page }) => {
  const requests = await instalar(page)
  await page.goto('/tesoreria/configuracion')
  await expect.poll(requests.contactosGet).toBe(1)
  await page.getByRole('button', { name: 'Administrar Destinatarios' }).click()
  await expect(page.getByText('Contabilidad de prueba', { exact: true })).toBeVisible()
  expect(requests.contactosGet()).toBe(1)
})

test('el ID cambia con el almacén seleccionado', async ({ page }) => {
  const requests = await instalar(page)
  await page.goto('/tesoreria/mis-depositos')
  await page.getByLabel('Almacén', { exact: true }).selectOption('T052')
  await page.getByRole('button', { name: 'Consultar', exact: true }).click()
  await page.getByRole('button', { name: 'Ver papeletas' }).click()
  const modal = await completarDatos(page)
  await modal.getByRole('button', { name: 'Confirmar y Registrar Depósito' }).click()
  await expect(modal.getByRole('alert')).toBeVisible()
  expect(requests.payloads[0]).toMatch(/name="AlmacenId"\r\n\r\n52\r\n/)
})

test('conserva el fallback solicitado si el catálogo no contiene el almacén', async ({ page }) => {
  const requests = await instalar(page, { sinCatalogo: true })
  await abrirDrawer(page)
  const modal = await completarDatos(page)
  await modal.getByRole('button', { name: 'Confirmar y Registrar Depósito' }).click()
  await expect(modal.getByRole('alert')).toBeVisible()
  expect(requests.payloads[0]).toMatch(/name="AlmacenId"\r\n\r\n0\r\n/)
})

test('el modal mantiene sus controles accesibles en móvil y modo oscuro', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await instalar(page)
  const drawer = await abrirDrawer(page)
  await page.evaluate(() => document.documentElement.classList.add('dark'))
  await drawer.getByRole('button', { name: 'Registrar Nuevo Depósito' }).click()
  const modal = page.getByRole('dialog', { name: 'Registrar depósito bancario' })
  await expect(modal).toBeVisible()
  const bounds = await modal.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844)
  await modal.locator('input[type="file"]').setInputFiles({ name: 'recibo.png', mimeType: 'image/png', buffer: pixel })
  await page.screenshot({ path: info.outputPath('registro-movil-oscuro.png') })
  await page.keyboard.press('Escape')
  await expect(modal).not.toBeVisible()
  await expect(drawer).toBeVisible()
})
