import type { SaveInventoryPlanningRequest } from '../types'

export const INVENTORY_TYPE_TOTAL = 'TT'
export const INVENTORY_TYPE_PARTIAL = 'PARCIAL'

export function isTotalInventoryType(type: string | null | undefined): boolean {
  return String(type || '').trim().toUpperCase() === INVENTORY_TYPE_TOTAL
}

export function inventoryTypeLabel(type: string): string {
  return isTotalInventoryType(type) ? 'Total (TT)' : 'Parcial'
}

/** Validación cliente alineada con PlanningValidationTests del API. */
export function validatePlanningForm(form: SaveInventoryPlanningRequest): string | null {
  if (!form.warehouseIds?.length) {
    return 'Seleccione al menos un almacén de su alcance operativo.'
  }

  if (isTotalInventoryType(form.inventoryType)) {
    if (form.categories.length > 0 || form.subcategories.length > 0) {
      return 'El inventario total (TT) no admite categorías ni subcategorías: cubre todo el stock SAP del almacén.'
    }
    return null
  }

  if (!form.categories.length && !form.subcategories.length) {
    return 'El inventario parcial requiere al menos una categoría o subcategoría.'
  }

  return null
}

/** Limpia clasificación cuando el tipo es TT. */
export function normalizePlanningFormForType<T extends SaveInventoryPlanningRequest>(form: T): T {
  if (!isTotalInventoryType(form.inventoryType)) return form
  form.categories = []
  form.subcategories = []
  return form
}
