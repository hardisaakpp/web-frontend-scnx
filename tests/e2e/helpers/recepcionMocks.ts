import type { Page, Route } from '@playwright/test'

const CLAIM_NAME = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
const CLAIM_ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

function base64url(input: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(input))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Builds an unsigned JWT-shaped string. `jwt-decode` (used by authStore) never verifies
 * signatures client-side, so this is sufficient to simulate an authenticated session
 * without a live Core backend issuing real tokens.
 */
function makeFakeJwt(roles: string[], userName: string): string {
  const header = { alg: 'none', typ: 'JWT' }
  const payload = {
    exp: Math.floor(Date.now() / 1000) + 3600,
    [CLAIM_NAME]: userName,
    [CLAIM_ROLE]: roles,
  }
  return `${base64url(header)}.${base64url(payload)}.e2e-signature`
}

export interface RecepcionAuthOptions {
  userName?: string
  roles?: string[]
  permissions?: string[]
  warehouseAccesses?: unknown[]
}

/**
 * Installs an authenticated session for the recepcion-mercaderia module:
 * - A fake JWT + user record in `localStorage`, read by `authStore.initializeAuth()`
 *   on app mount (drives `isAuthenticated`/roles for the router guard's auth check).
 * - A mocked `GET /api/Auth/me`, read by `authStore.fetchMe()` — called from the router
 *   guard before a protected route resolves — which is the actual source of truth for
 *   `userData.permissions`/`roles` used by `meta.permissions` checks and in-component
 *   `authStore.hasPermission(...)` checks.
 *
 * No live Core/MBA3 auth backend involved.
 */
export async function installRecepcionAuth(page: Page, options: RecepcionAuthOptions = {}): Promise<void> {
  const userName = options.userName ?? 'e2e-recepcion-user'
  const roles = options.roles ?? ['User']
  const permissions = options.permissions ?? []
  const warehouseAccesses = options.warehouseAccesses ?? [{ codAlmacen: 'D001' }]

  const token = makeFakeJwt(roles, userName)
  const user = {
    id: 'e2e-recepcion-user-id',
    userName,
    email: `${userName}@e2e.local`,
    fullName: userName,
    roles,
    permissions,
    warehouseAccesses,
  }

  await page.addInitScript((data: { token: string; user: Record<string, unknown> }) => {
    window.localStorage.setItem('token', data.token)
    window.localStorage.setItem('user', JSON.stringify(data.user))
  }, { token, user })

  await page.route('**/api/Auth/me**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user, capabilities: {} }),
    })
  })
}

export interface MockLine {
  lineId: number
  itemCode: string
  itemName: string
  quantity: number
  scanned: number
}

export interface MockTransfer {
  transferId: number
  documentNumber: string
  originWarehouseCode: string
  destinationWarehouseCode: string
  status: 'pending' | 'in-progress' | 'confirmed' | 'error'
  glpiTicket?: string | null
  lines: MockLine[]
  createdAtUtc: string
  materializedAtUtc?: string | null
}

export interface PickingMockOptions {
  transfer: MockTransfer
  /** 'success' returns the transfer with status 'confirmed'; 'sap-500' simulates the known api-middleware-sap failure. */
  confirmBehavior?: 'success' | 'sap-500'
}

export interface PickingMockHandle {
  getScanCalls: () => number
  getConfirmCalls: () => number
}

/**
 * Mocks api-recepcion-mercaderia (via the `/api/recepcion-api` proxy prefix) for the
 * picking flow: in-progress list, transfer detail, scan, confirm. Deterministic —
 * no live api-recepcion-mercaderia/api-middleware-sap backend involved.
 */
export async function installPickingMocks(page: Page, options: PickingMockOptions): Promise<PickingMockHandle> {
  let currentTransfer: MockTransfer = JSON.parse(JSON.stringify(options.transfer))
  let scanCalls = 0
  let confirmCalls = 0

  await page.route('**/api/recepcion-api/reception/**', async (route: Route) => {
    const request = route.request()
    const method = request.method()
    const path = new URL(request.url()).pathname

    if (method === 'GET' && path.endsWith('/in-progress')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([currentTransfer]) })
      return
    }

    if (method === 'GET' && /\/transfers\/\d+$/.test(path)) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentTransfer) })
      return
    }

    if (method === 'POST' && path.endsWith('/scan')) {
      scanCalls += 1
      const body = request.postDataJSON() as { itemCode: string; quantity: number }
      const line = currentTransfer.lines.find((l) => l.itemCode === body.itemCode)
      if (line) {
        line.scanned += body.quantity
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(line ?? currentTransfer.lines[0]),
      })
      return
    }

    if (method === 'POST' && path.endsWith('/confirm')) {
      confirmCalls += 1
      if (options.confirmBehavior === 'sap-500') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'SAP integration failed (E2E mock)' }),
        })
        return
      }
      currentTransfer = { ...currentTransfer, status: 'confirmed' }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(currentTransfer) })
      return
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
  })

  return { getScanCalls: () => scanCalls, getConfirmCalls: () => confirmCalls }
}

export interface MockHistoryRow {
  transferId: number
  documentNumber: string
  warehouseCode: string
  materializedAtUtc: string
  differencesCount: number
  glpiTicket?: string | null
}

export interface HistoryMockOptions {
  /** Rows returned by `GET history` (store-scoped). */
  rows: MockHistoryRow[]
  /** Rows returned by `GET history/all` (admin-scoped). Defaults to `rows` if omitted. */
  allRows?: MockHistoryRow[]
  exportBody?: string
  exportBehavior?: 'success' | 'error'
}

export interface HistoryMockHandle {
  getHistoryCalls: () => number
  getAllHistoryCalls: () => number
  getExportCalls: () => number
}

/**
 * Mocks api-recepcion-mercaderia's history endpoints: store-scoped history, admin
 * all-warehouses history, xlsx export, and inline GLPI ticket edit.
 */
export async function installHistoryMocks(page: Page, options: HistoryMockOptions): Promise<HistoryMockHandle> {
  let historyCalls = 0
  let allHistoryCalls = 0
  let exportCalls = 0
  const exportBody = options.exportBody ?? 'transferId,documentNumber\n'

  await page.route('**/api/recepcion-api/reception/**', async (route: Route) => {
    const request = route.request()
    const method = request.method()
    const path = new URL(request.url()).pathname

    if (method === 'GET' && path.endsWith('/history/all/export')) {
      exportCalls += 1
      if (options.exportBehavior === 'error') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: exportBody,
      })
      return
    }

    if (method === 'GET' && path.endsWith('/history/all')) {
      allHistoryCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(options.allRows ?? options.rows),
      })
      return
    }

    if (method === 'GET' && path.endsWith('/history')) {
      historyCalls += 1
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(options.rows) })
      return
    }

    if (method === 'PUT' && path.endsWith('/glpi-ticket')) {
      const body = request.postDataJSON() as { glpiTicket: string }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ glpiTicket: body.glpiTicket }) })
      return
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
  })

  return {
    getHistoryCalls: () => historyCalls,
    getAllHistoryCalls: () => allHistoryCalls,
    getExportCalls: () => exportCalls,
  }
}

/** Fails loudly on ANY call to api-recepcion-mercaderia — used to prove a flow makes zero live calls (e.g. degraded pending-transfers). */
export async function installRecepcionApiTripwire(page: Page): Promise<{ getCallCount: () => number }> {
  let callCount = 0
  await page.route('**/api/recepcion-api/**', async (route: Route) => {
    callCount += 1
    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
  })
  return { getCallCount: () => callCount }
}
