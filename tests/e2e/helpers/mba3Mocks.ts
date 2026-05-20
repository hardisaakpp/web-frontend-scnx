import type { Page, Route } from '@playwright/test'

/** Datos mínimos para terminal de cruce async en E2E. */
export const mockCruceData = {
  homologados_exactos: [] as unknown[],
  homologables: [] as unknown[],
  solo_en_mba3: [] as unknown[],
  solo_en_sap: [] as unknown[],
  estadisticas: {
    homologables: 2,
    solo_en_mba3: 1,
    solo_en_sap: 0,
    porcentaje_homologacion: 66.7,
  },
}

const homologacionesListBody = {
  data: [
    {
      homologacion_id: 'e2e-1',
      sku_mba3: 'SKU-E2E',
      sku_sap: null,
      estado: 'PENDIENTE',
      precio_mba3: 10,
      precio_sap: null,
    },
  ],
  total: 1,
  totalPages: 1,
  metadata: {
    total_pendientes: 1,
    total_homologados: 0,
    total_errores: 0,
  },
}

export type CruceMockOptions = {
  processId?: string
  /** Polls con `processing` antes del éxito (simula worker Celery). */
  processingPolls?: number
}

/**
 * Intercepta APIs MBA3 usadas por Homologaciones + cruce async (poll, sin SSE real).
 */
export async function installMba3HomologacionesAndCruceMocks(
  page: Page,
  options: CruceMockOptions = {}
): Promise<void> {
  const processId = options.processId ?? 'cruce-e2e-test-001'
  let pollCount = 0
  const processingPolls = options.processingPolls ?? 1

  await installMba3E2eAuthAndCatchAll(page)

  await page.route('**/api/mba3/api/homologaciones-sku**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(homologacionesListBody),
    })
  })

  await page.route('**/api/mba3/cruce-productos/iniciar**', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        process_id: processId,
        message: 'Cruce iniciado (E2E mock)',
      }),
    })
  })

  await page.route(`**/api/mba3/cruce-productos/resultado/${processId}**`, async (route: Route) => {
    pollCount += 1
    if (pollCount <= processingPolls) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'processing',
          estado: {
            step: 'cruce',
            progress: 40,
            message: 'Procesando cruce (E2E mock)',
          },
        }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        message: 'Cruce completado',
        data: mockCruceData,
      }),
    })
  })

  // SSE no se usa sin token en dev; si se intenta, devolver 401 para forzar fallback a poll.
  await page.route(`**/api/mba3/cruce-productos/stream/${processId}**`, async (route: Route) => {
    await route.fulfill({ status: 401, body: 'Unauthorized (E2E: usar poll)' })
  })
}

export type PlantillaMockOptions = {
  processId?: string
  processingPolls?: number
  numeroPedido?: string
}

const plantillasPedidosEmpty = {
  status: 'success',
  data: [] as unknown[],
  metadata: { total: 0, limit: 20, offset: 0, has_more: false },
}

const estadosPedidoEmpty = {
  status: 'success',
  data: [] as unknown[],
}

/**
 * Mocks para Cargar Plantilla (listado + upload-async + poll).
 */
/** Evita 401 → redirect /login en vistas que cargan detalle de pedido u otros GET MBA3. */
async function installMba3E2eAuthAndCatchAll(page: Page): Promise<void> {
  await page.route('**/api/Auth/me**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 'e2e', username: 'e2e-user' },
        roles: ['Admin'],
        permissions: ['mabel.view', 'odcsap.view'],
        capabilities: {
          mabel_view: true,
          can_manage_order: true,
          can_view_order_list: true,
          can_view_odc_sap: true,
        },
      }),
    })
  })

  await page.route('**/api/mba3/**', async (route: Route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      })
      return
    }
    await route.fallback()
  })
}

export async function installMba3PlantillaMocks(
  page: Page,
  options: PlantillaMockOptions = {}
): Promise<void> {
  const processId = options.processId ?? 'plantilla-e2e-001'
  const numeroPedido = options.numeroPedido ?? 'PED-E2E-001'
  let pollCount = 0
  const processingPolls = options.processingPolls ?? 1

  await installMba3E2eAuthAndCatchAll(page)

  await page.route('**/api/mba3/api/plantillas/pedidos**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(plantillasPedidosEmpty),
    })
  })

  await page.route('**/api/mba3/api/pedidos/estados**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(estadosPedidoEmpty),
    })
  })

  await page.route('**/api/mba3/api/plantillas/upload-async**', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'accepted',
        process_id: processId,
        async: true,
        message: 'Plantilla en cola (E2E mock)',
      }),
    })
  })

  await page.route(`**/api/mba3/api/plantillas/resultado/${processId}**`, async (route: Route) => {
    pollCount += 1
    if (pollCount <= processingPolls) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'processing',
          progress: 50,
          step: 'validando',
          message: 'Validando plantilla (E2E mock)',
        }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        numero_pedido: numeroPedido,
        pedido_id: 'e2e-pedido-id',
        articulos_cargados: 2,
        distribuciones_cargadas: 3,
        message: 'Plantilla procesada (E2E mock)',
      }),
    })
  })

  await page.route(`**/api/mba3/api/plantillas/stream/${processId}**`, async (route: Route) => {
    await route.fulfill({ status: 401, body: 'Unauthorized (E2E: usar poll)' })
  })

  const pedidoPath = encodeURIComponent(numeroPedido)
  const mockPedido = {
    cabecera: {
      pedido_id: 'e2e-pedido-id',
      numero_pedido: numeroPedido,
      estado: 'BORRADOR',
      proveedor_nombre: 'Proveedor E2E',
    },
    detalle: [],
    distribuciones: [],
  }

  await page.route(`**/api/mba3/api/plantillas/${pedidoPath}**`, async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPedido),
    })
  })
}
