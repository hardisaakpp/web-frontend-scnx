import axios from 'axios'

const rawBaseUrl = import.meta.env.VITE_SCNEXUS_INVENTORY_API_URL || 'http://localhost:8094'
const baseURL = rawBaseUrl.replace(/\/+$/, '')

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface WarehouseDto {
  warehouseCode: string
  name: string
}

export interface ItemStockDto {
  warehouseCode: string
  itemCode: string
  itemDescription?: string | null
  systemQuantity: number
  level1?: string | null
  level2?: string | null
  level3?: string | null
}

export interface InventoryPlanFilterDto {
  levelNumber: number
  filterValue: string
}

export interface InventoryPlanDto {
  planId: string
  warehouseCode: string
  createdByUserId: string
  description?: string | null
  status: 'Planned' | 'Executed'
  plannedOpenDate: string
  plannedCloseDate: string
  inventorySessionId?: string | null
  createdAt: string
  executedAt?: string | null
  executedByUserId?: string | null
  filters: InventoryPlanFilterDto[]
}

export interface CreateInventoryPlanRequest {
  warehouseCode: string
  description?: string | null
  plannedOpenDate: string
  plannedCloseDate: string
  level1Values?: string[] | null
  level2Values?: string[] | null
  level3Values?: string[] | null
}

export interface InventorySessionSummaryDto {
  sessionId: string
  warehouseCode: string
  status: 'Open' | 'Closed' | number
  openedAt: string
  description?: string | null
}

export type CountEntrySource = 'Manual' | 'Scan' | 'Adjustment' | 0 | 1 | 2

export interface AddInventoryCountRequest {
  itemCode: string
  quantity: number
  source: CountEntrySource
  scanCode?: string | null
}

export interface InventorySessionLineStatusDto {
  itemCode: string
  itemDescription?: string | null
  systemQuantity: number
  countedQuantity: number
  difference: number
  balanceStatus: 'Balanced' | 'Difference' | number
  totalCounts: number
}

export interface InventorySessionStatusDto {
  sessionId: string
  warehouseCode: string
  warehouseName: string
  createdByUserId: string
  status: 'Open' | 'Closed' | number
  balanceStatus: 'Balanced' | 'Difference' | number
  openedAt: string
  closedAt?: string | null
  description?: string | null
  lines: InventorySessionLineStatusDto[]
}

export interface SessionResultLineDto {
  resultId: string
  itemCode: string
  itemDescription?: string | null
  unitOfMeasure?: string | null
  systemQuantity: number
  countedQuantity: number
  difference: number
  balanceStatus: 'Balanced' | 'Difference' | number
}

export interface AdjustmentSummaryDto {
  adjustmentId: string
  sessionId: string
  warehouseCode: string
  auditorUserId: string
  status: 'Draft' | 'InReview' | 'Approved' | 'SentToSap' | number
  createdAt: string
  totalLines: number
  differenceLines: number
  sapDocumentNumber?: string | null
}

export interface AdjustmentLineDto {
  lineId: string
  itemCode: string
  itemDescription?: string | null
  unitOfMeasure?: string | null
  warehouseCode: string
  systemQuantity: number
  countedQuantity: number
  rawDifference: number
  adjustedDifference: number
  lineType: string | number
  equivalenceGroupId?: string | null
  auditorNotes?: string | null
}

export interface AdjustmentDetailDto {
  adjustmentId: string
  sessionId: string
  warehouseCode: string
  auditorUserId: string
  status: 'Draft' | 'InReview' | 'Approved' | 'SentToSap' | number
  notes?: string | null
  createdAt: string
  submittedAt?: string | null
  approvedAt?: string | null
  approvedByUserId?: string | null
  sapDocumentNumber?: string | null
  sapSentAt?: string | null
  lines: AdjustmentLineDto[]
}

function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  return []
}

function normalizeObject<T>(value: unknown): T {
  return (value ?? {}) as T
}

export const scnexusInventoryApi = {
  async getWarehouses(): Promise<WarehouseDto[]> {
    const { data } = await api.get('/api/stock/warehouses')
    return normalizeList<WarehouseDto>(data)
  },

  async getStock(warehouseCode: string, level1?: string, level2?: string): Promise<ItemStockDto[]> {
    const { data } = await api.get(`/api/stock/${encodeURIComponent(warehouseCode)}`, {
      params: {
        level1: level1 || undefined,
        level2: level2 || undefined
      }
    })
    return normalizeList<ItemStockDto>(data)
  },

  async createPlan(payload: CreateInventoryPlanRequest): Promise<InventoryPlanDto> {
    const { data } = await api.post('/api/inventory-plans', payload)
    return normalizeObject<InventoryPlanDto>(data)
  },

  async getPlans(status?: 'Planned' | 'Executed', warehouseCode?: string): Promise<InventoryPlanDto[]> {
    const { data } = await api.get('/api/inventory-plans', {
      params: {
        status: status || undefined,
        warehouseCode: warehouseCode || undefined
      }
    })
    return normalizeList<InventoryPlanDto>(data)
  },

  async getPlan(planId: string): Promise<InventoryPlanDto> {
    const { data } = await api.get(`/api/inventory-plans/${planId}`)
    return normalizeObject<InventoryPlanDto>(data)
  },

  async executePlan(planId: string): Promise<InventoryPlanDto> {
    const { data } = await api.post(`/api/inventory-plans/${planId}/execute`)
    return normalizeObject<InventoryPlanDto>(data)
  },

  async createSession(warehouseCode: string, description?: string): Promise<InventorySessionSummaryDto> {
    const { data } = await api.post('/api/inventory-sessions', { warehouseCode, description: description || null })
    return normalizeObject<InventorySessionSummaryDto>(data)
  },

  async addCount(sessionId: string, payload: AddInventoryCountRequest): Promise<InventorySessionStatusDto> {
    const { data } = await api.post(`/api/inventory-sessions/${sessionId}/counts`, payload)
    return normalizeObject<InventorySessionStatusDto>(data)
  },

  async getSessionStatus(sessionId: string): Promise<InventorySessionStatusDto> {
    const { data } = await api.get(`/api/inventory-sessions/${sessionId}/status`)
    return normalizeObject<InventorySessionStatusDto>(data)
  },

  async closeSession(sessionId: string, note?: string): Promise<InventorySessionStatusDto> {
    const { data } = await api.post(`/api/inventory-sessions/${sessionId}/close`, { note: note || null })
    return normalizeObject<InventorySessionStatusDto>(data)
  },

  async getSessionResults(sessionId: string): Promise<SessionResultLineDto[]> {
    const { data } = await api.get(`/api/inventory-sessions/${sessionId}/results`)
    return normalizeList<SessionResultLineDto>(data)
  },

  async getAdjustments(): Promise<AdjustmentSummaryDto[]> {
    const { data } = await api.get('/api/inventory-adjustments')
    return normalizeList<AdjustmentSummaryDto>(data)
  },

  async getAdjustment(adjustmentId: string): Promise<AdjustmentDetailDto> {
    const { data } = await api.get(`/api/inventory-adjustments/${adjustmentId}`)
    return normalizeObject<AdjustmentDetailDto>(data)
  },

  async createAdjustment(sessionId: string, notes?: string): Promise<AdjustmentDetailDto> {
    const { data } = await api.post('/api/inventory-adjustments', { sessionId, notes: notes || null })
    return normalizeObject<AdjustmentDetailDto>(data)
  },

  async updateAdjustmentLine(adjustmentId: string, lineId: string, payload: { adjustedDifference?: number | null; equivalenceGroupId?: string | null; auditorNotes?: string | null }): Promise<AdjustmentLineDto> {
    const { data } = await api.patch(`/api/inventory-adjustments/${adjustmentId}/lines/${lineId}`, payload)
    return normalizeObject<AdjustmentLineDto>(data)
  },

  async submitAdjustment(adjustmentId: string): Promise<AdjustmentDetailDto> {
    const { data } = await api.post(`/api/inventory-adjustments/${adjustmentId}/submit`)
    return normalizeObject<AdjustmentDetailDto>(data)
  },

  async approveAdjustment(adjustmentId: string): Promise<AdjustmentDetailDto> {
    const { data } = await api.post(`/api/inventory-adjustments/${adjustmentId}/approve`)
    return normalizeObject<AdjustmentDetailDto>(data)
  },

  async sendToSap(adjustmentId: string, sapDocumentNumber: string): Promise<AdjustmentDetailDto> {
    const { data } = await api.post(`/api/inventory-adjustments/${adjustmentId}/send-to-sap`, { sapDocumentNumber })
    return normalizeObject<AdjustmentDetailDto>(data)
  }
}
