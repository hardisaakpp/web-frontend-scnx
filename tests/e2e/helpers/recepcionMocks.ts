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
  barcode?: string | null
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

// Wire-shape mapping (this module's own MockTransfer/MockLine test fixtures -> the real backend
// response shape) — mirrors recepcionApi.ts's mapTransfer/mapLine in reverse. Verified against
// the same Reception.Api/Contracts/ReceptionTransferResponses.cs field names: `id` (not
// `transferId`), `sapTransferRequestNumber` (not `documentNumber`), `isConfirmed` boolean (not a
// `status` string), lines keyed by `sapItemCode`/`description`/`requestedQuantity`/
// `scannedQuantity` (not `itemCode`/`itemName`/`quantity`/`scanned`).
function toWireTransfer(t: MockTransfer, isConfirmed: boolean) {
  return {
    id: t.transferId,
    sapTransferRequestNumber: t.documentNumber,
    originWarehouseCode: t.originWarehouseCode,
    destinationWarehouseCode: t.destinationWarehouseCode,
    transitWarehouseCode: null,
    responsibleName: null,
    courierWaybillNumber: null,
    glpiTicketNumber: t.glpiTicket ?? null,
    isConfirmed,
    materializedAtUtc: t.materializedAtUtc ?? t.createdAtUtc,
    confirmedAtUtc: isConfirmed ? t.createdAtUtc : null,
    sapStockTransferDocEntry: null,
    sapStockTransferDocNum: null,
    integrationMessage: null,
    createdByUserId: 'e2e-recepcion-user-id',
    createdByUserName: 'e2e-recepcion-user',
    lines: t.lines.map((l) => ({
      id: l.lineId,
      sapItemCode: l.itemCode,
      description: l.itemName,
      barcode: l.barcode ?? null,
      requestedQuantity: l.quantity,
      scannedQuantity: l.scanned,
    })),
    differencesCount: 0,
  }
}

/**
 * Mocks api-recepcion-mercaderia (via the `/api/recepcion-api` proxy prefix) for the
 * picking flow: in-progress list, transfer detail, scan, confirm. Deterministic —
 * no live api-recepcion-mercaderia/api-middleware-sap backend involved.
 *
 * Response envelopes match the real, verified contracts consumed by recepcionApi.ts:
 * `/in-progress` returns a `PagedResponse` (`{ items, totalCount, pageNumber, pageSize }`), and
 * `/transfers/{id}` returns `{ transfer, differences }` — not the bare transfer object.
 */
export async function installPickingMocks(page: Page, options: PickingMockOptions): Promise<PickingMockHandle> {
  const transferState: MockTransfer = JSON.parse(JSON.stringify(options.transfer))
  let isConfirmed = false
  let scanCalls = 0
  let confirmCalls = 0

  await page.route('**/api/recepcion-api/reception/**', async (route: Route) => {
    const request = route.request()
    const method = request.method()
    const path = new URL(request.url()).pathname

    if (method === 'GET' && path.endsWith('/in-progress')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [toWireTransfer(transferState, isConfirmed)], totalCount: 1, pageNumber: 1, pageSize: 20 }),
      })
      return
    }

    if (method === 'GET' && /\/transfers\/\d+$/.test(path)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ transfer: toWireTransfer(transferState, isConfirmed), differences: [] }),
      })
      return
    }

    // Real body: { responsibleName, courierWaybillNumber, scans: [{ lineId, scannedQuantity }] }
    // — scannedQuantity is each line's new ABSOLUTE total, not an increment (see pickingStore.scan).
    if (method === 'POST' && path.endsWith('/scan')) {
      scanCalls += 1
      const body = request.postDataJSON() as { scans: { lineId: number; scannedQuantity: number }[] }
      for (const s of body.scans) {
        const line = transferState.lines.find((l) => l.lineId === s.lineId)
        if (line) line.scanned = s.scannedQuantity
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
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
      isConfirmed = true
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
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

// Same wire shape as toWireTransfer above (mapHistoryRow and mapTransfer both read the identical
// WireReceptionTransfer contract) — kept as its own function since MockHistoryRow is a simpler,
// history-list-only test fixture (no lines/status of its own).
function toWireHistoryRow(row: MockHistoryRow) {
  return {
    id: row.transferId,
    sapTransferRequestNumber: row.documentNumber,
    originWarehouseCode: row.warehouseCode,
    destinationWarehouseCode: row.warehouseCode,
    transitWarehouseCode: null,
    responsibleName: null,
    courierWaybillNumber: null,
    glpiTicketNumber: row.glpiTicket ?? null,
    isConfirmed: true,
    materializedAtUtc: row.materializedAtUtc,
    confirmedAtUtc: row.materializedAtUtc,
    sapStockTransferDocEntry: null,
    sapStockTransferDocNum: null,
    integrationMessage: null,
    createdByUserId: 'e2e-recepcion-user-id',
    createdByUserName: 'e2e-recepcion-user',
    lines: [],
    differencesCount: row.differencesCount,
  }
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

// Real filtering is server-side (HistoryController's dateFrom/dateTo/transferNumber query
// params — see historyStore.ts's buildFilterParams), so the mock must actually apply them
// instead of always returning every row, or a date-range/transfer# e2e assertion would pass for
// the wrong reason (the frontend no longer filters client-side).
function matchesHistoryFilters(row: MockHistoryRow, params: URLSearchParams): boolean {
  const transferNumber = params.get('transferNumber')
  if (transferNumber) {
    return row.documentNumber.toLowerCase().includes(transferNumber.toLowerCase())
  }
  const materializedAt = new Date(row.materializedAtUtc).getTime()
  const dateFrom = params.get('dateFrom')
  const dateTo = params.get('dateTo')
  if (dateFrom && materializedAt < new Date(dateFrom).getTime()) return false
  if (dateTo && materializedAt > new Date(dateTo).getTime()) return false
  return true
}

/**
 * Mocks api-recepcion-mercaderia's history endpoints: store-scoped history, admin
 * all-warehouses history, xlsx export, and inline GLPI ticket edit.
 *
 * Response envelopes match the real, verified contracts consumed by recepcionApi.ts: `/history`
 * and `/history/all` return a `PagedResponse` (`{ items, totalCount, pageNumber, pageSize }`),
 * not a bare array — and `updateGlpiTicket` PUTs then separately re-fetches via
 * `GET /transfers/{id}` (`{ transfer, differences }`), which this mock also serves.
 */
export async function installHistoryMocks(page: Page, options: HistoryMockOptions): Promise<HistoryMockHandle> {
  const rowsState: MockHistoryRow[] = JSON.parse(JSON.stringify(options.rows))
  const allRowsState: MockHistoryRow[] = JSON.parse(JSON.stringify(options.allRows ?? options.rows))
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
      const params = new URL(request.url()).searchParams
      const items = allRowsState.filter((r) => matchesHistoryFilters(r, params)).map(toWireHistoryRow)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items, totalCount: items.length, pageNumber: 1, pageSize: 20 }),
      })
      return
    }

    if (method === 'GET' && path.endsWith('/history')) {
      historyCalls += 1
      const params = new URL(request.url()).searchParams
      const items = rowsState.filter((r) => matchesHistoryFilters(r, params)).map(toWireHistoryRow)
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items, totalCount: items.length, pageNumber: 1, pageSize: 20 }),
      })
      return
    }

    // updateGlpiTicket PUTs (204, body ignored) then separately re-fetches the transfer via
    // GET /transfers/{id} — the store reads the refetched `.glpiTicket`, not the PUT response.
    if (method === 'PUT' && path.endsWith('/glpi-ticket')) {
      const transferId = Number(path.split('/').slice(-2, -1)[0])
      const body = request.postDataJSON() as { ticketNumber: string }
      const row = rowsState.find((r) => r.transferId === transferId) ?? allRowsState.find((r) => r.transferId === transferId)
      if (row) row.glpiTicket = body.ticketNumber
      await route.fulfill({ status: 204, contentType: 'application/json', body: '' })
      return
    }

    if (method === 'GET' && /\/transfers\/\d+$/.test(path)) {
      const transferId = Number(path.split('/').pop())
      const row = rowsState.find((r) => r.transferId === transferId) ?? allRowsState.find((r) => r.transferId === transferId)
      if (!row) {
        await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ transfer: toWireHistoryRow(row), differences: [] }),
      })
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

export interface MockPendingLine {
  sapTransferRequestNumber: string
  itemCode: string
  description: string
  openQuantity: number
  originWarehouseCode: string
  destinationWarehouseCode: string
  sapBaseDocEntry: number
  sapBaseLineNum: number
  sapDocumentDate: string
}

export interface PendingMockOptions {
  lines: MockPendingLine[]
  /** id returned by POST .../pending-transfers/materialize, and used by the store's post-receive re-fetch below. */
  materializedTransferId?: number
}

export interface PendingMockHandle {
  getPendingCalls: () => number
  getMaterializeCalls: () => number
}

/**
 * Mocks api-recepcion-mercaderia's pending-transfers endpoints: GET /pending-transfers (no
 * wire-name mapping — PendingTransferLine's field names already match the backend contract, per
 * recepcionApi.ts's own comment) and POST /pending-transfers/materialize. Only relevant while
 * featureReadiness.pendingTransfersReady is true (the live path) — when false, pendingStore's
 * 'degraded' guard makes fetchPending/receive no-op before any request is ever issued.
 */
export async function installPendingMocks(page: Page, options: PendingMockOptions): Promise<PendingMockHandle> {
  let pendingCalls = 0
  let materializeCalls = 0

  await page.route('**/api/recepcion-api/reception/**', async (route: Route) => {
    const request = route.request()
    const method = request.method()
    const path = new URL(request.url()).pathname

    if (method === 'GET' && path.endsWith('/pending-transfers')) {
      pendingCalls += 1
      const search = (new URL(request.url()).searchParams.get('search') ?? '').toLowerCase()
      const items = options.lines.filter(
        (l) =>
          !search ||
          l.sapTransferRequestNumber.toLowerCase().includes(search) ||
          l.itemCode.toLowerCase().includes(search) ||
          l.description.toLowerCase().includes(search)
      )
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items, totalCount: items.length, pageNumber: 1, pageSize: 20 }),
      })
      return
    }

    if (method === 'POST' && path.endsWith('/pending-transfers/materialize')) {
      materializeCalls += 1
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: options.materializedTransferId ?? 900 }),
      })
      return
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
  })

  return { getPendingCalls: () => pendingCalls, getMaterializeCalls: () => materializeCalls }
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
