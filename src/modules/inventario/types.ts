export interface ApiResponse<T> {
  success: boolean
  message?: string | null
  data?: T | null
  error_code?: string | null
  details?: unknown
  correlation_id?: string | null
}

export interface WarehouseDto {
  id: number
  code: string
  name: string
  brand?: string | null
  display_name?: string | null
}

export interface UserSettingsDto {
  id: number
  username: string
  perfil: number
  realiza_conteo: boolean
  articulos_contar: number
  fk_id_almacen_cierre?: number | null
  fk_id_almacen_invs?: number | null
  fk_id_almacen_bodeg?: number | null
  fk_id_almacen_transitorio?: number | null
  fk_id_almacen_cd?: number | null
  marca?: string | null
  email?: string | null
  email_super?: string | null
}

export interface UserEditDataDto {
  user: UserSettingsDto
  warehouses: WarehouseDto[]
}

export interface UpdateUserSettingsRequest {
  userName: string
  profileId: number
  performsRandomCount: boolean
  itemsToCount: number
  cashClosingWarehouseId?: number | null
  inventoryWarehouseId?: number | null
  bodegaWarehouseId?: number | null
  transitWarehouseId?: number | null
  distributionCenterWarehouseId?: number | null
  brand?: string | null
  storeEmail?: string | null
  supervisorEmail?: string | null
}

export interface CatalogDataDto {
  warehouses: WarehouseDto[]
  categories: string[]
  subcategories: string[]
}

export interface InventoryPlanningSummaryDto {
  id: number
  name: string
  description?: string | null
  inventory_type: string
  generation_date?: string | null
  finalization_date?: string | null
  recurring: boolean
  frequency?: string | null
  warehouses?: string | null
  total_warehouses: number
  total_categories: number
  total_subcategories: number
  status: string
}

export interface InventoryPlanningDetailDto {
  id: number
  name: string
  description?: string | null
  generation_date?: string | null
  finalization_date?: string | null
  inventory_type: string
  recurring: boolean
  frequency?: string | null
  day_of_month?: number | null
  day_of_week?: number | null
  month_of_year?: number | null
  warehouse_ids: number[]
  categories: string[]
  subcategories: string[]
}

export interface SaveInventoryPlanningRequest {
  id?: number | null
  name: string
  description?: string | null
  generationDate: string
  finalizationDate?: string | null
  inventoryType: string
  recurring: boolean
  frequency?: string | null
  dayOfMonth?: number | null
  dayOfWeek?: number | null
  monthOfYear?: number | null
  warehouseIds: number[]
  categories: string[]
  subcategories: string[]
}

export interface SavePlanningResultDto {
  id: number
}

export interface ExecutePlanningResultDto {
  generated_count: number
  generated_inventories: GeneratedInventoryReferenceDto[]
  errors: string[]
}

export interface GeneratedInventoryReferenceDto {
  warehouse_code: string
  inventory_id: number
  level1?: string | null
  level2?: string | null
}

export interface GeneratedInventoryDto {
  id: number
  inventory_code: string
  warehouse?: string | null
  inventory_type: string
  level1?: string | null
  level2?: string | null
  status: string
  created_at?: string | null
  total_items: number
  counted_items: number
}

export interface InventoryDetailDto {
  header: InventoryHeaderDto
  stats: InventoryStatsDto
  items: InventoryItemDetailDto[]
}

export interface InventoryHeaderDto {
  id: number
  inventory_code: string
  inventory_type: string
  subtype?: string | null
  level1?: string | null
  level2?: string | null
  status: string
  created_at?: string | null
  total_items: number
  counted_items: number
  differences?: number | null
  warehouse_code?: string | null
  warehouse_name?: string | null
  planning_name?: string | null
}

export interface InventoryStatsDto {
  total: number
  counted: number
  with_difference: number
  balanced: number
  processed_percent: number
}

export interface InventoryItemDetailDto {
  id: number
  item_code: string
  item_name?: string | null
  barcode?: string | null
  stock_sap: number
  stock_physical?: number | null
  recount?: number | null
  difference: number
  level1?: string | null
  level2?: string | null
  level3?: string | null
  counted_at?: string | null
  counted_by?: string | null
  status2?: string | null
}

export interface ImportCsvResult {
  imported: number
  errors: string[]
}

// --- Nuevo sistema: inventory-plans (api-inventario /api/inventory-plans) ---

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
  filters: InventoryPlanFilterItem[]
}

export interface InventoryPlanFilterItem {
  filterType: string
  filterValue: string
}

export interface CreateInventoryPlanRequest {
  warehouseCode: string
  description?: string | null
  plannedOpenDate: string
  plannedCloseDate: string
  uNv1Values?: string[]
  uNv2Values?: string[]
  uNv3Values?: string[]
  uGenValues?: string[]
  materialValues?: string[]
  packValues?: string[]
  coleccionValues?: string[]
}

export interface PlanFilterCatalogDto {
  uNv1Values: string[]
  uNv2Values: string[]
  uNv3Values: string[]
  uGenValues: string[]
  materialValues: string[]
  packValues: string[]
  coleccionValues: string[]
}

export interface WarehouseSimpleDto {
  code: string
  name: string
}

export type InventorySessionStatus = 'Open' | 'Recount' | 'Closed'

export interface InventorySessionPickerDto {
  id: string
  inventorySessionId: string
  userId: string
  assignedByUserId: string
  assignedAt: string
}

export interface InventorySessionListItemDto {
  sessionId: string
  planId?: string | null
  warehouseCode: string
  warehouseName: string
  createdByUserId: string
  createdByUserName?: string | null
  status: InventorySessionStatus
  openedAt: string
  closedAt?: string | null
  description?: string | null
  plannedCloseDate?: string | null
}

export interface MyCountHistoryLineDto {
  itemCode: string
  itemDescription?: string | null
  quantity: number
  round: number
  lastCountedAt: string
}

export interface MyCountHistorySessionDto {
  sessionId: string
  warehouseCode: string
  warehouseName: string
  status: InventorySessionStatus
  openedAt: string
  closedAt?: string | null
  description?: string | null
  totalQuantity: number
  skuCount: number
  lines: MyCountHistoryLineDto[]
}

export interface InventorySessionLineStatusDto {
  itemCode: string
  itemDescription?: string | null
  systemQuantity: number
  initialCountedQuantity: number
  recountedQuantity: number
  countedQuantity: number
  initialDifference: number
  recountDifference: number
  difference: number
  balanceStatus: string
  entryCount: number
}

export interface InventorySessionStatusDto {
  sessionId: string
  warehouseCode: string
  warehouseName: string
  createdByUserId: string
  status: string
  balanceStatus: string
  openedAt: string
  closedAt?: string | null
  description?: string | null
  lines: InventorySessionLineStatusDto[]
}

export interface AddInventoryCountRequest {
  itemCode: string
  quantity: number
  source: 'Manual' | 'Scan'
  scanCode?: string | null
}

export interface InventoryCountResultDto {
  countId: string
  inventorySessionId: string
  warehouseCode: string
  itemCode: string
  quantity: number
  userId: string
  source: string
  scanCode?: string | null
  countedAt: string
  round: number
}

export interface ItemValidationDto {
  itemCode: string
  exists: boolean
  description?: string | null
}

export interface LevelCountDto {
  level: string
  lines: number
  totalQuantity: number
}

export interface RecentCountItemDto {
  countId: string
  itemCode: string
  description?: string | null
  level1?: string | null
  level2?: string | null
  quantity: number
  countedByUserId: string
  countedAt: string
  canDelete: boolean
}

export interface InventoryPickingSummaryDto {
  byLevel1: LevelCountDto[]
  byLevel2: LevelCountDto[]
  recentCounts: RecentCountItemDto[]
}

export interface SessionUserStatDto {
  userId: string
  countEntries: number
  uniqueItemsCounted: number
  lastCountedAt: string
}

export interface SessionDetailLineDto {
  itemCode: string
  description?: string | null
  nivel1?: string | null
  nivel2?: string | null
  nivel3?: string | null
  familia?: string | null
  barcode?: string | null
  systemQuantity: number
  countedQuantity: number
  difference: number
  status: 'Balanced' | 'Difference' | 'New' | 'NotCounted'
}

export interface SessionDetailStatsDto {
  total: number
  balanced: number
  difference: number
  newItems: number
  notCounted: number
}

export interface UserScanSummaryDto {
  userId: string
  totalScans: number
  uniqueItems: number
  firstScan: string
  lastScan: string
}

export interface UserScanDetailEntryDto {
  countId: string
  scannedAt: string
  userId: string
  barcode?: string | null
  itemCode: string
  description?: string | null
  quantity: number
  nivel3?: string | null
  round: number
  canDelete: boolean
}

export interface SessionScansByUserDto {
  summary: UserScanSummaryDto[]
  detail: UserScanDetailEntryDto[]
}

export interface SupervisorSummaryDto {
  sessionId: string
  warehouseCode: string
  warehouseName: string
  status: InventorySessionStatus
  description?: string | null
  openedAt: string
  closedAt?: string | null
  totalSystemItems: number
  countedItems: number
  pendingItems: number
  balancedItems: number
  differenceItems: number
  newItems: number
  canClose: boolean
  userStats: SessionUserStatDto[]
}
