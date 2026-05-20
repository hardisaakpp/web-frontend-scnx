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
